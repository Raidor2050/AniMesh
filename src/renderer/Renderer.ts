import { createProgram, createQuadVAO, createFBO, resizeFBO, disposeFBO, VERT_SRC } from '../core/WebGL'
import { AudioSnapshot, ShaderDefinition, AudioMapping } from '../utils/types'
import { FeatureGraph, DEFAULT_PROFILE, legacyToRoutes, Route, ParamRanges, MACRO_IDS } from '../mappings/featureGraph'
import { audioDataBridge, useUIStore } from '../state/stores'
import { ProgramCache } from './programCache'

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
uniform float uBrightness;
uniform float uIntensity;
uniform float uHueShift;
uniform float uZoom;
uniform float uTime;
uniform float uBeat;
out vec4 fragColor;
// IQ hue rotation matrix
mat3 hueRotate(float a) {
  float c = cos(a), s = sin(a);
  mat3 m3 = mat3(0.299,0.587,0.114,
                0.299,0.587,0.114,
                0.299,0.587,0.114);
  mat3 a3 = mat3(0.701,-0.299,-0.300,
                -0.587,0.413,-0.588,
                -0.114,-0.114,0.886);
  mat3 b3 = mat3(0.168,0.330,-0.497,
                -0.328,0.035,0.292,
                1.250,-1.050,0.203);
  return m3 + c*a3 + s*b3;
}
void main() {
  vec2 uv = vUv;
  // Universal scale/zoom â€” affects EVERY shader output regardless of body
  vec2 center = vec2(0.5);
  uv = (uv - center) / max(uZoom, 0.05) + center;
  vec4 scene = texture(uScene, uv);
  vec4 bloom = texture(uBloom, uv);
  vec3 color = scene.rgb + bloom.rgb * uBloomStrength;
  // Guard against NaN/Inf propagating from a broken shader body
  if (any(isnan(color)) || any(isinf(color))) color = vec3(0.0);
  // Universal color grading â€” all params apply to every shader
  color *= uBrightness * uIntensity;
  color = hueRotate(uHueShift) * color;
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, uSaturation);
  // Safety floor + minimum beat flash so output is never pure black and
  // always audibly reactive, even if the source shader is degenerate.
  float floorAmt = 0.02 + 0.03 * uBeat;
  color = max(color, vec3(floorAmt));
  color = clamp(color, 0.0, 1.0);
  fragColor = vec4(color, 1.0);
}`

// Dual-source crossfade mixer (D3). `uProgress` is eased (smoothstep) so the
// blend never snaps, and both feeds are full-resolution scene FBOs.
const BLEND_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform float uProgress;
out vec4 fragColor;
void main() {
  vec4 a = texture(uFrom, vUv);
  vec4 b = texture(uTo, vUv);
  fragColor = mix(a, b, uProgress);
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

// Shader crossfade duration in seconds (D03 spec range is 0.4â€“1.2s).
const CROSSFADE_SECONDS = 0.7

export class Renderer {
  private gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private program: WebGLProgram | null = null
  private vao: WebGLVertexArrayObject | null = null
  private vaoBuffer: WebGLBuffer | null = null

  private fboA: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null
  private fboB: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null
  private fboC: { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null = null

  private bloomProgram: WebGLProgram | null = null
  private compositeProgram: WebGLProgram | null = null
  private blendProgram: WebGLProgram | null = null
  private bloomLocs: { uTexture: WebGLUniformLocation | null; uResolution: WebGLUniformLocation | null; uIntensity: WebGLUniformLocation | null } | null = null
  private compositeLocs: { uScene: WebGLUniformLocation | null; uBloom: WebGLUniformLocation | null; uBloomStrength: WebGLUniformLocation | null; uSaturation: WebGLUniformLocation | null; uBrightness: WebGLUniformLocation | null; uIntensity: WebGLUniformLocation | null; uHueShift: WebGLUniformLocation | null; uZoom: WebGLUniformLocation | null; uTime: WebGLUniformLocation | null; uBeat: WebGLUniformLocation | null } | null = null
  private blendLocs: { uFrom: WebGLUniformLocation | null; uTo: WebGLUniformLocation | null; uProgress: WebGLUniformLocation | null } | null = null

  private cache!: ProgramCache

  private graph = new FeatureGraph()
  private ranges: ParamRanges = {}
  private customRoutes = { key: '', routes: [] as Route[] }
  private currentShader: ShaderDefinition | null = null
  private uniforms: Map<string, WebGLUniformLocation> = new Map()
  private baseParams: Record<string, number> = {}

  private transition: {
    from: WebGLProgram
    fromUniforms: Map<string, WebGLUniformLocation>
    frac: number
  } | null = null

  // Reduced-motion freeze (D29): uTime is locked to the first frame value.
  private frozenTime: number | null = null

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
    this.cache = new ProgramCache(gl)
    this.graph.setProfile(DEFAULT_PROFILE)

    const quadResult = createQuadVAO(gl)
    if (quadResult) {
      this.vao = quadResult.vao
      this.vaoBuffer = quadResult.buffer
    }

    const w = canvas.width || 1
    const h = canvas.height || 1

    this.fboA = createFBO(gl, w, h)
    this.fboB = createFBO(gl, w, h)
    this.fboC = this.fboA && this.fboB ? createFBO(gl, w, h) : null

    if (this.fboA && this.fboB && this.fboC) {
      const bloomProg = createProgram(gl, VERT_SRC, BLOOM_FRAG)
      const compositeProg = createProgram(gl, VERT_SRC, COMPOSITE_FRAG)
      const blendProg = createProgram(gl, VERT_SRC, BLEND_FRAG)
      if (bloomProg && compositeProg && blendProg) {
        this.bloomProgram = bloomProg
        this.compositeProgram = compositeProg
        this.blendProgram = blendProg
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
          uBrightness: gl.getUniformLocation(compositeProg, 'uBrightness'),
          uIntensity: gl.getUniformLocation(compositeProg, 'uIntensity'),
          uHueShift: gl.getUniformLocation(compositeProg, 'uHueShift'),
          uZoom: gl.getUniformLocation(compositeProg, 'uZoom'),
          uTime: gl.getUniformLocation(compositeProg, 'uTime'),
          uBeat: gl.getUniformLocation(compositeProg, 'uBeat'),
        }
        this.blendLocs = {
          uFrom: gl.getUniformLocation(blendProg, 'uFrom'),
          uTo: gl.getUniformLocation(blendProg, 'uTo'),
          uProgress: gl.getUniformLocation(blendProg, 'uProgress'),
        }
        this.hasPostFx = true
      }
    }

    // Boot program = cached fallback so the very first setShader can
    // crossfade in from the safety pattern instead of hard-switching.
    this.program = this.cache.get(VERT_SRC, FALLBACK_FRAG)
    this.uniforms = this.collectUniforms(this.program)
  }

  resize(w: number, h: number, dpr: number) {
    this.width = w
    this.height = h
    // Cap DPR: 2.0 desktop, 1.5 mobile â€” research-backed for <14ms frame budget
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent)
    this.dpr = Math.min(dpr, isMobile ? 1.5 : 2.0)
    const rw = Math.floor(w * this.dpr)
    const rh = Math.floor(h * this.dpr)
    this.canvas.width = rw
    this.canvas.height = rh
    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`

    const { gl } = this
    const okA = this.fboA ? resizeFBO(gl, this.fboA, rw, rh) : true
    const okB = this.fboB ? resizeFBO(gl, this.fboB, rw, rh) : true
    const okC = this.fboC ? resizeFBO(gl, this.fboC, rw, rh) : true
    if (!okA || !okB || !okC) {
      // FBO reallocation failed (e.g. texture size exceeded) â€” degrade to
      // direct-to-screen rendering instead of silently binding an incomplete FBO.
      this.hasPostFx = false
      this.transition = null
      if (this.fboA) disposeFBO(gl, this.fboA)
      if (this.fboB) disposeFBO(gl, this.fboB)
      if (this.fboC) disposeFBO(gl, this.fboC)
      this.fboA = null
      this.fboB = null
      this.fboC = null
    }
  }

  setShader(def: ShaderDefinition) {
    const { gl } = this
    const vert = def.vertex ?? VERT_SRC
    gl.useProgram(null) // predictable linker state between switches

    let prog: WebGLProgram | null = null
    let ok = false
    try {
      prog = this.cache.get(vert, def.fragment)
      if (prog) ok = true
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : String(e)
      console.error('Shader compile failed:', e)
    }

    if (!ok) {
      this.lastError = this.lastError ?? 'Shader compile returned null'
      prog = this.cache.get(VERT_SRC, FALLBACK_FRAG)
      this.currentShader = null
    } else {
      this.currentShader = def
    }

    const prevProgram = this.program
    const prevUniforms = this.uniforms

    this.program = prog
    this.uniforms = this.collectUniforms(prog)
    this.baseParams = ok ? { ...def.defaults } : {}

    // Queue a crossfade (D3) when the full post pipeline is up. The old
    // program rendering continues with its own scene pass, blending into the
    // new one over CROSSFADE_SECONDS. Program lifetime stays with the cache.
    // Reduced-motion (D29) disables crossfades â€” hard switch, no motion.
    const reducedMotion = useUIStore.getState().reducedMotion
    if (this.hasPostFx && this.fboC && prevProgram && prevProgram !== prog && !reducedMotion) {
      this.transition = { from: prevProgram, fromUniforms: prevUniforms, frac: 0 }
    } else {
      this.transition = null
    }

    // Build param ranges (range-aware route amounts are fractions of these).
    this.ranges = {}
    for (const p of def.params ?? []) {
      if (typeof p.min === 'number' && typeof p.max === 'number') {
        this.ranges[p.id] = [p.min, p.max]
      }
    }
    // Composite/browser names that routes may target but which aren't shader params
    const compositeSpans: [string, [number, number]][] = [
      ['bloom', [0, 1.5]], ['bloomStrength', [0, 1.5]], ['zoom', [0.1, 2]],
      ['uZoom', [0.1, 2]], ['uBass', [0, 1]], ['uMid', [0, 1]], ['uTreble', [0, 1]],
    ]
    for (const [id, span] of compositeSpans) {
      if (!this.ranges[id]) this.ranges[id] = span
    }

    // Per-shader routes (legacy AudioMapping conversion keeps exact parity)
    this.graph.setShaderRoutes(legacyToRoutes(def.audioMappings ?? [], this.ranges, 'shader'))
    this.graph.setParamRanges(this.ranges)
    this.customRoutes.key = ''
    this.graph.reset()
  }

  getLastError(): string | null { return this.lastError }

  /**
   * Idle pre-warm (D2/D6): compile a program now so a later switch to `def`
   * hits the cache. Cheap when already warm (true cache hit).
   */
  warmShader(def: ShaderDefinition) {
    this.cache.warm(def.vertex ?? VERT_SRC, def.fragment)
  }

  /**
   * Has the given shader been pre-compiled already? (perf overlay / QA tooling)
   */
  hasShader(def: ShaderDefinition): boolean {
    return this.cache.has(def.vertex ?? VERT_SRC, def.fragment)
  }

  render(audio: AudioSnapshot, time: number, mouse: [number, number], customMappings?: AudioMapping[], userParams?: Record<string, number>) {
    const { gl, width, height } = this
    if (!this.program || width === 0 || height === 0 || !this.vao) return

    const now = performance.now()
    // Clamp dt so decays/animations don't snap after a hidden tab or long stall.
    const dt = this.lastFrameTime > 0 ? Math.min((now - this.lastFrameTime) / 1000, 0.1) : 1 / 60
    this.lastFrameTime = now

    const rw = Math.floor(width * this.dpr)
    const rh = Math.floor(height * this.dpr)
    const res: [number, number] = [rw, rh]

    // Reduced motion (D29): freeze uTime (and cancel in-flight crossfades).
    const reducedMotion = useUIStore.getState().reducedMotion
    if (reducedMotion) {
      this.frozenTime = this.frozenTime ?? time
      this.transition = null
    } else {
      this.frozenTime = null
    }
    const renderTime = reducedMotion ? this.frozenTime ?? time : time

    // MacroBar (D26): ref-bridge â†’ graph profile, read every frame (no React).
    const profileMacros = this.graph.getProfile().macros
    for (const id of MACRO_IDS) {
      const v = audioDataBridge.macros[id]
      if (v !== undefined) profileMacros[id] = v
    }

    const mergedBase = userParams ? { ...this.baseParams, ...userParams } : this.baseParams

    // Custom routes (EQ panel) are rebuilt only when the mapping list changes.
    const customKey = JSON.stringify(customMappings ?? [])
    if (customKey !== this.customRoutes.key) {
      this.customRoutes.key = customKey
      this.customRoutes.routes = legacyToRoutes(customMappings ?? [], this.ranges, 'custom')
      this.graph.setCustomRoutes(this.customRoutes.routes)
    }

    this.graph.setBaseParams(mergedBase)
    const graphOut = this.graph.applySnapshot(audio, dt)
    const mapped = { ...mergedBase, ...graphOut }

    gl.bindVertexArray(this.vao)

    if (this.hasPostFx && this.fboA && this.fboB && this.fboC && this.bloomProgram && this.blendProgram && this.compositeProgram && this.bloomLocs && this.blendLocs && this.compositeLocs) {
      if (this.transition && this.program && this.transition.from !== this.program) {
        // â”€â”€ Crossfade: dual-scene render (D3) â”€â”€
        const tr = this.transition
        tr.frac = Math.min(1, tr.frac + dt / CROSSFADE_SECONDS)
        const eased = tr.frac * tr.frac * (3.0 - 2.0 * tr.frac)

        // 1. outgoing scene â†’ FBO A
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer)
        gl.viewport(0, 0, rw, rh)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(tr.from)
        this.applyUniforms(tr.from, tr.fromUniforms, renderTime, audio, mapped, res, mouse, 1 - tr.frac)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        // 2. incoming scene â†’ FBO B
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB.framebuffer)
        gl.viewport(0, 0, rw, rh)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(this.program)
        this.applyUniforms(this.program, this.uniforms, renderTime, audio, mapped, res, mouse, tr.frac)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        // 3. blend (eased) â†’ FBO C
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboC.framebuffer)
        gl.viewport(0, 0, rw, rh)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(this.blendProgram)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.fboA.texture)
        if (this.blendLocs.uFrom) gl.uniform1i(this.blendLocs.uFrom, 0)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.fboB.texture)
        if (this.blendLocs.uTo) gl.uniform1i(this.blendLocs.uTo, 1)
        if (this.blendLocs.uProgress) gl.uniform1f(this.blendLocs.uProgress, eased)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        // 4. bloom from the blended scene â†’ FBO B (reuse, A+C consumed above)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB.framebuffer)
        gl.viewport(0, 0, rw, rh)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(this.bloomProgram)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.fboC.texture)
        if (this.bloomLocs.uTexture) gl.uniform1i(this.bloomLocs.uTexture, 0)
        if (this.bloomLocs.uResolution) gl.uniform2f(this.bloomLocs.uResolution, rw, rh)
        if (this.bloomLocs.uIntensity) gl.uniform1f(this.bloomLocs.uIntensity, mapped.bloom ?? 0.5)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        // 5. composite â†’ screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, rw, rh)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(this.compositeProgram)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.fboC.texture)
        if (this.compositeLocs.uScene) gl.uniform1i(this.compositeLocs.uScene, 0)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.fboB.texture)
        if (this.compositeLocs.uBloom) gl.uniform1i(this.compositeLocs.uBloom, 1)
        if (this.compositeLocs.uBloomStrength) gl.uniform1f(this.compositeLocs.uBloomStrength, mapped.bloomStrength ?? 0.6)
        if (this.compositeLocs.uSaturation) gl.uniform1f(this.compositeLocs.uSaturation, Math.max(0, mapped.saturation ?? 1.0))
        if (this.compositeLocs.uBrightness) gl.uniform1f(this.compositeLocs.uBrightness, Math.max(0, mapped.brightness ?? 1.0))
        if (this.compositeLocs.uIntensity) gl.uniform1f(this.compositeLocs.uIntensity, Math.max(0, mapped.intensity ?? 1.0))
        if (this.compositeLocs.uHueShift) gl.uniform1f(this.compositeLocs.uHueShift, mapped.hueShift ?? 0.0)
        if (this.compositeLocs.uZoom) gl.uniform1f(this.compositeLocs.uZoom, Math.max(0.1, (mapped.zoom ?? mapped.scale ?? 1.0)))
        if (this.compositeLocs.uTime) gl.uniform1f(this.compositeLocs.uTime, renderTime)
        if (this.compositeLocs.uBeat) gl.uniform1f(this.compositeLocs.uBeat, audio.beatIntensity)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        gl.activeTexture(gl.TEXTURE0)

        if (tr.frac >= 1) {
          this.transition = null
        }

        // Hint driver: FBO contents consumed, safe to discard tile memory
        const invalidate = [gl.COLOR_ATTACHMENT0]
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer)
        gl.invalidateFramebuffer(gl.FRAMEBUFFER, invalidate)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB.framebuffer)
        gl.invalidateFramebuffer(gl.FRAMEBUFFER, invalidate)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboC.framebuffer)
        gl.invalidateFramebuffer(gl.FRAMEBUFFER, invalidate)
      } else {
        this.transition = null
        // Scene pass â†’ FBO A
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer)
        gl.viewport(0, 0, rw, rh)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(this.program)
        this.setUniforms(renderTime, audio, mapped, res, mouse)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        // Bloom pass â†’ FBO B
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

        // Composite â†’ screen
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
        if (this.compositeLocs.uSaturation) gl.uniform1f(this.compositeLocs.uSaturation, Math.max(0, mapped.saturation ?? 1.0))
        if (this.compositeLocs.uBrightness) gl.uniform1f(this.compositeLocs.uBrightness, Math.max(0, mapped.brightness ?? 1.0))
        if (this.compositeLocs.uIntensity) gl.uniform1f(this.compositeLocs.uIntensity, Math.max(0, mapped.intensity ?? 1.0))
        if (this.compositeLocs.uHueShift) gl.uniform1f(this.compositeLocs.uHueShift, mapped.hueShift ?? 0.0)
        if (this.compositeLocs.uZoom) gl.uniform1f(this.compositeLocs.uZoom, Math.max(0.1, (mapped.zoom ?? mapped.scale ?? 1.0)))
        if (this.compositeLocs.uTime) gl.uniform1f(this.compositeLocs.uTime, renderTime)
        if (this.compositeLocs.uBeat) gl.uniform1f(this.compositeLocs.uBeat, audio.beatIntensity)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        gl.activeTexture(gl.TEXTURE0)

        // Hint driver: FBO contents consumed, safe to discard tile memory
        const invalidate = [gl.COLOR_ATTACHMENT0]
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer)
        gl.invalidateFramebuffer(gl.FRAMEBUFFER, invalidate)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB.framebuffer)
        gl.invalidateFramebuffer(gl.FRAMEBUFFER, invalidate)
      }
    } else {
      // Direct render to screen (no post-processing / crossfade)
      this.transition = null
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, rw, rh)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(this.program)
      this.setUniforms(renderTime, audio, mapped, res, mouse)
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
    this.applyUniforms(this.program, this.uniforms, time, audio, mapped, resolution, mouse, 1.0)
  }

  private applyUniforms(
    prog: WebGLProgram | null,
    unis: Map<string, WebGLUniformLocation>,
    time: number,
    audio: AudioSnapshot,
    mapped: Record<string, number>,
    resolution: [number, number],
    mouse: [number, number],
    transitionProgress: number
  ) {
    const { gl } = this
    if (!prog) return

    const set = (name: string, ...values: number[]) => {
      const loc = unis.get(name)
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
    set('uTransitionProgress', transitionProgress)

    for (const [key, value] of Object.entries(mapped)) {
      set(key, value)
    }
  }

  private collectUniforms(prog: WebGLProgram | null): Map<string, WebGLUniformLocation> {
    const m = new Map<string, WebGLUniformLocation>()
    if (!prog) return m
    const { gl } = this
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(prog, i)
      if (info) {
        const loc = gl.getUniformLocation(prog, info.name)
        if (loc) m.set(info.name, loc)
      }
    }
    return m
  }

  getFPS() { return this.fps }
  getCurrentShader() { return this.currentShader }
  dispose() {
    const { gl } = this
    // All shader programs live in the LRU cache (owns lifetime).
    this.cache.dispose()
    if (this.bloomProgram) gl.deleteProgram(this.bloomProgram)
    if (this.compositeProgram) gl.deleteProgram(this.compositeProgram)
    if (this.blendProgram) gl.deleteProgram(this.blendProgram)
    if (this.vao) gl.deleteVertexArray(this.vao)
    if (this.vaoBuffer) gl.deleteBuffer(this.vaoBuffer)
    disposeFBO(gl, this.fboA)
    disposeFBO(gl, this.fboB)
    disposeFBO(gl, this.fboC)
  }
}