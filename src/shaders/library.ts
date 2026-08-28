import { ShaderDefinition } from '../utils/types'
import { MILKDROP_PRESETS } from './milkdrop-generated'
import { GENERATED_REACTIVE } from './reactive-collection'
import { GENERATED_DEEP } from './deep-collection'
import { GENERATED_OBJECTS } from './objects-collection'
import { COMPLEX_SHADERS } from './complex'
import { createShader } from './factory'
import { HERO_SHADERS } from './heroes'

export const SHADER_LIBRARY: ShaderDefinition[] = [
  ...HERO_SHADERS,
  // Phase-25 extreme collection: complex hand-authored heroes + GL objects
  // + deep generative families (all strict-GLSL-audited, compile-swept).
  ...COMPLEX_SHADERS,
  ...GENERATED_OBJECTS,
  ...GENERATED_DEEP,
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
    [{ signal: 'bass', param: 'distortion', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }],
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
    [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }],
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
      pattern *= pow(max(1.0 - r, 0.0), 2.0);
      float burst = uBeat * exp(-r * 3.0) * 2.0;
      pattern += burst;
      vec3 col = vec3(1.0, 0.6, 0.2) * pattern * intensity;
      col += vec3(0.1, 0.0, 0.3) * (1.0 - pattern);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }],
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
    [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }],
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
    [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }],
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
          vec2 pt = vec2(0.5 + 0.5*sin(hash(i+n)*6.28 + uTime*speed));
          float d = length(n + pt - f);
          if(d < md) { md2 = md; md = d; }
          else if(d < md2) { md2 = d; }
        }
      return vec2(md, md2);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float vScale = 4.0 + uBeat * 0.5;
      vec2 v = voronoi(uv * vScale);
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
    [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }],
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
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }],
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
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }],
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
    [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }],
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
      vec2 warped = uv + normalize(uv + 0.0001) * warp * 0.1;
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
    [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }],
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
    [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }],
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
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }],
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
      d = max(d, 0.0);
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
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }],
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
    [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }],
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
    [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }],
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
    [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }],
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
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'high'
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
        float sScale=pow(2.0,fi);
        vec2 p=uv*sScale+vec2(sin(uTime*0.2*speed+fi),cos(uTime*0.15*speed+fi*1.3))*0.3;
        float tri=abs(p.x)+abs(p.y*0.866)-0.5/sScale;
        float edge=smoothstep(0.01/sScale,0.0,abs(tri));
        float glow=exp(-abs(tri)*sScale*5.0)*0.3;
        vec3 c=mix(vec3(0.3,0.1,0.8),vec3(0.8,0.2,0.5),fi/12.0);
        col+=c*(edge+glow)*(1.0-uBeat*0.3*step(4.0,fi));
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
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
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'low'
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
      float strobe=mix(0.06,1.0,gate*beat);
      vec3 base=vec3(smoothstep(0.0,0.33,uv.x),smoothstep(0.33,0.66,uv.x),smoothstep(0.66,1.0,uv.x));
      vec3 col=strobe*(base*0.35+vec3(0.15,0.08,0.12));
      col.r+=strobe*smoothstep(0.0,0.33,uv.x)*uBass*0.8;
      col.g+=strobe*smoothstep(0.33,0.66,uv.x)*uMid*0.8;
      col.b+=strobe*smoothstep(0.66,1.0,uv.x)*uTreble*0.8;
      col*=intensity*2.0;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'low'
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
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
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
      float cScale=8.0+uBass*2.0;
      float c=cell(uv*cScale);
      float edge=smoothstep(0.05,0.0,abs(c-0.1));
      float fill=smoothstep(0.15,0.05,c);
      vec3 col=vec3(0.0);
      col+=fill*vec3(0.1,0.3,0.6)*intensity;
      col+=edge*vec3(0.5,0.8,1.0)*intensity*(0.5+0.5*uBeat);
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
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
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
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
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
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
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
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
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
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
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
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
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
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
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
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
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
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
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
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
        col+=c*p*0.5;
      }
      col*=intensity;
      fragColor=vec4(clamp(col,0.0,1.0),1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'high'
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
        float twinkle=0.5+0.5*sin(uTime*3.0+fi*20.0)+uBass*0.2;
        vec3 c=mix(vec3(1.0,0.9,0.7),vec3(0.7,0.8,1.0),fi);
        col+=c*brightness*twinkle*0.01;
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'high'
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
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
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
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
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
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
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
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'low'
  ),

  // ── 100+ NEW SHADERS ──

  createShader(
    'fractal-burning-ship', 'Burning Ship', 'fractals', 'Classic Burning Ship fractal with flame-like tendrils',
    ['🔥'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.5 - scale * 0.5 + uBass * 0.15;
  uv += vec2(offsetX, offsetY);
  vec2 c = vec2(-0.745, 0.186);
  vec2 z = uv;
  float iter = 0.0;
  for (int i = 0; i < 80; i++) {
    z = vec2(z.x * z.x - z.y * z.y + c.x, abs(2.0 * z.x * z.y) + c.y);
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 80.0;
  vec3 col = vec3(0.0);
  col += 0.5 + 0.5 * cos(6.28 * (t * 3.0 + uTime * 0.1 + vec3(0.0, 0.33, 0.67) + uSpectralCentroid * 0.3));
  col *= (1.0 + uBass * 0.3) * (0.7 + 0.5 * uBeat);
  col *= 0.8 + uTreble * 0.4;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'offsetX', label: 'Offset X', min: -2, max: 2, default: -0.745, step: 0.01, group: 'transform' },
     { id: 'offsetY', label: 'Offset Y', min: -2, max: 2, default: 0.186, step: 0.01, group: 'transform' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium',
    'uniform float offsetX;\nuniform float offsetY;\n'
  ),

  createShader(
    'fractal-phoenix', 'Phoenix', 'fractals', 'Phoenix fractal with swirling orbital patterns',
    ['🦅'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.0;
  vec2 c = vec2(0.566, 0.566);
  vec2 z = uv;
  vec2 prev = vec2(0.0);
  float iter = 0.0;
  for (int i = 0; i < 100; i++) {
    vec2 temp = z;
    z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y) + 0.1 * prev;
    prev = temp;
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 100.0;
  vec3 col = vec3(0.0);
  col += 0.5 + 0.5 * cos(6.28 * (t * 5.0 + vec3(0.0, 0.1, 0.2)));
  col *= 1.0 + uMid * 0.4;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'zoom', label: 'Zoom', min: 0, max: 5, default: 1, step: 0.1, group: 'transform' },
     { id: 'blend', label: 'Blend', min: 0, max: 1, default: 0.1, step: 0.01, group: 'audio' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'fractal-logistic', 'Logistic Map', 'fractals', 'Visualization of chaos theory through logistic equation',
    ['📈'],
    `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float r = 2.5 + uv.x * 1.5 + uBass * 0.5;
  float x = 0.5;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 100; i++) {
    x = r * x * (1.0 - x);
    float y = float(i) / 100.0;
    if (abs(y - uv.y) < 0.01) {
      col = vec3(x, x * 0.5, x * 0.3);
      break;
    }
  }
  col *= 0.8 + 0.2 * sin(uTime + uv.x * 10.0);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'rate', label: 'Growth Rate', min: 2.5, max: 4, default: 3.5, step: 0.01, group: 'chaos' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'fractal-newton', 'Newton Basin', 'fractals', 'Newton fractal with colorful convergence basins',
    ['🍎'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0;
  vec2 z = uv;
  vec2 roots[3];
  roots[0] = vec2(1.0, 0.0);
  roots[1] = vec2(-0.5, 0.866);
  roots[2] = vec2(-0.5, -0.866);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    vec2 z2 = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
    vec2 z3 = vec2(z2.x * z.x - z2.y * z.y, z2.x * z.y + z2.y * z.x);
    z = z - (z3 - vec2(1.0, 0.0)) * vec2(3.0 * z2.x + 0.001, -(3.0 * z2.y)) / max(dot(3.0 * z2, 3.0 * z2) + 0.001, 0.001);
    float d0 = distance(z, roots[0]);
    float d1 = distance(z, roots[1]);
    float d2 = distance(z, roots[2]);
    if (d0 < 0.01) { col = vec3(1.0, 0.3, 0.3); break; }
    if (d1 < 0.01) { col = vec3(0.3, 1.0, 0.3); break; }
    if (d2 < 0.01) { col = vec3(0.3, 0.3, 1.0); break; }
  }
  col *= 1.0 + uTreble * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'iterations', label: 'Iterations', min: 10, max: 50, default: 20, step: 1, group: 'quality' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'fractal-julia-spiral', 'Julia Spiral', 'fractals', 'Spiraling Julia set with animated parameters',
    ['🌀'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.0;
  vec2 c = vec2(-0.7, 0.27015) + 0.1 * sin(uTime * 0.3 + uMid * 0.5);
  vec2 z = uv;
  float iter = 0.0;
  for (int i = 0; i < 60; i++) {
    z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 60.0;
  vec3 col = vec3(0.0);
  col.r = sin(t * 3.14 * 2.0 + uTime * 0.5 + uBass * 0.4);
  col.g = sin(t * 3.14 * 2.0 + uTime * 0.5 + 2.094 + uBeat * 0.3);
  col.b = sin(t * 3.14 * 2.0 + uTime * 0.5 + 4.188 + uTreble * 0.5);
  col = col * col;
  col *= 0.7 + 0.5 * uBeat;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Animation Speed', min: 0, max: 2, default: 0.3, step: 0.01, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'medium'
  ),

  createShader(
    'fractal-burning-zoom', 'Burning Zoom', 'fractals', 'Zooming into burning ship detail with motion',
    ['🔥'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float zoom = pow(1.5, scale * 3.0 + uBass * 0.5);
  uv *= zoom;
  uv += vec2(-0.745, 0.186);
  vec2 c = vec2(-0.745, 0.186);
  vec2 z = uv;
  float iter = 0.0;
  for (int i = 0; i < 100; i++) {
    z = vec2(z.x * z.x - z.y * z.y + c.x, abs(2.0 * z.x * z.y) + c.y);
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 100.0;
  vec3 col = 0.5 + 0.5 * cos(6.28 * (t + vec3(0.0, 0.1, 0.2) + uTime * 0.05 + uMid * 0.3));
  col *= 0.7 + 0.6 * uBeat;
  col *= 0.8 + uTreble * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'zoom', label: 'Zoom', min: 0, max: 10, default: 1, step: 0.1, group: 'transform' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.35, curve: 'linear' }], 'medium'
  ),

  createShader(
    'fractal-tricorn', 'Tricorn', 'fractals', 'Tricorn fractal with mirror symmetry',
    ['🔻'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.5 * (1.0 + uBass * 0.15);
  vec2 c = vec2(-0.3, 0.6) + vec2(sin(uTime * 0.2) * 0.05 * uMid, cos(uTime * 0.15) * 0.05 * uMid);
  vec2 z = uv;
  float iter = 0.0;
  for (int i = 0; i < 80; i++) {
    z = vec2(z.x * z.x - z.y * z.y + c.x, -2.0 * z.x * z.y + c.y);
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 80.0;
  vec3 col = vec3(0.0);
  col += 0.5 + 0.5 * cos(6.28 * (t * 2.0 + vec3(0.0, 0.33, 0.67) + uSpectralCentroid * 0.4));
  col *= 0.7 + 0.6 * uBeat;
  col *= 0.8 + uTreble * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'zoom', label: 'Zoom', min: 0, max: 5, default: 1, step: 0.1, group: 'transform' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'fractal-buddhabrot', 'Buddhabrot', 'fractals', 'Probabilistic rendering of Buddha set trajectories',
    ['🧘'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0 * (1.0 + uBass * 0.1);
  vec3 col = vec3(0.0);
  for (int s = 0; s < 20; s++) {
    vec2 c = vec2(
      fract(sin(float(s) * 127.1) * 43758.5453),
      fract(cos(float(s) * 311.7) * 43758.5453)
    ) * 4.0 - 2.0;
    vec2 z = vec2(0.0);
    bool escaped = false;
    for (int i = 0; i < 50; i++) {
      z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
      if (dot(z, z) > 4.0) { escaped = true; break; }
    }
    if (escaped) {
      z = vec2(0.0);
      for (int i = 0; i < 50; i++) {
        z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
        vec2 p = z;
        float d = length(p - uv);
        col += exp(-d * 5.0) * vec3(0.5 + uBeat * 0.3, 0.2, 0.8 + uTreble * 0.2);
      }
    }
  }
  col /= 20.0;
  col *= 0.7 + 0.6 * uVolume;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'samples', label: 'Samples', min: 5, max: 50, default: 20, step: 1, group: 'quality' }],
    {}, [{ signal: 'beat', param: 'brightness', amount: 0.4, curve: 'linear' }, { signal: 'volume', param: 'distortion', amount: 0.3, curve: 'log' }], 'high'
  ),

  createShader(
    'fractal-lyapunov', 'Lyapunov', 'fractals', 'Lyapunov exponent visualization of chaotic systems',
    ['📊'],
    `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float r = 3.5 + sin(uTime * 0.2) * 0.5;
  float x = 0.5;
  float lyap = 0.0;
  for (int i = 0; i < 100; i++) {
    float dx = r * (1.0 - 2.0 * x);
    if (abs(dx) < 0.0001) dx = 0.0001;
    lyap += log(abs(dx));
    x = r * x * (1.0 - x);
  }
  lyap /= 100.0;
  vec3 col = vec3(0.0);
  if (lyap < 0.0) {
    col = vec3(0.0, -lyap * 2.0, 0.0);
  } else {
    col = vec3(lyap * 2.0, 0.0, 0.0);
  }
  col *= 1.0 + uBeat * 0.5;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'rate', label: 'Growth Rate', min: 2.5, max: 4, default: 3.5, step: 0.01, group: 'chaos' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'fractal-feather', 'Feather', 'fractals', 'Feather-like fractal patterns with organic curves',
    ['🪶'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.0;
  vec2 z = uv;
  float t = uTime * 0.1 + uMid * 0.3;
  float iter = 0.0;
  for (int i = 0; i < 60; i++) {
    float r = length(z);
    float theta = atan(z.y, z.x);
    z = vec2(
      r * cos(theta * 2.0 + t) + 0.5 * cos(theta * 3.0 + uBass * 0.2),
      r * sin(theta * 2.0 + t) + 0.5 * sin(theta * 3.0 + uBeat * 0.3)
    );
    if (length(z) > 2.0) break;
    iter += 1.0;
  }
  float f = iter / 60.0;
  vec3 col = vec3(f * 0.8, f * 0.4, f * 0.6);
  col *= (1.0 + uMid * 0.3) * (0.7 + 0.6 * uBeat);
  col *= 0.8 + uTreble * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'complexity', label: 'Complexity', min: 1, max: 5, default: 2, step: 0.1, group: 'shape' }],
    {}, [{ signal: 'mid', param: 'speed', amount: 0.3, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'fractal-multibrot', 'Multibrot', 'fractals', 'Higher-order Mandelbrot sets with N-fold symmetry',
    ['🔮'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.5;
  vec2 c = uv;
  vec2 z = vec2(0.0);
  float power = 3.0 + sin(uTime * 0.2) * 0.5 + uBass * 0.3;
  float iter = 0.0;
  for (int i = 0; i < 60; i++) {
    float r = length(z);
    float theta = atan(z.y, z.x);
    z = vec2(
      pow(r, power) * cos(power * theta) + c.x,
      pow(r, power) * sin(power * theta) + c.y
    );
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 60.0;
  vec3 col = 0.5 + 0.5 * cos(6.28 * (t * 3.0 + vec3(0.0, 0.1, 0.2)));
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'power', label: 'Power', min: 2, max: 8, default: 3, step: 0.1, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'vj-glitch', 'Glitch', 'vj', 'Digital glitch effect with scanline displacement',
    ['📺'],
    `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float glitchStrength = uBeat * 0.5 + uBass * 0.3;
  float slice = floor(uv.y * 20.0);
  float offset = sin(slice * 43.5 + uTime * 10.0) * glitchStrength * 0.1;
  vec2 distortedUv = uv + vec2(offset, 0.0);
  float scanline = sin(uv.y * uResolution.y * 0.5) * 0.02;
  vec3 col = vec3(
    sin(distortedUv.x * 10.0 + uTime) * 0.5 + 0.5,
    sin(distortedUv.x * 10.0 + uTime + 2.094) * 0.5 + 0.5,
    sin(distortedUv.x * 10.0 + uTime + 4.188) * 0.5 + 0.5
  );
  col += scanline;
  col *= 1.0 - step(0.98, fract(sin(slice * 127.1) * 43758.5453)) * glitchStrength;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'intensity', label: 'Intensity', min: 0, max: 2, default: 1, step: 0.1, group: 'glitch' },
     { id: 'scanlines', label: 'Scanlines', min: 0, max: 1, default: 0.5, step: 0.1, group: 'glitch' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'low'
  ),

  createShader(
    'vj-mirror-tunnel', 'Mirror Tunnel', 'vj', 'Kaleidoscopic tunnel mirror effect',
    ['🪞'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float segments = 6.0 + uBass * 2.0;
  angle = mod(angle, 6.28 / segments);
  angle = abs(angle - 3.14 / segments);
  vec2 rotatedUv = vec2(cos(angle), sin(angle)) * radius;
  float pattern = sin(rotatedUv.x * 10.0 + uTime * 2.0) * cos(rotatedUv.y * 10.0 - uTime);
  vec3 col = vec3(
    pattern * 0.5 + 0.5,
    sin(pattern * 3.14 + uTime) * 0.5 + 0.5,
    cos(pattern * 3.14 - uTime) * 0.5 + 0.5
  );
  col *= 1.0 / (1.0 + radius * 2.0);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'segments', label: 'Segments', min: 3, max: 12, default: 6, step: 1, group: 'shape' },
     { id: 'depth', label: 'Depth', min: 0.5, max: 3, default: 1, step: 0.1, group: 'transform' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'medium'
  ),

  createShader(
    'vj-kaleido-tunnel', 'Kaleido Tunnel', 'vj', 'Spiraling kaleidoscope with depth distortion',
    ['🎆'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float segments = 8.0 + floor(uBeat * 4.0);
  angle = mod(angle, 6.28 / segments);
  angle = abs(angle - 3.14 / segments);
  float spiral = radius + uTime * 0.5;
  float pattern = sin(angle * 20.0 + spiral * 10.0) * 0.5 + 0.5;
  vec3 col = vec3(
    pattern * sin(spiral * 2.0 + uTime),
    pattern * sin(spiral * 2.0 + uTime + 2.094),
    pattern * sin(spiral * 2.0 + uTime + 4.188)
  );
  col *= 1.0 / (1.0 + radius * 3.0);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Speed', min: 0, max: 3, default: 1, step: 0.1, group: 'animation' },
     { id: 'complexity', label: 'Complexity', min: 4, max: 16, default: 8, step: 1, group: 'shape' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'medium'
  ),

  createShader(
    'vj-feedback', 'Video Feedback', 'vj', 'Recursive video feedback with trail accumulation',
    ['📹'],
    `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 center = vec2(0.5);
  vec2 toCenter = center - uv;
  float dist = length(toCenter);
  float angle = atan(toCenter.y, toCenter.x);
  float spiral = sin(angle * 3.0 + uTime + dist * 10.0) * 0.1;
  vec2 sampleUv = uv + toCenter * spiral * uBass;
  float pattern = sin(sampleUv.x * 20.0 + uTime) * cos(sampleUv.y * 20.0 - uTime);
  vec3 col = vec3(
    pattern * 0.5 + 0.5,
    sin(pattern * 3.14 + uTime * 0.5) * 0.5 + 0.5,
    cos(pattern * 3.14 - uTime * 0.5) * 0.5 + 0.5
  );
  col *= exp(-dist * 2.0);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'feedback', label: 'Feedback', min: 0, max: 1, default: 0.5, step: 0.01, group: 'feedback' },
     { id: 'zoom', label: 'Zoom', min: 0.8, max: 1.2, default: 1, step: 0.01, group: 'transform' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'medium'
  ),

  createShader(
    'vj-line-burst', 'Line Burst', 'vj', 'Radial line explosion from center',
    ['💥'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float lines = 32.0;
  float pattern = sin(angle * lines + uTime * 5.0) * 0.5 + 0.5;
  pattern *= exp(-radius * 3.0);
  float burst = uBeat * 0.5;
  vec3 col = vec3(
    pattern * (1.0 + burst),
    pattern * 0.3,
    pattern * 0.8
  );
  col *= 1.0 + burst * exp(-radius * 5.0);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'lines', label: 'Lines', min: 8, max: 64, default: 32, step: 1, group: 'shape' },
     { id: 'burst', label: 'Burst', min: 0, max: 2, default: 1, step: 0.1, group: 'audio' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'low'
  ),

  createShader(
    'vj-circular-spectrum', 'Circular Spectrum', 'vj', 'Audio spectrum displayed in a circular pattern',
    ['🎯'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float band = (angle + 3.14159) / 6.28318;
  float spectrum = sin(band * 3.14159 * 8.0 + uTime) * 0.5 + 0.5;
  spectrum = max(spectrum, 0.1);
  spectrum *= uBass * 0.5 + uMid * 0.3 + uTreble * 0.2 + 0.15;
  float ring = smoothstep(0.3, 0.31, radius) - smoothstep(0.31 + spectrum * 0.2, 0.32 + spectrum * 0.2, radius);
  vec3 col = vec3(
    spectrum * sin(angle * 2.0 + uTime),
    spectrum * sin(angle * 2.0 + uTime + 2.094),
    spectrum * sin(angle * 2.0 + uTime + 4.188)
  );
  col *= ring;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'radius', label: 'Radius', min: 0.1, max: 0.5, default: 0.3, step: 0.01, group: 'transform' },
     { id: 'thickness', label: 'Thickness', min: 0.01, max: 0.1, default: 0.03, step: 0.005, group: 'shape' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'medium'
  ),

  createShader(
    'vj-scanlines', 'Scanlines', 'vj', 'CRT monitor scanline effect with distortion',
    ['📺'],
    `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float scanline = sin(uv.y * uResolution.y * 0.8) * 0.03;
  float rgbShift = sin(uv.y * 50.0 + uTime * 2.0) * 0.002 * uBeat;
  vec3 col;
  col.r = sin((uv.x + rgbShift) * 20.0 + uTime) * 0.5 + 0.5;
  col.g = sin(uv.x * 20.0 + uTime) * 0.5 + 0.5;
  col.b = sin((uv.x - rgbShift) * 20.0 + uTime) * 0.5 + 0.5;
  col -= scanline;
  col *= 1.0 + sin(uv.y * 200.0) * 0.02;
  float vignette = 1.0 - length(uv - 0.5) * 0.5;
  col *= vignette;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 0.1, default: 0.02, step: 0.005, group: 'crt' },
     { id: 'vignette', label: 'Vignette', min: 0, max: 1, default: 0.5, step: 0.1, group: 'crt' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'low'
  ),

  createShader(
    'vj-pulse-grid', 'Pulse Grid', 'vj', 'Grid that pulses with audio beats',
    ['🔲'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 grid = fract(uv * 5.0 + uTime * 0.2) - 0.5;
  float line = smoothstep(0.02, 0.0, abs(grid.x)) + smoothstep(0.02, 0.0, abs(grid.y));
  float pulse = uBeat * 0.5 + 0.5;
  vec3 col = vec3(line * pulse * 0.3);
  col += vec3(
    exp(-length(uv) * 2.0) * pulse * 0.5,
    exp(-length(uv) * 2.0) * pulse * 0.2,
    exp(-length(uv) * 2.0) * pulse * 0.8
  );
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'density', label: 'Density', min: 2, max: 20, default: 5, step: 1, group: 'shape' },
     { id: 'pulse', label: 'Pulse', min: 0, max: 2, default: 1, step: 0.1, group: 'audio' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'low'
  ),

  createShader(
    'vj-hex-beat', 'Hex Beat', 'vj', 'Hexagonal grid with beat-reactive cells',
    ['⬡'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 hex = uv * 4.0;
  float hexX = hex.x * 1.732;
  float hexY = hex.y + mod(floor(hexX), 2.0) * 0.5;
  vec2 cell = vec2(floor(hexX), floor(hexY));
  float dist = length(fract(hex) - 0.5);
  float beat = sin(dot(cell, vec2(12.9898, 78.233)) + uTime * 3.0) * 0.5 + 0.5;
  beat *= 0.5 + 0.5 * uBass;
  float hexShape = smoothstep(0.5, 0.45, dist);
  vec3 col = vec3(
    hexShape * beat * 0.8,
    hexShape * beat * 0.3,
    hexShape * beat * 0.6
  );
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'scale', label: 'Scale', min: 2, max: 10, default: 4, step: 0.5, group: 'shape' },
     { id: 'reactivity', label: 'Reactivity', min: 0, max: 2, default: 1, step: 0.1, group: 'audio' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'medium'
  ),

  createShader(
    'vj-rgb-split', 'RGB Split', 'vj', 'Chromatic aberration with beat-reactive splitting',
    ['🌈'],
    `void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float split = uBeat * 0.02 + 0.005;
  vec2 center = vec2(0.5);
  vec2 dir = uv - center;
  float r = sin((uv.x + split) * 20.0 + uTime) * 0.5 + 0.5;
  float g = sin(uv.x * 20.0 + uTime) * 0.5 + 0.5;
  float b = sin((uv.x - split) * 20.0 + uTime) * 0.5 + 0.5;
  vec3 col = vec3(r, g, b);
  col *= 1.0 - length(dir) * 0.5;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'split', label: 'Split', min: 0, max: 0.05, default: 0.01, step: 0.001, group: 'chromatic' },
     { id: 'pattern', label: 'Pattern', min: 5, max: 50, default: 20, step: 1, group: 'shape' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'low'
  ),

  createShader(
    'vj-barn-doors', 'Barn Doors', 'vj', 'Theatrical barn door light effect',
    ['🚪'],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float door = uBass * 0.3;
  float left = smoothstep(-0.5 - door, -0.4 - door, uv.x);
  float right = smoothstep(0.5 + door, 0.4 + door, uv.x);
  float top = smoothstep(0.5 + door, 0.4 + door, uv.y);
  float bottom = smoothstep(-0.5 - door, -0.4 - door, uv.y);
  float mask = left * right * top * bottom;
  vec3 col = vec3(
    mask * (0.8 + 0.2 * sin(uTime)),
    mask * (0.6 + 0.2 * sin(uTime + 2.094)),
    mask * (0.4 + 0.2 * sin(uTime + 4.188))
  );
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'opening', label: 'Opening', min: 0, max: 0.5, default: 0.1, step: 0.01, group: 'shape' },
     { id: 'feather', label: 'Feather', min: 0, max: 0.1, default: 0.01, step: 0.005, group: 'shape' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }], 'low'
  ),


  // ── GEOMETRIC SHADERS ──

  createShader(
    'geo-hexagonal', 'Hexagonal Grid', 'geometric', 'Hexagonal tessellation with distance-based coloring',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 hex = uv * 5.0;
  float hexX = hex.x * 1.732;
  float hexY = hex.y + mod(floor(hexX), 2.0) * 0.5;
  vec2 cell = vec2(floor(hexX), floor(hexY));
  vec2 center = cell + 0.5;
  float dist = length(fract(hex) - 0.5);
  float edge = smoothstep(0.5, 0.45, dist);
  float noise = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 col = vec3(edge * noise * 0.8, edge * noise * 0.4, edge * noise * 0.6);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'scale', label: 'Scale', min: 2, max: 15, default: 5, step: 0.5, group: 'shape' },
     { id: 'edge', label: 'Edge', min: 0.4, max: 0.5, default: 0.45, step: 0.01, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'geo-penrose', 'Penrose Tiles', 'geometric', 'Aperiodic Penrose tiling pattern',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0;
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float theta = mod(angle, 3.14159 / 5.0);
  float kite = smoothstep(0.1, 0.0, abs(theta - 3.14159 / 10.0) - 0.05);
  float dart = smoothstep(0.1, 0.0, abs(theta - 3.14159 / 5.0) - 0.03);
  float pattern = kite + dart * 0.5;
  pattern *= sin(radius * 5.0 + uTime * 0.5) * 0.3 + 0.7;
  pattern *= 0.7 + 0.3 * uBass;
  vec3 col = vec3(pattern * 0.6, pattern * 0.8, pattern);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'scale', label: 'Scale', min: 1, max: 10, default: 3, step: 0.5, group: 'shape' },
     { id: 'rotation', label: 'Rotation', min: 0, max: 6.28, default: 0, step: 0.1, group: 'transform' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'high'
  ),

  createShader(
    'geo-sacred', 'Sacred Geometry', 'geometric', 'Flower of Life and sacred geometric patterns',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0;
  float pattern = 0.0;
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * 3.14159 / 3.0;
    vec2 center = vec2(cos(angle), sin(angle));
    float dist = length(uv - center);
    pattern += smoothstep(0.5, 0.48, dist);
  }
  float c = smoothstep(0.5, 0.48, length(uv));
  pattern += c;
  pattern = mod(pattern, 2.0);
  vec3 col = vec3(pattern * 0.5, pattern * 0.7, pattern);
  col *= 1.0 + uMid * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'circles', label: 'Circles', min: 3, max: 12, default: 6, step: 1, group: 'shape' },
     { id: 'scale', label: 'Scale', min: 1, max: 5, default: 3, step: 0.1, group: 'transform' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'geo-wireframe', 'Wireframe', 'geometric', '3D wireframe mesh with perspective',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.0));
  float grid = 0.0;
  for (float i = 0.0; i < 5.0; i++) {
    float z = 2.0 - i * 0.5;
    vec2 p = ro.xy + rd.xy * (z - ro.z) / rd.z;
    grid += smoothstep(0.02, 0.0, abs(fract(p.x * 2.0) - 0.5));
    grid += smoothstep(0.02, 0.0, abs(fract(p.y * 2.0) - 0.5));
  }
  vec3 col = vec3(grid * 0.3, grid * 0.6, grid);
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'density', label: 'Density', min: 1, max: 10, default: 2, step: 0.5, group: 'shape' },
     { id: 'depth', label: 'Depth', min: 3, max: 10, default: 5, step: 1, group: 'transform' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'geo-tessellation', 'Tessellation', 'geometric', 'Animated triangular tessellation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 5.0;
  float triX = uv.x * 1.732;
  float triY = uv.y + mod(floor(triX), 2.0) * 0.5;
  vec2 cell = vec2(floor(triX), floor(triY));
  vec2 local = fract(uv) - 0.5;
  float tri = abs(local.x) + abs(local.y);
  float edge = smoothstep(0.6, 0.55, tri);
  float pattern = sin(cell.x * 0.5 + cell.y * 0.5 + uTime * 2.0) * 0.5 + 0.5;
  vec3 col = vec3(edge * pattern * 0.8, edge * pattern * 0.4, edge * pattern * 0.6);
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'scale', label: 'Scale', min: 2, max: 15, default: 5, step: 0.5, group: 'shape' },
     { id: 'animation', label: 'Animation', min: 0, max: 5, default: 2, step: 0.1, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'geo-diamond', 'Diamond Grid', 'geometric', 'Diamond-shaped grid with internal patterns',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 4.0;
  vec2 grid = vec2(uv.x + uv.y, uv.y - uv.x);
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float diamond = abs(local.x) + abs(local.y);
  float edge = smoothstep(0.5, 0.45, diamond);
  float inner = smoothstep(0.3, 0.25, diamond);
  float pattern = sin(cell.x * 2.0 + cell.y * 2.0 + uTime) * 0.5 + 0.5;
  float pulse = 0.7 + 0.3 * uBeat;
  vec3 col = vec3(
    edge * pattern * 0.5 * pulse + inner * 0.3,
    edge * pattern * 0.3 * pulse + inner * 0.6,
    edge * pattern * 0.8 * pulse + inner * 0.4
  );
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'scale', label: 'Scale', min: 2, max: 10, default: 4, step: 0.5, group: 'shape' },
     { id: 'inner', label: 'Inner Pattern', min: 0, max: 1, default: 0.5, step: 0.1, group: 'detail' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'geo-spiral', 'Spiral Grid', 'geometric', 'Logarithmic spiral tessellation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float spiral = angle / 6.28318 + log(radius + 0.1) * 0.5;
  float pattern = sin(spiral * 20.0 + uTime * 0.5) * 0.5 + 0.5;
  float rings = sin(radius * 10.0 - uTime) * 0.5 + 0.5;
  float combined = pattern * rings;
  vec3 col = vec3(combined * 0.8, combined * 0.4, combined * 0.9);
  col *= 1.0 / (1.0 + radius * 2.0);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'tightness', label: 'Tightness', min: 0.1, max: 1, default: 0.5, step: 0.05, group: 'shape' },
     { id: 'rings', label: 'Rings', min: 5, max: 30, default: 10, step: 1, group: 'detail' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'geo-truchet', 'Truchet Tiles', 'geometric', 'Truchet tile pattern with randomized connections',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 5.0;
  vec2 cell = floor(uv);
  vec2 local = fract(uv) - 0.5;
  float rnd = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  float pattern = 0.0;
  if (rnd < 0.5) {
    float d = length(local - vec2(0.25, 0.25));
    pattern = smoothstep(0.3, 0.25, d);
    d = length(local - vec2(-0.25, -0.25));
    pattern += smoothstep(0.3, 0.25, d);
  } else {
    float d = length(local - vec2(0.25, -0.25));
    pattern = smoothstep(0.3, 0.25, d);
    d = length(local - vec2(-0.25, 0.25));
    pattern += smoothstep(0.3, 0.25, d);
  }
  vec3 col = vec3(pattern * 0.6, pattern * 0.8, pattern);
  col *= 1.0 + uBeat * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'scale', label: 'Scale', min: 2, max: 15, default: 5, step: 0.5, group: 'shape' },
     { id: 'complexity', label: 'Complexity', min: 1, max: 4, default: 2, step: 1, group: 'detail' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'geo-lattice', 'Lattice', 'geometric', 'Interlocking lattice structure with depth',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 4.0;
  float lattice = 0.0;
  lattice += smoothstep(0.1, 0.0, abs(fract(uv.x) - 0.5));
  lattice += smoothstep(0.1, 0.0, abs(fract(uv.y) - 0.5));
  vec2 offset = vec2(0.5);
  lattice += smoothstep(0.1, 0.0, abs(fract(uv.x + offset.x) - 0.5)) * 0.5;
  lattice += smoothstep(0.1, 0.0, abs(fract(uv.y + offset.y) - 0.5)) * 0.5;
  lattice = min(lattice, 1.0);
  vec3 col = vec3(lattice * 0.4, lattice * 0.7, lattice * 0.9);
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'thickness', label: 'Thickness', min: 0.05, max: 0.2, default: 0.1, step: 0.01, group: 'shape' },
     { id: 'scale', label: 'Scale', min: 2, max: 10, default: 4, step: 0.5, group: 'transform' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'geo-polyhedra', 'Polyhedra', 'geometric', 'Rotating polyhedron wireframe projection',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.0));
  float edges = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    vec3 p = vec3(cos(fi * 0.5236 + t) * 1.0, sin(fi * 0.5236 + t) * 1.0, sin(fi * 1.0472 + t) * 0.5);
    float d = length(p - ro);
    edges += exp(-d * 0.5);
  }
  edges = min(edges, 1.0);
  vec3 col = vec3(edges * 0.5, edges * 0.8, edges);
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'vertices', label: 'Vertices', min: 4, max: 20, default: 12, step: 1, group: 'shape' },
     { id: 'rotation', label: 'Rotation Speed', min: 0, max: 2, default: 0.3, step: 0.1, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'high'
  ),

  createShader(
    'geo-celtic', 'Celtic Knot', 'geometric', 'Interlacing Celtic knot pattern',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0;
  float knot = 0.0;
  knot += smoothstep(0.15, 0.1, abs(sin(uv.x * 3.14159) * cos(uv.y * 3.14159)));
  knot += smoothstep(0.15, 0.1, abs(cos(uv.x * 3.14159) * sin(uv.y * 3.14159)));
  knot = min(knot, 1.0);
  float interlace = sin(uv.x * 6.28318 + uv.y * 6.28318 + uTime * 0.5) * 0.5 + 0.5;
  vec3 col = vec3(knot * interlace * 0.6, knot * interlace * 0.8, knot * 0.5);
  col *= 1.0 + uMid * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'complexity', label: 'Complexity', min: 1, max: 5, default: 3, step: 1, group: 'shape' },
     { id: 'interlace', label: 'Interlace', min: 0, max: 1, default: 0.5, step: 0.1, group: 'detail' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'mid', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  // ── LIQUID SHADERS ──

  createShader(
    'liq-oil', 'Oil Slick', 'liquid', 'Iridescent oil slick interference patterns',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  vec2 q = vec2(sin(uv.x * 3.0 + t) * cos(uv.y * 2.0 + t * 0.7), cos(uv.x * 2.5 + t * 0.8) * sin(uv.y * 3.5 + t * 0.5));
  float f1 = sin(uv.x * 10.0 + q.x * 5.0);
  float f2 = sin(uv.y * 10.0 + q.y * 5.0);
  float f3 = sin((uv.x + uv.y) * 8.0 + t);
  vec3 col = vec3(sin(f1 * 3.14159) * 0.5 + 0.5, sin(f2 * 3.14159 + 2.094) * 0.5 + 0.5, sin(f3 * 3.14159 + 4.188) * 0.5 + 0.5);
  col = pow(col, vec3(0.8));
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'thickness', label: 'Thickness', min: 5, max: 20, default: 10, step: 1, group: 'detail' },
     { id: 'distortion', label: 'Distortion', min: 0, max: 5, default: 2, step: 0.1, group: 'distortion' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'liq-marble', 'Marble', 'liquid', 'Veined marble texture with subsurface scattering',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float vein = sin(uv.x * 20.0 + sin(uv.y * 10.0 + t) * 3.0) * 0.5 + 0.5;
  vein = pow(vein, 0.5);
  float noise = fract(sin(dot(uv * 50.0, vec2(12.9898, 78.233))) * 43758.5453);
  vein = mix(vein, noise, 0.1);
  vec3 col = vec3(vein * 0.9 + 0.1, vein * 0.85 + 0.15, vein * 0.8 + 0.2);
  col *= 1.0 + uMid * 0.15;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'scale', label: 'Scale', min: 5, max: 30, default: 20, step: 1, group: 'shape' },
     { id: 'vein', label: 'Vein Intensity', min: 0, max: 5, default: 3, step: 0.1, group: 'detail' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'liq-wave', 'Wave', 'liquid', 'Fluid wave interference with caustics',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float wave = 0.0;
  wave += sin(uv.x * 5.0 + t) * 0.3;
  wave += sin(uv.y * 5.0 + t * 0.7) * 0.3;
  wave += sin((uv.x + uv.y) * 3.0 + t * 1.3) * 0.2;
  wave += sin(length(uv) * 10.0 - t * 2.0) * 0.2;
  float caustic = pow(max(0.0, sin(wave * 10.0)), 4.0);
  vec3 col = vec3(caustic * 0.2, caustic * 0.6, caustic * 0.8);
  col *= 1.0 + uBass * 0.4;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Speed', min: 0.1, max: 2, default: 0.5, step: 0.1, group: 'animation' },
     { id: 'complexity', label: 'Complexity', min: 2, max: 8, default: 4, step: 1, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'liq-plasma', 'Plasma', 'liquid', 'Classic plasma effect with multiple wave interference',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float v1 = sin(uv.x * 10.0 + t);
  float v2 = sin(uv.y * 10.0 + t * 0.7);
  float v3 = sin((uv.x + uv.y) * 10.0 + t * 1.3);
  float v4 = sin(length(uv) * 12.0 - t * 2.0);
  float plasma = (v1 + v2 + v3 + v4) * 0.25;
  vec3 col = vec3(sin(plasma * 3.14159) * 0.5 + 0.5, sin(plasma * 3.14159 + 2.094) * 0.5 + 0.5, sin(plasma * 3.14159 + 4.188) * 0.5 + 0.5);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Speed', min: 0.1, max: 2, default: 0.3, step: 0.1, group: 'animation' },
     { id: 'complexity', label: 'Complexity', min: 2, max: 8, default: 4, step: 1, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'liq-lava', 'Lava', 'liquid', 'Molten lava flow with glowing cracks',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float flow = sin(uv.x * 5.0 + sin(uv.y * 3.0 + t) * 2.0) * 0.5 + 0.5;
  flow = pow(flow, 2.0);
  float crack = 1.0 - smoothstep(0.39, 0.4, flow);
  float glow = exp(-flow * 3.0) * 0.5;
  vec3 col = vec3(flow * 0.8 + glow, flow * 0.2, flow * 0.1);
  col += crack * vec3(1.0, 0.8, 0.2) * 0.5;
  col *= 1.0 + uBass * 0.4;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'temperature', label: 'Temperature', min: 0.5, max: 2, default: 1, step: 0.1, group: 'color' },
     { id: 'flow', label: 'Flow Speed', min: 0.05, max: 0.5, default: 0.1, step: 0.01, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'liq-aurora-fluid', 'Aurora Fluid', 'liquid', 'Northern lights fluid simulation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.15;
  float aurora = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float y = uv.y * (1.0 + fi * 0.2) + sin(uv.x * 2.0 + t + fi) * 0.3;
    aurora += exp(-abs(y) * 2.0) * (0.5 + 0.5 * sin(uv.x * 5.0 + t * 2.0 + fi * 1.5));
  }
  vec3 col = vec3(aurora * 0.2, aurora * 0.8, aurora * 0.6);
  col *= 1.0 + uMid * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'curtains', label: 'Curtains', min: 3, max: 10, default: 5, step: 1, group: 'shape' },
     { id: 'brightness', label: 'Brightness', min: 0.5, max: 2, default: 1, step: 0.1, group: 'color' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'liq-silk', 'Silk', 'liquid', 'Flowing silk fabric with subsurface scattering',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float fold = sin(uv.x * 8.0 + sin(uv.y * 3.0 + t) * 2.0) * 0.5 + 0.5;
  fold = pow(fold, 0.3);
  float sheen = pow(max(0.0, sin(fold * 6.28318)), 8.0);
  vec3 col = vec3(fold * 0.8 + sheen * 0.2, fold * 0.7 + sheen * 0.3, fold * 0.9 + sheen * 0.1);
  col *= 1.0 + uMid * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'sheen', label: 'Sheen', min: 0, max: 1, default: 0.5, step: 0.1, group: 'material' },
     { id: 'flow', label: 'Flow', min: 0.1, max: 1, default: 0.2, step: 0.05, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'liq-chrome', 'Chrome', 'liquid', 'Reflective chrome surface with environment mapping',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec3 normal = normalize(vec3(uv, 1.0));
  float t = uTime * 0.3;
  vec3 reflectDir = reflect(normal, vec3(0.0, 0.0, 1.0));
  float env = sin(reflectDir.x * 5.0 + t) * sin(reflectDir.y * 5.0 + t * 0.7);
  env = env * 0.5 + 0.5;
  vec3 col = vec3(env * 0.8 + 0.2);
  col *= vec3(1.0, 0.95, 0.9);
  col += pow(env, 8.0) * 0.3;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'smoothness', label: 'Smoothness', min: 0, max: 1, default: 0.8, step: 0.1, group: 'material' },
     { id: 'environment', label: 'Environment', min: 1, max: 10, default: 5, step: 1, group: 'detail' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'liq-abalone', 'Abalone', 'liquid', 'Iridescent abalone shell with nacre layers',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float nacre = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    nacre += sin(uv.x * (10.0 + fi * 2.0) + t + fi * 1.5) * (0.5 + 0.5 * cos(uv.y * 8.0 + t * 0.5));
  }
  nacre /= 5.0;
  vec3 col = vec3(sin(nacre * 6.28318) * 0.5 + 0.5, sin(nacre * 6.28318 + 2.094) * 0.5 + 0.5, sin(nacre * 6.28318 + 4.188) * 0.5 + 0.5);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'layers', label: 'Layers', min: 3, max: 10, default: 5, step: 1, group: 'detail' },
     { id: 'iridescence', label: 'Iridescence', min: 0, max: 2, default: 1, step: 0.1, group: 'color' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'liq-ripple', 'Ripple', 'liquid', 'Concentric water ripples with interference',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float ripple = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 center = vec2(sin(t * 0.3 + fi * 2.094) * 0.3, cos(t * 0.4 + fi * 2.094) * 0.3);
    float d = length(uv - center);
    ripple += sin(d * 20.0 - t * 3.0 + fi * 1.5) * exp(-d * 2.0);
  }
  ripple = ripple * 0.33 + 0.5;
  vec3 col = vec3(ripple * 0.3, ripple * 0.6, ripple * 0.9);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'sources', label: 'Sources', min: 1, max: 5, default: 3, step: 1, group: 'shape' },
     { id: 'frequency', label: 'Frequency', min: 10, max: 40, default: 20, step: 1, group: 'detail' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'liq-viscous', 'Viscous', 'liquid', 'Thick viscous fluid with slow deformation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.05;
  vec2 q = vec2(sin(uv.x * 3.0 + t) * cos(uv.y * 2.0 + t * 0.7), cos(uv.x * 2.5 + t * 0.8) * sin(uv.y * 3.5 + t * 0.5));
  float f = sin(uv.x * 5.0 + q.x * 3.0) * cos(uv.y * 5.0 + q.y * 3.0);
  f = f * 0.5 + 0.5;
  f = pow(f, 0.5);
  vec3 col = vec3(f * 0.8 + 0.2, f * 0.6 + 0.1, f * 0.3);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'viscosity', label: 'Viscosity', min: 0.01, max: 0.2, default: 0.05, step: 0.01, group: 'physics' },
     { id: 'distortion', label: 'Distortion', min: 1, max: 5, default: 3, step: 0.1, group: 'distortion' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  // ── COSMIC SHADERS ──

  createShader(
    'cos-wormhole', 'Wormhole', 'cosmic', 'Traversable wormhole with gravitational lensing',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float dist = length(uv);
  float tunnel = 1.0 / (dist + 0.1);
  float angle = atan(uv.y, uv.x);
  vec2 tiledUv = vec2(angle / 3.14159, tunnel + t + uBass * 0.5);
  float pattern = sin(tiledUv.x * 20.0) * sin(tiledUv.y * 5.0) * 0.5 + 0.5;
  vec3 col = vec3(pattern * 0.2, pattern * 0.5, pattern * 0.8);
  col *= exp(-dist * 2.0);
  col += vec3(0.1, 0.05, 0.2) * (1.0 - exp(-dist * 3.0));
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'depth', label: 'Depth', min: 0.5, max: 3, default: 1, step: 0.1, group: 'transform' },
     { id: 'speed', label: 'Speed', min: 0.1, max: 2, default: 0.5, step: 0.1, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'cos-supernova', 'Supernova', 'cosmic', 'Stellar explosion with expanding shockwave',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float dist = length(uv);
  float shockwave = smoothstep(0.1, 0.0, abs(dist - t * 0.5));
  float debris = sin(dist * 30.0 - t * 10.0) * exp(-dist * 3.0) * 0.5 + 0.5;
  float core = exp(-dist * 10.0) * max(0.0, 1.0 - t * 0.2);
  vec3 col = vec3(shockwave * 0.8 + debris * 0.5 + core, shockwave * 0.3 + debris * 0.2, shockwave * 0.1 + debris * 0.8 + core * 0.5);
  col *= 1.0 + uBeat * 0.5;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'expansion', label: 'Expansion', min: 0.1, max: 1, default: 0.5, step: 0.05, group: 'animation' },
     { id: 'brightness', label: 'Brightness', min: 0.5, max: 2, default: 1, step: 0.1, group: 'color' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'cos-dark-matter', 'Dark Matter', 'cosmic', 'Dark matter web structure visualization',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.05;
  vec2 q = vec2(sin(uv.x * 2.0 + t) * cos(uv.y * 1.5 + t * 0.7), cos(uv.x * 1.8 + t * 0.8) * sin(uv.y * 2.2 + t * 0.5));
  float filament = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float d = abs(sin(uv.x * 3.0 + q.x * 2.0 + fi * 1.5) * cos(uv.y * 3.0 + q.y * 2.0 + fi * 1.5));
    filament += exp(-d * 10.0);
  }
  filament = min(filament, 1.0);
  vec3 col = vec3(filament * 0.1, filament * 0.2, filament * 0.4);
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'density', label: 'Density', min: 0.1, max: 1, default: 0.5, step: 0.05, group: 'structure' },
     { id: 'filaments', label: 'Filaments', min: 3, max: 10, default: 5, step: 1, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'high'
  ),

  createShader(
    'cos-pulsar', 'Pulsar', 'cosmic', 'Rotating pulsar with lighthouse beams',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 2.0;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float beam1 = pow(max(0.0, cos(angle - t)), 32.0);
  float beam2 = pow(max(0.0, cos(angle - t + 3.14159)), 32.0);
  float core = exp(-dist * 20.0);
  vec3 col = vec3((beam1 + beam2) * exp(-dist * 3.0) * 0.8, (beam1 + beam2) * exp(-dist * 3.0) * 0.6, (beam1 + beam2) * exp(-dist * 3.0) * 1.0);
  col += core * vec3(1.0, 0.9, 0.8);
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Rotation Speed', min: 0.5, max: 5, default: 2, step: 0.1, group: 'animation' },
     { id: 'beamWidth', label: 'Beam Width', min: 8, max: 64, default: 32, step: 4, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'cos-web', 'Cosmic Web', 'cosmic', 'Large-scale structure of the universe',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.03;
  float web = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 offset = vec2(sin(t + fi * 0.785) * 0.5, cos(t * 0.7 + fi * 0.785) * 0.5);
    float d = length(uv - offset);
    web += exp(-d * 2.0) * 0.5;
  }
  web = min(web, 1.0);
  web *= 0.7 + 0.3 * uBass;
  vec3 col = vec3(web * 0.1, web * 0.3, web * 0.6);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'nodes', label: 'Nodes', min: 4, max: 12, default: 8, step: 1, group: 'structure' },
     { id: 'connections', label: 'Connections', min: 0.5, max: 3, default: 1, step: 0.1, group: 'detail' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'high'
  ),

  createShader(
    'cos-event-horizon', 'Event Horizon', 'cosmic', 'Black hole event horizon with accretion disk',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float disk = smoothstep(0.3, 0.25, dist) - smoothstep(0.15, 0.1, dist);
  float spiral = sin(angle * 3.0 - dist * 10.0 + t * 5.0) * 0.5 + 0.5;
  disk *= spiral;
  float horizon = smoothstep(0.09, 0.1, dist);
  float lensing = 1.0 / (1.0 + dist * 5.0);
  vec3 col = vec3(disk * 0.8 + horizon, disk * 0.4 + horizon, disk * 0.2 + horizon);
  col *= lensing;
  col += vec3(0.05, 0.02, 0.1) * (1.0 - horizon);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'diskSize', label: 'Disk Size', min: 0.1, max: 0.5, default: 0.3, step: 0.01, group: 'shape' },
     { id: 'spin', label: 'Spin', min: 0.1, max: 2, default: 0.5, step: 0.1, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'cos-neutron', 'Neutron Star', 'cosmic', 'Dense neutron star with magnetic field lines',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 1.5;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float field = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float fieldAngle = fi * 1.047 + t;
    float d = abs(sin(angle - fieldAngle) * dist);
    field += exp(-d * 5.0) * exp(-dist * 2.0);
  }
  float core = exp(-dist * 15.0);
  vec3 col = vec3(field * 0.5, field * 0.7, field + core);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'fieldLines', label: 'Field Lines', min: 3, max: 12, default: 6, step: 1, group: 'shape' },
     { id: 'intensity', label: 'Intensity', min: 0.5, max: 2, default: 1, step: 0.1, group: 'color' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'cos-comet', 'Comet', 'cosmic', 'Comet with ion tail and dust trail',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  vec2 cometPos = vec2(sin(t * 0.3) * 0.5, cos(t * 0.2) * 0.3);
  vec2 toComet = uv - cometPos;
  float dist = length(toComet);
  float angle = atan(toComet.y, toComet.x);
  float ionTail = exp(-abs(sin(angle)) * 5.0) * exp(-dist * 1.5);
  float dustTrail = exp(-abs(sin(angle + 0.5)) * 3.0) * exp(-dist * 1.0) * 0.5;
  float nucleus = exp(-dist * 20.0);
  vec3 col = vec3(nucleus + ionTail * 0.2, nucleus * 0.8 + ionTail * 0.5, nucleus * 0.6 + dustTrail * 0.8);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'tailLength', label: 'Tail Length', min: 0.5, max: 3, default: 1.5, step: 0.1, group: 'shape' },
     { id: 'speed', label: 'Speed', min: 0.1, max: 1, default: 0.5, step: 0.05, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'cos-constellation', 'Constellation', 'cosmic', 'Star constellation with connecting lines',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    vec2 star = vec2(fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0, fract(cos(fi * 311.7) * 43758.5453) * 2.0 - 1.0);
    float brightness = fract(sin(fi * 43.5) * 43758.5453);
    float twinkle = sin(t * (1.0 + brightness) + fi) * 0.3 + 0.7;
    float d = length(uv - star);
    col += exp(-d * 50.0) * twinkle * brightness * (0.7 + 0.3 * uBass);
  }
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'starCount', label: 'Star Count', min: 10, max: 50, default: 20, step: 1, group: 'shape' },
     { id: 'twinkle', label: 'Twinkle', min: 0, max: 1, default: 0.5, step: 0.1, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'cos-dark-energy', 'Dark Energy', 'cosmic', 'Accelerating expansion of the universe',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float expansion = 1.0 + t * 0.2;
  vec2 expanded = uv * expansion;
  float density = 0.0;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    vec2 offset = vec2(sin(t * 0.5 + fi * 0.628) * 0.3, cos(t * 0.4 + fi * 0.628) * 0.3);
    float d = length(expanded - offset);
    density += exp(-d * 3.0);
  }
  density = min(density, 1.0);
  vec3 col = vec3(density * 0.1, density * 0.05, density * 0.3);
  col *= 1.0 / expansion;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'expansionRate', label: 'Expansion Rate', min: 0.05, max: 0.5, default: 0.2, step: 0.01, group: 'cosmology' },
     { id: 'filaments', label: 'Filaments', min: 5, max: 20, default: 10, step: 1, group: 'structure' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'high'
  ),

  createShader(
    'cos-stardust', 'Stardust', 'cosmic', 'Interstellar dust clouds with emission nebula',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.05;
  vec2 q = vec2(sin(uv.x * 2.0 + t) * cos(uv.y * 1.5 + t * 0.7), cos(uv.x * 1.8 + t * 0.8) * sin(uv.y * 2.2 + t * 0.5));
  float dust = sin(uv.x * 3.0 + q.x * 2.0) * cos(uv.y * 3.0 + q.y * 2.0);
  dust = dust * 0.5 + 0.5;
  dust = pow(dust, 2.0);
  float emission = pow(dust, 4.0) * 0.5;
  vec3 col = vec3(dust * 0.1 + emission * 0.8, dust * 0.05 + emission * 0.3, dust * 0.15 + emission * 0.5);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'density', label: 'Density', min: 0.5, max: 3, default: 1, step: 0.1, group: 'structure' },
     { id: 'emission', label: 'Emission', min: 0, max: 1, default: 0.5, step: 0.1, group: 'color' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.3, curve: 'log' }, { signal: 'mid', param: 'brightness', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'distortion', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  // ── SYNTHWAVE SHADERS ──

  createShader(
    'syn-grid-runner', 'Grid Runner', 'synthwave', 'Retro synthwave infinite grid',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 2.0;
  uv.y += 0.3;
  vec2 grid = vec2(uv.x / (uv.y + 0.5), 1.0 / (uv.y + 0.5));
  float lineX = smoothstep(0.02, 0.0, abs(fract(grid.x * 5.0) - 0.5));
  float lineY = smoothstep(0.02, 0.0, abs(fract(grid.y + t) - 0.5));
  float gridPattern = lineX + lineY;
  float horizon = exp(-uv.y * 3.0);
  vec3 col = vec3(gridPattern * horizon * 0.8, gridPattern * horizon * 0.2, gridPattern * horizon * 0.9);
  col += vec3(0.1, 0.0, 0.2) * (1.0 - horizon);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Speed', min: 0.5, max: 5, default: 2, step: 0.1, group: 'animation' },
     { id: 'density', label: 'Density', min: 3, max: 15, default: 5, step: 1, group: 'shape' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'syn-chrome', 'Chrome Text', 'synthwave', 'Chrome metallic text effect',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float chrome = sin(uv.y * 30.0 + t) * 0.5 + 0.5;
  chrome = pow(chrome, 0.3);
  float reflection = sin(uv.x * 20.0 + t * 0.3) * 0.5 + 0.5;
  vec3 col = vec3(chrome * 0.8 + reflection * 0.2, chrome * 0.7 + reflection * 0.3, chrome * 0.9 + reflection * 0.1);
  col *= 1.0 + uBeat * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'smoothness', label: 'Smoothness', min: 0, max: 1, default: 0.8, step: 0.1, group: 'material' },
     { id: 'reflection', label: 'Reflection', min: 0, max: 1, default: 0.5, step: 0.1, group: 'detail' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'syn-palms', 'Neon Palms', 'synthwave', 'Synthwave palm tree silhouettes',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float sky = uv.y * 0.5 + 0.5;
  sky = pow(sky, 0.5);
  vec3 col = vec3(sky * 0.2, sky * 0.05, sky * 0.3);
  float sun = smoothstep(0.3, 0.29, length(uv - vec2(0.0, 0.3)));
  col += sun * vec3(1.0, 0.3, 0.5);
  float palm = smoothstep(0.02, 0.0, abs(uv.x - sin(uv.y * 5.0 + t) * 0.1 - 0.5));
  palm *= step(uv.y, 0.0);
  col = mix(col, vec3(0.0), palm);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'sunSize', label: 'Sun Size', min: 0.1, max: 0.5, default: 0.3, step: 0.01, group: 'shape' },
     { id: 'palmCount', label: 'Palm Count', min: 1, max: 5, default: 2, step: 1, group: 'shape' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'syn-sunset', 'Sunset', 'synthwave', 'Retro sunset gradient with scanlines',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float gradient = uv.y * 0.5 + 0.5;
  vec3 col = vec3(gradient * 0.8 + 0.2, gradient * 0.3 + 0.1, gradient * 0.5 + 0.3);
  float sun = smoothstep(0.35, 0.34, length(uv - vec2(0.0, 0.1)));
  col += sun * vec3(1.0, 0.5, 0.3);
  float scanline = sin(uv.y * 100.0) * 0.03;
  col -= scanline;
  col *= 1.0 + uBeat * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'scanlines', label: 'Scanlines', min: 0, max: 0.1, default: 0.03, step: 0.01, group: 'crt' },
     { id: 'warmth', label: 'Warmth', min: 0.5, max: 2, default: 1, step: 0.1, group: 'color' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'syn-cassette', 'Cassette', 'synthwave', 'Retro cassette tape animation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 2.0;
  float tape = smoothstep(0.3, 0.29, length(uv - vec2(-0.15, 0.0)));
  tape += smoothstep(0.3, 0.29, length(uv - vec2(0.15, 0.0)));
  float reel = smoothstep(0.1, 0.09, length(uv - vec2(-0.15, 0.0)));
  reel += smoothstep(0.1, 0.09, length(uv - vec2(0.15, 0.0)));
  float spin = sin(atan(uv.y, uv.x + 0.15) * 3.0 + t) * 0.5 + 0.5;
  vec3 col = vec3(tape * 0.3, tape * 0.3, tape * 0.3);
  col += reel * spin * vec3(0.5, 0.3, 0.2);
  col += smoothstep(0.5, 0.49, abs(uv.y)) * 0.1;
  col *= 0.7 + 0.3 * uBeat;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Reel Speed', min: 0.5, max: 4, default: 2, step: 0.1, group: 'animation' },
     { id: 'glow', label: 'Glow', min: 0, max: 1, default: 0.5, step: 0.1, group: 'color' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'syn-laser', 'Laser Grid', 'synthwave', 'Synthwave laser grid floor',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 2.0;
  uv.y += 0.3;
  if (uv.y < 0.0) {
    vec2 grid = vec2(uv.x / (-uv.y + 0.1), t / (-uv.y + 0.1));
    float lineX = smoothstep(0.05, 0.0, abs(fract(grid.x * 2.0) - 0.5));
    float lineY = smoothstep(0.05, 0.0, abs(fract(grid.y * 0.5) - 0.5));
    float gridPattern = lineX + lineY;
    float fade = exp(uv.y * 3.0);
    vec3 col = vec3(gridPattern * fade * 0.9, gridPattern * fade * 0.1, gridPattern * fade * 0.8);
    col *= 0.7 + 0.3 * uBass;
    fragColor = vec4(col, 1.0);
  } else {
    vec3 col = vec3(0.05, 0.0, 0.1);
    fragColor = vec4(col, 1.0);
  }
}`,
    [{ id: 'speed', label: 'Speed', min: 0.5, max: 5, default: 2, step: 0.1, group: 'animation' },
     { id: 'perspective', label: 'Perspective', min: 0.05, max: 0.3, default: 0.1, step: 0.01, group: 'transform' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'syn-vhs', 'VHS Glitch', 'synthwave', 'VHS tape distortion with tracking errors',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float glitch = step(0.98, fract(sin(floor(uv.y * 20.0) * 127.1) * 43758.5453));
  float offset = glitch * sin(t * 100.0) * 0.05;
  vec2 distortedUv = uv + vec2(offset, 0.0);
  float scanline = sin(uv.y * 200.0) * 0.02;
  vec3 col = vec3(sin(distortedUv.x * 10.0 + t) * 0.5 + 0.5, sin(distortedUv.x * 10.0 + t + 2.094) * 0.5 + 0.5, sin(distortedUv.x * 10.0 + t + 4.188) * 0.5 + 0.5);
  col -= scanline;
  col += filmGrain * fract(sin(dot(uv * t, vec2(12.9898, 78.233))) * 43758.5453);
  col *= 1.0 + glitch * 0.5;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'tracking', label: 'Tracking', min: 0, max: 1, default: 0.5, step: 0.1, group: 'glitch' },
     { id: 'filmGrain', label: 'Noise Grain', min: 0, max: 0.2, default: 0.05, step: 0.01, group: 'glitch' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'syn-outrun', 'Outrun', 'synthwave', 'Retrowave car dashboard view',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float dashboard = smoothstep(0.3, 0.29, uv.y);
  vec3 col = vec3(0.0);
  col += dashboard * vec3(0.1, 0.0, 0.2);
  float speed = sin(uv.x * 20.0 + t * 10.0) * 0.5 + 0.5;
  speed *= exp(-abs(uv.x) * 3.0);
  col += speed * vec3(0.0, 1.0, 0.8) * 0.3;
  float horizon = smoothstep(0.3, 0.31, uv.y);
  col += horizon * vec3(0.3, 0.0, 0.5);
  float sun = smoothstep(0.15, 0.14, length(uv - vec2(0.0, 0.5)));
  col += sun * vec3(1.0, 0.3, 0.5) * 0.5;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Speed', min: 5, max: 30, default: 10, step: 1, group: 'animation' },
     { id: 'glow', label: 'Glow', min: 0, max: 1, default: 0.5, step: 0.1, group: 'color' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'syn-neon-sign', 'Neon Sign', 'synthwave', 'Glowing neon sign with flicker',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float flicker = 1.0 - step(0.95, fract(sin(floor(t * 10.0) * 127.1) * 43758.5453)) * 0.3;
  float glow = sin(uv.x * 10.0 + t) * 0.5 + 0.5;
  glow *= exp(-abs(uv.y) * 3.0);
  float core = smoothstep(0.02, 0.0, abs(uv.y)) * glow;
  vec3 col = vec3(glow * 0.8 * flicker, glow * 0.2 * flicker, glow * 0.9 * flicker);
  col += core * vec3(1.0, 0.5, 1.0) * 0.5;
  col *= 0.7 + 0.3 * uBeat;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'flicker', label: 'Flicker', min: 0, max: 1, default: 0.5, step: 0.1, group: 'animation' },
     { id: 'glow', label: 'Glow', min: 0.5, max: 2, default: 1, step: 0.1, group: 'color' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'syn-chrome-sphere', 'Chrome Sphere', 'synthwave', 'Reflective chrome sphere with environment',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float dist = length(uv);
  float sphere = smoothstep(0.5, 0.49, dist);
  vec3 normal = normalize(vec3(uv, sqrt(max(0.0, 1.0 - dist * dist))));
  float t = uTime * 0.3;
  float env = sin(normal.x * 5.0 + t) * sin(normal.y * 5.0 + t * 0.7);
  env = env * 0.5 + 0.5;
  vec3 col = vec3(env * 0.8 + 0.2);
  col *= sphere;
  col += exp(-dist * 2.0) * 0.1;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'smoothness', label: 'Smoothness', min: 0, max: 1, default: 0.9, step: 0.1, group: 'material' },
     { id: 'environment', label: 'Environment', min: 1, max: 10, default: 5, step: 1, group: 'detail' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'syn-80s-tv', '80s TV', 'synthwave', 'Retro 80s television static and test pattern',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float bars = step(0.5, fract(uv.y * 10.0));
  vec3 col = vec3(filmGrain * fract(sin(dot(uv * t, vec2(12.9898, 78.233))) * 43758.5453));
  col += bars * vec3(step(0.8, fract(uv.x * 7.0 + t)), step(0.6, fract(uv.x * 7.0 + t + 0.2)), step(0.4, fract(uv.x * 7.0 + t + 0.4))) * 0.5;
  col *= 1.0 + uBeat * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'filmGrain', label: 'Noise Grain', min: 0, max: 0.5, default: 0.3, step: 0.05, group: 'glitch' },
     { id: 'pattern', label: 'Pattern', min: 0, max: 1, default: 0.5, step: 0.1, group: 'detail' }],
    {}, [{ signal: 'beat', param: 'scale', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'distortion', amount: 0.3, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  // ── ABSTRACT SHADERS ──

  createShader(
    'abs-moire', 'Moiré', 'abstract', 'Interference moiré pattern with rotation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float angle = t * 0.1;
  vec2 rotUv = vec2(uv.x * cos(angle) - uv.y * sin(angle), uv.x * sin(angle) + uv.y * cos(angle));
  float f1 = sin(rotUv.x * 30.0) * sin(rotUv.y * 30.0);
  float f2 = sin(uv.x * 30.0) * sin(uv.y * 30.0);
  float moire = f1 * f2;
  moire = moire * 0.5 + 0.5;
  vec3 col = vec3(moire * 0.8, moire * 0.6, moire * 0.9);
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'frequency', label: 'Frequency', min: 10, max: 50, default: 30, step: 1, group: 'shape' },
     { id: 'rotation', label: 'Rotation', min: 0, max: 1, default: 0.1, step: 0.01, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'abs-opart', 'Op Art', 'abstract', 'Optical art illusion with moving patterns',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float pattern = sin(uv.x * 20.0 + sin(uv.y * 10.0 + t) * 3.0);
  pattern *= cos(uv.y * 20.0 + cos(uv.x * 10.0 + t) * 3.0);
  pattern = pattern * 0.5 + 0.5;
  float circle = sin(length(uv) * 30.0 - t * 5.0) * 0.5 + 0.5;
  float combined = pattern * circle;
  vec3 col = vec3(combined);
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'frequency', label: 'Frequency', min: 10, max: 40, default: 20, step: 1, group: 'shape' },
     { id: 'distortion', label: 'Distortion', min: 0, max: 5, default: 3, step: 0.1, group: 'distortion' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'abs-glitch-art', 'Glitch Art', 'abstract', 'Abstract glitch art with data corruption',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float block = floor(uv.x * 10.0);
  float rnd = fract(sin(block * 127.1 + floor(t * 5.0)) * 43758.5453);
  float offset = rnd * 0.2 * step(0.8, rnd);
  vec2 corruptedUv = uv + vec2(offset, 0.0);
  float pattern = sin(corruptedUv.x * 30.0) * cos(corruptedUv.y * 30.0);
  pattern = pattern * 0.5 + 0.5;
  vec3 col = vec3(pattern * (1.0 - offset * 2.0), pattern * 0.5, pattern * (1.0 + offset));
  col *= 1.0 + uBeat * 0.5;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'corruption', label: 'Corruption', min: 0, max: 1, default: 0.5, step: 0.1, group: 'glitch' },
     { id: 'blockSize', label: 'Block Size', min: 5, max: 20, default: 10, step: 1, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'abs-smoke', 'Abstract Smoke', 'abstract', 'Wispy abstract smoke tendrils',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  vec2 q = vec2(sin(uv.x * 2.0 + t) * cos(uv.y * 1.5 + t * 0.7), cos(uv.x * 1.8 + t * 0.8) * sin(uv.y * 2.2 + t * 0.5));
  float smoke = 0.0;
  smoke += sin(uv.x * 3.0 + q.x * 2.0) * 0.5 + 0.5;
  smoke *= cos(uv.y * 3.0 + q.y * 2.0) * 0.5 + 0.5;
  smoke = pow(smoke, 0.5);
  vec3 col = vec3(smoke * 0.6, smoke * 0.5, smoke * 0.7);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'density', label: 'Density', min: 0.5, max: 3, default: 1, step: 0.1, group: 'structure' },
     { id: 'flow', label: 'Flow', min: 0.05, max: 0.3, default: 0.1, step: 0.01, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'abs-geode', 'Geode', 'abstract', 'Cross-section of a crystal geode',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float dist = length(uv);
  float layers = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float radius = 0.1 + fi * 0.05;
    float thickness = 0.02;
    layers += smoothstep(thickness, 0.0, abs(dist - radius));
  }
  float crystal = sin(atan(uv.y, uv.x) * 12.0 + dist * 10.0) * 0.5 + 0.5;
  crystal *= layers;
  vec3 col = vec3(crystal * 0.6, crystal * 0.4, crystal * 0.8);
  col *= 1.0 + uMid * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'layers', label: 'Layers', min: 4, max: 15, default: 8, step: 1, group: 'shape' },
     { id: 'crystal', label: 'Crystal Detail', min: 4, max: 20, default: 12, step: 1, group: 'detail' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'abs-topographic', 'Topographic', 'abstract', 'Topographic map contour lines',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.05;
  float elevation = sin(uv.x * 3.0 + sin(uv.y * 2.0 + t) * 2.0) * 0.5 + 0.5;
  elevation *= cos(uv.y * 3.0 + cos(uv.x * 2.0 + t) * 2.0) * 0.5 + 0.5;
  float contour = sin(elevation * 30.0) * 0.5 + 0.5;
  contour = smoothstep(0.4, 0.5, contour);
  vec3 col = vec3(contour * 0.3, contour * 0.6, contour * 0.2);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'contours', label: 'Contour Density', min: 10, max: 40, default: 30, step: 1, group: 'detail' },
     { id: 'elevation', label: 'Elevation', min: 1, max: 5, default: 3, step: 0.1, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'abs-crystallize', 'Crystallize', 'abstract', 'Crystallization pattern growth',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float crystal = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float angle = fi * 1.047;
    vec2 dir = vec2(cos(angle), sin(angle));
    float d = abs(dot(uv, vec2(-dir.y, dir.x)));
    crystal += smoothstep(0.1, 0.0, d - t * 0.1 * (1.0 + fi * 0.1));
  }
  crystal = min(crystal, 1.0);
  vec3 col = vec3(crystal * 0.7, crystal * 0.8, crystal * 1.0);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'branches', label: 'Branches', min: 3, max: 12, default: 6, step: 1, group: 'shape' },
     { id: 'growth', label: 'Growth', min: 0.05, max: 0.3, default: 0.1, step: 0.01, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  createShader(
    'abs-halftone', 'Halftone', 'abstract', 'Dot halftone pattern with variable size',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  vec2 grid = uv * 20.0;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float brightness = sin(uv.x * 5.0 + t) * cos(uv.y * 5.0 + t * 0.7) * 0.5 + 0.5;
  float dotSize = brightness * 0.4;
  float d = length(local);
  float dotV = smoothstep(dotSize, dotSize - 0.05, d);
  vec3 col = vec3(dotV * 0.8);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'gridSize', label: 'Grid Size', min: 10, max: 40, default: 20, step: 1, group: 'shape' },
     { id: 'contrast', label: 'Contrast', min: 0.5, max: 2, default: 1, step: 0.1, group: 'color' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'low'
  ),

  createShader(
    'abs-liquid-chrome', 'Liquid Chrome', 'abstract', 'Flowing liquid chrome with reflections',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  vec2 q = vec2(sin(uv.x * 3.0 + t) * cos(uv.y * 2.0 + t * 0.7), cos(uv.x * 2.5 + t * 0.8) * sin(uv.y * 3.5 + t * 0.5));
  float chrome = sin(uv.x * 10.0 + q.x * 5.0) * cos(uv.y * 10.0 + q.y * 5.0);
  chrome = chrome * 0.5 + 0.5;
  chrome = pow(chrome, 0.3);
  float reflection = sin(q.x * 20.0 + q.y * 20.0) * 0.5 + 0.5;
  vec3 col = vec3(chrome * 0.8 + reflection * 0.2, chrome * 0.7 + reflection * 0.3, chrome * 0.9 + reflection * 0.1);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'smoothness', label: 'Smoothness', min: 0, max: 1, default: 0.8, step: 0.1, group: 'material' },
     { id: 'distortion', label: 'Distortion', min: 0, max: 5, default: 2, step: 0.1, group: 'distortion' }],
    {}, [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }], 'medium'
  ),

  // ── PARTICLE SHADERS ──

  createShader(
    'part-fireflies', 'Fireflies', 'particle', 'Glowing particles with soft trails',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    vec2 pos = vec2(sin(t * 0.3 + fi * 1.234) * 0.8, cos(t * 0.2 + fi * 2.345) * 0.6);
    float brightness = sin(t * 2.0 + fi * 3.456) * 0.5 + 0.5;
    float d = length(uv - pos);
    col += exp(-d * 10.0) * brightness * vec3(0.8, 1.0, 0.4);
  }
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'count', label: 'Count', min: 10, max: 60, default: 30, step: 1, group: 'particle' },
     { id: 'glow', label: 'Glow', min: 5, max: 20, default: 10, step: 1, group: 'material' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'part-rain', 'Rain', 'particle', 'Falling rain drops with splashes',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 3.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float speed = 0.5 + fract(sin(fi * 311.7) * 43758.5453) * 0.5;
    float y = fract(t * speed + fi * 0.1) * 2.0 - 1.0;
    float drop = smoothstep(0.02, 0.0, abs(uv.x - x)) * smoothstep(0.05, 0.0, abs(uv.y - y));
    col += drop * vec3(0.4, 0.6, 0.9) * 0.5;
  }
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'count', label: 'Count', min: 20, max: 80, default: 40, step: 1, group: 'particle' },
     { id: 'speed', label: 'Speed', min: 1, max: 5, default: 3, step: 0.5, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'part-snow', 'Snow', 'particle', 'Gentle snowfall with wind drift',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 50; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float size = 0.01 + fract(sin(fi * 311.7) * 43758.5453) * 0.02;
    float spd = 0.2 + fract(sin(fi * 543.2) * 43758.5453) * 0.3;
    float drift = sin(t * 0.5 + fi * 0.1) * 0.3 + uBass * 0.1;
    float y = fract(t * spd + fi * 0.05) * 2.0 - 1.0;
    float d = length(uv - vec2(x + drift, y));
    col += exp(-d / size * 10.0) * vec3(0.9, 0.95, 1.0) * 0.3;
  }
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'count', label: 'Count', min: 20, max: 100, default: 50, step: 1, group: 'particle' },
     { id: 'wind', label: 'Wind', min: 0, max: 1, default: 0.3, step: 0.05, group: 'physics' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'part-confetti', 'Confetti', 'particle', 'Falling confetti pieces with rotation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float speed = 0.3 + fract(sin(fi * 311.7) * 43758.5453) * 0.4;
    float y = fract(t * speed + fi * 0.1) * 2.0 - 1.0;
    float rot = t * (1.0 + fract(fi * 0.5)) + fi;
    float confetti = smoothstep(0.03, 0.0, abs(uv.x - x - sin(rot) * 0.1)) * smoothstep(0.02, 0.0, abs(uv.y - y));
    vec3 c = vec3(sin(fi * 2.0) * 0.5 + 0.5, sin(fi * 2.0 + 2.094) * 0.5 + 0.5, sin(fi * 2.0 + 4.188) * 0.5 + 0.5);
    col += confetti * c;
  }
  col *= 1.0 + uBeat * 0.5;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'count', label: 'Count', min: 10, max: 60, default: 30, step: 1, group: 'particle' },
     { id: 'gravity', label: 'Gravity', min: 0.1, max: 1, default: 0.3, step: 0.05, group: 'physics' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'part-sparks', 'Sparks', 'particle', 'Flying sparks with motion blur',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 25; i++) {
    float fi = float(i);
    float angle = fract(sin(fi * 127.1) * 43758.5453) * 6.28;
    float speed = 0.5 + fract(sin(fi * 311.7) * 43758.5453) * 1.0;
    float life = fract(t * speed * 0.5 + fi * 0.2);
    vec2 dir = vec2(cos(angle), sin(angle));
    vec2 pos = dir * life * 0.8;
    float spark = exp(-life * 5.0) * smoothstep(0.03, 0.0, length(uv - pos));
    vec3 c = vec3(1.0, 0.8 - life * 0.5, 0.2 - life * 0.2);
    col += spark * c;
  }
  col *= 1.0 + uBeat * 0.6;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'count', label: 'Count', min: 10, max: 50, default: 25, step: 1, group: 'particle' },
     { id: 'speed', label: 'Speed', min: 0.2, max: 2, default: 1, step: 0.1, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'part-magnetic', 'Magnetic', 'particle', 'Particles following magnetic field lines',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    float angle = fi * 2.399 + t * 0.3;
    float r = 0.2 + sin(fi * 0.5 + t) * 0.1;
    vec2 pos = vec2(cos(angle) * r, sin(angle) * r);
    float field = sin(atan(uv.y - pos.y, uv.x - pos.x) * 3.0 + t) * 0.5 + 0.5;
    float d = length(uv - pos);
    col += exp(-d * 8.0) * field * vec3(0.5, 0.8, 1.0) * 0.3;
  }
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'particles', label: 'Particles', min: 10, max: 60, default: 30, step: 1, group: 'particle' },
     { id: 'field', label: 'Field Strength', min: 1, max: 5, default: 3, step: 0.5, group: 'physics' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'high'
  ),

  createShader(
    'part-meteor', 'Meteor Shower', 'particle', 'Meteors streaking across the sky',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 15; i++) {
    float fi = float(i);
    float startT = fract(fi * 0.137) * 5.0;
    float life = mod(t - startT, 5.0) / 5.0;
    vec2 dir = normalize(vec2(-0.7, -0.3));
    vec2 start = vec2(fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0, 1.0);
    vec2 pos = start + dir * life * 2.0;
    float trail = smoothstep(0.1, 0.0, length(uv - pos)) * exp(-life * 3.0);
    vec3 c = mix(vec3(1.0, 0.9, 0.7), vec3(0.3, 0.5, 1.0), life);
    col += trail * c;
  }
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'count', label: 'Count', min: 5, max: 30, default: 15, step: 1, group: 'particle' },
     { id: 'speed', label: 'Speed', min: 0.5, max: 3, default: 1, step: 0.1, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'part-bubble', 'Bubbles', 'particle', 'Rising soap bubbles with iridescence',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float speed = 0.2 + fract(sin(fi * 311.7) * 43758.5453) * 0.3;
    float y = fract(t * speed + fi * 0.1) * 2.0 - 1.0;
    float size = 0.05 + fract(sin(fi * 543.2) * 43758.5453) * 0.05;
    float d = length(uv - vec2(x, y));
    float bubble = smoothstep(size, size - 0.01, d) - smoothstep(size - 0.01, size - 0.02, d);
    float iridescent = sin(d * 50.0 + t * 2.0) * 0.5 + 0.5;
    vec3 c = vec3(iridescent * 0.5 + 0.5, iridescent * 0.3 + 0.7, 1.0) * bubble;
    col += c * 0.5;
  }
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'count', label: 'Count', min: 5, max: 40, default: 20, step: 1, group: 'particle' },
     { id: 'iridescence', label: 'Iridescence', min: 0, max: 2, default: 1, step: 0.1, group: 'color' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  createShader(
    'part-aurora-particles', 'Aurora Particles', 'particle', 'Particles dancing in aurora borealis',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float baseY = fract(sin(fi * 311.7) * 43758.5453) * 0.5;
    float y = baseY + sin(x * 3.0 + t + fi * 0.5) * 0.3;
    float brightness = sin(t * 2.0 + fi * 1.234) * 0.5 + 0.5;
    float d = length(uv - vec2(x, y));
    vec3 c = mix(vec3(0.1, 0.8, 0.4), vec3(0.2, 0.4, 0.9), sin(fi * 0.5) * 0.5 + 0.5);
    col += exp(-d * 12.0) * brightness * c * 0.3;
  }
  col *= 1.0 + uMid * 0.3;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'count', label: 'Count', min: 20, max: 80, default: 40, step: 1, group: 'particle' },
     { id: 'wave', label: 'Wave Amplitude', min: 0.1, max: 0.6, default: 0.3, step: 0.05, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }], 'medium'
  ),

  // ── MINIMAL SHADERS ──

  createShader(
    'min-pulse', 'Pulse', 'minimal', 'Gentle breathing pulse circle',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float pulse = sin(t) * 0.5 + 0.5 + uBeat * 0.3;
  float d = length(uv);
  float circle = smoothstep(0.3 + pulse * 0.1, 0.29 + pulse * 0.1, d);
  float ring = smoothstep(0.01, 0.0, abs(d - 0.3 - pulse * 0.1));
  vec3 col = vec3(circle * 0.1 + ring * 0.3);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Speed', min: 0.1, max: 2, default: 0.5, step: 0.1, group: 'animation' },
     { id: 'size', label: 'Size', min: 0.1, max: 0.5, default: 0.3, step: 0.01, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-aurora', 'Aurora', 'minimal', 'Soft minimal aurora gradient',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float aurora = sin(uv.y * 3.0 + sin(uv.x * 2.0 + t) * 2.0) * 0.5 + 0.5;
  aurora = pow(aurora, 0.5);
  vec3 col = vec3(aurora * 0.1, aurora * 0.4, aurora * 0.3);
  col *= 1.0 - length(uv) * 0.3;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'flow', label: 'Flow', min: 0.05, max: 0.3, default: 0.1, step: 0.01, group: 'animation' },
     { id: 'brightness', label: 'Brightness', min: 0.2, max: 1, default: 0.5, step: 0.1, group: 'color' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-dot', 'Dot Grid', 'minimal', 'Minimal dot grid pattern',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 grid = uv * 10.0;
  vec2 local = fract(grid) - 0.5;
  float d = length(local);
  float dotV = smoothstep(0.15, 0.1, d);
  float alpha = 1.0 - length(uv) * 0.5;
  vec3 col = vec3(dotV * 0.2 * alpha * (0.7 + 0.3 * uBeat));
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'density', label: 'Density', min: 5, max: 20, default: 10, step: 1, group: 'shape' },
     { id: 'dotSize', label: 'Dot Size', min: 0.05, max: 0.25, default: 0.15, step: 0.01, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-horizon', 'Horizon', 'minimal', 'Minimal horizon line with gradient sky',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float horizon = smoothstep(0.01, 0.0, abs(uv.y));
  float sky = max(0.0, uv.y) * 0.15;
  float ground = max(0.0, -uv.y) * 0.05;
  vec3 col = vec3(sky + ground + horizon * (0.4 + 0.2 * uBeat));
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'skyColor', label: 'Sky Brightness', min: 0.05, max: 0.3, default: 0.15, step: 0.01, group: 'color' },
     { id: 'lineWidth', label: 'Line Width', min: 0.005, max: 0.05, default: 0.01, step: 0.005, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-gradient', 'Gradient', 'minimal', 'Smooth radial gradient with subtle animation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float d = length(uv);
  float gradient = exp(-d * 2.0);
  float shift = sin(t) * 0.05;
  vec2 offsetUv = uv + vec2(shift, shift * 0.5);
  float shifted = exp(-length(offsetUv) * 2.0);
  vec3 col = vec3(gradient * 0.15 + shifted * 0.05);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'spread', label: 'Spread', min: 0.5, max: 4, default: 2, step: 0.1, group: 'shape' },
     { id: 'animation', label: 'Animation', min: 0, max: 0.3, default: 0.1, step: 0.01, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-cross', 'Cross', 'minimal', 'Minimal animated crosshair',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float h = smoothstep(0.005, 0.0, abs(uv.y)) * smoothstep(0.3, 0.0, abs(uv.x));
  float v = smoothstep(0.005, 0.0, abs(uv.x)) * smoothstep(0.3, 0.0, abs(uv.y));
  float cross = h + v;
  float pulse = sin(t) * 0.3 + 0.7 + uBeat * 0.2;
  vec3 col = vec3(cross * 0.2 * pulse);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'size', label: 'Size', min: 0.1, max: 0.5, default: 0.3, step: 0.01, group: 'shape' },
     { id: 'thickness', label: 'Thickness', min: 0.001, max: 0.01, default: 0.005, step: 0.001, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-wave', 'Wave Line', 'minimal', 'Single oscillating wave line',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float wave = sin(uv.x * 6.28318 * 3.0 + t * 2.0) * (0.1 + uBass * 0.05);
  float line = smoothstep(0.005, 0.0, abs(uv.y - wave));
  float fade = smoothstep(1.0, 0.0, abs(uv.x));
  vec3 col = vec3(line * 0.2 * fade);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'frequency', label: 'Frequency', min: 1, max: 6, default: 3, step: 0.5, group: 'shape' },
     { id: 'amplitude', label: 'Amplitude', min: 0.02, max: 0.2, default: 0.1, step: 0.01, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-concentric', 'Concentric', 'minimal', 'Expanding concentric circles',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float d = length(uv);
  float rings = sin(d * 20.0 - t * 2.0) * 0.5 + 0.5;
  rings = smoothstep(0.4, 0.5, rings);
  float fade = exp(-d * 2.0);
  vec3 col = vec3(rings * 0.15 * fade * (0.7 + 0.3 * uBeat));
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'rings', label: 'Ring Count', min: 5, max: 25, default: 10, step: 1, group: 'shape' },
     { id: 'speed', label: 'Speed', min: 0.1, max: 2, default: 0.5, step: 0.1, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-rotate', 'Rotate', 'minimal', 'Slowly rotating minimal line',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float angle = t + uBass * 0.2;
  vec2 rotUv = vec2(uv.x * cos(angle) - uv.y * sin(angle), uv.x * sin(angle) + uv.y * cos(angle));
  float line = smoothstep(0.003, 0.0, abs(rotUv.x)) * smoothstep(lineLen, 0.0, abs(rotUv.y));
  float fade = 1.0 - length(uv) * 0.8;
  vec3 col = vec3(line * 0.2 * max(0.0, fade));
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Speed', min: 0.05, max: 1, default: 0.2, step: 0.05, group: 'animation' },
     { id: 'lineLen', label: 'Length', min: 0.2, max: 0.8, default: 0.5, step: 0.05, group: 'shape' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low',
    'uniform float lineLen;\n'
  ),

  createShader(
    'min-fade', 'Fade', 'minimal', 'Smooth fade in/out with minimal shape',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float fade = max(sin(t) * 0.5 + 0.5 + uBeat * 0.2, 0.30);
  float d = length(uv);
  float shape = smoothstep(0.2 + fade * 0.1, 0.19 + fade * 0.1, d);
  vec3 col = vec3(shape * 0.15 * fade + 0.015);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'speed', label: 'Speed', min: 0.1, max: 1, default: 0.3, step: 0.05, group: 'animation' },
     { id: 'brightness', label: 'Brightness', min: 0.05, max: 0.3, default: 0.15, step: 0.01, group: 'color' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-grid', 'Minimal Grid', 'minimal', 'Clean minimal grid with subtle animation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  vec2 grid = uv * 8.0;
  float lineX = smoothstep(0.02, 0.0, abs(fract(grid.x) - 0.5));
  float lineY = smoothstep(0.02, 0.0, abs(fract(grid.y) - 0.5));
  float lines = lineX + lineY;
  float fade = 1.0 - length(uv) * 0.6;
  float pulse = sin(t) * 0.1 + 0.9 + uBass * 0.1;
  vec3 col = vec3(lines * 0.1 * fade * pulse);
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'density', label: 'Density', min: 4, max: 16, default: 8, step: 1, group: 'shape' },
     { id: 'animation', label: 'Animation', min: 0, max: 0.5, default: 0.1, step: 0.05, group: 'animation' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  createShader(
    'min-dot-circle', 'Dot Circle', 'minimal', 'Ring of dots with minimal animation',
    [],
    `void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float d = length(uv);
  float ring = smoothstep(0.25, 0.24, abs(d - 0.3));
  float angle = atan(uv.y, uv.x);
  float dots = sin(angle * 12.0) * 0.5 + 0.5;
  dots = smoothstep(0.3, 0.7, dots);
  float shape = ring * dots;
  float fade = 1.0 - d * 0.5;
  vec3 col = vec3(shape * 0.15 * max(0.0, fade) * (0.7 + 0.3 * uBeat));
  fragColor = vec4(col, 1.0);
}`,
    [{ id: 'dotCount', label: 'Dot Count', min: 6, max: 24, default: 12, step: 1, group: 'shape' },
     { id: 'radius', label: 'Radius', min: 0.1, max: 0.5, default: 0.3, step: 0.01, group: 'transform' }],
    {}, [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }], 'low'
  ),

  // ── OPEN SOURCE ADAPTATIONS ──

  // IQ Domain Warping (Inigo Quilez, MIT)
  createShader(
    'oss-iq-warp', 'Domain Warp', 'abstract',
    'Double-warped FBM nebula by Inigo Quilez (MIT)',
    ['iq', 'warp', 'fbm', 'nebula', 'organic'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float t = uTime * 0.15 * speed;
      vec2 q = vec2(fbm(uv + t*0.1), fbm(uv + vec2(5.2,1.3) + t*0.12));
      vec2 r = vec2(fbm(uv + 4.0*q + vec2(1.7,9.2) + t*0.15), fbm(uv + 4.0*q + vec2(8.3,2.8) + t*0.18));
      float f = fbm(uv + 4.0*r);
      vec3 col = mix(vec3(0.1,0.2,0.4), vec3(0.8,0.3,0.1), clamp(f*f*4.0, 0.0, 1.0));
      col = mix(col, vec3(0.9,0.9,0.6), clamp(length(q), 0.0, 1.0));
      col = mix(col, vec3(0.1,0.3,0.5), clamp(length(r.x), 0.0, 1.0));
      f = f*f*f*(f*(f*6.0-15.0)+10.0);
      col *= f;
      col *= 0.5 + 0.5*cos(6.28*(f*0.5 + uTime*0.1 + vec3(0.0,0.1,0.2) + uBass*0.3));
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }],
    'medium'
  ),

  // Curl Noise Fluid (adapted from Shadertoy CC BY-NC-SA, procedural)
  createShader(
    'oss-curl-fluid', 'Curl Fluid', 'liquid',
    'Audio-reactive curl noise fluid simulation',
    ['fluid', 'curl', 'noise', 'organic', 'flow'],
    `
    vec2 curlNoise(vec2 p) {
      float e = 0.01;
      float n1 = noise(p + vec2(0.0, e));
      float n2 = noise(p - vec2(0.0, e));
      float a = (n1 - n2) / (2.0*e);
      n1 = noise(p + vec2(e, 0.0));
      n2 = noise(p - vec2(e, 0.0));
      float b = (n1 - n2) / (2.0*e);
      return vec2(a, -b);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float t = uTime * 0.3 * speed;
      vec2 p = uv * 2.0;
      vec2 q = vec2(0.0);
      for(int i = 0; i < 6; i++) {
        q += curlNoise(p + t*0.5 + float(i)*0.5) * 0.3 * (1.0 + uBass*0.5);
      }
      float f = fbm(p + q*2.0);
      vec3 col = 0.5 + 0.5*cos(6.28*(f*2.0 + vec3(0.0,0.1,0.2) + uTime*0.05));
      col *= 1.0 - 0.5*length(q);
      col *= intensity * (0.6 + 0.6*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }],
    'medium'
  ),

  // Kaleidoscope (adapted from GL Transitions, MIT)
  createShader(
    'oss-kaleidoscope', 'Kaleidoscope', 'geometric',
    'Audio-reactive kaleidoscope folding pattern',
    ['kaleidoscope', 'mirror', 'geometric', 'folding'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = uv;
      float t = uTime * speed * 0.5 + uBeat * 0.3;
      float angle = 3.14159 / (3.0 + uBass);
      for(int i = 0; i < 7; i++) {
        p = vec2(sin(t)*p.x + cos(t)*p.y, sin(t)*p.y - cos(t)*p.x);
        t += angle;
        p = abs(mod(p, 2.0) - 1.0);
      }
      float f = fbm(p*3.0 + uTime*0.1);
      vec3 col = 0.5 + 0.5*cos(6.28*(f + vec3(0.0,0.33,0.67) + uTime*0.05 + uBass*0.4));
      col *= intensity * (0.8 + 0.4*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'beat', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }],
    'medium'
  ),

  // Smooth Voronoi (Inigo Quilez, MIT)
  createShader(
    'oss-voronoi-pulse', 'Voronoi Pulse', 'geometric',
    'Audio-reactive smooth voronoi cells with pulse animation',
    ['voronoi', 'cells', 'geometric', 'pulse', 'iq'],
    `
    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }
    float voronoi(vec2 p) {
      vec2 n = floor(p);
      vec2 f = fract(p);
      float md = 8.0;
      for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j));
          vec2 o = hash2(n + g);
          o = 0.5 + 0.5*sin(uTime*0.3*speed + 6.2831*o);
          vec2 r = g + o - f;
          float d = dot(r, r);
          md = min(md, d);
        }
      }
      return sqrt(md);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float f = voronoi(uv * 4.0 * scale + uBass*0.5);
      vec3 col = vec3(0.0);
      col += 0.5 + 0.5*cos(6.28*(f*2.0 + vec3(0.0,0.33,0.67) + uTime*0.1*speed));
      col *= smoothstep(0.0, 0.1, f) * (1.0 - f);
      col *= intensity * (0.6 + 0.6*uBeat);
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'scale', label: 'Scale', min: 1, max: 8, default: 4, step: 0.5, group: 'shape' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }, { signal: 'beat', param: 'brightness', amount: 0.3, curve: 'linear' }],
    'medium'
  ),

  // Fractal Plasma Tunnel (plasmafractal-gl + Book of Shaders, MIT)
  createShader(
    'oss-plasma-tunnel', 'Plasma Tunnel', 'fractals',
    'Fractal plasma tunnel with FBM distortion and IQ cosine palette',
    ['tunnel', 'plasma', 'fractal', 'fbm', 'palette'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float angle = atan(uv.y, uv.x);
      float radius = length(uv);
      float tunnel = 1.0 / (radius + 0.01);
      float tunnelAngle = angle / 3.14159;
      float t = uTime * speed;
      float pattern = fbm(vec2(tunnelAngle*3.0 + t*0.2, tunnel + t*0.5));
      pattern += 0.5*fbm(vec2(angle*2.0 + t*0.1, radius*5.0 - t*0.3));
      vec3 col = palette(pattern + uBass*0.2, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,1.0,1.0), vec3(0.0,0.33,0.67));
      col *= 1.0 - radius*0.8;
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(max(col, vec3(0.0)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.2, curve: 'linear' }],
    'medium'
  ),

  ...GENERATED_REACTIVE,
  ...MILKDROP_PRESETS.map(md => {
    // Make MilkDrop presets fully tweakable + audio-reactive: expose the md*
    // adapter uniforms as real parameter sliders seeded from each preset's
    // defaults, and add the universal audio-mapping set.
    const mdParams: ShaderDefinition['params'] = [
      { id: 'mdZoom', label: 'Zoom', min: 0.2, max: 3, default: md.defaults.mdZoom ?? 1, step: 0.05, group: 'transform' },
      { id: 'mdRot', label: 'Rotate', min: -3, max: 3, default: md.defaults.mdRot ?? 0, step: 0.05, group: 'transform' },
      { id: 'mdDecay', label: 'Decay', min: 0, max: 1, default: md.defaults.mdDecay ?? 0.6, step: 0.05, group: 'audio' },
      { id: 'mdWarp', label: 'Warp', min: 0, max: 2, default: md.defaults.mdWarp ?? 0.5, step: 0.05, group: 'audio' },
      { id: 'mdGamma', label: 'Gamma', min: 0.5, max: 3, default: md.defaults.mdGamma ?? 1.4, step: 0.05, group: 'color' },
      { id: 'mdWaveMode', label: 'Wave Mode', min: 0, max: 6, default: md.defaults.mdWaveMode ?? 0, step: 1, group: 'shape' },
      { id: 'mdWaveAlpha', label: 'Wave Alpha', min: 0, max: 2, default: md.defaults.mdWaveAlpha ?? 1, step: 0.05, group: 'audio' },
      { id: 'mdWaveScale', label: 'Wave Scale', min: 0.2, max: 3, default: md.defaults.mdWaveScale ?? 1, step: 0.05, group: 'shape' },
      { id: 'mdWaveFreq', label: 'Wave Freq', min: 0.5, max: 12, default: md.defaults.mdWaveFreq ?? 4, step: 0.1, group: 'shape' },
      { id: 'mdObSize', label: 'Obj Size', min: 0.05, max: 1, default: md.defaults.mdObSize ?? 0.3, step: 0.01, group: 'shape' },
      { id: 'mdObAlpha', label: 'Obj Alpha', min: 0, max: 2, default: md.defaults.mdObAlpha ?? 0, step: 0.05, group: 'audio' },
      { id: 'mdIbSize', label: 'Inner Size', min: 0.05, max: 1, default: md.defaults.mdIbSize ?? 0.3, step: 0.01, group: 'shape' },
      { id: 'mdIbAlpha', label: 'Inner Alpha', min: 0, max: 2, default: md.defaults.mdIbAlpha ?? 0, step: 0.05, group: 'audio' },
    ]
    const universal: ShaderDefinition['params'] = [
      { id: 'speed', label: 'Speed', min: 0, max: 3, default: md.defaults.speed ?? 1, step: 0.1 },
      { id: 'intensity', label: 'Intensity', min: 0, max: 2, default: md.defaults.intensity ?? 1, step: 0.05 },
      { id: 'distortion', label: 'Distortion', min: 0, max: 2, default: md.defaults.distortion ?? 0, step: 0.05, group: 'audio' },
      { id: 'scale', label: 'Scale', min: 0.1, max: 3, default: md.defaults.scale ?? 1, step: 0.1, group: 'audio' },
      { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: md.defaults.brightness ?? 1, step: 0.05, group: 'audio' },
      { id: 'hueShift', label: 'Hue Shift', min: 0, max: 6.28, default: md.defaults.hueShift ?? 0, step: 0.05 },
      { id: 'saturation', label: 'Saturation', min: 0, max: 2, default: md.defaults.saturation ?? 1, step: 0.05 },
    ]
    return {
      ...md,
      params: [...universal, ...mdParams],
      defaults: {
        speed: 1, intensity: 1, distortion: 0, scale: 1, brightness: 1, hueShift: 0, saturation: 1,
        mdZoom: md.defaults.mdZoom ?? 1, mdRot: md.defaults.mdRot ?? 0, mdDecay: md.defaults.mdDecay ?? 0.6,
        mdWarp: md.defaults.mdWarp ?? 0.5, mdGamma: md.defaults.mdGamma ?? 1.4, mdWaveMode: md.defaults.mdWaveMode ?? 0,
        mdWaveAlpha: md.defaults.mdWaveAlpha ?? 1, mdWaveScale: md.defaults.mdWaveScale ?? 1,
        mdWaveFreq: md.defaults.mdWaveFreq ?? 4, mdObSize: md.defaults.mdObSize ?? 0.3,
        mdObAlpha: md.defaults.mdObAlpha ?? 0, mdIbSize: md.defaults.mdIbSize ?? 0.3,
        mdIbAlpha: md.defaults.mdIbAlpha ?? 0, ...md.defaults,
      },
      audioMappings: ([
        { signal: 'bass', param: 'mdZoom', amount: 0.30, curve: 'log' } as const,
        { signal: 'beat', param: 'intensity', amount: 0.35, curve: 'linear' } as const,
        { signal: 'mid', param: 'hueShift', amount: 0.30, curve: 'linear' } as const,
        { signal: 'treble', param: 'brightness', amount: 0.20, curve: 'linear' } as const,
        { signal: 'volume', param: 'brightness', amount: 0.25, curve: 'log' } as const,
      ]) as unknown as ShaderDefinition['audioMappings'],
    }
  }),
]

export function searchShaders(query: string): ShaderDefinition[] {
  const q = query.toLowerCase()
  return SHADER_LIBRARY.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.tags.some(t => t.includes(q)) ||
    s.category.includes(q)
  )
}
