import { describe, it, expect, beforeEach } from 'vitest'
import { useShaderStore } from '../stores'
import { SHADER_LIBRARY } from '../../shaders/library'
import { VISUAL_LIBRARY } from '../../shaders/visualLibrary'

const shader = SHADER_LIBRARY[0]
const otherShader = SHADER_LIBRARY.find(s => s.id !== shader.id)!
const svgVisual = VISUAL_LIBRARY.find(v => v.kind === 'svg')!

describe('activeShader survives SVG object selection (Param/EQ stay visible)', () => {
  beforeEach(() => {
    useShaderStore.setState({
      activeShader: shader,
      activeVisual: shader,
      params: { ...shader.defaults },
    })
  })

  it('keeps the last shader when the active visual becomes an SVG object', () => {
    useShaderStore.getState().setActiveVisual(svgVisual)
    const s = useShaderStore.getState()
    expect(s.activeVisual?.kind).toBe('svg')
    expect(s.activeShader).not.toBeNull()
    expect(s.activeShader?.id).toBe(shader.id)
  })

  it('keeps the shader params while an SVG object is on screen', () => {
    useShaderStore.getState().setActiveVisual(svgVisual)
    expect(useShaderStore.getState().params).toEqual(shader.defaults)
  })

  it('restores the picked shader when switching from an SVG object back to a shader', () => {
    useShaderStore.getState().setActiveVisual(svgVisual)
    useShaderStore.getState().setActiveVisual(otherShader)
    const s = useShaderStore.getState()
    expect(s.activeVisual?.id).toBe(otherShader.id)
    expect(s.activeShader?.id).toBe(otherShader.id)
    expect(s.params).toEqual(otherShader.defaults)
  })
})