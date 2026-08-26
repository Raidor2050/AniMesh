import { AudioSnapshot, DEFAULT_AUDIO } from '../utils/types'
import { Smoother, computeRMS, clamp } from '../utils/math'

export type AudioSourceType = 'none' | 'mic' | 'file' | 'demo' | 'system'

// Research-backed band ranges (mel-scale inspired, musical frequency groups)
const BAND_RANGES: [number, number][] = [
  [20, 60],     // sub: sub-bass rumble
  [60, 200],    // bass: kick fundamental (50-120Hz)
  [200, 600],   // lowMid: body/timbre warmth
  [600, 2000],  // mid: vocal/guitar range
  [2000, 6000], // highMid: snare presence, consonants
  [6000, 16000], // treble: hi-hats, air, sparkle
]

function createSnapshot(): AudioSnapshot {
  return {
    ...DEFAULT_AUDIO,
    waveform: new Float32Array(1024),
    spectrum: new Uint8Array(1024),
  }
}

export type BPMMode = 'auto' | 'manual' | 'tap'

export class AudioEngine {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioNode | null = null
  private masterGain: GainNode | null = null
  private outputGain: GainNode | null = null
  private sourceType: AudioSourceType = 'none'
  private generation = 0

  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(0)
  private timeData: Float32Array<ArrayBuffer> = new Float32Array(0)

  private smoothBands: Smoother[] = [
    new Smoother(3, 300),   // sub: fast attack, slow release
    new Smoother(3, 250),   // bass: fast attack for kicks
    new Smoother(5, 200),   // lowMid
    new Smoother(8, 180),   // mid
    new Smoother(10, 150),  // highMid
    new Smoother(12, 120),  // treble: heavier smoothing for jittery signal
  ]
  private smoothVolume = new Smoother(3, 200)
  private smoothBeat = new Smoother(0, 100) // instant attack for beat flash
  private smoothCentroid = new Smoother(10, 300)

  // Energy-based beat detection
  private energyHistory: Float32Array = new Float32Array(43)
  private historyIndex = 0
  private energySum = 0
  private lastBeatTime = 0
  private beatDetected = false
  private beatPhaseAcc = 0
  private bpmEstimate = 128
  private startTime = 0
  private warmUpFrames = 0
  private beatCount = 0

  // Spectral flux onset detection (production standard)
  private prevSpectrum: Uint8Array = new Uint8Array(0)
  private fluxHistory: Float32Array = new Float32Array(43)
  private fluxIndex = 0
  private fluxSum = 0

  // BPM detection from intervals
  private beatIntervals: number[] = []
  private static readonly BPM_WINDOW = 16
  private static readonly MIN_BPM = 60
  private static readonly MAX_BPM = 200

  // Manual BPM
  private bpmMode: BPMMode = 'auto'
  private manualBpm = 128
  private tapTimes: number[] = []
  private static readonly TAP_TIMEOUT = 3000
  private static readonly TAP_MAX_SAMPLES = 12

  private snapshot: AudioSnapshot = createSnapshot()

  private demoNodes: OscillatorNode[] = []
  private micStream: MediaStream | null = null
  private systemStream: MediaStream | null = null
  private debugFrameCount = 0

  onBeat: (() => void) | null = null

