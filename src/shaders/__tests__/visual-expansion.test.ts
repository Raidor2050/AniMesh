import { describe, it, expect } from 'vitest'
import { SHADER_LIBRARY } from '../library'
import { SVG_OBJECTS, getSvgCount } from '../../objects/svgObjects'
import { VISUAL_LIBRARY, getVisualById, isSvg } from '../visualLibrary'
import { CATEGORIES, TIERS } from '../catalog'
import { SvgLayoutKey } from '../../utils/types'
import { cycleVisual, randomVisual } from '../../state/shaderActions'
import { useShaderStore } from '../../state/stores'

function getActiveVisualForTest() {
  return useShaderStore.getState().activeVisual!
}

const LAYOUT_KEYS: SvgLayoutKey[] = [
  'rings', 'rose', 'spiro', 'lissajous', 'polarSpectrum', 'radialBars',
  'waveform', 'mandala', 'orbits', 'flowDash', 'grid', 'petals',
]

describe('Phase-25 visual expansion', () => {
  it('SVG object ids are unique and never collide with shader ids', () => {
    const svgIds = SVG_OBJECTS.map(o => o.id)
    expect(new Set(svgIds).size).toBe(svgIds.length)
    const shaderIds = new Set(SHADER_LIBRARY.map(s => s.id))
    for (const id of svgIds) expect(shaderIds.has(id)).toBe(false)
  })

  it('every layout is covered by multiple variants (60 SVG objects)', () => {
    expect(getSvgCount()).toBe(60)
    for (const layout of LAYOUT_KEYS) {
      const ofLayout = SVG_OBJECTS.filter(o => o.layout === layout)
      expect(ofLayout.length, layout).toBeGreaterThanOrEqual(5)
    }
  })

  it('SVG objects carry valid category, tier, layout and mapping metadata', () => {
    for (const o of SVG_OBJECTS) {
      expect(CATEGORIES).toContain(o.category)
      expect(TIERS).toContain(o.performanceTier)
      expect(LAYOUT_KEYS).toContain(o.layout)
      for (const m of o.audioMappings) expect(o.defaults).toHaveProperty(m.param)
      expect(o.defaults).toHaveProperty('count')
    }
  })

  it('VISUAL_LIBRARY merges shaders and SVG objects with unique ids', () => {
    expect(VISUAL_LIBRARY.length).toBe(SHADER_LIBRARY.length + SVG_OBJECTS.length)
    const ids = VISUAL_LIBRARY.map(v => v.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('isSvg/getVisualById discriminate the two visual kinds', () => {
    const firstSvg = VISUAL_LIBRARY.find(v => v.kind === 'svg')!
    expect(isSvg(firstSvg)).toBe(true)
    const firstShader = VISUAL_LIBRARY.find(v => v.kind !== 'svg')!
    expect(isSvg(firstShader)).toBe(false)
    expect(getVisualById(firstSvg.id)).toBe(firstSvg)
    expect(getVisualById('does-not-exist')).toBeUndefined()
  })

  it('visual shuffling stays in bounds and never repeats the same id', () => {
    const start = getActiveVisualForTest()
    cycleVisual(1)
    const afterPrev = getActiveVisualForTest()
    expect(afterPrev).not.toBe(start)
    cycleVisual(-1)
    expect(getActiveVisualForTest()).toBe(start)
  })

  it('randomVisual can land on both shaders and SVG objects', () => {
    const kinds = new Set<string>()
    for (let i = 0; i < 80; i++) {
      randomVisual()
      const v = getActiveVisualForTest()
      kinds.add(v.kind === 'svg' ? 'svg' : 'shader')
    }
    expect(kinds.has('svg')).toBe(true)
    expect(kinds.has('shader')).toBe(true)
  })

  it('hero count stays exactly ten after the expansion', () => {
    const heroes = SHADER_LIBRARY.filter(s => s.tags.includes('hero'))
    expect(heroes).toHaveLength(10)
  })
})