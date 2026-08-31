import { describe, it, expect, beforeEach } from 'vitest'
import { useShaderStore } from '../stores'
import { SHADER_LIBRARY } from '../../shaders/library'

const shader = SHADER_LIBRARY[0]

describe('mapping disable toggle (take a param over manually)', () => {
  beforeEach(() => {
    useShaderStore.setState({
      activeShader: shader,
      disabledMappings: [],
    })
  })

  it('starts with the mapping enabled', () => {
    expect(useShaderStore.getState().disabledMappings).toEqual([])
  })

  it('toggles a mapping key on', () => {
    useShaderStore.getState().toggleMappingDisabled('bass->intensity')
    expect(useShaderStore.getState().disabledMappings).toContain('bass->intensity')
  })

  it('toggles it back off on a second call', () => {
    useShaderStore.getState().toggleMappingDisabled('bass->intensity')
    useShaderStore.getState().toggleMappingDisabled('bass->intensity')
    expect(useShaderStore.getState().disabledMappings).toEqual([])
  })

  it('keeps multiple disabled mappings independently', () => {
    useShaderStore.getState().toggleMappingDisabled('bass->intensity')
    useShaderStore.getState().toggleMappingDisabled('treble->scale')
    useShaderStore.getState().toggleMappingDisabled('bass->intensity')
    expect(useShaderStore.getState().disabledMappings).toEqual(['treble->scale'])
  })
})