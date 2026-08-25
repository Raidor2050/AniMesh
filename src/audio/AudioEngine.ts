import { AudioSnapshot, DEFAULT_AUDIO } from '../utils/types'
import { Smoother, computeRMS, clamp } from '../utils/math'

export type AudioSourceType = 'none' | 'mic' | 'file' | 'demo' | 'system'

const BAND_RANGES: [number, number][] = [
  [20, 60],
  [60, 250],
  [250, 500],
  [500, 2000],
  [2000, 4000],
  [4000, 16000],
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
  private sourceType: AudioSourceType = 'none'
  private generation = 0

  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(0)
  private timeData: Float32Array<ArrayBuffer> = new Float32Array(0)

  private smoothBands: Smoother[] = [
    new Smoother(5, 400),
    new Smoother(5, 300),
    new Smoother(8, 250),
    new Smoother(10, 200),
    new Smoother(12, 180),
    new Smoother(15, 150),
  ]
  private smoothVolume = new Smoother(5, 200)
  private smoothBeat = new Smoother(5, 100)

  private energyHistory: Float32Array = new Float32Array(43)
  private historyIndex = 0
  private energySum = 0
  private lastBeatTime = 0
  private beatDetected = false
  private beatPhaseAcc = 0
  private bpmEstimate = 128
  private startTime = 0
  private warmUpFrames = 0

  // BPM detection from intervals
  private beatIntervals: number[] = []
  private static readonly BPM_WINDOW = 16
  private static readonly MIN_BPM = 60
  private static readonly MAX_BPM = 200

  // Manual BPM
  private bpmMode: BPMMode = 'auto'
  private manualBpm = 128
  private tapTimes: number[] = []
  private static readonly TAP_TIMEOUT = 2500
  private static readonly TAP_MAX_SAMPLES = 8

  private snapshot: AudioSnapshot = createSnapshot()

  private demoNodes: OscillatorNode[] = []
  private micStream: MediaStream | null = null
  private systemStream: MediaStream | null = null
  private debugFrameCount = 0

  // Callback for beat events (used by UI tap tempo visual feedback)
  onBeat: (() => void) | null = null

  async init(): Promise<void> {
    if (this.ctx) return
    this.ctx = new AudioContext()
    await this.ctx.resume()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
    this.timeData = new Float32Array(this.analyser.fftSize)
    this.startTime = performance.now()
  }

  async setSource(type: AudioSourceType, file?: File): Promise<boolean> {
    await this.init()
    if (!this.ctx || !this.analyser) return false

    this.disconnect()
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
    if (!this.ctx || !this.analyser) return false
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
    this.source.connect(this.analyser)
    this.sourceType = 'mic'
    return true
  }

  private async connectSystem(gen: number): Promise<boolean> {
    if (!this.ctx || !this.analyser) return false

    // Check if getDisplayMedia is available
    if (!navigator.mediaDevices?.getDisplayMedia) {
      console.warn('System audio: getDisplayMedia not supported in this browser')
      return false
    }

    let stream: MediaStream
    try {
      // Request display media with audio capture enabled.
      // In Chrome, the user MUST check "Share audio" in the picker dialog.
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: { ideal: 44100 },
        },
        // Chrome 109+: request system audio inclusion
        systemAudio: 'include' as any,
        // Allow sharing browser tabs too (for web-based audio sources)
        selfBrowserSurface: 'include' as any,
      } as any)
    } catch (err: any) {
      // Common cases: user cancelled, or browser doesn't support system audio
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
      // No audio track returned — user may not have checked "Share audio"
      console.warn(
        'System audio: no audio track in display media stream. ' +
        'Please check "Share audio" (Chrome) or ensure your system supports audio capture.'
      )
      // Clean up the video-only stream
      stream.getTracks().forEach(t => t.stop())
      return false
    }

    // Mute the video track instead of stopping it — stopping it can kill
    // the audio track on some Chrome versions.
    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = false
    }

    // Handle the case where the user stops sharing via browser UI
    audioTrack.onended = () => {
      if (this.sourceType === 'system') {
        this.disconnect()
        this.sourceType = 'none'
      }
    }

    this.systemStream = stream
    this.source = this.ctx.createMediaStreamSource(stream)
    this.source.connect(this.analyser)
    this.sourceType = 'system'

    // Ensure the AudioContext is running — getDisplayMedia may return
    // while the context is still suspended from the picker dialog.
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    console.log(
      `%c[AudioEngine] System audio connected — context state: ${this.ctx.state}, ` +
      `audio tracks: ${stream.getAudioTracks().length}, ` +
      `video tracks: ${stream.getVideoTracks().length}`,
      'color: #22C55E; font-weight: bold'
    )

    return true
  }

  private async connectFile(file: File, gen: number): Promise<boolean> {
    if (!this.ctx || !this.analyser) return false
    const arrayBuffer = await file.arrayBuffer()
    if (gen !== this.generation) return false
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer)
    if (gen !== this.generation) return false
    const source = this.ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
    source.loop = true
    source.start(0)
    this.source = source
    this.sourceType = 'file'
    return true
  }

  private connectDemo(gen: number): boolean {
    if (!this.ctx || !this.analyser) return false

    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const osc3 = this.ctx.createOscillator()
    const gain1 = this.ctx.createGain()
    const gain2 = this.ctx.createGain()
    const gain3 = this.ctx.createGain()
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()

    osc1.type = 'sawtooth'; osc1.frequency.value = 110
    osc2.type = 'square'; osc2.frequency.value = 55
    osc3.type = 'sine'; osc3.frequency.value = 440
    gain1.gain.value = 0.3; gain2.gain.value = 0.4; gain3.gain.value = 0.1
    lfo.frequency.value = 2; lfoGain.gain.value = 30

    lfo.connect(lfoGain)
    lfoGain.connect(osc1.frequency)

    osc1.connect(gain1); osc2.connect(gain2); osc3.connect(gain3)
    gain1.connect(this.analyser); gain2.connect(this.analyser); gain3.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)

    osc1.start(); osc2.start(); osc3.start(); lfo.start()
    this.demoNodes = [osc1, osc2, osc3, lfo]
    this.sourceType = 'demo'
    return true
  }

  private disconnect() {
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
    if (this.source) {
      try { this.source.disconnect() } catch {}
      this.source = null
    }
    if (this.analyser) {
      try { this.analyser.disconnect() } catch {}
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

  // ── Tap Tempo ──

  tap(): number | null {
    const now = performance.now()

    // Reset if tapped after long silence
    if (this.tapTimes.length > 0) {
      const lastTap = this.tapTimes[this.tapTimes.length - 1]
      if (now - lastTap > AudioEngine.TAP_TIMEOUT) {
        this.tapTimes = []
      }
    }

    this.tapTimes.push(now)

    // Keep only recent taps
    if (this.tapTimes.length > AudioEngine.TAP_MAX_SAMPLES) {
      this.tapTimes.shift()
    }

    // Need at least 2 taps to calculate BPM
    if (this.tapTimes.length < 2) return null

    // Average intervals between taps
    let totalInterval = 0
    for (let i = 1; i < this.tapTimes.length; i++) {
      totalInterval += this.tapTimes[i] - this.tapTimes[i - 1]
    }
    const avgInterval = totalInterval / (this.tapTimes.length - 1)
    const tapBpm = clamp(Math.round(60000 / avgInterval), 30, 300)

    this.manualBpm = tapBpm
    return tapBpm
  }

  // ── Auto BPM Detection ──

  private detectBpm(isBeat: boolean, timestamp: number) {
    if (this.bpmMode !== 'auto') return

    if (isBeat && this.beatIntervals.length < AudioEngine.BPM_WINDOW) {
      if (this.lastBeatTime > 0) {
        const interval = timestamp - this.lastBeatTime
        // Only accept intervals within reasonable BPM range
        const impliedBpm = 60000 / interval
        if (impliedBpm >= AudioEngine.MIN_BPM && impliedBpm <= AudioEngine.MAX_BPM) {
          this.beatIntervals.push(interval)
        }
      }
    }

    if (this.beatIntervals.length >= 3) {
      // Remove outlier intervals (more than 40% from median)
      const sorted = [...this.beatIntervals].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const filtered = this.beatIntervals.filter(i =>
        Math.abs(i - median) / median < 0.4
      )
      if (filtered.length >= 2) {
        const avg = filtered.reduce((a, b) => a + b, 0) / filtered.length
        const detected = clamp(Math.round(60000 / avg), AudioEngine.MIN_BPM, AudioEngine.MAX_BPM)
        // Smooth transition to avoid jitter
        this.bpmEstimate = this.bpmEstimate * 0.7 + detected * 0.3
      }
    }
  }

  tick(timestamp: number): AudioSnapshot {
    if (!this.analyser) return this.snapshot

    // Auto-resume if context got suspended (e.g. tab was backgrounded)
    if (this.ctx?.state === 'suspended' && this.sourceType !== 'none') {
      this.ctx.resume()
    }

    const { freqData, timeData, analyser } = this

    analyser.getByteFrequencyData(freqData)
    analyser.getFloatTimeDomainData(timeData)

    // Debug: log audio data every 60 frames when system audio is active
    if (this.sourceType === 'system') {
      this.debugFrameCount++
      if (this.debugFrameCount % 60 === 0) {
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

    for (let i = 0; i < 6; i++) {
      const [minHz, maxHz] = BAND_RANGES[i]
      const startBin = Math.floor(minHz / binHz)
      const endBin = Math.min(Math.ceil(maxHz / binHz), freqData.length - 1)
      let sum = 0, count = 0
      for (let j = startBin; j <= endBin; j++) { sum += freqData[j]; count++ }
      const raw = count > 0 ? (sum / count) / 255 : 0
      const smoothed = this.smoothBands[i].update(raw)
      ;(this.snapshot as any)[bandNames[i]] = smoothed
    }

    const rms = computeRMS(timeData)
    this.snapshot.volume = this.smoothVolume.update(clamp(rms * 3, 0, 1))

    const currentEnergy = rms * rms * timeData.length
    this.energySum -= this.energyHistory[this.historyIndex]
    this.energyHistory[this.historyIndex] = currentEnergy
    this.energySum += currentEnergy
    this.historyIndex = (this.historyIndex + 1) % this.energyHistory.length

    this.warmUpFrames++
    const THRESHOLD = 1.4
    const MIN_INTERVAL = 200
    const avgEnergy = this.energySum / this.energyHistory.length
    const isBeat = this.warmUpFrames > this.energyHistory.length &&
      currentEnergy > avgEnergy * THRESHOLD &&
      (timestamp - this.lastBeatTime) > MIN_INTERVAL

    if (isBeat) {
      this.lastBeatTime = timestamp
      this.beatDetected = true
      this.onBeat?.()
    } else {
      this.beatDetected = false
    }

    // Auto-detect BPM from beat intervals
    this.detectBpm(isBeat, timestamp)

    this.snapshot.beat = this.beatDetected
    this.snapshot.beatIntensity = this.smoothBeat.update(isBeat ? 1 : 0)

    // Use manual BPM when not in auto mode
    const effectiveBpm = this.bpmMode === 'auto' ? this.bpmEstimate : this.manualBpm

    const elapsed = timestamp - this.startTime
    const beatMs = 60000 / effectiveBpm
    this.beatPhaseAcc = (elapsed % beatMs) / beatMs
    this.snapshot.beatPhase = this.beatPhaseAcc

    this.snapshot.bpm = effectiveBpm
    this.snapshot.time = elapsed / 1000

    for (let i = 0; i < Math.min(timeData.length, 1024); i++) {
      this.snapshot.waveform[i] = timeData[i]
    }
    for (let i = 0; i < Math.min(freqData.length, 1024); i++) {
      this.snapshot.spectrum[i] = freqData[i]
    }

    return this.snapshot
  }

  async resume() {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  destroy() {
    this.disconnect()
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}
