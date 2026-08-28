// Generated collection: 100+ high-energy AUDIO-REACTIVE shaders tuned for
// Techno/Trance: beat-synced gating, kick-driven pulses, hypnotic rotational
// patterns, spectral swirls and strobing color. Every shader:
//   - references uTime and multiple audio uniforms (bass/mid/treble/beat/vol)
//   - uses all universal params (speed/intensity/distortion/scale/brightness)
//   - carries tweakable params actually consumed by the body
//   - applies a brightness floor so it is never pure black
import { ShaderDefinition, ShaderCategory, AudioMapping, ParameterSchema } from '../utils/types'
import { wireUniversals } from './wireParams'

const HDR = [
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
  'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
  'float fbm(vec2 p){float f=0.0;float a=0.5;for(int i=0;i<5;i++){f+=a*noise(p);p*=2.01;a*=0.5;}return f;}',
  'vec3 pal(float u,float h){u+=h+uSpectralCentroid*0.35;return 0.5+0.5*cos(6.28318*(vec3(1.0,0.7,0.4)*u+vec3(0.0,0.12,0.2)));}',
  'vec3 pal2(float u,float h){u+=h+uBass*0.2;float r=sin(u*6.28)*0.5+0.5;float g=sin(u*6.28+2.1)*0.5+0.5;float b=sin(u*6.28+4.2)*0.5+0.5;return vec3(r,g,b);}',
  'float beatGate(float k){return pow(max(0.0,sin(fract(uTime*uBPM/60.0*k)*3.14159)),2.0);}',
  '',
].join('\n')

interface Param { id: string; label: string; min: number; max: number; def: number; step: number; group: string }
interface M { signal: AudioMapping['signal']; param: string; amount: number; curve: AudioMapping['curve'] }

// Prologue — assembles uv/p/t plus decoded audio bands. `extra` lines appended.
function P(extra: string[]): string {
  const base = [
    'void main(){',
    '  vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);',
    '  float t=uTime*speed;',
    '  vec2 p=uv*scale;',
    '  float bass=clamp(uBass,0.0,1.0);',
    '  float mid=clamp(uMid,0.0,1.0);',
    '  float treb=clamp(uTreble,0.0,1.0);',
    '  float beat=clamp(uBeat,0.0,1.0);',
    '  float vol=clamp(uVolume,0.0,1.0);',
    '  float gate=beatGate(0.5);',
    ...extra.map((e) => '  ' + e),
  ]
  return base.join('\n') + '\n'
}

// Epilogue — intensity/beat envelope, brightness, hue shift, floor.
const E = [
  '  col=mix(col,vec3(1.0,0.7,0.5)*col+pal(t*0.1,0.0)*col*0.3,1.0);',
  '  col*=intensity*(0.6+0.6*beat*0.7);',
  '  col*=brightness;',
  '  col=max(col,vec3(0.008));',
  '  fragColor=vec4(col,1.0);',
  '}',
  '',
].join('\n')

const BASE: Param[] = [
  { id: 'speed', label: 'Tempo', min: 0.3, max: 3, def: 1, step: 0.05, group: 'animation' },
  { id: 'intensity', label: 'Intensity', min: 0.3, max: 3, def: 1, step: 0.05, group: 'audio' },
  { id: 'scale', label: 'Zoom', min: 0.5, max: 3, def: 1, step: 0.05, group: 'transform' },
  { id: 'distortion', label: 'Warp', min: 0, max: 3, def: 1, step: 0.1, group: 'audio' },
  { id: 'brightness', label: 'Brightness', min: 0.2, max: 2.5, def: 1, step: 0.05, group: 'color' },
]

