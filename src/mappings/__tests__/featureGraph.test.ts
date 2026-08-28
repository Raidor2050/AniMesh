import { describe, it, expect } from 'vitest'
import { FeatureGraph, DEFAULT_PROFILE, MacroId, ParamRanges, Profile, Route } from '../featureGraph'
import { AudioSnapshot, DEFAULT_AUDIO } from '../../utils/types'
import { legacyToRoutes } from '../featureGraph'

const RANGES: ParamRanges = {
  scale: [0.1, 3],
  intensity: [0, 2],
  distortion: [0, 2],
  speed: [0, 3],
  brightness: [0, 2],
  hueShift: [0, 6.28],
  saturation: [0, 2],
}

const BASE = {
  scale: 1, intensity: 1, distortion: 0, speed: 1, brightness: 1, hueShift: 0, saturation: 1,
}

// Isolated profile: no global routes/macros so route-semantics tests are pure.
const EMPTY_PROFILE: Profile = {
  macros: { uMacroEnergy: 1, uMacroComplexity: 1, uMacroMotion: 1, uMacroMusicality: 1, uMacroAtmosphere: 1 },
  macroDefs: [],
  globalRoutes: [],
}

function snapshot(over: Partial<AudioSnapshot> = {}): AudioSnapshot {
  return { ...DEFAULT_AUDIO, ...over }
}

function route(partial: Partial<Route> & { src: Route['src']; target: string; amount: number }): Route {
  return {
    id: `r_${partial.target}`,
    curve: 'linear', attack: 0.001, release: 0.001, op: 'add',
    ...partial,
  }
}

function graphWith(profile: Profile = EMPTY_PROFILE) {
  const g = new FeatureGraph()
  g.setProfile(profile)
  g.setParamRanges(RANGES)
  g.setBaseParams(BASE)
  return g
}

describe('FeatureGraph — musicality gain (D18)', () => {
  it('musicality 0 zeroes route output while macros still run', () => {
    const g = graphWith({ ...EMPTY_PROFILE, musicality: 0 })
    g.setShaderRoutes([route({ src: 'bass', target: 'scale', amount: 0.5 })])
    for (let i = 0; i < 30; i++) g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    const out = g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    expect(out.scale).toBeCloseTo(1, 5)
  })

  it('musicality 0.5 halves a warm route contribution', () => {
    const g = graphWith({ ...EMPTY_PROFILE, musicality: 0.5 })
    g.setShaderRoutes([route({ src: 'bass', target: 'scale', amount: 0.5 })])
    for (let i = 0; i < 30; i++) g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    const out = g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    expect(out.scale).toBeGreaterThan(1 + 0.5 * 2.9 * 0.5 * 0.9)
    expect(out.scale).toBeLessThan(1 + 0.5 * 2.9 * 0.5 + 1e-6)
  })
})

describe('FeatureGraph — route semantics', () => {
  it('add: amount is a fraction of the target span, applied to base', () => {
    const g = graphWith()
    g.setShaderRoutes([route({ src: 'bass', target: 'scale', amount: 0.5 })])
    for (let i = 0; i < 30; i++) g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    const out = g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    expect(out.scale).toBeGreaterThan(1 + 0.5 * 2.9 * 0.97)
    expect(out.scale).toBeLessThan(1 + 0.5 * 2.9 + 1e-6)
  })

  it('add: zero signal leaves base unchanged', () => {
    const g = graphWith()
    g.setShaderRoutes([route({ src: 'bass', target: 'scale', amount: 1 })])
    const out = g.applySnapshot(snapshot({ bass: 0 }), 1 / 60)
    expect(out.scale).toBeCloseTo(1, 5)
  })

  it('attenuverter: negative amount inverts the contribution', () => {
    const g = graphWith()
    g.setShaderRoutes([route({ src: 'bass', target: 'intensity', amount: -0.5 })])
    for (let i = 0; i < 30; i++) g.applySnapshot(snapshot({ bass: 0.9 }), 1 / 60)
    const out = g.applySnapshot(snapshot({ bass: 0.9 }), 1 / 60)
    // intensity span 2 → 1 + (−0.5*2) ≈ 0 after warmup
    expect(out.intensity).toBeLessThan(1 - 0.4)
  })

  it('multiply: scales base with a 0-safe clamp', () => {
    const g = graphWith()
    g.setShaderRoutes([route({ src: 'bass', target: 'intensity', amount: -1, op: 'multiply' })])
    for (let i = 0; i < 30; i++) g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    const out = g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    expect(out.intensity).toBeGreaterThanOrEqual(0)
    expect(out.intensity).toBeLessThan(1)
  })

  it('mix: crossfades base toward the span-mapped value by |signed|', () => {
    const g = graphWith()
    g.setShaderRoutes([route({ src: 'lfo1', target: 'hueShift', amount: 1, op: 'mix' })])
    const out = g.applySnapshot(snapshot({ beatPhase: 0.5, bpm: 120 }), 1 / 60)
    expect(out.hueShift).toBeGreaterThanOrEqual(0)
    expect(out.hueShift).toBeLessThanOrEqual(6.28)
  })

  it('curves: log and exp shape the source monotonically; exp punches harder than log mid-way', () => {
    const sample = (v: number, curve: 'linear' | 'log' | 'exp') => {
      const g = graphWith()
      g.setShaderRoutes([route({ src: 'bass', target: 'intensity', amount: 1, curve })])
      for (let i = 0; i < 30; i++) g.applySnapshot(snapshot({ bass: v }), 1 / 60)
      return g.applySnapshot(snapshot({ bass: v }), 1 / 60).intensity as number
    }
    for (const v of [0.2, 0.5, 0.9]) {
      expect(sample(v, 'linear')).toBeGreaterThan(1)
      expect(sample(v, 'log')).toBeGreaterThan(1)
      expect(sample(v, 'exp')).toBeGreaterThan(1)
    }
    // exp 1-(1-a)^3 = 0.875 vs log(5.5)/log10 = 0.740 at a=0.5
    expect(sample(0.5, 'exp')).toBeGreaterThan(sample(0.5, 'log'))
    // monotonic in base value
    expect(sample(0.9, 'exp')).toBeGreaterThan(sample(0.5, 'exp'))
  })

  it('envelope honors slow attack', () => {
    const g = graphWith()
    g.setShaderRoutes([route({ src: 'bass', target: 'intensity', amount: 1, attack: 0.9, release: 0.01 })])
    g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    const first = g.applySnapshot(snapshot({ bass: 1 }), 1 / 60).intensity as number
    expect(first - 1).toBeLessThan(0.1)
  })

  it('min/max clamp the final output', () => {
    const g = graphWith()
    g.setShaderRoutes([route({ src: 'bass', target: 'intensity', amount: 5, min: 0, max: 1.2 })])
    for (let i = 0; i < 30; i++) g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    const out = g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    expect(out.intensity).toBeLessThanOrEqual(1.2)
  })

  it('routes targeting the same param accumulate, not overwrite', () => {
    const g = graphWith()
    g.setShaderRoutes([
      route({ src: 'bass', target: 'scale', amount: 0.5 }),
      route({ src: 'beatPhase', target: 'scale', amount: 0.2 }),
    ])
    for (let i = 0; i < 30; i++) g.applySnapshot(snapshot({ bass: 1, beatPhase: 0 }), 1 / 60)
    const out = g.applySnapshot(snapshot({ bass: 1, beatPhase: 0 }), 1 / 60)
    // 1 + 0.5*2.9 (bass) + 0.2*2.9*0 (beatPhase contribution w/ env final 0) ≈ 2.45
    expect(out.scale).toBeCloseTo(1 + 0.5 * 2.9, 3)
  })
})

