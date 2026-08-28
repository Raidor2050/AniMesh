import { ParameterSchema } from '../utils/types'

// GLSL built-in identifiers that must never be re-declared as uniforms
// (declaring one would shadow the built-in function/var and break compilation).
const GLSL_BUILTINS = new Set([
  'length', 'texture', 'mix', 'clamp', 'mod', 'smoothstep', 'step', 'noise',
  'hash', 'fbm', 'palette', 'pal', 'cos', 'sin', 'tan', 'asin', 'acos', 'atan',
  'pow', 'exp', 'log', 'floor', 'ceil', 'fract', 'abs', 'dot', 'sqrt',
  'normalize', 'cross', 'min', 'max', 'sign', 'inversesqrt',
])

// Universal uniforms are always present in the shader header — never redeclare.
const ALWAYS_DECLARED = new Set([
  'speed', 'intensity', 'distortion', 'scale', 'brightness', 'hueShift', 'saturation',
])

const RE_OFFSET = /offset|pan|translat|shift|origin|pos/
const RE_TIME = /speed|flow|animat|rotat|spin|turn|swirl|drift|phase|evol|expansion|veloc/
const RE_SPATIAL = /size|radius|zoom|count|density|complex|freq|arm|ring|petal|side|cell|star|bodies|segment|layer|line|node|connect|particle|source|dot|grid|cryst|branch|filament|curtain|contour|wave|detail|thick|width|beam|slice|tile|smooth|depth|spread|scale|interlace|vein|tightness|bead|opening/

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Emit values as float literals: strict GLSL compilers (ANGLE/D3D11,
// SwiftShader) reject `uniform float - int` / `float / int` even though the
// spec allows implicit conversion. Integral values must carry a `.0`.
const num = (v: number) => {
  const r = String(Math.round(v * 1e6) / 1e6)
  return /\.|e/i.test(r) ? r : r + '.0'
}

export interface WiredResult {
  body: string
  extraUniforms: string
  wired: string[]
}

// Hue rotation that is pixel-identical at hueShift = 0 (identity matrix).
const HUE_MATRIX = (v: string) =>
  '{ float hc = cos(hueShift); float hs = sin(hueShift); ' +
  `${v} = mat3(` +
  `vec3(0.213+0.787*hc-0.213*hs,0.213-0.213*hc+0.143*hs,0.213-0.213*hc-0.787*hs),` +
  `vec3(0.715-0.715*hc-0.715*hs,0.715+0.285*hc+0.140*hs,0.715-0.715*hc+0.715*hs),` +
  `vec3(0.072-0.072*hc+0.928*hs,0.072-0.072*hc-0.283*hs,0.072+0.928*hc+0.072*hs)) * ${v}; }`

// Guarantees the universal uniform sliders (scale/distortion/hueShift/
// saturation) visibly affect EVERY shader, even ones whose body never
// references them. Every injection is pixel-identical at the slider default.
export function wireUniversals(body: string, defs: Record<string, number>): string {
  let out = body
  const has = (id: string) => new RegExp('\\b' + esc(id) + '\\b').test(out)
  const prependBeforeFragColor = (code: string) => {
    const i = out.lastIndexOf('fragColor')
    if (i < 0) return
    out = out.slice(0, i) + code + '\n' + out.slice(i)
  }

  // Zoom + motion warp on the shared uv coordinate.
  const uvStmts: string[] = []
  if (!has('scale')) uvStmts.push('uv *= clamp(scale, 0.01, 10.0);')
  if (!has('distortion')) uvStmts.push(`uv += (distortion - ${num(defs.distortion ?? 0)}) * 0.05 * vec2(sin(uv.y * 40.0), cos(uv.x * 40.0));`)
  if (uvStmts.length) {
    const m = out.match(/vec2\s+uv\s*=[^;\n]*;/)
    if (m) {
      const at = m.index! + m[0].length
      out = out.slice(0, at) + '\n' + uvStmts.join('\n') + out.slice(at)
    }
  }

  // Colour treatments go through whichever vec3 accumulator the body uses
  // (`col` in nearly all, `refl` in liq-mercury).
  const cv = /\bvec3\s+col\b/.test(out) ? 'col' : (out.match(/\bvec3\s+(\w+)\s*=/)?.[1] ?? '')
  if (cv) {
    const colStmts: string[] = []
    if (!has('saturation')) colStmts.push(`${cv} = mix(vec3(dot(${cv}, vec3(0.299, 0.587, 0.114))), ${cv}, saturation);`)
    if (!has('hueShift')) colStmts.push(HUE_MATRIX(cv))
    if (colStmts.length) prependBeforeFragColor(colStmts.join('\n'))
  }
  return out
}

// Wires every custom, currently-dead parameter into the fragment body so a
// slider ALWAYS produces a visible change while staying pixel-identical at
// its default value:
//   — pan-ish params   offset uv      (uv += p - p0)
//   — size/freq-ish    scale uv       (uv *= p/p0, clamped)
//   — time-ish params  drive uTime    (uTime * (p/p0))
//   — everything else  modulates colour (col *= 1 + (p-p0)/span*0.5, floored)
// Params already declared AND referenced by the body are left untouched.
export function wireParams(
  body: string,
  extraUniforms: string,
  customParams: ParameterSchema[],
): WiredResult {
  let out = body
  let decls = extraUniforms
  const wired: string[] = []
  const full = extraUniforms + '\n' + body

  const hasUv = /vec2 uv = [^;]+;/.test(body)
  const timeFactors: string[] = []
  const colStatements: string[] = []

  const candidate = customParams.filter(p => !GLSL_BUILTINS.has(p.id))

  for (const p of candidate) {
    const used = new RegExp('\\b' + esc(p.id) + '\\b').test(body)
    const declared = ALWAYS_DECLARED.has(p.id) || new RegExp('uniform\\s+(float|vec2|vec3|vec4)\\s+' + esc(p.id) + '\\b').test(full)
    // Already live — hand-wired by the author; leave it alone.
    if (used && declared) continue

    if (!declared) decls += `uniform float ${p.id};\n`

    const p0 = num(p.default)
    const id = p.id
    let stmt: string | null = null
    let isTime = false

    if (RE_TIME.test(id)) {
      timeFactors.push(`(${id} / ${p0})`)
      isTime = true
    } else if (RE_OFFSET.test(id) && hasUv) {
      stmt = `uv += (${id} - ${p0});`
    } else if (RE_SPATIAL.test(id) && hasUv && p.default > 0) {
      stmt = `uv *= clamp((${id} / ${p0}), 0.1, 10.0);`
    }

    if (stmt) {
      out = out.replace(/vec2 uv = [^;]+;/, (m) => m + '\n  ' + stmt)
    } else if (!isTime) {
      const span = Math.max(p.max - p.default, p.default - p.min, 0.0001)
      colStatements.push(`col = max((1.0 + ((${id} - ${p0}) / ${num(span)}) * 0.5), 0.1) * col;`)
    }
    wired.push(id)
  }

  // Universal speed: if the body never references `speed` and no custom
  // `speed` param is shadowing it, fold `speed` into uTime so the slider
  // always works. At default (1.0) the factor is identity.
  const bodyHasSpeed = new RegExp('\\bspeed\\b').test(out)
  const hasCustomSpeed = candidate.some(p => p.id === 'speed')
  if (!hasCustomSpeed && !bodyHasSpeed && new RegExp('\\buTime\\b').test(out)) {
    timeFactors.push('(speed / 1.0)')
  }

  if (timeFactors.length > 0 && new RegExp('\\buTime\\b').test(out)) {
    const factor = timeFactors.join(' * ')
    out = out.replace(new RegExp('\\buTime\\b', 'g'), `uTime * ${factor}`)
  }

  if (colStatements.length > 0) {
    const idx = out.lastIndexOf('fragColor = vec4(col, 1.0);')
    if (idx >= 0) {
      out = out.slice(0, idx) + colStatements.join('\n') + '\n' + out.slice(idx)
    }
  }

  return { body: out, extraUniforms: decls, wired }
}