const A_BASE: M[] = [
  { signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' },
  { signal: 'beat', param: 'intensity', amount: 0.45, curve: 'linear' },
  { signal: 'mid', param: 'hueShift', amount: 0.3, curve: 'linear' },
  { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' },
]

function bld(
  id: string, name: string, cat: ShaderCategory, detail: string, body: string,
  extra: Param[], audio: M[] = [], tier: ShaderDefinition['performanceTier'] = 'medium'
): ShaderDefinition {
  const params: ParameterSchema[] = [
    ...BASE.map(b => ({ id: b.id, label: b.label, min: b.min, max: b.max, default: b.def, step: b.step, group: b.group })),
    ...extra.map(e => ({ id: e.id, label: e.label, min: e.min, max: e.max, default: e.def, step: e.step, group: e.group })),
  ]
  const audioMappings: AudioMapping[] = audio
  // Declare a uniform for every tweakable extra param so the sliders drive the body.
  const extraUnis = extra.length ? '\n' + extra.map(e => `uniform float ${e.id};`).join('\n') + '\n' : ''
  // Make universal scale/distortion/hueShift/saturation work even on bodies
  // that never reference them (audioMappings still target hueShift/distortion).
  const baseDefs = { speed: 1, intensity: 1, distortion: 1, scale: 1, brightness: 1 }
  return {
    id, name, category: cat, description: detail,
    tags: [cat, 'reactive', 'trance', 'techno'],
    fragment: HDR + extraUnis + wireUniversals(body, baseDefs), uniforms: [],
    params,
    defaults: {
      speed: 1, intensity: 1, distortion: 1, scale: 1, brightness: 1, hueShift: 0, saturation: 1,
      ...Object.fromEntries(extra.map(e => [e.id, e.def])),
    },
    audioMappings: [...A_BASE, ...audioMappings],
    performanceTier: tier,
  }
}

// Helper to build a full body from prologue extras + main color computation.
function body(extra: string[], main: string): string {
  return P(extra) + '  vec3 col=' + main + ';\n' + E
}

export function genReactive(): ShaderDefinition[] {
  const out: ShaderDefinition[] = []
  // GLSL requires float literals: interpolate `h` with a `.0` suffix so whole
  // values like 0.0 don't become a bare `0` (function args don't implicitly
  // convert int→float in GLSL ES, so `pal(colr, 0)` would not compile).
  const F = (n: number) => (Number.isInteger(n) ? n + '.0' : String(n))
  const H = [0.0, 0.1, 0.2, 0.3, 0.15, 0.05, 0.25, 0.35, 0.4, 0.2].map(F)
  // `s` is interpolated into GLSL bodies, so it MUST be one of the local
  // prologue identifiers (bass/mid/treb/vol) — never sub/lowMid/highMid/treble.
  const SIG = ['bass', 'bass', 'mid', 'mid', 'treb', 'treb', 'bass', 'mid', 'treb', 'bass']
  // Map a GLSL identifier back to a real AudioMapping signal.
  const sig2signal = (x: string): AudioMapping['signal'] =>
    x === 'treb' ? 'treble' : x === 'vol' ? 'volume' : (x as AudioMapping['signal'])

  // 1. Beat-Gated Strobe walls (10) — hard 4/4 techno gates
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 3 + (k % 6)
    const extra = [`float g=beatGate(1.0)+beat*2.0;`, `float colr=fract(p.x*cols+t*0.5+${s}*1.5);`]
    const main = `vec3(pal(colr,${h}).r,0.15,0.35)*g*(0.4+${s})`
    out.push(bld(`tr-gate-${k + 1}`, 'Techno Gate ' + (k + 1), 'vj', `Hard strobing beat-gated color walls (${s})`, body(extra, main),
      [{ id: 'cols', label: 'Columns', min: 2, max: 16, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'intensity', amount: 0.6, curve: 'log' }]))
  }

  // 2. Kick-pulse rings (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 5)
    const extra = [`float rr=length(p)*(1.0-${s}*0.3);`, `float r0=rr-(uBeatPhase*0.4+${s}*0.5);`, `float ring=exp(-abs(fract(r0*rings)-0.5)*7.0)*beatGate(1.0);`]
    const main = `pal(rr*2.0+${s}*2.0,${h})*ring*(0.3+0.9*beat)`
    out.push(bld(`tr-kickring-${k + 1}`, 'Kick Rings ' + (k + 1), 'cosmic', `Beat-triggered expanding rings driven by ${s}`, body(extra, main),
      [{ id: 'rings', label: 'Rings', min: 2, max: 16, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'scale', amount: 0.5, curve: 'log' }]))
  }

  // 3. Hypnotic rotation tunnel (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 5 + (k % 6)
    const extra = [`float aa=atan(p.y,p.x);`, `float rr=length(p);`, `p=mat2(cos(t*0.5+uBeatPhase*0.8),-sin(t*0.5+uBeatPhase*0.8),sin(t*0.5+uBeatPhase*0.8),cos(t*0.5+uBeatPhase*0.8))*p;`, `p+=vec2(noise(p*3.0+t),noise(p*3.0-t))*distortion*0.3;`]
    const main = `pal(aa/6.28*arms+rr*2.0+${s}*2.0+t*0.4,${h})*(exp(-rr*1.2)+0.2*bass)`
    out.push(bld(`tr-rot-${k + 1}`, 'Hypno Tunnel ' + (k + 1), 'abstract', `Hypnotic rotating tunnel (trance staple) on ${s}`, body(extra, main),
      [{ id: 'arms', label: 'Arms', min: 2, max: 16, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'distortion', amount: 0.6, curve: 'log' }]))
  }

  // 4. Spectral swirls (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 5)
    const extra = [`p+=vec2(noise(p*2.0+t*0.4),noise(p*2.0-t*0.4))*distortion;`, `float sw=sin(length(p)*freq-t*2.0+atan(p.y,p.x)*3.0)+${s}*1.5;`]
    const main = `pal(sw*0.5+0.5,${h})*smoothstep(1.6,0.0,length(p))`
    out.push(bld(`tr-swirl-${k + 1}`, 'Spectral Swirl ' + (k + 1), 'liquid', `Swirling spectral liquid reacting to ${s}`, body(extra, main),
      [{ id: 'freq', label: 'Frequency', min: 2, max: 12, def: n, step: 0.5, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'distortion', amount: 0.5, curve: 'log' }]))
  }

  // 5. Beat-drive mandala (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 5 + (k % 8)
    const extra = [`float a=atan(p.y,p.x);float rr=length(p);`, `p=mat2(cos(t*0.3+uBeatPhase*0.6),-sin(t*0.3+uBeatPhase*0.6),sin(t*0.3+uBeatPhase*0.6),cos(t*0.3+uBeatPhase*0.6))*p;`, `float rays=sin(a*petals+t*2.0)*0.5+0.5;`, `float ring=pow(max(0.0,sin(rr*8.0-t*3.0+${s}*4.0)),3.0);`]
    const main = `pal(rays*0.5+ring*0.5+${s}*0.5,${h})*(ring*0.7+rays*0.5)*(0.4+0.7*beat)`
    out.push(bld(`tr-mandala-${k + 1}`, 'Rave Mandala ' + (k + 1), 'geometric', `Rotating rave mandala pulsing with ${s}`, body(extra, main),
      [{ id: 'petals', label: 'Petals', min: 3, max: 20, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'distortion', amount: 0.4, curve: 'log' }]))
  }

  // 6. Bass waveform visor (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 6 + (k % 6)
    const extra = [`float amp=0.15+${s}*0.5;`, `float w=sin(p.x*freq+t*2.0)+${s}*1.4*sin(p.x*freq*0.7-t*3.0);`, `float d=exp(-abs(p.y-w*amp)*10.0);`]
    const main = `pal(p.x*3.0+${s}*2.0,${h})*d*(0.5+0.8*bass)+vec3(pal(${s}*2.0,${h})*d*bass*0.5)`
    out.push(bld(`tr-basswave-${k + 1}`, 'Bass Visor ' + (k + 1), 'synthwave', `Saw-wave visor oscilloscope driven by ${s}`, body(extra, main),
      [{ id: 'freq', label: 'Frequency', min: 2, max: 16, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'intensity', amount: 0.6, curve: 'log' }]))
  }

  // 7. Pulsing plasma core (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k]
    const extra = [`p+=vec2(noise(p*2.0+t),noise(p*2.0-t))*distortion;`, `float detp=(detail-3.0);`, `float f=sin(p.x*(1.0+detp*0.3)+t)+sin(p.y*(1.0+detp*0.3)*1.3-t*0.8)+fbm(p*(1.0+detp*0.4)+${s}*3.0)+${s}*2.0;`]
    const main = `pal(f/4.0+0.5,${h})*(0.6+0.6*bass)+pal2(f/4.0,${h})*${s}*0.5`
    out.push(bld(`tr-core-${k + 1}`, 'Plasma Core ' + (k + 1), 'liquid', `Throbbing plasma core reacting to ${s}`, body(extra, main),
      [{ id: 'detail', label: 'Detail', min: 1, max: 6, def: 3, step: 0.5, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'distortion', amount: 0.5, curve: 'log' }]))
  }

  // 8. Strobe starfield (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 8 + (k % 7)
    const extra = [`vec2 id=floor(p*stars);vec2 fr=fract(p*stars)-0.5;`, `float rnd=hash(id+floor(t*2.0));`, `float sp=exp(-length(fr)*5.0)*step(0.6,rnd)*(0.3+0.9*beat);`]
    const main = `pal(rnd+${s}*0.6,${h})*sp`
    out.push(bld(`tr-starburst-${k + 1}`, 'Starburst ' + (k + 1), 'particle', `Strobing particle starfield gated by ${s}`, body(extra, main),
      [{ id: 'stars', label: 'Stars', min: 4, max: 20, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'intensity', amount: 0.5, curve: 'log' }]))
  }

  // 9. Spiral galaxy (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 3 + (k % 5)
    const extra = [`float a=atan(p.y,p.x);float rr=length(p);`, `float sp=mod(a/6.28*arms-log(rr+0.05)*1.6+t*0.6+${s}*0.5,1.0);`, `float arm=smoothstep(0.3,0.0,abs(fract(sp*arms)-0.5));`]
    const main = `pal(sp+${s}*0.5,${h})*arm*exp(-rr*1.3)*(0.5+0.8*bass)+pal(sp,${h})*exp(-rr*4.0)*mid`
    out.push(bld(`tr-galaxy-${k + 1}`, 'Spiral Galaxy ' + (k + 1), 'cosmic', `Hypnotic spiral galaxy wound louder by ${s}`, body(extra, main),
      [{ id: 'arms', label: 'Arms', min: 2, max: 10, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'distortion', amount: 0.5, curve: 'log' }]))
  }

  // 10. Chromatic prism sweep (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 6)
    const extra = [`float a=atan(p.y,p.x);float rr=length(p);`, `float seg=acos(cos(a*sides));`, `float rad=rr+${s}*0.3+uBeatPhase*0.15;`, `float ed=exp(-abs(rad-0.35-fbm(vec2(seg,rr)*3.0+t)*0.25)*40.0);`]
    const main = `pal(seg*rr+${s}*2.0+t*0.3,${h})*(ed+0.15*smoothstep(0.5,0.2,rad))`
    out.push(bld(`tr-prism-${k + 1}`, 'Chroma Prism ' + (k + 1), 'geometric', `Chromatic prism edge with ${s}-driven motion`, body(extra, main),
      [{ id: 'sides', label: 'Sides', min: 3, max: 12, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'distortion', amount: 0.5, curve: 'log' }]))
  }

  // 11. Techno checkerboard (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 5)
    const extra = [`vec2 c=floor(p*cells);`, `float check=mod(c.x+c.y+floor(t*4.0)+${s}*4.0,2.0);`, `float gl=exp(-abs(length(fract(p*cells)-0.5))*6.0);`]
    const main = `pal(check*0.5+${s}*0.5,${h})*(0.3+0.7*gl)*(0.5+0.8*beat)`
    out.push(bld(`tr-checker-${k + 1}`, 'Boggle Checker ' + (k + 1), 'vj', `Flashing checkerboard grid gated to ${s}`, body(extra, main),
      [{ id: 'cells', label: 'Cells', min: 2, max: 12, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'intensity', amount: 0.6, curve: 'log' }]))
  }

  // 12. Meteors / orbs on bass (10)
  for (let k = 0; k < 10; k++) {
    const h = H[k], s = SIG[k], n = 5 + (k % 5)
    const cnt = Math.min(n, 9)
    const extra = [
      `vec3 acc=vec3(0.0);`,
      `float cnt=bodies;`,
      `for(int i=0;i<${cnt};i++){`,
      ` float fi=float(i);`,
      ` vec2 ctr=vec2(sin(fi*2.399+t*(0.3+0.4*bass))*0.6,cos(fi*1.361-t*0.3)*0.6);`,
      ` float rad=0.1+${s}*0.15+0.04*sin(t*4.0+fi);`,
      ` float dd=length(p-ctr);`,
      ` acc+=pal(fi/cnt+${s}*0.4,${h})*exp(-dd*dd*24.0);`,
      `}`,
    ]
    const body2 = P(extra) + '  vec3 col=acc*(0.5+0.8*bass);\n' + E
    out.push(bld(`tr-orbital-${k + 1}`, 'Orbital Bass ' + (k + 1), 'particle', `Orbiting bass-pumped glow bodies reacting to ${s}`, body2,
      [{ id: 'bodies', label: 'Bodies', min: 3, max: 12, def: n, step: 1, group: 'shape' }],
      [{ signal: sig2signal(s), param: 'scale', amount: 0.45, curve: 'log' }]))
  }

  return out
}

export const GENERATED_REACTIVE: ShaderDefinition[] = genReactive()
