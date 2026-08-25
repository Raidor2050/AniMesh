import { ShaderDefinition, ShaderCategory } from '../utils/types'

const UNIFORM_HEADER = `#version 300 es
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
uniform float speed;
uniform float intensity;
uniform float distortion;
uniform float scale;
uniform float brightness;
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
float turbulence(vec2 p) {
  float f = 0.0; float a = 0.5;
  for(int i = 0; i < 5; i++) { f += a*abs(noise(p)); p *= 2.0; a *= 0.5; }
  return f;
}
`

function createShader(
  id: string, name: string, category: ShaderCategory,
  description: string, tags: string[],
  body: string, params: ShaderDefinition['params'] = [],
  defaults: Record<string, number> = {},
  audioMappings: ShaderDefinition['audioMappings'] = [],
  tier: ShaderDefinition['performanceTier'] = 'medium',
  extraUniforms: string = ''
): ShaderDefinition {
  return {
    id, name, category, description, tags,
    fragment: UNIFORM_HEADER + extraUniforms + COMMON_NOISE + body,
    uniforms: [],
    params: [
      { id: 'speed', label: 'Speed', min: 0, max: 3, default: 1, step: 0.1 },
      { id: 'intensity', label: 'Intensity', min: 0, max: 2, default: 1, step: 0.05 },
      ...params,
    ],
    defaults: { speed: 1, intensity: 1, ...defaults },
    audioMappings: [
      { signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' },
      { signal: 'beat', param: 'scale', amount: 0.3, curve: 'linear' },
      { signal: 'treble', param: 'brightness', amount: 0.4, curve: 'linear' },
      ...audioMappings,
    ],
    performanceTier: tier,
  }
}

export const SHADER_LIBRARY: ShaderDefinition[] = [
  // ── FRACTALS ──
  createShader(
    'fractal-mandelbrot', 'Mandelbrot Voyage', 'fractals',
    'Infinite zoom through the Mandelbrot set with audio-reactive color cycling',
    ['fractal', 'mandelbrot', 'zoom', 'classic'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float zoom = 1.0 + uTime * 0.1 * speed + uBass * 0.3;
      vec2 c = uv / zoom + vec2(-0.745, 0.186);
      vec2 z = vec2(0.0);
      float iter = 0.0;
      for(int i = 0; i < 128; i++) {
        if(dot(z,z) > 4.0) break;
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        iter += 1.0;
      }
      float t = iter/128.0;
      vec3 col = 0.5 + 0.5*cos(6.2831*(t*3.0 + uTime*0.2*speed + vec3(0.0,0.33,0.67) + uBass*0.5));
      col *= intensity * (0.8 + 0.4*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'scale', label: 'Scale', min: 0.5, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    { speed: 0.5 },
    [{ signal: 'volume', param: 'distortion', amount: 0.3, curve: 'log' }],
    'medium'
  ),

  createShader(
    'fractal-julia', 'Julia Dreamscape', 'fractals',
    'Audio-reactive Julia set with morphing parameters and luminous coloring',
    ['fractal', 'julia', 'morphing', 'reactive'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float zoom = 1.5 - uBass*0.3;
      vec2 c = vec2(-0.7, 0.27015) + vec2(sin(uTime*0.1*speed)*0.1, cos(uTime*0.13*speed)*0.1);
      c += uMid * vec2(0.1, -0.05);
      vec2 z = uv / zoom;
      float iter = 0.0;
      for(int i = 0; i < 100; i++) {
        if(dot(z,z) > 4.0) break;
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        iter += 1.0;
      }
      float t = iter/100.0;
      vec3 col = 0.5 + 0.5*cos(6.2831*(t*2.0 + vec3(0.0,0.1,0.2) + uTime*0.15));
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.6, curve: 'log' }],
    'medium'
  ),

  createShader(
    'fractal-kaleidoscope', 'Kaleidoscope Mind', 'fractals',
    'Psychedelic kaleidoscopic fractals driven by the beat',
    ['fractal', 'kaleidoscope', 'psychedelic', 'beat-synced'],
    `
    vec2 kaleidoscope(vec2 p, float folds) {
      float angle = 3.14159 / folds;
      float sector = atan(p.y, p.x);
      sector = mod(sector, 2.0*angle) - angle;
      float r = length(p);
      return r * vec2(cos(sector), sin(sector));
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float folds = 6.0 + floor(uBeat * 3.0);
      vec2 p = kaleidoscope(uv, folds);
      p += uTime * 0.2 * speed;
      float n = fbm(p * 3.0);
      float warp = fbm(p * 2.0 + n * 2.0 * (1.0 + uBass));
      vec3 col = 0.5 + 0.5*cos(6.2831*(warp*2.0 + vec3(0,0.33,0.67) + uTime*0.1));
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'low'
  ),

  // ── VJ ──
  createShader(
    'vj-tunnel', 'Hypnotic Tunnel', 'vj',
    'Classic VJ tunnel with depth-reactive warping and beat pulse',
    ['tunnel', 'classic', 'depth', 'reactive'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float tunnel = 1.0 / (r + 0.01);
      float depth = tunnel + uTime * speed * 2.0;
      float warp = sin(a*3.0 + depth*0.5) * 0.1 * (1.0 + uBass);
      vec2 tc = vec2(a/3.14159, tunnel*0.3 + warp) + vec2(uTime*0.1, 0.0);
      float pattern = fbm(tc * 4.0);
      float ring = smoothstep(0.48, 0.5, fract(depth*0.3 + pattern*0.2));
      vec3 col = mix(
        vec3(0.02, 0.0, 0.05),
        vec3(0.4 + 0.3*uBeat, 0.1, 0.8),
        ring * intensity
      );
      col *= 1.0 - r*1.5;
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'low'
  ),

  createShader(
    'vj-radial-burst', 'Radial Burst', 'vj',
    'Explosive radial bursts synchronized with kick drums',
    ['radial', 'burst', 'kick', 'explosive'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float r = length(uv);
      float a = atan(uv.y, uv.x);
      float rays = 12.0 + uBeat * 6.0;
      float pattern = sin(a * rays + uTime * speed) * 0.5 + 0.5;
      pattern *= pow(1.0 - r, 2.0);
      float burst = uBeat * exp(-r * 3.0) * 2.0;
      pattern += burst;
      vec3 col = vec3(1.0, 0.6, 0.2) * pattern * intensity;
      col += vec3(0.1, 0.0, 0.3) * (1.0 - pattern);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'low'
  ),

  createShader(
    'vj-spectrum', 'Spectrum Field', 'vj',
    'Frequency spectrum visualization with fluid dynamics',
    ['spectrum', 'bars', 'fluid', 'reactive'],
    `
    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      float bars = 0.0;
      float nBars = 64.0;
      float barWidth = 1.0/nBars;
      float idx = floor(uv.x * nBars);
      float binVal = sin(idx * 0.3 + uTime * speed) * 0.5 + 0.5;
      binVal *= (0.3 + uBass*0.7 * smoothstep(0.0, 0.3, uv.x) +
                     uMid*0.5 * smoothstep(0.2, 0.6, uv.x) +
                     uTreble*0.6 * smoothstep(0.5, 1.0, uv.x));
      float bar = smoothstep(uv.y, uv.y + 0.02, binVal * 0.8);
      float glow = exp(-abs(uv.y - binVal*0.8) * 20.0) * 0.5;
      vec3 col = vec3(0.0);
      col += bar * mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.2, 0.8), uv.x);
      col += glow * vec3(0.2, 0.5, 1.0);
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'low'
  ),

  // ── GEOMETRIC ──
  createShader(
    'geo-grid', 'Reactive Grid', 'geometric',
    'Warping grid mesh that breathes with the bass and pulses on beats',
    ['grid', 'mesh', 'warp', 'reactive'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float warp = uBass * 0.3;
      vec2 p = uv * (4.0 + sin(uTime*0.2*speed)*0.5);
      p += vec2(fbm(p + uTime*0.1), fbm(p + vec2(5.2))) * warp;
      vec2 grid = fract(p) - 0.5;
      float line = min(abs(grid.x), abs(grid.y));
      float pattern = smoothstep(0.02, 0.05, line);
      float glow = exp(-line * 30.0) * 0.5;
      vec3 col = vec3(0.0);
      col += (1.0 - pattern) * vec3(0.3, 0.1, 0.8) * intensity;
      col += glow * vec3(0.5, 0.2, 1.0) * (0.5 + 0.5*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'low'
  ),

  createShader(
    'geo-voronoi', 'Voronoi Pulse', 'geometric',
    'Organic Voronoi cells that split and pulse with the rhythm',
    ['voronoi', 'cells', 'organic', 'pulse'],
    `
    vec2 voronoi(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      float md = 8.0; float md2 = 8.0;
      for(int y = -1; y <= 1; y++)
        for(int x = -1; x <= 1; x++) {
          vec2 n = vec2(float(x), float(y));
          vec2 pt = 0.5 + 0.5*sin(hash(i+n)*6.28 + uTime*speed);
          float d = length(n + pt - f);
          if(d < md) { md2 = md; md = d; }
          else if(d < md2) { md2 = d; }
        }
      return vec2(md, md2);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float scale = 4.0 + uBeat * 0.5;
      vec2 v = voronoi(uv * scale);
      float edge = smoothstep(0.0, 0.05, v.y - v.x);
      float glow = exp(-v.x * 10.0) * (0.5 + 0.5*uBeat);
      vec3 col = mix(vec3(0.6, 0.1, 0.8), vec3(0.1, 0.4, 1.0), v.x);
      col *= (1.0 - edge) * intensity;
      col += glow * vec3(0.8, 0.3, 1.0) * 0.5;
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'medium'
  ),

  // ── LIQUID ──
  createShader(
    'liq-fluid', 'Fluid Distortion', 'liquid',
    'Flowing liquid metal surface with domain warping and bass reactivity',
    ['fluid', 'metal', 'warp', 'bass-reactive'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float amp = 0.5 + uBass * 1.5;
      vec2 q = vec2(fbm(uv*2.0 + uTime*0.1*speed), fbm(uv*2.0 + vec2(5.2,1.3) + uTime*0.12));
      vec2 r = vec2(fbm(uv*2.0 + 4.0*q + vec2(1.7,9.2) + uTime*0.15),
                    fbm(uv*2.0 + 4.0*q + vec2(8.3,2.8) + uTime*0.126));
      float f = fbm(uv*2.0 + amp * r);
      vec3 col = mix(vec3(0.05, 0.0, 0.15), vec3(0.9, 0.3, 0.6), clamp(f*f*4.0, 0.0, 1.0));
      col = mix(col, vec3(0.1, 0.6, 0.9), clamp(length(q), 0.0, 1.0));
      col *= intensity * (0.8 + 0.4*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'medium'
  ),

  createShader(
    'liq-metaballs', 'Metaballs', 'liquid',
    'Smooth metaball blobs that respond to frequency bands',
    ['metaballs', 'organic', 'smooth', 'reactive'],
    `
    float sdSphere(vec2 p, float r) { return length(p) - r; }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float d = 1e10;
      for(int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 center = vec2(
          sin(uTime*0.3*speed + fi*1.3) * 0.4 + sin(fi*2.1)*0.2,
          cos(uTime*0.25*speed + fi*1.7) * 0.4 + cos(fi*1.7)*0.2
        );
        float r = 0.1 + sin(fi*1.5 + uTime*0.5) * 0.05;
        if(i == 0) r += uBass * 0.1;
        if(i == 2) r += uMid * 0.08;
        if(i == 4) r += uTreble * 0.06;
        d = min(d, sdSphere(uv - center, r));
      }
      float glow = exp(-d * 15.0) * 0.8;
      float fill = smoothstep(0.01, -0.01, d);
      vec3 col = vec3(0.0);
      col += fill * vec3(0.4, 0.1, 0.8) * intensity;
      col += glow * vec3(0.8, 0.3, 1.0);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'medium'
  ),

  // ── COSMIC ──
  createShader(
    'cos-nebula', 'Nebula Drift', 'cosmic',
    'Deep space nebula with swirling gases and star field',
    ['nebula', 'space', 'stars', 'drift'],
    `
    float stars(vec2 p) {
      p *= 200.0;
      float s = hash(floor(p));
      s = step(0.98, s);
      s *= 0.5 + 0.5*sin(uTime*2.0 + hash(floor(p+1.0))*6.28);
      return s;
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 q = vec2(fbm(uv + uTime*0.02*speed), fbm(uv + vec2(5.2) + uTime*0.015));
      float n = fbm(uv*3.0 + q*2.0);
      vec3 col = mix(vec3(0.0, 0.0, 0.02), vec3(0.2, 0.0, 0.5), n);
      col = mix(col, vec3(0.8, 0.2, 0.5), n*n*2.0);
      col += stars(uv) * vec3(1.0) * (0.7 + 0.3*uBeat);
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'medium'
  ),

  createShader(
    'cos-blackhole', 'Black Hole', 'cosmic',
    'Gravitational lensing around a black hole with accretion disk',
    ['blackhole', 'gravity', 'lensing', 'accretion'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float r = length(uv);
      float a = atan(uv.y, uv.x);
      float gravity = 0.15 + uBass * 0.1;
      float warp = gravity / (r + 0.01);
      vec2 warped = uv + normalize(uv) * warp * 0.1;
      float disk = exp(-abs(length(warped) - 0.3 - sin(uTime*0.3*speed)*0.05) * 30.0);
      float accretion = disk * (0.5 + 0.5*sin(a*8.0 + uTime*2.0*speed));
      vec3 col = vec3(0.0);
      col += accretion * mix(vec3(1.0, 0.5, 0.1), vec3(0.5, 0.1, 1.0), disk);
      float eventHorizon = smoothstep(0.08, 0.05, r);
      col *= (1.0 - eventHorizon);
      col += vec3(0.3, 0.0, 0.8) * exp(-r*3.0) * 0.2 * (0.5 + 0.5*uBeat);
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'high'
  ),

  // ── SYNTHWAVE ──
  createShader(
    'syn-horizon', 'Synthwave Horizon', 'synthwave',
    'Retro grid horizon with neon sunset and reactive mountains',
    ['synthwave', 'retro', 'grid', 'horizon'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec3 col = vec3(0.0);
      float horizon = 0.0;
      if(uv.y > horizon) {
        float sky = (uv.y - horizon) / (0.5 - horizon);
        col = mix(vec3(0.8, 0.1, 0.4), vec3(0.1, 0.0, 0.4), sky);
        float sun = smoothstep(0.15, 0.0, abs(uv.x) - 0.1);
        sun *= smoothstep(0.0, 0.3, uv.y) * smoothstep(0.5, 0.3, uv.y);
        col += sun * vec3(1.0, 0.6, 0.2);
      } else {
        float gridZ = -0.5 / (uv.y - horizon + 0.01);
        float gridX = uv.x * gridZ;
        vec2 grid = fract(vec2(gridX, gridZ * 2.0 + uTime * speed * 3.0));
        float line = min(abs(grid.x), abs(grid.y));
        float gridPattern = smoothstep(0.02, 0.04, line);
        float fade = exp(-abs(uv.y - horizon) * 5.0);
        col = mix(vec3(0.8, 0.2, 1.0), vec3(0.0), gridPattern) * fade;
        col += exp(-abs(uv.y - horizon) * 20.0) * vec3(1.0, 0.3, 0.8) * 0.5;
      }
      col *= intensity * (0.8 + 0.3*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'low'
  ),

  // ── ABSTRACT ──
  createShader(
    'abs-domain-warp', 'Domain Warp', 'abstract',
    'Classic double domain warping with audio-driven intensity',
    ['domain-warp', 'fbm', 'flow', 'reactive'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float amp = 0.5 + uBass * 2.0;
      vec2 q = vec2(fbm(uv*3.0), fbm(uv*3.0 + vec2(5.2,1.3)));
      vec2 r = vec2(fbm(uv*3.0 + 4.0*q + vec2(1.7,9.2) + uTime*0.15*speed),
                    fbm(uv*3.0 + 4.0*q + vec2(8.3,2.8) + uTime*0.126));
      float f = fbm(uv*3.0 + amp * r);
      vec3 col = vec3(0.0);
      col = mix(col, vec3(0.8, 0.2, 0.5), clamp(f*f*4.0, 0.0, 1.0));
      col = mix(col, vec3(0.1, 0.3, 0.8), clamp(length(q), 0.0, 1.0));
      col = mix(col, vec3(0.2, 0.8, 0.5), clamp(length(r.x), 0.0, 1.0));
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'medium'
  ),

  createShader(
    'abs-interference', 'Interference Pattern', 'abstract',
    'Wave interference patterns with constructive and destructive zones',
    ['interference', 'waves', 'patterns', 'constructive'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float d = 0.0;
      for(int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 center = vec2(sin(fi*1.5 + uTime*0.2*speed)*0.5, cos(fi*2.1 + uTime*0.15)*0.5);
        float r = length(uv - center);
        d += sin(r * (10.0 + fi*5.0) - uTime * (1.0 + fi*0.3) * speed);
      }
      d = d * 0.25 + 0.5;
      vec3 col = vec3(0.0);
      col.r = pow(d, 2.0 + uBass);
      col.g = pow(d, 3.0);
      col.b = pow(d, 1.5 + uTreble);
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'low'
  ),

  // ── MINIMAL ──
  createShader(
    'min-circle', 'Pulse Circle', 'minimal',
    'Elegant pulsing circle with beat-reactive glow',
    ['minimal', 'circle', 'pulse', 'elegant'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float r = length(uv);
      float circle = smoothstep(0.005, 0.0, abs(r - 0.3 - uBeat*0.05));
      float inner = smoothstep(0.28, 0.3, r) * smoothstep(0.32, 0.3, r);
      float glow = exp(-abs(r - 0.3) * 20.0) * (0.3 + 0.7*uBeat);
      vec3 col = vec3(0.0);
      col += circle * vec3(0.4, 0.4, 1.0) * intensity;
      col += glow * vec3(0.3, 0.3, 0.8) * 0.5;
      col += inner * vec3(0.05, 0.02, 0.1);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'low'
  ),

  createShader(
    'min-lines', 'Minimal Lines', 'minimal',
    'Clean horizontal lines with audio-reactive wave distortion',
    ['minimal', 'lines', 'clean', 'wave'],
    `
    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      float lines = 0.0;
      float nLines = 20.0;
      float y = uv.y * nLines;
      float wave = sin(y * 3.14159 + uTime * speed + uv.x * 2.0) * 0.3 * (1.0 + uBass);
      float line = smoothstep(0.48, 0.5, fract(y + wave));
      float glow = exp(-abs(fract(y + wave) - 0.5) * 20.0);
      vec3 col = vec3(0.0);
      col += line * vec3(0.6, 0.6, 0.7) * intensity;
      col += glow * vec3(0.4, 0.4, 0.6) * 0.3;
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'low'
  ),

  // ── PARTICLE (via fragment shader approximation) ──
  createShader(
    'part-explosion', 'Particle Galaxy', 'particle',
    'Fragment-based particle galaxy with trails and beat explosions',
    ['particles', 'galaxy', 'trails', 'explosion'],
    `
    float particle(vec2 uv, vec2 center, float size) {
      float d = length(uv - center);
      return size / (d * d + 0.001);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec3 col = vec3(0.0);
      float n = 30.0 + uBeat * 15.0;
      for(float i = 0.0; i < 30.0; i++) {
        float fi = i / 30.0;
        float angle = fi * 6.2831 + uTime * 0.3 * speed;
        float radius = 0.1 + fi * 0.3 + sin(uTime*0.5 + fi*10.0)*0.05;
        vec2 pos = vec2(cos(angle), sin(angle)) * radius;
        float p = particle(uv, pos, 0.0002);
        vec3 pCol = mix(vec3(0.5, 0.1, 1.0), vec3(1.0, 0.5, 0.2), fi);
        col += p * pCol * (0.3 + 0.7*step(fi, uBeat));
      }
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [],
    'high'
  ),

  // ── Additional FRACTALS ──
  createShader(
    'fractal-menger', 'Menger Cathedral', 'fractals',
    'Recursive Menger sponge with volumetric lighting and audio-reactive rotation',
    ['fractal', 'menger', '3d', 'recursive'],
    `
    float sdBox(vec3 p, vec3 b) { vec3 q=abs(p)-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0); }
    float mengerSponge(vec3 p) {
      float d = sdBox(p, vec3(1.0));
      float s = 1.0;
      for(int i=0;i<3;i++) {
        vec3 a=mod(p*s,2.0)-1.0; s*=3.0;
        vec3 r=abs(1.0-3.0*abs(a));
        float da=max(r.x,r.y), db=max(r.y,r.z), dc=max(r.z,r.x);
        float c=(min(da,min(db,dc))-1.0)/s;
        d=max(d,c);
      }
      return d;
    }
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 ro=vec3(0.0,0.0,3.0);
      vec3 rd=normalize(vec3(uv,-1.5));
      float t=0.0;
      for(int i=0;i<60;i++) {
        vec3 p=ro+rd*t;
        float r=uTime*0.3*speed;
        p.xz*=mat2(cos(r),-sin(r),sin(r),cos(r));
        float d=mengerSponge(p);
        if(d<0.001)break;
        t+=d;
        if(t>10.0)break;
      }
      vec3 p=ro+rd*t;
      float glow=exp(-t*0.5)*0.3;
      vec3 col=vec3(glow)*vec3(0.4,0.2,0.8);
      col*=intensity*(0.7+0.5*uBeat);
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'high'
  ),

  createShader(
    'fractal-sierpinski', 'Sierpinski Abyss', 'fractals',
    'Infinite Sierpinski triangle descent with beat-reactive depth',
    ['fractal', 'sierpinski', 'abyss', 'depth'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 col=vec3(0.0);
      for(int i=0;i<12;i++) {
        float fi=float(i);
        float scale=pow(2.0,fi);
        vec2 p=uv*scale+vec2(sin(uTime*0.2*speed+fi),cos(uTime*0.15*speed+fi*1.3))*0.3;
        float tri=abs(p.x)+abs(p.y*0.866)-0.5/scale;
        float edge=smoothstep(0.01/scale,0.0,abs(tri));
        float glow=exp(-abs(tri)*scale*5.0)*0.3;
        vec3 c=mix(vec3(0.3,0.1,0.8),vec3(0.8,0.2,0.5),fi/12.0);
        col+=c*(edge+glow)*(1.0-uBeat*0.3*step(4.0,fi));
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'medium'
  ),

  // ── Additional VJ ──
  createShader(
    'vj-waveform', 'Waveform River', 'vj',
    'Flowing audio waveform visualized as luminous river particles',
    ['waveform', 'river', 'particles', 'audio'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 col=vec3(0.0);
      for(float i=0.0;i<20.0;i++) {
        float fi=i/20.0;
        float y=mix(-0.5,0.5,fi);
        float wave=sin(uv.x*10.0+uTime*2.0*speed+fi*6.28)*0.1*(1.0+uBass);
        float dist=abs(uv.y-y-wave);
        float line=exp(-dist*50.0);
        float pulse=exp(-dist*200.0)*uBeat*0.5;
        vec3 c=mix(vec3(0.0,0.5,1.0),vec3(1.0,0.2,0.8),fi);
        col+=c*(line*0.3+pulse);
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'low'
  ),

  createShader(
    'vj-strobe', 'Strobe Gate', 'vj',
    'Rhythmic strobe effect with frequency-split color channels',
    ['strobe', 'rhythmic', 'flash', 'gate'],
    `
    void main() {
      vec2 uv=gl_FragCoord.xy/uResolution;
      float gate=step(0.5,fract(uTime*uBPM/60.0*0.5));
      float beat=smoothstep(0.0,0.05,uBeat);
      float strobe=gate*beat;
      vec3 col=vec3(0.0);
      col.r=strobe*smoothstep(0.0,0.33,uv.x)*uBass;
      col.g=strobe*smoothstep(0.33,0.66,uv.x)*uMid;
      col.b=strobe*smoothstep(0.66,1.0,uv.x)*uTreble;
      col+=vec3(0.02,0.01,0.03);
      col*=intensity*2.0;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'low'
  ),

  // ── Additional GEOMETRIC ──
  createShader(
    'geo-mandala', 'Digital Mandala', 'geometric',
    'Symmetrical mandala pattern with rotating audio-reactive layers',
    ['mandala', 'symmetry', 'rotating', 'layers'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float a=atan(uv.y,uv.x);
      float r=length(uv);
      float symmetry=8.0;
      float sector=mod(a,6.2831/symmetry)-3.14159/symmetry;
      vec2 p=r*vec2(cos(sector),sin(sector));
      float d=0.0;
      for(float i=1.0;i<6.0;i++) {
        float ring=abs(r-i*0.08)*10.0;
        float pattern=abs(p.x)+abs(p.y*0.5);
        d+=smoothstep(0.02,0.0,abs(pattern-0.1-i*0.02))*(1.0+uBeat*0.5);
      }
      float rot=sin(uTime*0.5*speed+r*3.0)*0.3*(1.0+uBass*0.5);
      d+=smoothstep(0.01,0.0,abs(r-0.3+sin(a*symmetry+rot)*0.05));
      vec3 col=vec3(0.4,0.1,0.8)*d*intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'medium'
  ),

  createShader(
    'geo-cells', 'Cellular Automata', 'geometric',
    'Living cellular automata grid with organic growth patterns',
    ['cellular', 'automata', 'organic', 'growth'],
    `
    float cell(vec2 p) {
      vec2 i=floor(p); vec2 f=fract(p);
      float minD=10.0;
      for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++) {
        vec2 n=vec2(float(x),float(y));
        vec2 pt=vec2(hash(i+n),hash(i+n+vec2(31,17)));
        pt=0.5+0.5*sin(uTime*0.3*speed+pt*6.28);
        float d=length(n+pt-f);
        minD=min(minD,d);
      }
      return minD;
    }
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float scale=8.0+uBass*2.0;
      float c=cell(uv*scale);
      float edge=smoothstep(0.05,0.0,abs(c-0.1));
      float fill=smoothstep(0.15,0.05,c);
      vec3 col=vec3(0.0);
      col+=fill*vec3(0.1,0.3,0.6)*intensity;
      col+=edge*vec3(0.5,0.8,1.0)*intensity*(0.5+0.5*uBeat);
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'medium'
  ),

  // ── Additional LIQUID ──
  createShader(
    'liq-ink', 'Ink Diffusion', 'liquid',
    'Spreading ink drops with viscous fluid dynamics',
    ['ink', 'diffusion', 'viscous', 'drops'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float d=0.0;
      for(int i=0;i<6;i++) {
        float fi=float(i);
        vec2 center=vec2(sin(fi*2.1+uTime*0.1*speed)*0.4,cos(fi*1.7+uTime*0.13)*0.4);
        if(i==0) center+=uBass*vec2(0.1,0.05);
        float r=length(uv-center);
        float drop=smoothstep(0.15+sin(uTime+fi)*0.05,0.0,r);
        d+=drop;
      }
      float warp=fbm(uv*5.0+d*3.0);
      vec3 col=mix(vec3(0.0,0.0,0.05),vec3(0.1,0.2,0.5),clamp(d,0.0,1.0));
      col=mix(col,vec3(0.5,0.1,0.3),warp*0.5);
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'medium'
  ),

  createShader(
    'liq-mercury', 'Liquid Mercury', 'liquid',
    'Reflective liquid metal surface with dynamic environment mapping',
    ['mercury', 'reflective', 'metal', 'dynamic'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float n=fbm(uv*3.0+uTime*0.2*speed);
      float warp=fbm(uv*2.0+vec2(n)*2.0);
      float metal=smoothstep(0.3,0.7,warp);
      vec3 refl=vec3(0.6,0.7,0.8)*metal+vec3(0.1,0.1,0.15)*(1.0-metal);
      refl+=vec3(0.3,0.5,0.8)*exp(-length(uv)*2.0)*0.3;
      float highlight=pow(max(0.0,1.0-abs(warp-0.5)*4.0),8.0);
      refl+=highlight*vec3(1.0)*(0.5+0.5*uBeat);
      refl*=intensity;
      fragColor=vec4(refl,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'medium'
  ),

  // ── Additional COSMIC ──
  createShader(
    'cos-galaxy', 'Spiral Galaxy', 'cosmic',
    'Rotating spiral galaxy with star nurseries and cosmic dust',
    ['galaxy', 'spiral', 'stars', 'cosmic'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float a=atan(uv.y,uv.x);
      float r=length(uv);
      float spiral=sin(a*3.0-r*10.0+uTime*0.5*speed+uBass*2.0);
      float arms=pow(max(0.0,spiral),4.0)*exp(-r*3.0);
      float core=exp(-r*5.0)*0.8;
      float stars=step(0.98,hash(floor(uv*200.0)))*0.5;
      vec3 col=vec3(0.0);
      col+=arms*mix(vec3(0.3,0.1,0.8),vec3(0.8,0.3,0.1),r);
      col+=core*vec3(1.0,0.9,0.7);
      col+=stars*vec3(1.0);
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'medium'
  ),

  createShader(
    'cos-aurora', 'Aurora Borealis', 'cosmic',
    'Northern lights with flowing curtains and particle-like shimmer',
    ['aurora', 'borealis', 'lights', 'flowing'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float y=uv.y*0.5+0.3;
      float wave=sin(uv.x*3.0+uTime*0.5*speed)*0.1+sin(uv.x*7.0-uTime*0.3)*0.05;
      float curtain=exp(-pow((y+wave)*3.0,2.0));
      float shimmer=fbm(vec2(uv.x*10.0,uTime*0.8))*0.3;
      curtain*=0.7+shimmer+uBeat*0.3;
      vec3 col=vec3(0.0);
      col.r=curtain*0.2;
      col.g=curtain*0.8;
      col.b=curtain*0.5+shimmer*0.3;
      col+=vec3(0.0,0.02,0.04)*(1.0-curtain);
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'medium'
  ),

  // ── Additional SYNTHWAVE ──
  createShader(
    'syn-city', 'Neon City', 'synthwave',
    'Synthwave cityscape with neon signs and reflective streets',
    ['city', 'neon', 'buildings', 'reflective'],
    `
    float building(vec2 p, float x) {
      float w=0.03+hash(vec2(x,0.0))*0.04;
      float h=0.1+hash(vec2(x,1.0))*0.3;
      float d=smoothstep(x-w,x-w+0.002,p.x)*smoothstep(x+w,x+w-0.002,p.x);
      d*=smoothstep(-0.1,-0.1+0.002,p.y)*smoothstep(h,h-0.002,p.y);
      return d;
    }
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 col=vec3(0.0);
      if(uv.y<0.0) {
        float ref=uv.y*-1.0;
        col=mix(vec3(0.1,0.0,0.2),vec3(0.0),ref*3.0);
        float streetLine=smoothstep(0.001,0.0,abs(fract(uv.x*5.0+uTime*speed)-0.5)-0.48);
        col+=streetLine*vec3(0.8,0.2,1.0)*0.3*(1.0-ref*5.0);
      } else {
        col=vec3(0.02,0.0,0.05);
        for(float i=0.0;i<8.0;i++) {
          float x=-0.7+i*0.2;
          col+=building(uv,i)*mix(vec3(0.05,0.02,0.1),vec3(0.5,0.1,0.8),hash(vec2(i,2.0)));
          float neon=building(vec2(uv.x,uv.y-0.05),i)*hash(vec2(i,3.0));
          col+=neon*vec3(1.0,0.2,0.5)*step(0.5,hash(vec2(i,4.0)))*(0.5+0.5*uBeat);
        }
        float stars=step(0.99,hash(floor(uv*100.0)));
        col+=stars*vec3(0.5)*smoothstep(0.3,0.8,uv.y);
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'medium'
  ),

  createShader(
    'syn-wave', 'Retrowave', 'synthwave',
    'Retro wave pattern with neon gradients and VHS distortion',
    ['retro', 'wave', 'vhs', 'neon'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float wave=sin(uv.x*8.0+uTime*2.0*speed)*0.1*(1.0+uBass);
      float scan=smoothstep(0.48,0.5,fract(uv.y*30.0+wave));
      float vhs=hash(vec2(floor(uTime*10.0),floor(uv.y*100.0)))*0.02;
      vec3 col=vec3(0.0);
      float grad=uv.y*0.5+0.5;
      col=mix(vec3(1.0,0.2,0.5),vec3(0.2,0.0,0.8),grad);
      col*=scan*0.3+0.7;
      col+=vhs*vec3(1.0,0.5,0.8);
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'low'
  ),

  // ── Additional ABSTRACT ──
  createShader(
    'abs-noise-field', 'Noise Field', 'abstract',
    'Layered noise field with audio-driven turbulence',
    ['noise', 'field', 'turbulence', 'layered'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float n1=fbm(uv*3.0+uTime*0.1*speed);
      float n2=fbm(uv*5.0+vec2(n1)*2.0+uTime*0.15);
      float n3=fbm(uv*8.0+vec2(n2)*1.5+uBass*2.0);
      vec3 col=vec3(0.0);
      col.r=n3;
      col.g=n2*0.7;
      col.b=n1*0.5+0.2;
      col=pow(col,vec3(1.5));
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'medium'
  ),

  createShader(
    'abs-plasma', 'Plasma Storm', 'abstract',
    'Classic plasma effect with modern audio-reactive enhancement',
    ['plasma', 'classic', 'storm', 'reactive'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float t=uTime*speed;
      float v1=sin(uv.x*10.0+t);
      float v2=sin(uv.y*10.0+t*0.7);
      float v3=sin((uv.x+uv.y)*10.0+t*0.5);
      float v4=sin(length(uv)*12.0-t);
      float plasma=(v1+v2+v3+v4)*0.25;
      plasma+=uBass*0.3;
      vec3 col=0.5+0.5*cos(6.2831*(plasma+vec3(0.0,0.33,0.67)+uBeat*0.3));
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'low'
  ),

  createShader(
    'abs-mesh', 'Living Mesh', 'abstract',
    'Deforming mesh grid with vertex displacement driven by audio',
    ['mesh', 'deform', 'grid', 'vertex'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float gridSize=20.0;
      vec2 p=uv*gridSize;
      float dx=sin(p.y+uTime*speed)*0.3*(1.0+uBass);
      float dy=cos(p.x+uTime*0.8*speed)*0.3*(1.0+uMid);
      vec2 dp=vec2(dx,dy);
      vec2 gp=fract(p+dp)-0.5;
      float lineX=smoothstep(0.03,0.0,abs(gp.x)-0.47);
      float lineY=smoothstep(0.03,0.0,abs(gp.y)-0.47);
      float line=max(lineX,lineY);
      float glow=exp(-line*20.0)*0.5;
      vec3 col=vec3(0.0);
      col+=line*vec3(0.3,0.6,1.0)*intensity;
      col+=glow*vec3(0.5,0.3,0.8)*uBeat;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'low'
  ),

  // ── Additional PARTICLE ──
  createShader(
    'part-trails', 'Particle Trails', 'particle',
    'Trailing particles that follow audio-driven attractors',
    ['trails', 'attractors', 'flowing', 'persistent'],
    `
    float particle(vec2 uv, vec2 pos, float size, float trail) {
      vec2 d=uv-pos;
      float r=length(d);
      float angle=atan(d.y,d.x);
      vec2 trailPos=pos+vec2(cos(angle),sin(angle))*trail*0.1;
      float trailDist=length(uv-trailPos);
      return size/(r*r+0.001)+size*0.3/(trailDist*trailDist+0.01);
    }
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 col=vec3(0.0);
      for(float i=0.0;i<25.0;i++) {
        float fi=i/25.0;
        float speed2=0.3+fi*0.5;
        vec2 pos=vec2(
          sin(uTime*speed2+fi*6.28)*0.4,
          cos(uTime*speed2*0.7+fi*4.0)*0.4
        );
        float size=0.0003*(0.5+uBeat*0.5);
        float trail=uBass*0.5;
        float p=particle(uv,pos,size,trail);
        vec3 c=mix(vec3(0.2,0.5,1.0),vec3(1.0,0.3,0.8),fi);
        col+=c*p*0.01;
      }
      col*=intensity;
      fragColor=vec4(clamp(col,0.0,1.0),1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'high'
  ),

  createShader(
    'part-nebula-particles', 'Stardust', 'particle',
    'Floating stardust particles with nebula background',
    ['stardust', 'particles', 'nebula', 'floating'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float nebula=fbm(uv*2.0+uTime*0.05*speed);
      vec3 col=vec3(0.02,0.0,0.05)*nebula*2.0;
      for(float i=0.0;i<40.0;i++) {
        float fi=i/40.0;
        vec2 pos=vec2(
          hash(vec2(i,1.0))-0.5,
          hash(vec2(i,2.0))-0.5
        );
        pos+=vec2(sin(uTime*0.2+fi*10.0),cos(uTime*0.15+fi*8.0))*0.05;
        float d=length(uv-pos);
        float brightness=0.001/(d*d+0.001);
        float twinkle=0.5+0.5*sin(uTime*3.0+fi*20.0);
        vec3 c=mix(vec3(1.0,0.9,0.7),vec3(0.7,0.8,1.0),fi);
        col+=c*brightness*twinkle*0.0005;
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'high'
  ),

  // ── Additional MINIMAL ──
  createShader(
    'min-breath', 'Breathing Light', 'minimal',
    'Single breathing light point with subtle harmonic overtones',
    ['breathing', 'light', 'minimal', 'harmonic'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float breath=sin(uTime*0.5*speed)*0.5+0.5;
      breath=mix(breath,breath*uBeat,0.3);
      float d=length(uv);
      float core=exp(-d*5.0)*breath;
      float glow=exp(-d*2.0)*breath*0.3;
      float ring=exp(-abs(d-0.3-breath*0.1)*30.0)*0.1;
      vec3 col=vec3(0.6,0.7,1.0)*core+vec3(0.3,0.4,0.8)*glow+vec3(0.4,0.5,0.9)*ring;
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'low'
  ),

  createShader(
    'min-zen', 'Zen Circle', 'minimal',
    'Enso-inspired circle with imperfect brush stroke and audio reactivity',
    ['zen', 'enso', 'circle', 'imperfect'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float r=length(uv);
      float a=atan(uv.y,uv.x);
      float stroke=0.3+sin(a*3.0)*0.01+sin(a*7.0)*0.005;
      stroke+=uBass*0.02;
      float dist=abs(r-stroke);
      float brush=smoothstep(0.008,0.002,dist);
      float alpha=smoothstep(3.14159*2.0,2.5,a+3.14159);
      brush*=alpha;
      vec3 col=vec3(0.0);
      col+=brush*vec3(0.8,0.8,0.7)*intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'low'
  ),

  createShader(
    'min-rings', 'Concentric', 'minimal',
    'Perfect concentric rings with audio-driven color shift',
    ['concentric', 'rings', 'clean', 'color-shift'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float r=length(uv);
      float rings=sin(r*30.0-uTime*2.0*speed)*0.5+0.5;
      rings*=1.0+uBass*0.5;
      float edge=smoothstep(0.48,0.5,rings);
      float glow=exp(-abs(rings-0.5)*10.0)*0.3;
      float hue=fract(r*2.0+uTime*0.1+uMid);
      vec3 ringCol=0.5+0.5*cos(6.2831*(hue+vec3(0,0.33,0.67)));
      vec3 col=vec3(0.0);
      col+=edge*ringCol*intensity;
      col+=glow*ringCol*0.3;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'low'
  ),

  // ── More VJ ──
  createShader(
    'vj-psychedelic', 'Acid Trip', 'vj',
    'Intense psychedelic visuals with fractal feedback and color cycling',
    ['psychedelic', 'acid', 'feedback', 'intense'],
    `
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec2 p=uv;
      for(int i=0;i<6;i++) {
        p=vec2(sin(p.y*3.0+uTime*0.3*speed+uBass),cos(p.x*3.0+uTime*0.25));
      }
      float d=length(p);
      vec3 col=0.5+0.5*cos(6.2831*(d*3.0+vec3(0,0.33,0.67)+uTime*0.2));
      col*=intensity*(0.8+0.4*uBeat);
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1.5, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [], 'low'
  ),
]

export function getShadersByCategory(category: ShaderCategory): ShaderDefinition[] {
  return SHADER_LIBRARY.filter(s => s.category === category)
}

export function getShaderById(id: string): ShaderDefinition | undefined {
  return SHADER_LIBRARY.find(s => s.id === id)
}

export function searchShaders(query: string): ShaderDefinition[] {
  const q = query.toLowerCase()
  return SHADER_LIBRARY.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.tags.some(t => t.includes(q)) ||
    s.category.includes(q)
  )
}
