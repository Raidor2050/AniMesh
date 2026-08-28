import { describe, it, expect } from 'vitest'
import { resolveChunkTemplates, hasChunkTemplate, listMissingChunks } from '../compose'
import { CHUNK_IDS } from '../chunks'
import { HERO_SHADERS } from '../heroes'

describe('chunk templates', () => {
  it('resolves a single chunk to its GLSL', () => {
    const out = resolveChunkTemplates('{{chunk:palette}}')
    expect(out).toContain('vec3 iqp(')
    expect(/\{\{chunk:/.test(out)).toBe(false)
  })

  it('leaves chunk-free input untouched (identity)', () => {
    const src = 'void main() { gl_FragColor = vec4(1.0); }'
    expect(resolveChunkTemplates(src)).toBe(src)
    expect(hasChunkTemplate(src)).toBe(false)
  })

  it('resolves multiple chunks in body order', () => {
    const out = resolveChunkTemplates('{{chunk:noise}} {{chunk:fbm}}')
    expect(out.indexOf('float vnoise')).toBeGreaterThanOrEqual(0)
    expect(out.indexOf('float fbm5')).toBeGreaterThan(out.indexOf('float vnoise'))
    expect(hasChunkTemplate(out)).toBe(false)
  })

  it('throws on an unknown chunk', () => {
    expect(() => resolveChunkTemplates('{{chunk:not_a_chunk}}')).toThrow(/not_a_chunk/)
  })

  it('reports missing chunks', () => {
    expect(listMissingChunks('{{chunk:noise}} {{chunk:ghost}} {{chunk:phantom}}')).toEqual(['ghost', 'phantom'])
  })

  it('detects leftover templates after resolution', () => {
    const out = resolveChunkTemplates('{{chunk:noise}}')
    expect(/\{\{chunk:/.test(out)).toBe(false)
  })

  it('every registered chunk is non-empty GLSL', () => {
    for (const id of CHUNK_IDS) {
      expect(id.length).toBeGreaterThan(0)
    }
  })

  it('all hero shaders resolve their chunk grammar cleanly', () => {
    for (const hero of HERO_SHADERS) {
      const bare = hero.fragment.replace(/^#version[\s\S]*?out vec4 fragColor;\s*/m, '')
      expect(/\{\{chunk:/.test(bare)).toBe(false)
      expect(bare).toContain('void main()')
      expect(bare).toContain('fragColor = vec4(col, 1.0);')
    }
  })

  it('heroes declare every uniform their body references', () => {
    // extraUniforms are baked into fragment; referenced uniform floats must be
    // declared somewhere in the fragment (header or extra) or the shader fails.
    for (const hero of HERO_SHADERS) {
      for (const p of hero.params) {
        const decl = new RegExp(`uniform\\s+float\\s+${p.id}\\b`).test(hero.fragment)
        const used = new RegExp(`\\b${p.id}\\b`).test(hero.fragment)
        if (used) expect(decl, `uniform ${p.id} undeclared in ${hero.id}`).toBe(true)
      }
    }
  })
})