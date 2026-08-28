import { AudioSnapshot } from '../utils/types'
import { clamp, lerp } from '../utils/math'

export type Curve = 'linear' | 'log' | 'exp'
export type RouteOp = 'add' | 'multiply' | 'mix'

export type SignalSource =
  | 'sub' | 'bass' | 'lowMid' | 'mid' | 'highMid' | 'treble'
  | 'volume' | 'beat' | 'beatPhase' | 'spectralCentroid' | 'bpm'
  | 'barPhase' | 'conf'
  | `bandEnv.${'sub' | 'bass' | 'lowMid' | 'mid' | 'highMid' | 'treble'}`
  | 'flux' | 'fluxEnv' | 'onset' | 'onsetEnv'
  | 'lfo1' | 'lfo2' | 'lfo3' | 'lfo4' | 'noiseS' | 'rand'
  | MacroId

export type MacroId = 'uMacroEnergy' | 'uMacroComplexity' | 'uMacroMotion' | 'uMacroMusicality' | 'uMacroAtmosphere'

export interface Route {
  id: string
  src: SignalSource
  target: string
  /** Attenuverter −1..1 = signed fraction of the target's span */
  amount: number
  curve?: Curve
  /** one-pole attack time (s) */
  attack?: number
  /** one-pole release time (s) */
  release?: number
  op?: RouteOp
  min?: number
  max?: number
  /** extra per-route multiplier after the envelope */
  weight?: number
}

export interface MacroDef {
  id: MacroId
  src: SignalSource
  curve?: Curve
  attack?: number
  release?: number
  label: string
  description: string
}

export interface Profile {
  /** MacroBar overrides ∈ [0,1] — scales the signal-driven macro value */
  macros: Record<MacroId, number>
  macroDefs: MacroDef[]
  /**
   * De-baked universals (D19): routes targeting the universal param ids so
   * every shader stays audio-reactive even when its own body is inert.
   */
  globalRoutes: Route[]
  /** Global responsiveness gain applied after envelopes (D18). 0 = inert. */
  musicality?: number
}

export interface ParamRanges {
  [target: string]: [number, number]
}

const BAND_NAMES = ['sub', 'bass', 'lowMid', 'mid', 'highMid', 'treble'] as const
const CURVE_LOG = Math.log(10)

const LEGACY_SIGNAL: Record<string, SignalSource> = {
  sub: 'sub', bass: 'bass', lowMid: 'lowMid', mid: 'mid',
  highMid: 'highMid', treble: 'treble', volume: 'volume',
  beat: 'beat', beatPhase: 'beatPhase', spectralCentroid: 'spectralCentroid',
}

function normalizeLegacySignal(s: string): SignalSource {
  return LEGACY_SIGNAL[s] ?? 'volume'
}

/**
 * Legacy AudioMapping conversion. Old semantics were "add product units":
 *   mapped = base + signal * amount.
 * New semantics are range-aware: signed fraction of the target span.
 * amount' = amount / span reproduces identical linear output, so legacy
 * configurations keep behaving the same while new routes get clamped spans.
 */
export function legacyToRoutes(
  mappings: { signal: string; param: string; amount: number; curve?: 'linear' | 'log' | 'exp' }[],
  ranges: ParamRanges,
  prefix: string,
): Route[] {
  return mappings.map((m, i) => {
    const span = ranges[m.param] ? ranges[m.param][1] - ranges[m.param][0] : 1
    return {
      id: `${prefix}_${m.param}_${m.signal}_${i}`,
      src: normalizeLegacySignal(m.signal),
      target: m.param,
      amount: clamp((m.amount || 0) / (span || 1), -1, 1),
      curve: m.curve ?? 'linear',
      attack: 0.12,
      release: 0.12,
      op: 'add',
    }
  })
}

