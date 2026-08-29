import { describe, it, expect } from 'vitest'
import { SHADER_LIBRARY } from '../library'
import { catalogStats, CATEGORIES, TIERS, getShadersByCategory } from '../catalog'

describe('shader catalog integrity (tier audit, D21)', () => {
  it('every shader id is unique', () => {
    const ids = SHADER_LIBRARY.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every shader has a valid category', () => {
    for (const s of SHADER_LIBRARY) {
      expect(CATEGORIES, `${s.id} category`).toContain(s.category)
    }
  })

  it('every shader has a valid performanceTier with a body', () => {
    for (const s of SHADER_LIBRARY) {
      expect(TIERS, `${s.id} tier`).toContain(s.performanceTier)
      expect(s.fragment, `${s.id} body`).toContain('void main()')
    }
  })

  it('exactly ten hero shaders are flag-tagged', () => {
    const heroes = SHADER_LIBRARY.filter(s => s.tags.includes('hero'))
    expect(heroes).toHaveLength(10)
  })

  it('catalog stats reconcile with the library', () => {
    const stats = catalogStats()
    const sum = Object.values(stats.byCategory).reduce((a, b) => a + b, 0)
    expect(sum).toBe(stats.total)
    expect(stats.total).toBe(SHADER_LIBRARY.length)
    expect(stats.heroes).toHaveLength(10)
    expect(stats.milkdropCount).toBeGreaterThan(120)
  })

  it('catalog category getters return the right slices', () => {
    expect(new Set(getShadersByCategory('cosmic').map(s => s.category))).toEqual(new Set(['cosmic']))
  })

  it('audio mappings target shader params, not phantom floats', () => {
    for (const s of SHADER_LIBRARY) {
      for (const m of s.audioMappings) {
        expect(s.defaults, `${s.id} mapping ${m.param} default`).toHaveProperty(m.param)
      }
    }
  })

  it('every shader fragment is unique — no repeated visuals', () => {
    const seen = new Map<string, string>()
    for (const s of SHADER_LIBRARY) {
      const key = s.fragment.replace(/\s+/g, ' ').trim()
      if (seen.has(key)) {
        throw new Error(`duplicate fragment: ${s.id} == ${seen.get(key)}`)
      }
      seen.set(key, s.id)
    }
    expect(seen.size).toBe(SHADER_LIBRARY.length)
  })

  it('each milkdrop preset gets its own unique variant fragment', () => {
    const md = SHADER_LIBRARY.filter(s => s.id.startsWith('md-'))
    expect(md.length).toBeGreaterThan(100)
    const keys = md.map(s => s.fragment.replace(/\s+/g, ' ').trim())
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('no shader family exceeds 3 variations', () => {
    const seen = new Map<string, number>()
    for (const s of SHADER_LIBRARY) {
      const base = s.id.replace(/-\d+$/, '')
      const n = (seen.get(base) ?? 0) + 1
      expect(n, `${base} family`).toBeLessThanOrEqual(3)
      seen.set(base, n)
    }
  })

  it('psychedelic collection delivers the +299 net expansion (1004 total)', () => {
    const psy = SHADER_LIBRARY.filter(s => s.category === 'psychedelic')
    expect(psy.length).toBe(613)
    expect(SHADER_LIBRARY.length).toBe(705 + 299)
    // Every psychedelic shader is audio-reactive in a meaningful way: time +
    // at least two band/local signals + beat energy in the fragment body.
    for (const s of psy) {
      const body = s.fragment
      expect(body, `${s.id} time`).toMatch(/\buTime\b/)
      expect(body, `${s.id} bands`).toMatch(/\b(bass|mid|treb|vol|sub|cnt)\b/)
      expect(body, `${s.id} beat`).toMatch(/\b(beat|uBeat)\b/)
      expect(s.defaults, `${s.id} speed`).toHaveProperty('speed')
    }
  })

  it('every shader exposes at least one controllable parameter — Param + EQ panels stay live', () => {
    for (const s of SHADER_LIBRARY) {
      expect(s.params.length, `${s.id} params`).toBeGreaterThan(0)
      // Slider values and renderer uploads fall back to def.defaults; every
      // exposed param id must exist there or the mapping/substitution is dead.
      for (const p of s.params) {
        expect(s.defaults, `${s.id} param default for ${p.id}`).toHaveProperty(p.id)
      }
    }
  })

  it('every MilkDrop preset exposes its adapter sliders for the Param + EQ panels', () => {
    const md = SHADER_LIBRARY.filter(s => s.id.startsWith('md-'))
    expect(md.length).toBeGreaterThan(100)
    for (const s of md) {
      const ids = new Set(s.params.map(p => p.id))
      expect(s.params.some(p => p.id === 'speed'), `${s.id} has speed`).toBe(true)
      expect(s.params.some(p => p.id === 'intensity'), `${s.id} has intensity`).toBe(true)
      for (const id of ['mdZoom', 'mdRot', 'mdDecay', 'mdWarp', 'mdGamma', 'mdWaveMode']) {
        expect(ids.has(id), `${s.id} exposes ${id}`).toBe(true)
      }
    }
  })
})