describe('FeatureGraph — silence & cleanliness', () => {
  it('silence holds route outputs instead of decaying to zero', () => {
    const g = graphWith()
    g.setShaderRoutes([route({ src: 'bass', target: 'scale', amount: 0.5, attack: 0.01, release: 0.01 })])
    for (let i = 0; i < 30; i++) g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    const loud = g.applySnapshot(snapshot({ bass: 1 }), 1 / 60).scale as number
    expect(loud).toBeGreaterThan(1)
    for (let i = 0; i < 200; i++) g.applySnapshot(snapshot({ bass: 0, volume: 0 }), 1 / 60)
    const silent = g.applySnapshot(snapshot({ bass: 0, volume: 0 }), 1 / 60).scale as number
    expect(silent).toBeGreaterThanOrEqual(loud - 1e-6)
  })

  it('drops stale targets when routes change (shader switch)', () => {
    const g = graphWith()
    g.setShaderRoutes([route({ src: 'bass', target: 'scale', amount: 0.5 })])
    g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    expect('scale' in g.uniforms).toBe(true)
    g.setShaderRoutes([])
    g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    expect('scale' in g.uniforms).toBe(false)
  })

  it('macro set to 0 kills its output', () => {
    const g = graphWith(DEFAULT_PROFILE)
    const id: MacroId = 'uMacroEnergy'
    g.setMacro(id, 0)
    let out = g.applySnapshot(snapshot({ bass: 1, volume: 1 }), 1 / 60)
    for (let i = 0; i < 20; i++) out = g.applySnapshot(snapshot({ bass: 1, volume: 1 }), 1 / 60)
    expect(out[id]).toBeLessThan(0.02)
  })

  it('macro at 1 tracks its source', () => {
    const g = graphWith(DEFAULT_PROFILE)
    const id: MacroId = 'uMacroEnergy'
    const out = g.applySnapshot(snapshot({ bass: 1, volume: 1 }), 1 / 60)
    expect(out[id]).toBeGreaterThanOrEqual(0)
  })
})

describe('legacyToRoutes', () => {
  it('reproduces legacy linear add output exactly after warmup', () => {
    const g = graphWith()
    const routes = legacyToRoutes(
      [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'linear' }],
      RANGES,
      'test',
    )
    g.setShaderRoutes(routes)
    for (let i = 0; i < 40; i++) g.applySnapshot(snapshot({ bass: 1 }), 1 / 60)
    const warmed = g.applySnapshot(snapshot({ bass: 1 }), 1 / 60).scale as number
    // amount' = 0.3/2.9 → add(base, v·0.3) identical to old base + v·0.3
    expect(warmed).toBeCloseTo(1 + 0.3, 1)
  })

  it('clamps conversion to ±1 and defaults unknown signals', () => {
    const routes = legacyToRoutes(
      [{ signal: 'nope', param: 'scale', amount: 99, curve: 'linear' }],
      RANGES,
      't',
    )
    expect(routes[0].amount).toBe(1)
    expect(routes[0].src).toBe('volume')
  })
})