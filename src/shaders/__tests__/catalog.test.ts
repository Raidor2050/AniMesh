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
})