import { ShaderDefinition, ShaderCategory } from '../utils/types'
import { wireParams, wireUniversals } from './wireParams'
import { resolveChunkTemplates } from './compose'

export const UNIFORM_HEADER = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uVolume;
uniform float uBeat;
uniform float uBeatPhase;
uniform float uBPM;
uniform float uSub;
uniform float uLowMid;
uniform float uHighMid;
uniform float uSpectralCentroid;
uniform float uMacroEnergy;
uniform float uMacroComplexity;
uniform float uMacroMotion;
uniform float uMacroMusicality;
uniform float uMacroAtmosphere;
uniform float uTransitionProgress;
uniform float speed;
uniform float intensity;
uniform float distortion;
uniform float scale;
uniform float brightness;
uniform float hueShift;
uniform float saturation;
out vec4 fragColor;
`

const COMMON_NOISE = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float f = 0.0; float a = 0.5;
  for(int i = 0; i < 5; i++) { f += a*noise(p); p *= 2.01; a *= 0.5; }
  return f;
}
// IQ cosine palette: 3 base colors + palette parameter t ∈ [0,1]
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
`

export function createShader(
  id: string, name: string, category: ShaderCategory,
  description: string, tags: string[],
  body: string, params: ShaderDefinition['params'] = [],
  defaults: Record<string, number> = {},
  audioMappings: ShaderDefinition['audioMappings'] = [],
  tier: ShaderDefinition['performanceTier'] = 'medium',
  extraUniforms: string = ''
): ShaderDefinition {
  const universalParams: ShaderDefinition['params'] = [
    { id: 'speed', label: 'Speed', min: 0, max: 3, default: 1, step: 0.1 },
    { id: 'intensity', label: 'Intensity', min: 0, max: 2, default: 1, step: 0.05 },
    { id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
    { id: 'scale', label: 'Scale', min: 0.1, max: 3, default: 1, step: 0.1, group: 'audio' },
    { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' },
    { id: 'hueShift', label: 'Hue Shift', min: 0, max: 6.28, default: 0, step: 0.05 },
    { id: 'saturation', label: 'Saturation', min: 0, max: 2, default: 1, step: 0.05 },
  ]

  // Filter out duplicates: shader-specific params override universal ones
  const shaderParamIds = new Set(params.map(p => p.id))
  const filteredUniversal = universalParams.filter(p => !shaderParamIds.has(p.id))

  const defs: Record<string, number> = { speed: 1, intensity: 1, distortion: 0, scale: 1, brightness: 1, hueShift: 0, saturation: 1 }
  for (const p of params) defs[p.id] = p.default
  Object.assign(defs, defaults)

  // Resolve {{chunk:name}} grammar (D22) BEFORE wiring so injected GLSL also
  // participates in universal/param injection.
  const chunked = resolveChunkTemplates(body)
  // Make every custom param a live manipulator (declared + injected into the
  // body when the author left it unwired) plus guarantee universal speed works.
  const wired = wireParams(chunked, extraUniforms, params)
  // Universal scale/distortion/hueShift/saturation also work on every shader.
  const finalBody = wireUniversals(wired.body, defs)

  return {
    id, name, category, description, tags,
    fragment: UNIFORM_HEADER + wired.extraUniforms + COMMON_NOISE + finalBody,
    uniforms: [],
    params: [
      ...filteredUniversal,
      ...params,
    ],
    defaults: defs,
    audioMappings: [
      // Universal mappings are DE-BAKED (D19) — they now live in the global
      // FeatureGraph profile, keeping every shader reactive without duplicating
      // six magic constants per definition. Only shader-specific routes appear
      // here.
      ...audioMappings,
    ],
    performanceTier: tier,
  }
}