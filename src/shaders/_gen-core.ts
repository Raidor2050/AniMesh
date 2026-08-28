// Shared generator core for the extreme-collection shader families.
//
// Strict-GLSL-safe by construction (Phase 24 ANGLE/D3D11 + SwiftShader audit):
//   - `#version 300 es` is the first line
//   - every interpolated numeric literal is a float literal (`.0` suffix)
//   - no implicit int→float in function args (pal(colr, 0.0), not pal(colr, 0))
//   - loop induction counters are `int`, cast `float(i)` when used in math
//   - no variable/function named after a GLSL builtin
// These rules are enforced per-family and verified by the full-library sweep.
import { ShaderDefinition, ShaderCategory, AudioMapping, ParameterSchema } from '../utils/types'
import { wireUniversals } from './wireParams'

const HDR_BASE = [
  '#version 300 es',
  'precision highp float;',
  'uniform float uTime;',
  'uniform vec2 uResolution;',
  'uniform vec2 uMouse;',
  'uniform float uBass;',
  'uniform float uMid;',
  'uniform float uTreble;',
  'uniform float uVolume;',
  'uniform float uBeat;',
  'uniform float uBeatPhase;',
  'uniform float uBPM;',
  'uniform float uSub;',
  'uniform float uLowMid;',
  'uniform float uHighMid;',
  'uniform float uSpectralCentroid;',
  'uniform float speed;',
  'uniform float intensity;',
  'uniform float distortion;',
  'uniform float scale;',
  'uniform float brightness;',
  'uniform float hueShift;',
  'uniform float saturation;',
  'out vec4 fragColor;',
  '',
  'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}',
  'float fbm(vec2 p){float f=0.0;float a=0.5;for(int i=0;i<5;i++){f+=a*noise(p);p*=2.01;a*=0.5;}return f;}',
  'vec3 pal(float u,float h){u+=h+uSpectralCentroid*0.35;return 0.5+0.5*cos(6.28318*(vec3(1.0,0.7,0.4)*u+vec3(0.0,0.12,0.2)));}',
  'vec3 pal2(float u,float h){u+=h+uBass*0.2;float r=sin(u*6.28318)*0.5+0.5;float g=sin(u*6.28318+2.1)*0.5+0.5;float b=sin(u*6.28318+4.2)*0.5+0.5;return vec3(r,g,b);}',
  'float beatGate(float k){return pow(max(0.0,sin(fract(uTime*uBPM/60.0*k)*3.14159)),2.0);}',
  '',
].join('\n')

export interface Param { id: string; label: string; min: number; max: number; def: number; step: number; group: string }
export interface M { signal: AudioMapping['signal']; param: string; amount: number; curve: AudioMapping['curve'] }

// Prologue — uv/p/t plus decoded audio locals (bass/mid/treb/vol/sub/cnt/gate).
// `s` interpolation MUST reference one of these locals (never a uniform name).
export function P(extra: string[]): string {
  const base = [
    'void main(){',
    '  vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);',
    '  float t=uTime*speed;',
    '  vec2 p=uv*scale;',
    '  float bass=clamp(uBass,0.0,1.0);',
    '  float mid=clamp(uMid,0.0,1.0);',
    '  float treb=clamp(uTreble,0.0,1.0);',
    '  float vol=clamp(uVolume,0.0,1.0);',
    '  float sub=clamp(uSub,0.0,1.0);',
    '  float cnt=clamp(uSpectralCentroid,0.0,1.0);',
    '  float beat=clamp(uBeat,0.0,1.0);',
    '  float gate=beatGate(0.5);',
    ...extra.map((e) => '  ' + e),
  ]
  return base.join('\n') + '\n'
}

// Color-wash epilogue (deep generative families) — beat flash + brightness floor.
export const E = [
  '  col=mix(col,vec3(1.0,0.7,0.5)*col+pal(t*0.1,0.0)*col*0.3,1.0);',
  '  col*=intensity*(0.6+0.6*beat*0.7);',
  '  col*=brightness;',
  '  col=max(col,vec3(0.008));',
  '  fragColor=vec4(col,1.0);',
  '}',
  '',
].join('\n')

// Pure epilogue (object fragments): objects stay crisp on near-black, no wash.
export const E2 = [
  '  col*=intensity*(0.55+0.6*beat);',
  '  col*=brightness;',
  '  col=max(col,vec3(0.004));',
  '  fragColor=vec4(col,1.0);',
  '}',
  '',
].join('\n')