// Default global profile — the six proven universal mappings, expressed as
// range-aware routes instead of raw products, + macro fan-out into
// universal (composite-visible) params.
export const DEFAULT_PROFILE: Profile = {
  macros: {
    uMacroEnergy: 1, uMacroComplexity: 1, uMacroMotion: 1,
    uMacroMusicality: 1, uMacroAtmosphere: 0.6,
  },
  macroDefs: [
    { id: 'uMacroEnergy', src: 'bass', curve: 'log', attack: 0.04, release: 0.2, label: 'Energy', description: 'Low-end drive' },
    { id: 'uMacroComplexity', src: 'fluxEnv', curve: 'log', attack: 0.05, release: 0.3, label: 'Complexity', description: 'Timbral busyness' },
    { id: 'uMacroMotion', src: 'onsetEnv', curve: 'linear', attack: 0.02, release: 0.22, label: 'Motion', description: 'Transient activity' },
    { id: 'uMacroMusicality', src: 'bpm', curve: 'linear', attack: 0.1, release: 0.5, label: 'Musicality', description: 'Tempo-driven structure' },
    { id: 'uMacroAtmosphere', src: 'lfo1', curve: 'linear', attack: 0.3, release: 0.8, label: 'Atmosphere', description: 'Slow ambient drift' },
  ],
  globalRoutes: [
    { id: 'global_bass_scale', src: 'bass', target: 'scale', amount: 0.3, curve: 'log', attack: 0.05, release: 0.3, op: 'add' },
    { id: 'global_beat_intensity', src: 'beat', target: 'intensity', amount: 0.35, curve: 'linear', attack: 0.01, release: 0.15, op: 'add' },
    { id: 'global_beatphase_scale', src: 'beatPhase', target: 'scale', amount: 0.12, curve: 'linear', attack: 0.08, release: 0.2, op: 'add' },
    { id: 'global_mid_hueshift', src: 'mid', target: 'hueShift', amount: 0.3, curve: 'linear', attack: 0.1, release: 0.4, op: 'add' },
    { id: 'global_treble_brightness', src: 'treble', target: 'brightness', amount: 0.2, curve: 'linear', attack: 0.05, release: 0.25, op: 'add' },
    { id: 'global_volume_brightness', src: 'volume', target: 'brightness', amount: 0.25, curve: 'log', attack: 0.05, release: 0.3, op: 'add' },
    { id: 'global_macro_energy', src: 'uMacroEnergy', target: 'intensity', amount: 0.25, curve: 'linear', attack: 0.04, release: 0.2, op: 'add' },
    { id: 'global_macro_complexity', src: 'uMacroComplexity', target: 'distortion', amount: 0.3, curve: 'linear', attack: 0.05, release: 0.25, op: 'add' },
    { id: 'global_macro_motion', src: 'uMacroMotion', target: 'speed', amount: 0.3, curve: 'linear', attack: 0.03, release: 0.2, op: 'add' },
    { id: 'global_macro_musicality', src: 'uMacroMusicality', target: 'saturation', amount: 0.2, curve: 'linear', attack: 0.1, release: 0.4, op: 'add' },
    { id: 'global_macro_atmosphere', src: 'uMacroAtmosphere', target: 'brightness', amount: 0.15, curve: 'linear', attack: 0.3, release: 0.8, op: 'add' },
  ],
}

export class FeatureGraph {
  private ranges: ParamRanges = {}
  private profile: Profile = DEFAULT_PROFILE
  private shaderRoutes: Route[] = []
  private customRoutes: Route[] = []
  private base: Record<string, number> = {}

  private envelopes = new Map<string, number>()
  private silence = false
  private holding = false
  private silentFrames = 0
  private held: Record<string, number> | null = null
  private lastTargets = new Set<string>()

  // derived-signal state
  private prevSpectrum: Uint8Array = new Uint8Array(0)
  private fluxValue = 0
  private fluxHistory = new Float32Array(43)
  private fluxIndex = 0
  private fluxSum = 0
  private fluxEnvV = 0
  private onsetValue = 0
  private onsetEnvV = 0
  private barClock = 0
  private beatInBar = 0
  private lastBeatPhase = 0
  private lastBeatSeenAt = -1
  private lastBeatTimestamps: number[] = []
  private beatConfidence = 0
  private noiseSValue = 0
  private randValue = 0
  private energySmooth = 0
  private macroValues: Record<MacroId, number> = {
    uMacroEnergy: 0, uMacroComplexity: 0, uMacroMotion: 0,
    uMacroMusicality: 0, uMacroAtmosphere: 0,
  }

  /** flat uniform-ready output */
  readonly uniforms: Record<string, number> = {}

