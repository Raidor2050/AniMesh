import { createProgram, createQuadVAO, createFBO, resizeFBO, disposeFBO, disposeProgram, VERT_SRC } from '../core/WebGL'
import { AudioSnapshot, ShaderDefinition, AudioMapping } from '../utils/types'
import { AudioMappingEngine } from '../mappings/AudioMappingEngine'

const BLOOM_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uIntensity;
out vec4 fragColor;
void main() {
  vec2 texel = 1.0 / uResolution;
  vec4 c = texture(uTexture, vUv) * 4.0;
  c += texture(uTexture, vUv + texel * vec2(1,1));
  c += texture(uTexture, vUv + texel * vec2(-1,1));
  c += texture(uTexture, vUv + texel * vec2(1,-1));
  c += texture(uTexture, vUv + texel * vec2(-1,-1));
  fragColor = c / 8.0;
  float brightness = dot(fragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  fragColor.rgb *= smoothstep(0.6, 1.0, brightness) * uIntensity;
}`

const COMPOSITE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomStrength;
uniform float uSaturation;
out vec4 fragColor;
void main() {
  vec4 scene = texture(uScene, vUv);
  vec4 bloom = texture(uBloom, vUv);
  vec3 color = scene.rgb + bloom.rgb * uBloomStrength;
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);
  fragColor = vec4(color, 1.0);
}`

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

export class Renderer {
  private gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private program: WebGLProgram | null = null
  private vao: WebGLVertexArrayObject | null = null
  private vaoBuffer: WebGLBuffer | null = null

  private fboA: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null
  private fboB: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null

  private bloomProgram: WebGLProgram | null = null
  private compositeProgram: WebGLProgram | null = null
  private bloomLocs: { uTexture: WebGLUniformLocation | null; uResolution: WebGLUniformLocation | null; uIntensity: WebGLUniformLocation | null } | null = null
  private compositeLocs: { uScene: WebGLUniformLocation | null; uBloom: WebGLUniformLocation | null; uBloomStrength: WebGLUniformLocation | null; uSaturation: WebGLUniformLocation | null } | null = null

  private mappingEngine = new AudioMappingEngine()
  private currentShader: ShaderDefinition | null = null
  private uniforms: Map<string, WebGLUniformLocation> = new Map()
  private baseParams: Record<string, number> = {}

  private dpr = 1
  private width = 0
  private height = 0
  private fps = 0
  private frameCount = 0
  private lastFpsTime = 0
  private lastFrameTime = 0
  private hasPostFx = false

  private lastError: string | null = null

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas
    this.gl = gl

    const quadResult = createQuadVAO(gl)
    if (quadResult) {
      this.vao = quadResult.vao
      this.vaoBuffer = quadResult.buffer
    }

    const w = canvas.width || 1
    const h = canvas.height || 1

    this.fboA = createFBO(gl, w, h)
    this.fboB = createFBO(gl, w, h)

    if (this.fboA && this.fboB) {
      const bloomProg = createProgram(gl, VERT_SRC, BLOOM_FRAG)
      const compositeProg = createProgram(gl, VERT_SRC, COMPOSITE_FRAG)
      if (bloomProg && compositeProg) {
        this.bloomProgram = bloomProg
        this.compositeProgram = compositeProg
        this.bloomLocs = {
          uTexture: gl.getUniformLocation(bloomProg, 'uTexture'),
          uResolution: gl.getUniformLocation(bloomProg, 'uResolution'),
          uIntensity: gl.getUniformLocation(bloomProg, 'uIntensity'),
        }
        this.compositeLocs = {
          uScene: gl.getUniformLocation(compositeProg, 'uScene'),
          uBloom: gl.getUniformLocation(compositeProg, 'uBloom'),
          uBloomStrength: gl.getUniformLocation(compositeProg, 'uBloomStrength'),
          uSaturation: gl.getUniformLocation(compositeProg, 'uSaturation'),
        }
        this.hasPostFx = true
      }
    }

    const fallbackProg = createProgram(gl, VERT_SRC, FALLBACK_FRAG)
    if (fallbackProg && !this.program) {
      this.program = fallbackProg
    }
  }

  resize(w: number, h: number, dpr: number) {
    this.width = w
    this.height = h
    // Cap DPR: 2.0 desktop, 1.5 mobile — research-backed for <14ms frame budget
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent)
    this.dpr = Math.min(dpr, isMobile ? 1.5 : 2.0)
    const rw = Math.floor(w * this.dpr)
    const rh = Math.floor(h * this.dpr)
    this.canvas.width = rw
    this.canvas.height = rh
    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`

    const { gl } = this
    if (this.fboA) resizeFBO(gl, this.fboA, rw, rh)
    if (this.fboB) resizeFBO(gl, this.fboB, rw, rh)
  }

  setShader(def: ShaderDefinition) {
    const { gl } = this

    if (this.program) gl.deleteProgram(this.program)
    this.program = null
    this.currentShader = null
    this.uniforms.clear()
    this.baseParams = {}

    try {
      this.program = createProgram(gl, def.vertex ?? VERT_SRC, def.fragment)
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : String(e)
      console.error('Shader compile failed:', e)
      const fallback = createProgram(gl, VERT_SRC, FALLBACK_FRAG)
      if (fallback) this.program = fallback
      return
    }

    if (!this.program) {
      this.lastError = 'Shader compile returned null'
      const fallback = createProgram(gl, VERT_SRC, FALLBACK_FRAG)
      if (fallback) this.program = fallback
      return
    }

    this.lastError = null
    this.currentShader = def
    this.baseParams = { ...def.defaults }

    const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(this.program, i)
      if (info) {
        const loc = gl.getUniformLocation(this.program, info.name)
        if (loc) this.uniforms.set(info.name, loc)
      }
    }

    this.mappingEngine.reset()
  }

  getLastError(): string | null { return this.lastError }

  render(audio: AudioSnapshot, time: number, mouse: [number, number], customMappings?: AudioMapping[], userParams?: Record<string, number>) {
    const { gl, width, height } = this
    if (!this.program || width === 0 || height === 0 || !this.vao) return

    const now = performance.now()
    const dt = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 1 / 60
    this.lastFrameTime = now

    const rw = Math.floor(width * this.dpr)
    const rh = Math.floor(height * this.dpr)

    const allMappings = [
      ...(this.currentShader?.audioMappings ?? []),
      ...(customMappings ?? []),
    ]

    const mergedBase = userParams ? { ...this.baseParams, ...userParams } : this.baseParams

    const mapped = this.mappingEngine.applyMappings(
      audio,
      allMappings,
      mergedBase,
      dt
    )

    gl.bindVertexArray(this.vao)

    if (this.hasPostFx && this.fboA && this.fboB && this.bloomProgram && this.compositeProgram && this.bloomLocs && this.compositeLocs) {
      // Scene pass → FBO A
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer)
      gl.viewport(0, 0, rw, rh)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(this.program)
      this.setUniforms(time, audio, mapped, [rw, rh], mouse)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // Bloom pass → FBO B
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB.framebuffer)
      gl.viewport(0, 0, rw, rh)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(this.bloomProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.fboA.texture)
      if (this.bloomLocs.uTexture) gl.uniform1i(this.bloomLocs.uTexture, 0)
      if (this.bloomLocs.uResolution) gl.uniform2f(this.bloomLocs.uResolution, rw, rh)
      if (this.bloomLocs.uIntensity) gl.uniform1f(this.bloomLocs.uIntensity, mapped.bloom ?? 0.5)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // Composite → screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, rw, rh)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(this.compositeProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.fboA.texture)
      if (this.compositeLocs.uScene) gl.uniform1i(this.compositeLocs.uScene, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, this.fboB.texture)
      if (this.compositeLocs.uBloom) gl.uniform1i(this.compositeLocs.uBloom, 1)
      if (this.compositeLocs.uBloomStrength) gl.uniform1f(this.compositeLocs.uBloomStrength, mapped.bloomStrength ?? 0.6)
      if (this.compositeLocs.uSaturation) gl.uniform1f(this.compositeLocs.uSaturation, mapped.saturation ?? 1.0)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      gl.activeTexture(gl.TEXTURE0)

      // Hint driver: FBO contents consumed, safe to discard tile memory
      const invalidate = [gl.COLOR_ATTACHMENT0]
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer)
      gl.invalidateFramebuffer(gl.FRAMEBUFFER, invalidate)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB.framebuffer)
      gl.invalidateFramebuffer(gl.FRAMEBUFFER, invalidate)
    } else {
      // Direct render to screen (no post-processing)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, rw, rh)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(this.program)
      this.setUniforms(time, audio, mapped, [rw, rh], mouse)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    gl.bindVertexArray(null)

    this.frameCount++
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastFpsTime = now
    }
  }

  private setUniforms(
    time: number,
    audio: AudioSnapshot,
    mapped: Record<string, number>,
    resolution: [number, number],
    mouse: [number, number]
  ) {
    const { gl, program, uniforms } = this
    if (!program) return

    const set = (name: string, ...values: number[]) => {
      const loc = uniforms.get(name)
      if (!loc) return
      if (values.length === 1) gl.uniform1f(loc, values[0])
      else if (values.length === 2) gl.uniform2f(loc, values[0], values[1])
      else if (values.length === 3) gl.uniform3f(loc, values[0], values[1], values[2])
      else if (values.length === 4) gl.uniform4f(loc, values[0], values[1], values[2], values[3])
    }

    set('uTime', time)
    set('uResolution', resolution[0], resolution[1])
    set('uMouse', mouse[0], mouse[1])
    set('uBass', audio.bass)
    set('uMid', audio.mid)
    set('uTreble', audio.treble)
    set('uVolume', audio.volume)
    set('uBeat', audio.beatIntensity)
    set('uBeatPhase', audio.beatPhase)
    set('uBPM', audio.bpm)
    set('uSub', audio.sub)
    set('uLowMid', audio.lowMid)
    set('uHighMid', audio.highMid)
    set('uSpectralCentroid', audio.spectralCentroid)

    for (const [key, value] of Object.entries(mapped)) {
      set(key, value)
    }
  }

  getFPS() { return this.fps }
  getCurrentShader() { return this.currentShader }
  dispose() {
    const { gl } = this
    if (this.program) gl.deleteProgram(this.program)
    if (this.bloomProgram) gl.deleteProgram(this.bloomProgram)
    if (this.compositeProgram) gl.deleteProgram(this.compositeProgram)
    if (this.vao) gl.deleteVertexArray(this.vao)
    if (this.vaoBuffer) gl.deleteBuffer(this.vaoBuffer)
    disposeFBO(gl, this.fboA)
    disposeFBO(gl, this.fboB)
  }
}
