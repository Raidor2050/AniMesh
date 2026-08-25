import { createProgram, createQuadVAO, createFBO, VERT_SRC } from '../core/WebGL'
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

export class Renderer {
  private gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private program: WebGLProgram | null = null
  private vao: WebGLVertexArrayObject
  private quadBuffer: WebGLBuffer

  private fboA: { framebuffer: WebGLFramebuffer; texture: WebGLTexture }
  private fboB: { framebuffer: WebGLFramebuffer; texture: WebGLTexture }
  private fboC: { framebuffer: WebGLFramebuffer; texture: WebGLTexture }

  private bloomProgram: WebGLProgram
  private vignetteProgram: WebGLProgram
  private compositeProgram: WebGLProgram

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

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas
    this.gl = gl
    this.vao = createQuadVAO(gl)

    const buf = gl.createBuffer()!
    this.quadBuffer = buf

    const w = canvas.width
    const h = canvas.height
    this.fboA = createFBO(gl, w, h)
    this.fboB = createFBO(gl, w, h)
    this.fboC = createFBO(gl, w, h)

    this.bloomProgram = createProgram(gl, VERT_SRC, BLOOM_FRAG)!
    this.vignetteProgram = createProgram(gl, VERT_SRC, VIGNETTE_FRAG)!
    this.compositeProgram = createProgram(gl, VERT_SRC, COMPOSITE_FRAG)!
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
    const resize = (fbo: { framebuffer: WebGLFramebuffer; texture: WebGLTexture }) => {
      gl.bindTexture(gl.TEXTURE_2D, fbo.texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, rw, rh, 0, gl.RGBA, gl.HALF_FLOAT, null)
    }
    resize(this.fboA)
    resize(this.fboB)
    resize(this.fboC)
  }

  setShader(def: ShaderDefinition) {
    const { gl } = this
    if (this.program) gl.deleteProgram(this.program)

    try {
      this.program = createProgram(gl, def.vertex ?? VERT_SRC, def.fragment)
    } catch (e) {
      console.error('Shader compile failed:', e)
      this.program = null
      return
    }

    this.currentShader = def
    this.uniforms.clear()
    this.baseParams = { ...def.defaults }

    if (this.program) {
      const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS) as number
      for (let i = 0; i < numUniforms; i++) {
        const info = gl.getActiveUniform(this.program, i)
        if (info) {
          const loc = gl.getUniformLocation(this.program, info.name)
          if (loc) this.uniforms.set(info.name, loc)
        }
      }
    }

    this.mappingEngine.reset()
  }

  render(audio: AudioSnapshot, time: number, mouse: [number, number]) {
    const { gl, width, height } = this
    if (!this.program) return

    const rw = Math.floor(width * this.dpr)
    const rh = Math.floor(height * this.dpr)

    const mapped = this.mappingEngine.applyMappings(
      audio,
      this.currentShader?.audioMappings ?? [],
      this.baseParams,
      1 / 60
    )

    // Scene pass → FBO A
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer)
    gl.viewport(0, 0, rw, rh)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(this.program)
    gl.bindVertexArray(this.vao)

    this.setUniforms(time, audio, mapped, [rw, rh], mouse)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // Bloom pass → FBO B
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB.framebuffer)
    gl.viewport(0, 0, rw, rh)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.bloomProgram)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.fboA.texture)
    const bloomLoc = gl.getUniformLocation(this.bloomProgram, 'uTexture')
    gl.uniform1i(bloomLoc, 0)
    const bloomResLoc = gl.getUniformLocation(this.bloomProgram, 'uResolution')
    gl.uniform2f(bloomResLoc, rw, rh)
    const bloomIntLoc = gl.getUniformLocation(this.bloomProgram, 'uIntensity')
    gl.uniform1f(bloomIntLoc, mapped.bloom ?? 0.5)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // Composite + vignette → screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, rw, rh)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(this.compositeProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.fboA.texture)
    gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'uScene'), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.fboB.texture)
    gl.uniform1i(gl.getUniformLocation(this.compositeProgram, 'uBloom'), 1)
    gl.uniform1f(gl.getUniformLocation(this.compositeProgram, 'uBloomStrength'), mapped.bloomStrength ?? 0.6)
    gl.uniform1f(gl.getUniformLocation(this.compositeProgram, 'uSaturation'), mapped.saturation ?? 1.0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // FPS
    this.frameCount++
    const now = performance.now()
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
    gl.deleteBuffer(this.quadBuffer)
    gl.deleteFramebuffer(this.fboA.framebuffer)
    gl.deleteTexture(this.fboA.texture)
    gl.deleteFramebuffer(this.fboB.framebuffer)
    gl.deleteTexture(this.fboB.texture)
    gl.deleteFramebuffer(this.fboC.framebuffer)
    gl.deleteTexture(this.fboC.texture)
  }
}