  reset() {
    this.envelopes.clear()
    this.fluxIndex = 0
    this.fluxSum = 0
    this.fluxHistory.fill(0)
    this.silence = false
    this.holding = false
    this.silentFrames = 0
    this.lastTargets.clear()
  }

  setProfile(profile: Profile) { this.profile = profile }
  getProfile(): Profile { return this.profile }

  setParamRanges(ranges: ParamRanges) { this.ranges = ranges }

  /** Reference values routes add/multiply/mix against. Replaced every frame. */
  setBaseParams(base: Record<string, number>) { this.base = base }

  setMacro(id: MacroId, value: number) {
    this.profile.macros[id] = clamp(value, 0, 1)
  }

  setShaderRoutes(routes: Route[], prefix = 'shader') {
    this.shaderRoutes = routes.map((r, i) => ({ ...r, id: r.id || `${prefix}_${i}` }))
  }

  setCustomRoutes(routes: Route[]) { this.customRoutes = routes }

  isSilent(): boolean { return this.silence }

  getMacro(id: MacroId): number { return this.macroValues[id] }

  // ── derivation ──

  private computeFlux(snapshot: AudioSnapshot): void {
    // HWR flux over the smoothed spectrum — feeds flux/fluxEnv derived signals.
    const spec = snapshot.spectrum
    if (this.prevSpectrum.length !== spec.length) {
      this.prevSpectrum = new Uint8Array(spec.length)
    }
    let flux = 0
    const prev = this.prevSpectrum
    for (let i = 0; i < spec.length; i++) {
      const d = spec[i] - prev[i]
      if (d > 0) flux += d
    }
    this.prevSpectrum.set(spec)
    this.fluxSum -= this.fluxHistory[this.fluxIndex]
    this.fluxHistory[this.fluxIndex] = flux
    this.fluxSum += flux
    this.fluxIndex = (this.fluxIndex + 1) % this.fluxHistory.length
    this.fluxValue = flux
    const avg = this.fluxSum / this.fluxHistory.length

    // Engine-driven SuperFlux onset (raw analyser, D09) wins when present;
    // fall back to a spectrum-based adaptive threshold when the engine is idle
    // (isolated/unit-test contexts) or reporting no onset.
    if (snapshot.onsetOn || snapshot.onsetStrength > 0) {
      this.onsetValue = Math.max(this.onsetValue, Math.min(snapshot.onsetStrength, 3))
      return
    }
    if (avg > 0 && flux > avg * 1.4) {
      this.onsetValue = clamp(flux / avg, 0, 3)
    } else {
      this.onsetValue = Math.max(this.onsetValue - 0.02, 0)
    }
  }

  private updateClock(snapshot: AudioSnapshot): void {
    const bp = snapshot.beatPhase
    // beatPhase wraps 1→0 on a completed beat → advance the free-running beat clock
    if (bp < this.lastBeatPhase - 0.4) {
      this.barClock += 1
      this.beatInBar = (this.beatInBar + 1) % 4
      const now = performance.now()
      if (this.lastBeatSeenAt >= 0) {
        const interval = now - this.lastBeatSeenAt
        this.lastBeatTimestamps.push(interval)
        if (this.lastBeatTimestamps.length > 8) this.lastBeatTimestamps.shift()
        const sorted = [...this.lastBeatTimestamps].sort((a, b) => a - b)
        const median = sorted[Math.floor(sorted.length / 2)]
        const near = this.lastBeatTimestamps.filter(i => Math.abs(i - median) / median < 0.12).length
        this.beatConfidence = this.lastBeatTimestamps.length >= 4 ? near / this.lastBeatTimestamps.length : 0.4
      }
      this.lastBeatSeenAt = now
    }
    this.lastBeatPhase = bp
  }