  async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') {
        try { await this.ctx.resume() } catch {}
      }
      return
    }
    this.ctx = new AudioContext({ latencyHint: 'interactive' })
    try { await this.ctx.resume() } catch {}
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.1
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
    this.timeData = new Float32Array(this.analyser.fftSize)
    this.prevSpectrum = new Uint8Array(this.analyser.frequencyBinCount)
    this.masterGain = this.ctx.createGain()
    this.outputGain = this.ctx.createGain()
    // Fixed audio graph: masterGain → analyser → outputGain → destination (established once)
    this.masterGain.connect(this.analyser)
    this.analyser.connect(this.outputGain)
    this.outputGain.connect(this.ctx.destination)
    this.startTime = performance.now()
  }

  async setSource(type: AudioSourceType, file?: File): Promise<boolean> {
    await this.init()
    if (!this.ctx || !this.analyser) return false

    await this.disconnect()
    const gen = ++this.generation

    try {
      switch (type) {
        case 'mic': return this.connectMic(gen)
        case 'file': return file ? await this.connectFile(file, gen) : false
        case 'demo': return this.connectDemo(gen)
        case 'system': return await this.connectSystem(gen)
        case 'none':
        default: this.sourceType = 'none'; return true
      }
    } catch (e) {
      console.warn('Audio source failed:', e)
      this.sourceType = 'none'
      return false
    }
  }

  private async connectMic(gen: number): Promise<boolean> {
    if (!this.ctx || !this.masterGain) return false
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      }
    })
    if (gen !== this.generation) { stream.getTracks().forEach(t => t.stop()); return false }
    this.micStream = stream
    this.source = this.ctx.createMediaStreamSource(stream)
    this.source.connect(this.masterGain)
    this.sourceType = 'mic'
    return true
  }

  private async connectSystem(gen: number): Promise<boolean> {
    if (!this.ctx || !this.masterGain) return false

    if (!navigator.mediaDevices?.getDisplayMedia) {
      console.warn('System audio: getDisplayMedia not supported in this browser')
      return false
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          suppressLocalAudioPlayback: true,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: { ideal: 44100 },
        } as any,
        systemAudio: 'include' as any,
        selfBrowserSurface: 'include' as any,
      } as any)
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        console.warn('System audio: user cancelled the picker or denied permission')
      } else if (err?.name === 'NotReadableError') {
        console.warn('System audio: selected source is not readable')
      } else {
        console.warn('System audio: getDisplayMedia failed:', err)
      }
      return false
    }

    if (gen !== this.generation) { stream.getTracks().forEach(t => t.stop()); return false }

    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) {
      const isMac = navigator.platform?.includes('Mac')
      console.warn(
        'System audio: no audio track in display media stream. ' +
        (isMac
          ? 'System audio is not supported on macOS. Install BlackHole or Loopback for system audio capture.'
          : 'In Chrome, check "Share audio" in the picker dialog.')
      )
      stream.getTracks().forEach(t => t.stop())
      return false
    }

    // Wider bandwidth for music content
    try { audioTrack.contentHint = 'music' } catch {}

    // Mute video track — stopping it can kill the audio track
    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = false
    }

    audioTrack.onended = () => {
      if (this.sourceType === 'system') {
        this.disconnect()
        this.sourceType = 'none'
      }
    }

    this.systemStream = stream
    this.source = this.ctx.createMediaStreamSource(stream)
    this.source.connect(this.masterGain)
    this.sourceType = 'system'
    // Mute playback for system audio — analyser still gets data via masterGain
    if (this.outputGain) this.outputGain.gain.setValueAtTime(0, this.ctx.currentTime)

    if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') {
      try { await this.ctx.resume() } catch {}
    }

    return true
  }

  private async connectFile(file: File, gen: number): Promise<boolean> {
    if (!this.ctx || !this.masterGain) return false
    const arrayBuffer = await file.arrayBuffer()
    if (gen !== this.generation) return false
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer)
    if (gen !== this.generation) return false
    const source = this.ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.masterGain)
    source.loop = true
    source.start(0)
    this.source = source
    this.sourceType = 'file'
    return true
  }

  private connectDemo(gen: number): boolean {
    if (!this.ctx || !this.masterGain) return false

    // Enhanced FM synthesis demo — evolving, musically interesting
    const nodes: OscillatorNode[] = []

    // Carrier: FM-modulated bass
    const carrier = this.ctx.createOscillator()
    carrier.type = 'sine'
    carrier.frequency.value = 110

    const modulator = this.ctx.createOscillator()
    modulator.type = 'sine'
    modulator.frequency.value = 2.5

    const modGain = this.ctx.createGain()
    modGain.gain.value = 80

    modulator.connect(modGain)
    modGain.connect(carrier.frequency)

    // LFO on modulator for evolution
    const lfo1 = this.ctx.createOscillator()
    lfo1.type = 'sine'
    lfo1.frequency.value = 0.15
    const lfo1Gain = this.ctx.createGain()
    lfo1Gain.gain.value = 1.5
    lfo1.connect(lfo1Gain)
    lfo1Gain.connect(modulator.frequency)

    // Sub bass pulse
    const sub = this.ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = 55
    const subGain = this.ctx.createGain()
    subGain.gain.value = 0.35

    // Sub LFO for rhythmic pulse
    const subLfo = this.ctx.createOscillator()
    subLfo.type = 'square'
    subLfo.frequency.value = 2
    const subLfoGain = this.ctx.createGain()
    subLfoGain.gain.value = 0.3
    subLfo.connect(subLfoGain)
    subLfoGain.connect(subGain.gain)

    // Detuned pad for harmonic richness
    const pad1 = this.ctx.createOscillator()
    pad1.type = 'triangle'
    pad1.frequency.value = 220
    pad1.detune.value = -7
    const pad1Gain = this.ctx.createGain()
    pad1Gain.gain.value = 0.08

    const pad2 = this.ctx.createOscillator()
    pad2.type = 'triangle'
    pad2.frequency.value = 330
    pad2.detune.value = 5
    const pad2Gain = this.ctx.createGain()
    pad2Gain.gain.value = 0.06

    // Hi-hat-like noise burst via high-frequency oscillator
    const hihat = this.ctx.createOscillator()
    hihat.type = 'sawtooth'
    hihat.frequency.value = 6800
    const hihatGain = this.ctx.createGain()
    hihatGain.gain.value = 0.03
    const hihatLfo = this.ctx.createOscillator()
    hihatLfo.type = 'square'
    hihatLfo.frequency.value = 4
    const hihatLfoGain = this.ctx.createGain()
    hihatLfoGain.gain.value = 0.03
    hihatLfo.connect(hihatLfoGain)
    hihatLfoGain.connect(hihatGain.gain)

    // Connect all to master (analyser→destination already established in init)
    carrier.connect(modGain); modGain.connect(this.masterGain)
    sub.connect(subGain); subGain.connect(this.masterGain)
    pad1.connect(pad1Gain); pad1Gain.connect(this.masterGain)
    pad2.connect(pad2Gain); pad2Gain.connect(this.masterGain)
    hihat.connect(hihatGain); hihatGain.connect(this.masterGain)

    nodes.push(carrier, modulator, lfo1, sub, subLfo, pad1, pad2, hihat, hihatLfo)
    nodes.forEach(n => n.start())

    this.demoNodes = nodes
    this.sourceType = 'demo'
    return true
  }

  private async disconnect() {
    // Fade out to prevent clicks
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime)
        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.02)
        await new Promise(r => setTimeout(r, 30))
      } catch {}
    }

    this.demoNodes.forEach(n => { try { n.stop() } catch {} })
    this.demoNodes = []
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop())
      this.micStream = null
    }
    if (this.systemStream) {
      this.systemStream.getTracks().forEach(t => t.stop())
      this.systemStream = null
    }
    // Only disconnect source nodes from masterGain — never tear down masterGain→analyser→destination
    if (this.source) {
      try { if (this.masterGain) this.source.disconnect(this.masterGain); else this.source.disconnect() } catch { try { this.source.disconnect() } catch {} }
      this.source = null
    }
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(1, this.ctx?.currentTime ?? 0)
    }
    if (this.outputGain) {
      this.outputGain.gain.setValueAtTime(1, this.ctx?.currentTime ?? 0)
    }
  }

  getSourceType(): AudioSourceType { return this.sourceType }
  getSnapshot(): AudioSnapshot { return this.snapshot }

  // ── BPM Mode Control ──

  setBpmMode(mode: BPMMode) {
    this.bpmMode = mode
    if (mode === 'auto') {
      this.beatIntervals = []
      this.tapTimes = []
    }
  }

  getBpmMode(): BPMMode { return this.bpmMode }

  setManualBpm(bpm: number) {
    this.manualBpm = clamp(bpm, 30, 300)
  }

  getManualBpm(): number { return this.manualBpm }

  // ── Tap Tempo (linear regression for accuracy) ──

  tap(): number | null {
    const now = performance.now()

    if (this.tapTimes.length > 0) {
      const lastTap = this.tapTimes[this.tapTimes.length - 1]
      if (now - lastTap > AudioEngine.TAP_TIMEOUT) {
        this.tapTimes = []
      }
    }

    this.tapTimes.push(now)
    if (this.tapTimes.length > AudioEngine.TAP_MAX_SAMPLES) {
      this.tapTimes.shift()
    }

    if (this.tapTimes.length < 2) return null

    // Linear regression for robust BPM estimation
    const n = this.tapTimes.length
    const t0 = this.tapTimes[0]
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    for (let i = 0; i < n; i++) {
      const x = this.tapTimes[i] - t0
      const y = i
      sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x
    }
    const denom = n * sumX2 - sumX * sumX
    if (denom === 0) return null
    const slope = (n * sumXY - sumX * sumY) / denom
    if (slope <= 0) return null
    const tapBpm = clamp(Math.round(60000 * slope), 30, 300)

    this.manualBpm = tapBpm
    return tapBpm
  }

  // ── Auto BPM Detection ──

  private detectBpm(isBeat: boolean, timestamp: number) {
    if (this.bpmMode !== 'auto') return

    if (isBeat && this.beatIntervals.length < AudioEngine.BPM_WINDOW) {
      if (this.lastBeatTime > 0) {
        const interval = timestamp - this.lastBeatTime
        const impliedBpm = 60000 / interval
        if (impliedBpm >= AudioEngine.MIN_BPM && impliedBpm <= AudioEngine.MAX_BPM) {
          this.beatIntervals.push(interval)
        }
      }
    }

    if (this.beatIntervals.length >= 3) {
      const sorted = [...this.beatIntervals].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const filtered = this.beatIntervals.filter(i =>
        Math.abs(i - median) / median < 0.4
      )
      if (filtered.length >= 2) {
        const avg = filtered.reduce((a, b) => a + b, 0) / filtered.length
        const detected = clamp(Math.round(60000 / avg), AudioEngine.MIN_BPM, AudioEngine.MAX_BPM)
        this.bpmEstimate = this.bpmEstimate * 0.7 + detected * 0.3
      }
    }
  }

  // ── Spectral Flux Onset Detection ──

  private detectOnset(freqData: Uint8Array, timestamp: number): boolean {
    if (this.prevSpectrum.length !== freqData.length) {
      this.prevSpectrum = new Uint8Array(freqData.length)
      return false
    }

    // Half-wave rectified spectral flux
    let flux = 0
    for (let i = 0; i < freqData.length; i++) {
      const diff = freqData[i] - this.prevSpectrum[i]
      if (diff > 0) flux += diff
    }
    this.prevSpectrum.set(freqData)

    // Adaptive threshold
    this.fluxSum -= this.fluxHistory[this.fluxIndex]
    this.fluxHistory[this.fluxIndex] = flux
    this.fluxSum += flux
    this.fluxIndex = (this.fluxIndex + 1) % this.fluxHistory.length

    const avgFlux = this.fluxSum / this.fluxHistory.length
    return flux > avgFlux * 1.4 && (timestamp - this.lastBeatTime) > 200
  }

  // ── Spectral Centroid ──

  private computeSpectralCentroid(freqData: Uint8Array): number {
    const sampleRate = this.ctx?.sampleRate ?? 44100
    const fftSize = this.analyser?.fftSize ?? 2048
    let weightedSum = 0, totalEnergy = 0
    for (let i = 0; i < freqData.length; i++) {
      const freq = i * sampleRate / fftSize
      const energy = freqData[i] / 255
      weightedSum += freq * energy
      totalEnergy += energy
    }
    return totalEnergy > 0 ? weightedSum / totalEnergy / (sampleRate / 2) : 0
  }

  tick(timestamp: number): AudioSnapshot {
    if (!this.analyser) return this.snapshot

    // Handle Safari's interrupted state and general suspended state
    if (this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed' && this.sourceType !== 'none') {
      try { this.ctx.resume() } catch {}
    }

    const { freqData, timeData, analyser } = this

    analyser.getByteFrequencyData(freqData)
    analyser.getFloatTimeDomainData(timeData)

    // Debug: log audio data every 120 frames when system audio is active
    if (this.sourceType === 'system') {
      this.debugFrameCount++
      if (this.debugFrameCount % 120 === 0) {
        let maxFreq = 0
        for (let i = 0; i < freqData.length; i++) {
          if (freqData[i] > maxFreq) maxFreq = freqData[i]
        }
        console.log(
          `%c[AudioEngine] tick #${this.debugFrameCount} — ` +
          `ctx: ${this.ctx?.state}, maxFreq: ${maxFreq}, ` +
          `bass: ${this.snapshot.bass.toFixed(3)}, vol: ${this.snapshot.volume.toFixed(3)}`,
          maxFreq > 0 ? 'color: #22C55E' : 'color: #EF4444'
        )
      }
    }

    const sampleRate = this.ctx?.sampleRate ?? 44100
    const binHz = sampleRate / analyser.fftSize

    const bandNames = ['sub', 'bass', 'lowMid', 'mid', 'highMid', 'treble'] as const

    // Power-weighted band energy for more accurate perceived loudness
    for (let i = 0; i < 6; i++) {
      const [minHz, maxHz] = BAND_RANGES[i]
      const startBin = Math.floor(minHz / binHz)
      const endBin = Math.min(Math.ceil(maxHz / binHz), freqData.length - 1)
      let energy = 0, count = 0
      for (let j = startBin; j <= endBin; j++) {
        const mag = freqData[j] / 255
        energy += mag * mag // power = magnitude²
        count++
      }
      const raw = count > 0 ? Math.sqrt(energy / count) : 0
      const smoothed = this.smoothBands[i].update(raw)
      ;(this.snapshot as any)[bandNames[i]] = smoothed
    }

    // Noise gate: eliminate idle-state jitter
    const gatedBands = bandNames.map(n => {
      const v = (this.snapshot as any)[n]
      return v > 0.02 ? v : 0
    })
    for (let i = 0; i < 6; i++) {
      ;(this.snapshot as any)[bandNames[i]] = gatedBands[i]
    }

    const rms = computeRMS(timeData)
    this.snapshot.volume = this.smoothVolume.update(clamp(rms * 3, 0, 1))

    // Energy-based beat detection
    const currentEnergy = rms * rms * timeData.length
    this.energySum -= this.energyHistory[this.historyIndex]
    this.energyHistory[this.historyIndex] = currentEnergy
    this.energySum += currentEnergy
    this.historyIndex = (this.historyIndex + 1) % this.energyHistory.length

    this.warmUpFrames++
    const THRESHOLD = 1.4
    const MIN_INTERVAL = 200
    const avgEnergy = this.energySum / this.energyHistory.length
    const energyBeat = this.warmUpFrames > this.energyHistory.length &&
      currentEnergy > avgEnergy * THRESHOLD &&
      (timestamp - this.lastBeatTime) > MIN_INTERVAL

    // Spectral flux onset detection (catches snare/hat onsets)
    const fluxBeat = this.detectOnset(freqData, timestamp)

    // Combine both detectors — either triggers a beat
    const isBeat = energyBeat || fluxBeat

    if (isBeat) {
      this.lastBeatTime = timestamp
      this.beatDetected = true
      this.beatCount++
      this.onBeat?.()
      // Reset beat phase on detected beat for tight sync
      this.beatPhaseAcc = 0
    } else {
      this.beatDetected = false
    }

    this.detectBpm(isBeat, timestamp)

    this.snapshot.beat = this.beatDetected
    this.snapshot.beatIntensity = this.smoothBeat.update(isBeat ? 1 : 0)

    const effectiveBpm = this.bpmMode === 'auto' ? this.bpmEstimate : this.manualBpm

    if (!isBeat) {
      const elapsed = timestamp - this.lastBeatTime
      const beatMs = 60000 / effectiveBpm
      this.beatPhaseAcc = Math.min(elapsed / beatMs, 1.0)
    }
    this.snapshot.beatPhase = this.beatPhaseAcc

    this.snapshot.bpm = effectiveBpm
    this.snapshot.time = (timestamp - this.startTime) / 1000

    // Spectral centroid (brightness of sound) — map to hue shift
    this.snapshot.spectralCentroid = this.smoothCentroid.update(
      this.computeSpectralCentroid(freqData)
    )

    for (let i = 0; i < Math.min(timeData.length, 1024); i++) {
      this.snapshot.waveform[i] = timeData[i]
    }
    for (let i = 0; i < Math.min(freqData.length, 1024); i++) {
      this.snapshot.spectrum[i] = freqData[i]
    }

    return this.snapshot
  }

  async resume() {
    if (this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed') {
      try {
        // Safari can hang on resume — add timeout
        await Promise.race([
          this.ctx.resume(),
          new Promise<void>((_, reject) => setTimeout(() => reject(new Error('resume timeout')), 3000)),
        ])
      } catch {}
    }
  }

  async destroy() {
    await this.disconnect()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}
