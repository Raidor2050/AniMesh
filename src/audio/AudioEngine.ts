import { AudioSnapshot, DEFAULT_AUDIO, EngineMode } from '../utils/types'
import { Smoother, computeRMS, clamp } from '../utils/math'
import { CombTracker } from './combTracker'
import { computeFreeGrid, computeLockedGrid, Grid } from './grid'
import { useAudioStore } from '../state/stores'

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
  private rawAnalyser: AnalyserNode | null = null
  private source: AudioNode | null = null
  private fileSource: AudioBufferSourceNode | null = null
  private masterGain: GainNode | null = null
  private outputGain: GainNode | null = null
  private sourceType: AudioSourceType = 'none'
  private generation = 0

  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(0)
  private timeData: Float32Array<ArrayBuffer> = new Float32Array(0)
  private rawFreqData: Uint8Array<ArrayBuffer> = new Uint8Array(0)

  // Onset detection (SuperFlux) — raw unsmoothed analyser (D08/D09)
  private rawPrevSpectrum: Uint8Array = new Uint8Array(0)
  private rawFluxHistory: Float32Array = new Float32Array(64)
  private rawFluxIndex = 0
  private rawFluxMax = 0
  private onsetSens = 1.3
  private onsetStrengthValue = 0
  private lastOnsetTime = 0

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
  private warmUpFrames = 0
  private beatCount = 0

  // Manual BPM
  private bpmMode: BPMMode = 'auto'
  private manualBpm = 128
  private tapTimes: number[] = []
  private static readonly TAP_TIMEOUT = 3000
  private static readonly TAP_MAX_SAMPLES = 12

  // Comb-filter tempo tracker (D10/D11) — locked grid evidence
  private combTracker = new CombTracker()
  private clockBeats = 0
  private grid: Grid = { beatPhase: 0, barPhase: 0, eighthPhase: 0, sixteenthPhase: 0, downbeatConfidence: 0 }

  // engineMode (D12): free = raw sound, locked = BPM grid
  private engineMode: EngineMode = 'free'

  // silence handling (D20)
  private silentMs = 0
  private silentReported = false

  private snapshot: AudioSnapshot = createSnapshot()
  private lastTickTime = 0

  private demoNodes: OscillatorNode[] = []
  private micStream: MediaStream | null = null
  private systemStream: MediaStream | null = null

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
    // Analyser for visuals: light smoothing so FFT decays feel organic (D08)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.1
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10
    // Raw analyser: zero smoothing — onset/SuperFlux needs streak-truth (D08)
    this.rawAnalyser = this.ctx.createAnalyser()
    this.rawAnalyser.fftSize = 2048
    this.rawAnalyser.smoothingTimeConstant = 0
    this.rawAnalyser.minDecibels = -90
    this.rawAnalyser.maxDecibels = -10
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
    this.timeData = new Float32Array(this.analyser.fftSize)
    this.rawFreqData = new Uint8Array(this.rawAnalyser.frequencyBinCount)
    this.rawPrevSpectrum = new Uint8Array(this.rawAnalyser.frequencyBinCount)
    this.masterGain = this.ctx.createGain()
    this.outputGain = this.ctx.createGain()
    // Audio graph: masterGain → analyser → outputGain → destination (established once)
    // masterGain → rawAnalyser (analysis tap only)
    this.masterGain.connect(this.analyser)
    this.masterGain.connect(this.rawAnalyser)
    this.analyser.connect(this.outputGain)
    this.outputGain.connect(this.ctx.destination)
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
        default: this.sourceType = 'none'; this.syncSourceType(); return true
      }
    } catch (e) {
      console.warn('Audio source failed:', e)
      this.sourceType = 'none'
      this.syncSourceType()
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
    // Mic: analyser sees the signal, outputGain=0 prevents echo through speakers
    this.outputGain?.gain.setValueAtTime(0, this.ctx.currentTime)
    return true
  }

  private async connectSystem(gen: number): Promise<boolean> {
    if (!this.ctx || !this.masterGain) return false

    if (!navigator.mediaDevices?.getDisplayMedia) {
      console.warn('[AudioEngine] System audio: getDisplayMedia not supported')
      return false
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        // video is REQUIRED by getDisplayMedia — we keep it alive at minimal
        // frameRate so the capture session stays open for the audio track.
        // CRITICAL: disabling or stopping this track kills the entire capture session.
        video: {
          cursor: 'never',
          frameRate: { ideal: 1, max: 5 },
        },
        audio: {
          // Do NOT set suppressLocalAudioPlayback: true.
          // For system audio capture, this mutes the captured audio at the WASAPI
          // level, which can interfere with the original audio source. It's only
          // useful for tab capture to prevent echo. For system capture, the source
          // is external (other apps), so there's no echo risk.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: { ideal: 2 },
          sampleRate: { ideal: 44100 },
        },
        // Chrome 105+ on Windows: hints to offer system audio (WASAPI loopback) in the picker.
        // User MUST share "Entire Screen" (not a window) AND check "Share audio".
        systemAudio: 'include' as any,
        // Chrome 107+: prevents offering our own tab (avoids hall-of-mirrors).
        selfBrowserSurface: 'exclude' as any,
      } as any)
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        console.warn('[AudioEngine] System audio: user cancelled the picker or denied permission')
      } else if (err?.name === 'NotReadableError') {
        console.warn('[AudioEngine] System audio: selected source is not readable')
      } else {
        console.warn('[AudioEngine] System audio: getDisplayMedia failed:', err)
      }
      return false
    }

    if (gen !== this.generation) { stream.getTracks().forEach(t => t.stop()); return false }

    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) {
      console.warn(
        '[AudioEngine] System audio: no audio track returned. ' +
        'Requirements: (1) Share "Entire Screen", not a window. ' +
        '(2) Check "Share audio" in Chrome picker. ' +
        '(3) macOS/Linux do not support system audio natively — use BlackHole/Loopback.'
      )
      stream.getTracks().forEach(t => t.stop())
      return false
    }

    // Wider bandwidth hint for music content (widens Opus encoder bandwidth)
    try { audioTrack.contentHint = 'music' } catch {}

    // ─── CRITICAL: Do NOT disable or stop the video track ───
    // Chrome ties the display capture session lifecycle to the video track.
    // Setting videoTrack.enabled = false causes Chrome to pause the underlying
    // OS capture session (WASAPI loopback on Windows), which silently kills
    // the audio track too. The video runs at ~1fps (set above) and since we
    // never attach it to a <video> element, the frames are discarded with
    // negligible overhead. The blue "sharing" indicator is unavoidable.

    // Log audio track state for debugging
    const settings = audioTrack.getSettings()
    console.log(
      '[AudioEngine] System audio connected — ' +
      `readyState=${audioTrack.readyState}, enabled=${audioTrack.enabled}, ` +
      `channels=${settings.channelCount ?? '?'}, sampleRate=${settings.sampleRate ?? '?'}, ` +
      `suppressLocalAudioPlayback=${(settings as any).suppressLocalAudioPlayback ?? 'unsupported'}`
    )

    // Monitor audio track lifecycle events
    audioTrack.onended = () => {
      if (this.sourceType === 'system') {
        console.log('[AudioEngine] System audio track ended (user stopped sharing)')
        this.disconnect()
        this.sourceType = 'none'
        this.syncSourceType()
      }
    }

    audioTrack.onmute = () => {
      console.warn('[AudioEngine] System audio track muted — capture may have been paused by the OS or Chrome')
    }

    audioTrack.onunmute = () => {
      console.log('[AudioEngine] System audio track unmuted — capture resumed')
    }

    this.systemStream = stream
    this.source = this.ctx.createMediaStreamSource(stream)
    // Route the system audio DIRECTLY into the analyser.
    // This guarantees AniMesh reads the incoming sound data from the PC /
    // other Chrome tabs, independent of the (muted) playback path below.
    // The analyser taps the source before it reaches outputGain.
    if (this.analyser) this.source.connect(this.analyser)
    this.sourceType = 'system'
    // outputGain=0 — analysis only, no audible playback.
    // The user hears audio from the original source (YouTube, Spotify, etc.).
    // We MUST NOT play it back through speakers or it doubles/echoes.
    // The analyser still gets the audio because we connected source→analyser
    // directly above.
    this.outputGain?.gain.setValueAtTime(0, this.ctx.currentTime)

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
    this.fileSource = source
    this.sourceType = 'file'
    // File audio plays through our speakers
    this.outputGain?.gain.setValueAtTime(1, this.ctx.currentTime)
    return true
  }

  private connectDemo(_gen: number): boolean {
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
    // Demo audio plays through our speakers
    this.outputGain?.gain.setValueAtTime(1, this.ctx.currentTime)
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
    // Stop looped file sources so decoding doesn't continue in the background
    if (this.fileSource) {
      try { this.fileSource.stop() } catch {}
      this.fileSource = null
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop())
      this.micStream = null
    }
    if (this.systemStream) {
      this.systemStream.getTracks().forEach(t => t.stop())
      this.systemStream = null
    }
    // Only disconnect source nodes — analyser chain stays intact
    if (this.source) {
      try { if (this.masterGain) this.source.disconnect(this.masterGain) } catch {}
      try { if (this.analyser) this.source.disconnect(this.analyser) } catch {}
      try { this.source.disconnect() } catch {}
      this.source = null
    }
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(1, this.ctx?.currentTime ?? 0)
    }
  }

  getSourceType(): AudioSourceType { return this.sourceType }

  private syncSourceType() {
    // Keep the Zustand UI source-type badge in lockstep with the engine state.
    useAudioStore.getState().setSourceType(this.sourceType)
  }

  // ── BPM Mode Control ──

  setBpmMode(mode: BPMMode) {
    this.bpmMode = mode
    if (mode === 'auto') {
      this.combTracker.reset()
      this.tapTimes = []
    }
  }

  getBpmMode(): BPMMode { return this.bpmMode }

  // ── Engine Mode (D12) ──

  setEngineMode(mode: EngineMode) {
    this.engineMode = mode
    if (mode === 'locked') {
      // Entering locked: align the continuous clock to the most recent onset,
      // so the grid phase inherits the detected beat rather than jumping.
      this.clockBeats = this.lastBeatTime > 0
        ? Math.max(this.beatCount, Math.round(this.clockBeats))
        : Math.max(0, this.beatCount)
    }
  }

  getEngineMode(): EngineMode { return this.engineMode }

  setOnsetSensitivity(s: number) {
    this.onsetSens = clamp(s, 0.5, 3)
  }

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

  // ── Auto BPM Detection (comb-filter, D10/D11) ──

  private detectBpm(isBeat: boolean, timestamp: number) {
    if (this.bpmMode !== 'auto') return
    if (!isBeat) return

    this.combTracker.onImpulse(timestamp)
    if (this.silentReported) return

    const bpm = this.combTracker.getBpm()
    const conf = this.combTracker.getConfidence()
    // Blend toward the estimate only as confidence rises (TrustGrid gate 1).
    const blend = clamp(conf * 0.6, 0, 0.6)
    this.bpmEstimate = bpm > 0
      ? this.bpmEstimate * (1 - blend) + bpm * blend
      : this.bpmEstimate
  }

  // ── Spectral Flux Onset Detection (SuperFlux, raw analyser — D09) ──

  private detectOnset(rawFreq: Uint8Array, timestamp: number): boolean {
    if (this.rawPrevSpectrum.length !== rawFreq.length) {
      this.rawPrevSpectrum = new Uint8Array(rawFreq.length)
      return false
    }

    // Half-wave rectified spectral flux on the RAW (unsmoothed) analyser
    let flux = 0
    for (let i = 0; i < rawFreq.length; i++) {
      const diff = rawFreq[i] - this.rawPrevSpectrum[i]
      if (diff > 0) flux += diff
    }
    this.rawPrevSpectrum.set(rawFreq)

    // Local max filter over ~1s window as the adaptive threshold
    const idx = this.rawFluxIndex
    const replaced = this.rawFluxHistory[idx]
    this.rawFluxHistory[idx] = flux
    this.rawFluxIndex = (idx + 1) % this.rawFluxHistory.length

    if (replaced >= this.rawFluxMax) {
      // The max may have been evicted — rescan window
      let max = 0
      for (let i = 0; i < this.rawFluxHistory.length; i++) {
        const v = this.rawFluxHistory[i]
        if (v > max) max = v
      }
      this.rawFluxMax = max
    } else if (flux > this.rawFluxMax) {
      this.rawFluxMax = flux
    }
    const threshold = Math.max(this.rawFluxMax * 0.9, 1)
    const ratio = flux / threshold

    const spaced = (timestamp - this.lastOnsetTime) > 90
    const onset = ratio > this.onsetSens && spaced

    // onsetStrength: flux/threshold (~0..3), decayed between onsets
    this.onsetStrengthValue = onset
      ? clamp(ratio, 0, 3)
      : Math.max(this.onsetStrengthValue - 0.02, 0)
    if (onset) this.lastOnsetTime = timestamp

    return onset
  }

  // ── Feature extractions ──

  /** Spectral centroid: brightness of the spectrum, normalized. */
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

  /** Rolloff: normalized bin where cumulative spectral energy crosses 85%. */
  private computeRolloff(freqData: Uint8Array): number {
    let total = 0
    for (let i = 0; i < freqData.length; i++) total += freqData[i]
    if (total === 0) return 0
    const target = total * 0.85
    let cum = 0
    for (let i = 0; i < freqData.length; i++) {
      cum += freqData[i]
      if (cum >= target) return i / freqData.length
    }
    return 1
  }

  /** Spectral flatness: geometric/arithmetic mean ratio (noise ≈ 1, tone ≈ 0). */
  private computeFlatness(freqData: Uint8Array): number {
    let logSum = 0, arithSum = 0, count = 0
    // Restrict to the musically relevant band (~100Hz..7k) for stability
    const end = Math.min(freqData.length, Math.ceil((7000 * 2048) / (this.ctx?.sampleRate ?? 44100)))
    for (let i = 1; i < end; i++) {
      const m = Math.max(freqData[i], 1)
      logSum += Math.log(m)
      arithSum += m
      count++
    }
    if (count === 0 || arithSum === 0) return 1
    return Math.exp(logSum / count) / (arithSum / count)
  }

  /** Zero-crossing rate on the time buffer (percussive vs tonal). */
  private computeZcr(timeData: Float32Array): number {
    const n = Math.min(timeData.length, 1024)
    let crossings = 0
    for (let i = 1; i < n; i++) {
      if (timeData[i - 1] >= 0 !== timeData[i] >= 0) crossings++
    }
    return clamp(crossings / n, 0, 1)
  }

  tick(timestamp: number): AudioSnapshot {
    if (!this.analyser) return this.snapshot

    // Handle Safari's interrupted state and general suspended state
    if (this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed' && this.sourceType !== 'none') {
      try { this.ctx.resume() } catch {}
    }

    const { freqData, timeData, rawFreqData, analyser, rawAnalyser } = this

    analyser.getByteFrequencyData(freqData)
    analyser.getFloatTimeDomainData(timeData)
    rawAnalyser?.getByteFrequencyData(rawFreqData)

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
      this.snapshot.bands[i] = smoothed
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
    this.snapshot.rms = rms

    // Feature extractions (texture, not just level)
    this.snapshot.spectralCentroid = this.smoothCentroid.update(
      this.computeSpectralCentroid(freqData)
    )
    this.snapshot.rolloff = this.computeRolloff(freqData)
    this.snapshot.flatness = this.computeFlatness(freqData)
    this.snapshot.zcr = this.computeZcr(timeData)

    // Silence handling (D20): >3s under the floor → silence, confidence → 0.
    this.silentMs = (this.snapshot.volume < 0.02 && rms < 0.01)
      ? this.silentMs + 16.67
      : 0
    this.silentReported = this.silentMs > 3000
    this.snapshot.silence = this.silentReported

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

    // SuperFlux onset on the RAW analyser (catches snare/hat onsets)
    const fluxBeat = this.detectOnset(rawFreqData, timestamp)

    // Combine both detectors — either triggers a beat
    const isBeat = energyBeat || fluxBeat

    if (isBeat) {
      this.lastBeatTime = timestamp
      this.beatDetected = true
      this.beatCount++
      this.onBeat?.()
      if (this.engineMode === 'free') this.beatPhaseAcc = 0
    } else {
      this.beatDetected = false
    }

    this.detectBpm(isBeat, timestamp)

    this.snapshot.beat = this.beatDetected
    this.snapshot.beatOn = this.beatDetected
    this.snapshot.onsetOn = this.onsetStrengthValue > this.onsetSens * 0.8
    this.snapshot.onsetStrength = this.onsetStrengthValue
    this.snapshot.beatIntensity = this.smoothBeat.update(isBeat ? 1 : 0)

    const effectiveBpm = this.bpmMode === 'auto' ? this.bpmEstimate : this.manualBpm
    const conf = this.bpmMode === 'auto'
      ? this.combTracker.getConfidence()
      : (this.bpmMode === 'tap' ? 0.85 : 1)
    // TrustGrid gate: silence kills clock trust (D20)
    this.snapshot.confidence = this.silentReported ? 0 : (1 - 0.5 * this.silenceFactor()) * conf

    const beatMs = 60000 / effectiveBpm

    if (this.engineMode === 'locked') {
      // Continuous beat clock (D14). Phase re-anchors to the nearest onset,
      // advances by dt/beatDuration between beats — never resets.
      if (isBeat) {
        const nearest = Math.round(this.clockBeats)
        this.clockBeats = Math.abs(this.clockBeats - nearest) <= 0.6
          ? nearest
          : Math.floor(this.clockBeats) + 1
      }
      const dtMs = this.lastTickTime > 0 ? timestamp - this.lastTickTime : 16.67
      this.clockBeats += (Math.min(dtMs, 200) / beatMs)
      this.beatPhaseAcc = this.clockBeats % 1
      this.grid = computeLockedGrid(this.clockBeats, this.snapshot.confidence)
    } else {
      // Free mode (D12): transient-driven. beatPhase resets on each detected beat.
      if (!isBeat) {
        const elapsed = timestamp - this.lastBeatTime
        this.beatPhaseAcc = Math.min(elapsed / beatMs, 1.0)
      }
      this.grid = computeFreeGrid(this.beatPhaseAcc, this.beatCount, this.snapshot.confidence)
    }

    this.snapshot.beatPhase = this.beatPhaseAcc
    this.snapshot.beatCount = this.engineMode === 'locked' ? Math.floor(this.clockBeats) : this.beatCount
    this.snapshot.barPhase = this.grid.barPhase
    this.snapshot.eighthPhase = this.grid.eighthPhase
    this.snapshot.sixteenthPhase = this.grid.sixteenthPhase
    this.snapshot.downbeatConfidence = this.grid.downbeatConfidence
    this.snapshot.engineMode = this.engineMode

    // Advance the shader clock from clamped dt so animations don't teleport
    // after a hidden tab or frame stall; reset beat timing on large gaps.
    if (this.lastTickTime > 0) {
      const gapMs = timestamp - this.lastTickTime
      if (gapMs > 0) this.snapshot.time += Math.min(gapMs / 1000, 0.1)
      if (gapMs > 1500) {
        this.lastBeatTime = timestamp
        if (this.engineMode === 'free') this.beatPhaseAcc = 0
      }
    }
    this.lastTickTime = timestamp

    this.snapshot.bpm = effectiveBpm

    for (let i = 0; i < Math.min(timeData.length, 1024); i++) {
      this.snapshot.waveform[i] = timeData[i]
    }
    for (let i = 0; i < Math.min(freqData.length, 1024); i++) {
      this.snapshot.spectrum[i] = freqData[i]
    }

    return this.snapshot
  }

  /** Smooth fade of confidence into silence (0..1). */
  private silenceFactor(): number {
    return clamp(this.silentMs / 6000, 0, 1)
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