export const BASE: Param[] = [
  { id: 'speed', label: 'Tempo', min: 0.3, max: 3, def: 1, step: 0.05, group: 'animation' },
  { id: 'intensity', label: 'Intensity', min: 0.3, max: 3, def: 1, step: 0.05, group: 'audio' },
  { id: 'scale', label: 'Zoom', min: 0.5, max: 3, def: 1, step: 0.05, group: 'transform' },
  { id: 'distortion', label: 'Warp', min: 0, max: 3, def: 1, step: 0.1, group: 'audio' },
  { id: 'brightness', label: 'Brightness', min: 0.2, max: 2.5, def: 1, step: 0.05, group: 'color' },
]

export const A_BASE: M[] = [
  { signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' },
  { signal: 'beat', param: 'intensity', amount: 0.45, curve: 'linear' },
  { signal: 'mid', param: 'hueShift', amount: 0.3, curve: 'linear' },
  { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' },
]

// GLSL requires float literals: `F(n)` interpolates a whole number with `.0`.
export const F = (n: number) => (Number.isInteger(n) ? n + '.0' : String(n))

// 24 hue offsets for seeded variant families.
export const H = [0.0, 0.1, 0.2, 0.3, 0.15, 0.05, 0.25, 0.35, 0.4, 0.2, 0.45, 0.5, 0.08, 0.18, 0.28, 0.38, 0.12, 0.22, 0.32, 0.42, 0.48, 0.55, 0.6, 0.33].map(F)

// `s` interpolated into bodies MUST be a prologue local id.
export const SIG = ['bass', 'bass', 'mid', 'mid', 'treb', 'treb', 'vol', 'sub', 'cnt', 'bass', 'mid', 'treb', 'vol', 'sub', 'cnt', 'bass', 'mid', 'treb', 'vol', 'sub', 'cnt', 'mid', 'treb', 'bass']

export function sigToSignal(s: string): AudioMapping['signal'] {
  if (s === 'treb') return 'treble'
  if (s === 'vol') return 'volume'
  if (s === 'cnt' || s === 'sub') return 'mid' // centroid has no signal id; mid is the closest
  return s as AudioMapping['signal']
}

export function bld(
  id: string, name: string, cat: ShaderCategory, detail: string, body: string,
  extra: Param[], opts: {
    audio?: M[]
    tier?: ShaderDefinition['performanceTier']
    tags?: string[]
    /** 'wash' = color-wash epilogue (deep), 'pure' = crisp epilogue (objects) */
    epilogue?: 'wash' | 'pure'
  } = {}
): ShaderDefinition {
  const params: ParameterSchema[] = [
    ...BASE.map(b => ({ id: b.id, label: b.label, min: b.min, max: b.max, default: b.def, step: b.step, group: b.group })),
    ...extra.map(e => ({ id: e.id, label: e.label, min: e.min, max: e.max, default: e.def, step: e.step, group: e.group })),
  ]
  const audioMappings: AudioMapping[] = opts.audio ?? []
  const extraUnis = extra.length ? '\n' + extra.map(e => `uniform float ${e.id};`).join('\n') + '\n' : ''
  const baseDefs = { speed: 1, intensity: 1, distortion: 1, scale: 1, brightness: 1 }
  const epilogue = opts.epilogue === 'pure' ? E2 : E
  // Bodies assembled by consumers via body(); epilogue already carries `}`.
  const fullBody = body + '\n' + epilogue
  return {
    id, name, category: cat, description: detail,
    tags: opts.tags ?? [cat, 'reactive'],
    fragment: HDR_BASE + extraUnis + wireUniversals(fullBody, baseDefs), uniforms: [],
    params,
    defaults: {
      speed: 1, intensity: 1, distortion: 1, scale: 1, brightness: 1, hueShift: 0, saturation: 1,
      ...Object.fromEntries(extra.map(e => [e.id, e.def])),
    },
    audioMappings: [...A_BASE, ...audioMappings],
    performanceTier: opts.tier ?? 'medium',
  }
}

// Assemble a standard color-wash body: prologue extras + main + epilogue.
export function body(extra: string[], main: string): string {
  return P(extra) + '\n  vec3 col=' + main + ';\n'
}

// Enforce the "max N variations of the same shader" rule: group entries by
// family (id with its trailing `-N` suffix stripped) and keep the first `cap`
// members of each. Applied to the generated collections so no family exceeds
// its variant budget.
export function capFamily(defs: ShaderDefinition[], cap = 3): ShaderDefinition[] {
  const seen = new Map<string, number>()
  return defs.filter(d => {
    const base = d.id.replace(/-\d+$/, '')
    const n = seen.get(base) ?? 0
    if (n >= cap) return false
    seen.set(base, n + 1)
    return true
  })
}