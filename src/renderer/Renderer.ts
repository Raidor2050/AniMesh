import { createProgram, createQuadVAO, createFBO, resizeFBO, disposeFBO, disposeProgram, VERT_SRC } from '../core/WebGL'
import { AudioSnapshot, ShaderDefinition } from '../utils/types'
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

const VIGNETTE_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
uniform float uIntensity;
out vec4 fragColor;
void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float vig = 1.0 - dot(uv * uIntensity, uv * uIntensity);
  fragColor = texture(uTexture, vUv) * clamp(vig, 0.0, 1.0);
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

interface CachedUniforms {
  uTexture: WebGLUniformLocation | null
  uResolution: WebGLUniformLocation | null
  uIntensity: WebGLUniformLocation | null
}

interface CompositeUniforms {
  uScene: WebGLUniformLocation | null
  uBloom: WebGLUniformLocation | null
  uBloomStrength: WebGLUniformLocation | null
  uSaturation: WebGLUniformLocation | null
}

export class Renderer {
  private gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private program: WebGLProgram | null = null
  private vao: WebGLVertexArrayObject
  private vaoBuffer: WebGLBuffer

  private fboA: { framebuffer: WebGLFramebuffer; texture: WebGLTexture }
  private fboB: { framebuffer: WebGLFramebuffer; texture: WebGLTexture }

  private bloomProgram: WebGLProgram
  private vignetteProgram: WebGLProgram
  private compositeProgram: WebGLProgram
  private bloomUniforms: CachedUniforms
  private vignetteUniforms: { uTexture: WebGLUniformLocation | null; uIntensity: WebGLUniformLocation | null }
  private compositeUniforms: CompositeUniforms

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

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas
    this.gl = gl

    const quadResult = createQuadVAO(gl)
    if (!quadResult) throw new Error('Failed to create quad VAO')
    this.vao = quadResult.vao
    this.vaoBuffer = quadResult.buffer

    const w = canvas.width || 1
    const h = canvas.height || 1

    const fboAResult = createFBO(gl, w, h)
    const fboBResult = createFBO(gl, w, h)
    if (!fboAResult || !fboBResult) throw new Error('Failed to create FBOs')
    this.fboA = fboAResult
    this.fboB = fboBResult

    const bloomProg = createProgram(gl, VERT_SRC, BLOOM_FRAG)
    const vignetteProg = createProgram(gl, VERT_SRC, VIGNETTE_FRAG)
    const compositeProg = createProgram(gl, VERT_SRC, COMPOSITE_FRAG)
    if (!bloomProg || !vignetteProg || !compositeProg) throw new Error('Failed to compile post-processing programs')
    this.bloomProgram = bloomProg
    this.vignetteProgram = vignetteProg
    this.compositeProgram = compositeProg

    this.bloomUniforms = {
      uTexture: gl.getUniformLocation(bloomProg, 'uTexture'),
      uResolution: gl.getUniformLocation(bloomProg, 'uResolution'),
      uIntensity: gl.getUniformLocation(bloomProg, 'uIntensity'),
    }
    this.vignetteUniforms = {
      uTexture: gl.getUniformLocation(vignetteProg, 'uTexture'),
      uIntensity: gl.getUniformLocation(vignetteProg, 'uIntensity'),
    }
    this.compositeUniforms = {
      uScene: gl.getUniformLocation(compositeProg, 'uScene'),
      uBloom: gl.getUniformLocation(compositeProg, 'uBloom'),
      uBloomStrength: gl.getUniformLocation(compositeProg, 'uBloomStrength'),
      uSaturation: gl.getUniformLocation(compositeProg, 'uSaturation'),
    }
  }

  resize(w: number, h: number, dpr: number) {
    this.width = w
    this.height = h
    this.dpr = dpr
    const rw = Math.floor(w * dpr)
    const rh = Math.floor(h * dpr)
    this.canvas.width = rw
    this.canvas.height = rh
    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`

    const { gl } = this
    resizeFBO(gl, this.fboA, rw, rh)
    resizeFBO(gl, this.fboB, rw, rh)
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
      console.error('Shader compile failed:', e)
      return
    }

    if (!this.program) {
      console.error('Shader compile returned null')
      return
    }

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

  render(audio: AudioSnapshot, time: number, mouse: [number, number]) {
    const { gl, width, height } = this
    if (!this.program || !this.currentShader) return
    if (width === 0 || height === 0) return

    const now = performance.now()
    const dt = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 1 / 60
    this.lastFrameTime = now

    const rw = Math.floor(width * this.dpr)
    const rh = Math.floor(height * this.dpr)

    const mapped = this.mappingEngine.applyMappings(
      audio,
      this.currentShader.audioMappings ?? [],
      this.baseParams,
      dt
    )

    gl.bindVertexArray(this.vao)

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
    if (this.bloomUniforms.uTexture) gl.uniform1i(this.bloomUniforms.uTexture, 0)
    if (this.bloomUniforms.uResolution) gl.uniform2f(this.bloomUniforms.uResolution, rw, rh)
    if (this.bloomUniforms.uIntensity) gl.uniform1f(this.bloomUniforms.uIntensity, mapped.bloom ?? 0.5)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // Vignette pass → FBO A (reuse)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer)
    gl.viewport(0, 0, rw, rh)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.vignetteProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.fboB.texture)
    if (this.vignetteUniforms.uTexture) gl.uniform1i(this.vignetteUniforms.uTexture, 0)
    if (this.vignetteUniforms.uIntensity) gl.uniform1f(this.vignetteUniforms.uIntensity, 0.5)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // Composite → screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, rw, rh)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.compositeProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.fboA.texture)
    if (this.compositeUniforms.uScene) gl.uniform1i(this.compositeUniforms.uScene, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.fboB.texture)
    if (this.compositeUniforms.uBloom) gl.uniform1i(this.compositeUniforms.uBloom, 1)
    if (this.compositeUniforms.uBloomStrength) gl.uniform1f(this.compositeUniforms.uBloomStrength, mapped.bloomStrength ?? 0.6)
    if (this.compositeUniforms.uSaturation) gl.uniform1f(this.compositeUniforms.uSaturation, mapped.saturation ?? 1.0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    gl.activeTexture(gl.TEXTURE0)
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
    set('sub', audio.sub)
    set('lowMid', audio.lowMid)
    set('highMid', audio.highMid)

    for (const [key, value] of Object.entries(mapped)) {
      set(key, value)
    }
  }

  getFPS() { return this.fps }
  getCurrentShader() { return this.currentShader }
  dispose() {
    const { gl } = this
    if (this.program) gl.deleteProgram(this.program)
    gl.deleteProgram(this.bloomProgram)
    gl.deleteProgram(this.vignetteProgram)
    gl.deleteProgram(this.compositeProgram)
    gl.deleteVertexArray(this.vao)
    gl.deleteBuffer(this.vaoBuffer)
    disposeFBO(gl, this.fboA)
    disposeFBO(gl, this.fboB)
  }
}
