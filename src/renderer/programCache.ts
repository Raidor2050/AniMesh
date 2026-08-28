import { createProgram } from '../core/WebGL'

/**
 * LRU shader-program cache (D2/D6). Keeps recently-used programs alive so
 * switching back and forth across the catalog never recompiles GLSL, and
 * gives the renderer a warm pre-compiled pool for idle pre-warming. The cache
 * OWNS program lifetime — callers must never deleteProgram a cached program
 * (LRU eviction handles it).
 */
export class ProgramCache {
  private gl: WebGL2RenderingContext
  private map = new Map<string, WebGLProgram>()
  private readonly max: number

  constructor(gl: WebGL2RenderingContext, max = 16) {
    this.gl = gl
    this.max = max
  }

  private key(vert: string, frag: string): string {
    return vert + '\n===||===\n' + frag
  }

  get(vert: string, frag: string): WebGLProgram | null {
    const k = this.key(vert, frag)
    const hit = this.map.get(k)
    if (hit) {
      // LRU touch: move to most-recently-used end
      this.map.delete(k)
      this.map.set(k, hit)
      return hit
    }
    const prog = createProgram(this.gl, vert, frag)
    if (!prog) return null
    this.map.set(k, prog)
    while (this.map.size > this.max) {
      const firstKey = this.map.keys().next().value as string
      const evicted = this.map.get(firstKey)
      if (evicted) this.gl.deleteProgram(evicted)
      this.map.delete(firstKey)
    }
    return prog
  }

  has(vert: string, frag: string): boolean {
    return this.map.has(this.key(vert, frag))
  }

  warm(vert: string, frag: string): void {
    this.get(vert, frag)
  }

  size(): number {
    return this.map.size
  }

  dispose(): void {
    for (const p of this.map.values()) this.gl.deleteProgram(p)
    this.map.clear()
  }
}