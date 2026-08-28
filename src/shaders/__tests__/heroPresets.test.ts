import { describe, it, expect } from 'vitest'
import { HERO_PRESETS, getHeroPresets, mergePresets, ShaderPreset } from '../heroPresets'
import { HERO_SHADERS } from '../heroes'

describe('hero preset chips (D27)', () => {
  it('offers presets for every hero shader', () => {
    for (const hero of HERO_SHADERS) {
      expect(hero.tags.includes('hero')).toBe(true)
      const presets = getHeroPresets(hero.id)
      expect(presets.length, `${hero.id} presets`).toBeGreaterThanOrEqual(3)
    }
  })

  it('preset params all exist in the shader defaults (no phantom knobs)', () => {
    for (const hero of HERO_SHADERS) {
      for (const preset of HERO_PRESETS[hero.id] ?? []) {
        for (const [key, value] of Object.entries(preset.params)) {
          expect(hero.defaults, `${hero.id}/${preset.name}/${key}`).toHaveProperty(key)
          expect(typeof value).toBe('number')
        }
      }
    }
  })

  it('preset names are non-empty and unique per shader', () => {
    for (const hero of HERO_SHADERS) {
      const names = (HERO_PRESETS[hero.id] ?? []).map(p => p.name)
      expect(names.length).toBe(new Set(names).size)
      for (const n of names) expect(n.trim().length).toBeGreaterThan(0)
    }
  })

  it('mergePresets concatenates builtin then custom', () => {
    const custom: ShaderPreset[] = [{ name: 'Mine', params: { speed: 2 }, custom: true }]
    const merged = mergePresets(getHeroPresets('hero-plasma-flow'), custom)
    expect(merged.length).toBe(4)
    expect(merged[3].custom).toBe(true)
  })
})