  private evalSignal(src: SignalSource, snapshot: AudioSnapshot): number {
    switch (src) {
      case 'sub': return snapshot.sub
      case 'bass': return snapshot.bass
      case 'lowMid': return snapshot.lowMid
      case 'mid': return snapshot.mid
      case 'highMid': return snapshot.highMid
      case 'treble': return snapshot.treble
      case 'volume': return snapshot.volume
      case 'beat': return snapshot.beatIntensity
      case 'beatPhase': return snapshot.beatPhase
      case 'spectralCentroid': return snapshot.spectralCentroid
      case 'bpm': {
        const b = snapshot.bpm
        return b <= 0 ? 0 : clamp((b - 60) / 100, 0, 1)
      }
      case 'barPhase': {
        // Locked mode: the engine's continuous clock is authoritative (D13).
        if (snapshot.engineMode === 'locked') return snapshot.barPhase
        return (this.beatInBar + snapshot.beatPhase) / 4
      }
      case 'conf': {
        if (snapshot.engineMode === 'locked') return snapshot.confidence
        return this.beatConfidence
      }
      case 'flux': return clamp(this.fluxValue / 400, 0, 1)
      case 'fluxEnv': return clamp(this.fluxEnvV, 0, 1)
      case 'onset': return clamp(this.onsetValue, 0, 1)
      case 'onsetEnv': return clamp(this.onsetEnvV, 0, 1)
      case 'rand': return this.randValue
      case 'noiseS': return this.noiseSValue
      case 'lfo1': return 0.5 + 0.5 * Math.sin(2 * Math.PI * (this.beatsInBars(snapshot) / 1))
      case 'lfo2': return 0.5 + 0.5 * Math.sin(2 * Math.PI * (this.beatsInBars(snapshot) / 2))
      case 'lfo3': return 0.5 + 0.5 * Math.sin(2 * Math.PI * (this.beatsInBars(snapshot) / 4))
      case 'lfo4': return 0.5 + 0.5 * Math.sin(2 * Math.PI * (this.beatsInBars(snapshot) / 8))
      default: {
        if (src.startsWith('bandEnv.')) {
          const name = src.slice('bandEnv.'.length)
          return (snapshot as any)[name] ?? 0
        }
        // Macro sources read the computed macro value
        const macro = this.macroValues[src as MacroId]
        if (macro !== undefined) return macro
        return 0
      }
    }
  }

  /** LFO phase expressed in bars (1.0 = one full 4/4 bar). */
  private beatsInBars(snapshot: AudioSnapshot): number {
    if (snapshot.engineMode === 'locked') return snapshot.barPhase
    return (this.barClock + snapshot.beatPhase) / 4
  }

  private shape(v: number, curve: Curve): number {
    const s = v < 0 ? -1 : 1
    const a = clamp(Math.abs(v), 0, 1)
    switch (curve) {
      // log: perceptual (dB-like) — deluxe smooth motion for loudness signals
      case 'log': return s * (Math.log(1 + a * 9) / CURVE_LOG)
      // exp: accelerates into peaks (1-(1-a)^3) — pushed first-hits, saturates
      case 'exp': {
        const u = 1 - a
        return s * (1 - u * u * u)
      }
      default: return v
    }
  }

  /** one-pole envelope; freezes while holding (silence-hold, D20) */
  private envStep(route: Route, dt: number, target: number): number {
    const key = route.id
    let cur = this.envelopes.get(key)
    if (cur === undefined) {
      cur = this.holding ? target : 0
      this.envelopes.set(key, cur)
    }
    if (!this.holding) {
      const attack = Math.max(route.attack ?? 0.04, 0.001)
      const release = Math.max(route.release ?? 0.26, 0.001)
      const coeff = target > cur
        ? 1 - Math.exp(-dt / attack)
        : 1 - Math.exp(-dt / release)
      cur += (target - cur) * coeff
      this.envelopes.set(key, cur)
    }
    return cur
  }

  /**
   * Evaluate one route against the current base value. Amount is a signed
   * fraction of the target's span:
   *   add      → base + signed * span
   *   multiply → base * clamp(1 + signed, 0, 4)   (0-safe)
   *   mix      → lerp(base, min..max mapped, |signed|)
   */
  private evaluateRoute(route: Route, snapshot: AudioSnapshot, dt: number, cur: number): number {
    const curve = route.curve ?? 'linear'
    let raw = this.evalSignal(route.src, snapshot)
    if (curve !== 'linear') raw = this.shape(raw, curve)
    const v = clamp(raw, -1, 1)

    const env = this.envStep(route, dt, v)
    const signed = env * route.amount * (route.weight ?? 1) * (this.profile.musicality ?? 1)

    const span = this.ranges[route.target] ? this.ranges[route.target][1] - this.ranges[route.target][0] : 1
    const min = this.ranges[route.target] ? this.ranges[route.target][0] : 0
    const op = route.op ?? 'add'

    let out: number
    switch (op) {
      case 'multiply': {
        out = cur * clamp(1 + signed, 0, 4)
        break
      }
      case 'mix': {
        const mapped = min + span * (v + 1) / 2
        out = lerp(cur, mapped, clamp(Math.abs(signed), 0, 1))
        break
      }
      case 'add':
      default: {
        out = cur + signed * span
        break
      }
    }

    if (route.min !== undefined) out = Math.max(out, route.min)
    if (route.max !== undefined) out = Math.min(out, route.max)
    return out
  }

