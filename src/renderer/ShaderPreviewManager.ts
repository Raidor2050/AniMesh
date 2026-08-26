import { ShaderDefinition } from '../utils/types'
import { createProgram, createQuadVAO, VERT_SRC } from '../core/WebGL'

const FALLBACK_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
out vec4 fragColor;
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
  vec3 col = 0.5 + 0.5*cos(uTime + vec3(0.0, 2.1, 4.2) + uv.xyx * 2.0);
  fragColor = vec4(col, 1.0);
}`

const PREVIEW_W = 256
const PREVIEW_H = 160
const BATCH_SIZE = 4
const BATCH_DELAY_MS = 16

interface PreviewEntry {
  dataUrl: string
  timestamp: number
}

function requestIdleCallbackPolyfill(cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void, opts?: { timeout?: number }) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(cb, opts)
  }
  return setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), opts?.timeout ?? 0)
}

function cancelIdleCallbackPolyfill(id: number) {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    ;(window as any).cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

class ShaderPreviewManagerSingleton {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext | null = null
  private vao: WebGLVertexArrayObject | null = null
  private vaoBuffer: WebGLBuffer | null = null
  private fallbackProgram: WebGLProgram | null = null
  private currentProgram: WebGLProgram | null = null
  private currentUniforms: Map<string, WebGLUniformLocation> = new Map()
  private cache: Map<string, PreviewEntry> = new Map()
  private queue: ShaderDefinition[] = []
  private processing = false
  private idleHandle: number = 0
  private listeners: Map<string, Set<(url: string) => void>> = new Map()
  private globalListeners: Set<() => void> = new Set()
  private startTime: number = Date.now()
  private disposed = false

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = PREVIEW_W
    this.canvas.height = PREVIEW_H

    this.gl = this.canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    })

    if (this.gl) {
      this.gl.clearColor(0, 0, 0, 1)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)

      const quad = createQuadVAO(this.gl)
      if (quad) {
        this.vao = quad.vao
        this.vaoBuffer = quad.buffer
      }
      this.fallbackProgram = createProgram(this.gl, VERT_SRC, FALLBACK_FRAG)
      this.currentProgram = this.fallbackProgram
      this.cacheUniforms()
    }
  }

  private cacheUniforms() {
    this.currentUniforms.clear()
    if (!this.gl || !this.currentProgram) return
    const num = this.gl.getProgramParameter(this.currentProgram, this.gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < num; i++) {
      const info = this.gl.getActiveUniform(this.currentProgram, i)
      if (info) {
        const loc = this.gl.getUniformLocation(this.currentProgram, info.name)
        if (loc) this.currentUniforms.set(info.name, loc)
      }
    }
  }

  getCached(shaderId: string): string | null {
    return this.cache.get(shaderId)?.dataUrl ?? null
  }

  hasPreview(shaderId: string): boolean {
    return this.cache.has(shaderId)
  }

  subscribe(shaderId: string, callback: (url: string) => void): () => void {
    if (!this.listeners.has(shaderId)) {
      this.listeners.set(shaderId, new Set())
    }
    this.listeners.get(shaderId)!.add(callback)
    return () => {
      this.listeners.get(shaderId)?.delete(callback)
    }
  }

  subscribeAll(callback: () => void): () => void {
    this.globalListeners.add(callback)
    return () => {
      this.globalListeners.delete(callback)
    }
  }

  private notify(shaderId: string, dataUrl: string) {
    const subs = this.listeners.get(shaderId)
    if (subs) {
      subs.forEach(cb => cb(dataUrl))
    }
    this.globalListeners.forEach(cb => cb())
  }

  enqueue(shaders: ShaderDefinition[]) {
    if (this.disposed) return
    let added = false
    for (const s of shaders) {
      if (!this.cache.has(s.id) && !this.queue.find(q => q.id === s.id)) {
        this.queue.push(s)
        added = true
      }
    }
    if (added && !this.processing) {
      this.startProcessing()
    }
  }

  enqueueFront(shaders: ShaderDefinition[]) {
    if (this.disposed) return
    let added = false
    for (const s of shaders) {
      if (!this.cache.has(s.id) && !this.queue.find(q => q.id === s.id)) {
        this.queue.unshift(s)
        added = true
      }
    }
    if (added && !this.processing) {
      this.startProcessing()
    }
  }

  clearQueue() {
    this.queue = []
  }

  invalidate(shaderId: string) {
    this.cache.delete(shaderId)
  }

  private startProcessing() {
    this.processing = true
    this.idleHandle = requestIdleCallbackPolyfill(
      (deadline) => this.processBatch(deadline),
      { timeout: 100 }
    )
  }

  private processBatch = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => {
    if (this.disposed || this.queue.length === 0) {
      this.processing = false
      return
    }

    let count = 0
    while (count < BATCH_SIZE && this.queue.length > 0) {
      if (!deadline.didTimeout && deadline.timeRemaining() < 2 && count > 0) break
      const shader = this.queue.shift()!
      this.renderPreview(shader)
      count++
    }

    if (this.queue.length > 0) {
      this.idleHandle = requestIdleCallbackPolyfill(
        (d) => this.processBatch(d),
        { timeout: 200 }
      )
    } else {
      this.processing = false
    }
  }

  private renderPreview(def: ShaderDefinition) {
    const { gl } = this
    if (!gl || !this.vao) return

    let program: WebGLProgram | null = null
    try {
      program = createProgram(gl, VERT_SRC, def.fragment)
    } catch {
      // Shader failed to compile
    }
    if (!program) program = this.fallbackProgram
    if (!program) return

    if (this.currentProgram && this.currentProgram !== this.fallbackProgram) {
      gl.deleteProgram(this.currentProgram)
    }
    this.currentProgram = program
    this.cacheUniforms()

    gl.bindVertexArray(this.vao)
    gl.viewport(0, 0, PREVIEW_W, PREVIEW_H)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    const time = (Date.now() - this.startTime) / 1000
    const set = (name: string, ...values: number[]) => {
      const loc = this.currentUniforms.get(name)
      if (!loc) return
      if (values.length === 1) gl.uniform1f(loc, values[0])
      else if (values.length === 2) gl.uniform2f(loc, values[0], values[1])
      else if (values.length === 3) gl.uniform3f(loc, values[0], values[1], values[2])
      else if (values.length === 4) gl.uniform4f(loc, values[0], values[1], values[2], values[3])
    }

    set('uTime', time)
    set('uResolution', PREVIEW_W, PREVIEW_H)
    set('uMouse', 0.5, 0.5)
    set('uBass', 0.3)
    set('uMid', 0.25)
    set('uTreble', 0.15)
    set('uVolume', 0.25)
    set('uBeat', 0.2)
    set('uBeatPhase', 0)
    set('uBPM', 128)
    set('uSub', 0.3)
    set('uLowMid', 0.2)
    set('uHighMid', 0.15)
    set('uSpectralCentroid', 0.5)
    set('speed', def.defaults.speed ?? 1)
    set('intensity', def.defaults.intensity ?? 1)
    set('distortion', def.defaults.distortion ?? 0)
    set('scale', def.defaults.scale ?? 1)
    set('brightness', def.defaults.brightness ?? 1)
    set('hueShift', def.defaults.hueShift ?? 0)
    set('saturation', def.defaults.saturation ?? 1)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)

    let dataUrl: string
    try {
      dataUrl = this.canvas.toDataURL('image/webp', 0.75)
      if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) throw new Error('WebP unsupported')
    } catch {
      try {
        dataUrl = this.canvas.toDataURL('image/png')
      } catch {
        return
      }
    }

    this.cache.set(def.id, { dataUrl, timestamp: Date.now() })
    this.notify(def.id, dataUrl)
  }

  dispose() {
    this.disposed = true
    cancelIdleCallbackPolyfill(this.idleHandle)
    this.queue = []
    const { gl } = this
    if (gl) {
      if (this.currentProgram && this.currentProgram !== this.fallbackProgram) {
        gl.deleteProgram(this.currentProgram)
      }
      if (this.fallbackProgram) gl.deleteProgram(this.fallbackProgram)
      if (this.vao) gl.deleteVertexArray(this.vao)
      if (this.vaoBuffer) gl.deleteBuffer(this.vaoBuffer)
    }
    this.cache.clear()
    this.listeners.clear()
    this.globalListeners.clear()
  }
}

let instance: ShaderPreviewManagerSingleton | null = null

export function getShaderPreviewManager(): ShaderPreviewManagerSingleton {
  if (!instance) {
    instance = new ShaderPreviewManagerSingleton()
  }
  return instance
}