  // ── main entry ──

  applySnapshot(snapshot: AudioSnapshot, dt: number = 1 / 60): Record<string, number> {
    const { uniforms } = this

    // energy + silence detection (holds routes to avoid silence-shiver)
    const energy = (snapshot.sub + snapshot.bass + snapshot.lowMid + snapshot.mid +
      snapshot.highMid + snapshot.treble + snapshot.volume) / 7
    this.energySmooth = lerp(this.energySmooth, energy, 1 - Math.exp(-dt / 1.2))
    // Quiet = absolute floor OR a deep relative dip below recent activity.
    // The relative clause keeps sustained quiet pads (consistently ~0.02) alive
    // while track-drop / mic-gap (≈0) engages the hold immediately.
    const quieting = energy < 0.004 || energy < this.energySmooth * 0.25
    if (quieting) {
      this.silentFrames++
      this.silence = this.silentFrames > 45
      // Hold begins at the FIRST quiet frame so fast-release envelopes can't
      // pre-decay the last loud frame.
      this.holding = true
      if (this.held === null) {
        this.held = {}
        for (const t of this.lastTargets) this.held[t] = uniforms[t]
      }
    } else {
      this.silentFrames = 0
      this.silence = false
      this.holding = false
      this.held = null
    }

    this.computeFlux(snapshot)
    this.updateClock(snapshot)
    this.randValue = Math.random()
    this.noiseSValue = lerp(this.noiseSValue, Math.random(), 0.02)

    this.fluxEnvV = lerp(this.fluxEnvV, this.fluxValue / 400, 1 - Math.exp(-dt / 0.12))
    this.onsetEnvV = Math.max(this.onsetEnvV - dt * 6, 0)
    this.onsetEnvV = Math.max(this.onsetEnvV, this.onsetValue)

    // macros: signal-driven base, scaled by the macro bar (0 = off)
    for (const def of this.profile.macroDefs) {
      const base = this.evalSignal(def.src, snapshot)
      const shaped = def.curve && def.curve !== 'linear' ? this.shape(base, def.curve) : base
      const target = clamp(shaped, 0, 1) * clamp(this.profile.macros[def.id], 0, 1)
      const c = 1 - Math.exp(-dt / Math.max(def.attack ?? 0.05, 0.001))
      const cur = this.macroValues[def.id]
      this.macroValues[def.id] = cur + (target - cur) * c
    }
    for (const id of Object.keys(this.macroValues) as MacroId[]) {
      uniforms[id] = this.macroValues[id]
    }

    // per-shader + custom + global routes
    const all = [...this.shaderRoutes, ...this.customRoutes, ...this.profile.globalRoutes]
    // Drop outputs whose target is no longer routed (shader switched) so stale
    // uniforms never leak into the next program's buffer.
    const targets = new Set<string>()
    for (const r of all) targets.add(r.target)
    for (const old of this.lastTargets) if (!targets.has(old)) delete uniforms[old]
    this.lastTargets = targets

    if (this.holding && this.held) {
      // freeze last-loud frame; only ensure fresh targets have a sane value
      for (const t of targets) uniforms[t] = this.held[t] ?? this.base[t] ?? 0
    } else {
      // Reset routed targets to their base each frame, then accumulate route
      // contributions sequentially (same semantics as the legacy additive mapper).
      for (const t of targets) uniforms[t] = this.base[t] ?? 0
      for (const route of all) {
        uniforms[route.target] = this.evaluateRoute(route, snapshot, dt, uniforms[route.target])
      }
    }

    return uniforms
  }
}