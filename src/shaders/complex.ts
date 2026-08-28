// COMPLEX shader set (18 hero-tier entries) — structurally adapted from
// Phase-25 research (iq SDF raymarching, hg_sdf operators, kalis sets, domain
// warp, truchet, worley, gyroid, oscilloscope kaleido). All written from
// scratch for this engine's strict GLSL ES 3.00 prelude; every literal is a
// float literal and functions never rely on implicit int→float conversion.
import { createShader } from './factory'

export const COMPLEX_SHADERS = [
  createShader(
    'cx-raymarch-core', 'Core Breach', 'fractals',
    'Ray-marched SDF sphere field with fresnel glow, orbited by the beat',
    ['raymarch', 'sdf', 'sphere', '3d', 'glow'],
    `
    float sdS(vec3 q, float r) { return length(q) - r; }
    vec2 mapC(vec3 q) {
      float d0 = sdS(q - vec3(0.0, 0.0, uBeat*0.18), 0.85);
      float d1 = sdS(q - vec3(1.35, 0.4, uBass*0.3), 0.22);
      float d2 = sdS(q - vec3(-1.2, -0.5, 0.2), 0.16);
      return vec2(min(d0, min(d1, d2)), d0);
    }
    vec3 calcN(vec3 q) {
      vec2 e = vec2(0.002, 0.0);
      return normalize(vec3(
        mapC(q + e.xyy).x - mapC(q - e.xyy).x,
        mapC(q + e.yxy).x - mapC(q - e.yxy).x,
        mapC(q + e.yyx).x - mapC(q - e.yyx).x));
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      float zoom = 1.1 - 0.25 * uBass + 0.2 * sin(uTime * 0.3 * speed);
      vec3 ro = vec3(0.0, 0.0, -2.6 * zoom);
      vec3 rd = normalize(vec3(uv * 1.8, 1.4));
      float t0 = 0.0;
      float hit = 0.0;
      for (int i = 0; i < 48; i++) {
        vec3 pp = ro + rd * t0;
        float hh = mapC(pp).x;
        if (hh < 0.001) { hit = 1.0; break; }
        t0 += hh * 0.9;
      }
      vec3 col;
      if (hit > 0.5) {
        vec3 pp = ro + rd * t0;
        vec3 n = calcN(pp);
        float dif = max(dot(n, normalize(vec3(0.6, 0.8, 0.4))), 0.0);
        float fres = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
        col = vec3(0.05, 0.7, 0.9) * (dif * 1.2 + 0.15) + fres * pal(t0 * 0.4, 0.3) * (0.5 + 0.5*uBeat);
      } else {
        col = vec3(0.0, 0.02, 0.05) * t0;
        col += pal(rd.y * 1.5, 0.2) * exp(-t0 * 0.35) * 0.35 * uMid;
      }
      col *= intensity * (0.75 + 0.5*uBeat);
      col = max(col, vec3(0.01));
      fragColor = vec4(col, 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.3, curve: 'linear' }],
    'ultra'
  ),

  createShader(
    'cx-menger', 'Menger Fold', 'fractals',
    'Ray-marched Menger sponge with breathing fold scale on the beat',
    ['menger', 'raymarch', 'fold', 'fractal'],
    `
    float opRep(vec3 p, vec3 c) {
      vec3 q = p - c * clamp(round(p / c), vec3(-1.0), vec3(1.0));
      return length(q);
    }
    float mapM(vec3 q) {
      vec3 qq = q * (1.6 + 0.25*uBass);
      float s = 1.0;
      for (int i = 0; i < 5; i++) {
        qq = abs(qq);
        qq = vec3(qq.z, qq.x, qq.y);
        qq = abs(qq);
        if (qq.x > 1.0) qq.x = 2.0 - qq.x;
        if (qq.y > 1.0) qq.y = 2.0 - qq.y;
        s *= 2.7;
        qq = qq * 2.7 - 1.7;
      }
      return length(max(abs(qq) - vec3(0.42), vec3(0.0))) / s - 0.03;
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float halfW = uResolution.x / uResolution.y;
      vec3 ro = vec3(0.0, 0.0, -2.6 + uTreble * 0.35);
      vec3 rd = normalize(vec3(uv * vec2(halfW, 1.0) * 1.15, 1.0));
      float t0 = 0.0;
      float hit = 0.0;
      for (int i = 0; i < 40; i++) {
        float hh = mapM(ro + rd * t0);
        if (hh < 0.001) { hit = 1.0; break; }
        t0 += hh;
      }
      vec3 col = pal(t0 * 0.25 + uTime * 0.05 * speed, 0.1) * exp(-t0 * 0.09) * (0.4 + 0.8*uBeat);
      col += vec3(0.02, 0.0, 0.06) * smoothstep(6.0, 10.0, t0);
      col *= intensity * (0.8 + 0.5*uTreble);
      fragColor = vec4(max(col, vec3(0.005)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.6, curve: 'log' }, { signal: 'treble', param: 'distortion', amount: 0.25, curve: 'linear' }],
    'ultra'
  ),

  createShader(
    'cx-marble-orb', 'Marble Orb', 'abstract',
    'Ray-marched fbm-marbled sphere, camera dolly and marble flow on audio',
    ['raymarch', 'marble', 'fbm', 'sphere'],
    `
    vec2 mapOrb(vec3 q) {
      return vec2(length(q) - (1.0 + 0.12*uBass), 0.0);
    }
    vec3 calcNORB(vec3 q) {
      vec2 e = vec2(0.004, 0.0);
      return normalize(vec3(
        mapOrb(q + e.xyy).x - mapOrb(q - e.xyy).x,
        mapOrb(q + e.yxy).x - mapOrb(q - e.yxy).x,
        mapOrb(q + e.yyx).x - mapOrb(q - e.yyx).x));
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      vec3 ro = vec3(0.0, 0.0, -3.2 + uTreble * 0.4);
      vec3 rd = normalize(vec3(uv * 2.0, 1.5));
      float t0 = 0.0;
      for (int i = 0; i < 40; i++) {
        float hh = mapOrb(ro + rd * t0).x;
        if (hh < 0.001) break;
        t0 += hh * 0.85;
      }
      vec3 pp = ro + rd * t0;
      vec3 n = calcNORB(pp);
      vec3 lightDir = normalize(vec3(0.5, 0.8, -0.4));
      float dif = max(dot(n, lightDir), 0.0);
      float flow = uBass * 1.2 + uTime * 0.12 * speed;
      vec3 qv = n * 3.1 + vec3(flow);
      float qv2 = fbm(qv.xy);
      float marble = qv2 + 0.5 * fbm(qv.xy * 2.0 + flow);
      float vein = smoothstep(0.55, 0.6, marble) + smoothstep(0.7, 0.75, marble);
      vec3 col = pal(marble * 2.0 + uTime * 0.04, 0.15) * (dif * 1.1 + 0.2);
      col += vec3(0.5, 0.4, 0.7) * vein * (0.4 + 0.8*uBeat);
      float fres = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
      col += pal(n.x * 2.0, 0.4) * fres * (0.4 + 0.5*uMid);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'mid', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'treble', param: 'scale', amount: 0.35, curve: 'linear' }],
    'ultra'
  ),

  createShader(
    'cx-kalis-bloom', 'Kalis Bloom', 'fractals',
    'Kalis escape-time bloom zooming with the bass',
    ['kalis', 'escape', 'bloom'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 kp = uv / (1.3 - 0.5*uBass);
      float acc = 0.0;
      float zoomk = 1.0 + 0.25 * uBass;
      for (int i = 0; i < 9; i++) {
        kp = abs(kp) / max(dot(kp, kp), 0.0004) - zoomk;
        kp += vec2(0.26, 0.0) + uMid * 0.15;
        acc += exp(-length(kp) * 0.75);
      }
      float sc = 1.0 / (0.4 + 0.6 * exp(-length(uv)));
      vec3 col = pal(acc * 0.6 + uTime * 0.03 * speed + uBass, 0.25) * sc * (0.35 + 0.8*uBeat);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.4, curve: 'linear' }],
    'high'
  ),

  createShader(
    'cx-truchet-maze', 'Truchet Maze', 'geometric',
    'Truchet-tiled maze lines flowing to the audio spectrum',
    ['truchet', 'tiles', 'maze'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 g = floor(uv * 8.0);
      vec2 f = fract(uv * 8.0) - 0.5;
      float v = hash(g + floor(uTime * (0.4 + 0.6*uBeat)));
      vec2 fw = step(0.5, v) == 1.0 ? vec2(f.y, f.x) : f;
      float d = min(abs(fw.x - fw.y), 0.7 - abs(fw.x + fw.y));
      float line = exp(-abs(d) * 16.0);
      line += exp(-abs(fw.x - 0.0) * 30.0) * 0.3;
      vec3 col = pal(length(g) * 0.13 + uBass * 0.6 + uTime * 0.04, 0.4) * line * (0.7 + 0.6*uBeat);
      col *= intensity * brightness;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }],
    'medium'
  ),

  createShader(
    'cx-voronoi-vortex', 'Voronoi Vortex', 'geometric',
    'Worley cell field wrapped into a rotating vortex',
    ['voronoi', 'worley', 'vortex'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float swirl = a + uTime * 0.3 * speed * (0.7 + 0.6*uBeat);
      vec2 pv = vec2(cos(swirl), sin(swirl)) * r * 4.0;
      vec2 id = floor(pv); vec2 fr = fract(pv) - 0.5;
      float m = 1.0; vec2 mc = vec2(0.0);
      for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
          vec2 off = vec2(float(i), float(j));
          vec2 gw = id + off;
          vec2 rz = off + vec2(hash(gw), hash(gw + vec2(7.3, 1.9))) - fr;
          float d2 = dot(rz, rz);
          if (d2 < m) { m = d2; mc = gw; }
        }
      }
      float cell = smoothstep(0.35, 0.0, sqrt(m));
      vec3 col = pal(length(mc) * 0.4 + uBass * 0.5 + uTime * 0.05, 0.2) * (cell * 0.8 + 0.2);
      col *= (0.6 + 0.5 * exp(-r * 3.0));
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.6, curve: 'log' }, { signal: 'mid', param: 'hueShift', amount: 0.3, curve: 'linear' }],
    'medium'
  ),

  createShader(
    'cx-gyroid-sea', 'Gyroid Sea', 'abstract',
    'Animated gyroid lattice sheets surging with the sub bass',
    ['gyroid', 'lattice', 'isosurface'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 gp = uv * 5.0 * (1.0 + 0.3*uSub);
      float gt = uTime * 0.35 * speed;
      float gy = sin(gp.x + uBass * 2.0) * cos(gp.y - gt) +
                 sin(gp.y - gt * 0.7) * cos((gp.x + gp.y) * 0.7 + uMid * 2.0) +
                 sin((gp.x + gp.y) * 0.7) * cos(gp.x + gt * 0.5);
      float w = exp(-abs(gy) * 5.0) * (0.3 + 0.8*uSub);
      float w2 = exp(-abs(gy - 0.35) * 8.0) * 0.25 * uTreble;
      vec3 col = pal(gy * 0.5 + length(gp) * 0.2 + uTime * 0.05, 0.5) * (w + w2);
      col *= intensity * (0.6 + 0.7*uBeat);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'sub', param: 'distortion', amount: 0.7, curve: 'log' }, { signal: 'mid', param: 'intensity', amount: 0.4, curve: 'linear' }],
    'medium'
  ),

  createShader(
    'cx-lyapunov-bands', 'Chaos Bands', 'fractals',
    'Lyapunov exponent field mapped to colored chaos bands',
    ['lyapunov', 'chaos', 'logistic'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 cg = floor(uv * 12.0);
      vec2 cf = fract(uv * 12.0);
      float x = 0.5 + 0.35 * sin(uTime * 0.4 * speed + uBass * 2.0);
      float rA = 2.8 + 1.3 * uBass;
      float rB = 3.4 + 1.1 * uMid;
      float ls = 0.0;
      for (int i = 0; i < 14; i++) {
        float rr2 = mod(float(i), 2.0) < 1.0 ? rA : rB;
        x = rr2 * x * (1.0 - x);
        ls += log(max(abs(rr2 * (1.0 - 2.0 * x)), 0.0001));
      }
      float lyap = ls / 14.0;
      vec3 col = pal(lyap * 6.0 + cf.x + cf.y + uTime * 0.05, 0.1) *
                 (0.3 + 0.7 * smoothstep(0.1, 0.9, lyap));
      col *= intensity * (0.6 + 0.6*uBeat);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'mid', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }],
    'high'
  ),

  createShader(
    'cx-scope-kaleido', 'Scope Kaleido', 'synthwave',
    'Polar-folded oscilloscope kaleidoscope with spectral sweep',
    ['oscilloscope', 'kaleidoscope', 'spectrum'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float segs = 8.0;
      float fold = 6.28318 / segs;
      float sa = mod(a, fold) - 0.5 * fold;
      vec2 fp = r * vec2(cos(sa) + uTreble * 0.3, sin(sa));
      float wv = sin(fp.x * 7.0 - uTime * 2.0 * speed) * 0.5 +
                 sin(fp.x * 5.0 + uTime * 3.0 + uMid * 2.0) * 0.3 +
                 uTreble * 0.7 * sin(fp.x * 9.0 + uTime * 4.0);
      float wl = exp(-abs(fp.y - wv) * 15.0);
      float wedge = exp(-abs(r - 0.6 - uBass * 0.25) * 24.0);
      vec3 col = pal(fp.x * 2.0 + wv + r + uTime * 0.1, 0.6) * wl * (0.4 + 0.8*uTreble);
      col += pal(a / 6.28318 + r * 1.5, 0.2) * wedge * (0.3 + 0.7*uBeat);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'treble', param: 'distortion', amount: 0.6, curve: 'log' }, { signal: 'mid', param: 'hueShift', amount: 0.35, curve: 'linear' }],
    'high'
  ),

  createShader(
    'cx-crystal-cage', 'Crystal Cage', 'geometric',
    'Rotating 3D lattice cage crystal, facets flash on the beat',
    ['lattice', 'crystal', 'cage'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      float ca = uTime * 0.4 * speed + uBeatPhase * 0.7;
      vec2 rp = vec2(cos(ca), sin(ca));
      vec2 qx = abs(vec2(dot(uv, vec2(0.5, 0.866)), dot(uv, vec2(0.5, -0.866))));
      qx = vec2(rp.x * qx.x - rp.y * qx.y, rp.x * qx.y + rp.y * qx.x) * 1.3;
      float m = 1.0;
      vec2 fq = fract(qx * 4.0) - 0.5;
      float edge = exp(-abs(abs(fq.x) - 0.42) * 22.0) + exp(-abs(abs(fq.y) - 0.42) * 22.0);
      vec2 id = floor(qx * 4.0);
      float rnd = hash(id + floor(uTime * 2.0));
      float facet = step(0.55, rnd) * (0.4 + 0.8*uBeat);
      m = exp(-(abs(uv.x) + abs(uv.y)) * 1.4);
      vec3 col = pal(distance(id, vec2(0.0)) * 0.2 + uBass * 0.5, 0.3) * (edge + facet) * m;
      col *= intensity * (0.7 + 0.5*uTreble);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.5, curve: 'linear' }],
    'high'
  ),

  createShader(
    'cx-aurora-veil', 'Aurora Veil', 'cosmic',
    'Domain-warpped flowing aurora curtains billowing on the treble',
    ['aurora', 'domain-warp', 'curtains'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 q = uv * vec2(1.6, 1.0);
      float tA = uTime * 0.6 * speed;
      float qw = 0.4 * (0.5 + 0.6 * sin(tA + q.x * 0.6)) * (1.0 + 0.6*uTreble);
      vec2 rp = vec2(fbm(q + vec2(tA, 0.0)) - 0.5, fbm(q + vec2(0.0, tA)) - 0.5);
      rp *= 0.6 + 0.8 * uMid;
      float band = fbm(q * (1.0 + 0.5 * distance(uv, vec2(0.0))) + rp * qw - vec2(0.0, tA * 0.8));
      float curtain = smoothstep(0.62, 0.58, band) * (1.0 - 0.4 * distance(uv, vec2(0.0, -0.3)));
      vec3 col = pal(band * 3.0 + uBass, 0.7) * curtain * (0.5 + 0.7*uTreble);
      col += vec3(0.02, 0.05, 0.1) * (1.0 - curtain) * (0.4 + 0.4*uBeat);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' },
     { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'treble', param: 'distortion', amount: 0.6, curve: 'log' }, { signal: 'mid', param: 'scale', amount: 0.35, curve: 'linear' }],
    'high'
  ),

  createShader(
    'cx-nebula-heart', 'Nebula Heart', 'cosmic',
    'Layered fbm nebula with a pulsing stellar core',
    ['nebula', 'fbm', 'core', 'glow'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float r = length(uv * vec2(1.6, 1.0));
      float tN = uTime * 0.3 * speed;
      vec2 q = uv * vec2(1.6, 1.0) * (1.0 + 0.5 * sin(tN * 0.7 + uBass * 3.0));
      float neb = fbm(q * 1.6 + vec2(0.0, tN * 0.5)) +
                  0.4 * fbm(q * 3.2 - vec2(tN * 0.8, 0.0));
      float core = exp(-r * r * 3.0) * (0.45 + 0.55 * uBeat);
      float dust = smoothstep(1.1, 0.15, r * (1.0 - neb * 0.45));
      vec3 col = pal(neb * 2.5 + uBass, 0.45) * dust * (0.35 + 0.6*uMid);
      col += vec3(0.9, 0.7, 1.0) * core * (0.5 + 0.5*uTreble);
      col += pal(neb, 0.8) * core * 0.6;
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'mid', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.5, curve: 'linear' }],
    'high'
  ),

  createShader(
    'cx-eclipse-breach', 'Eclipse Breach', 'cosmic',
    'Concentric eclipse rings breached by bass-driven particles',
    ['eclipse', 'rings', 'corona'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float rr = r - 0.28 - 0.05 * sin(uTime * 2.0 * speed + uBass * 3.0);
      float disc = exp(-abs(rr) * 60.0);
      float breach = exp(-abs(abs(rr) - 0.03) * 40.0);
      vec2 sid = floor(uv * 18.0);
      float rnd = hash(sid);
      float life = fract(uTime * (0.3 + 0.4*uBeat) + rnd * 3.0);
      float part = exp(-length(fract(uv * 3.6) - 0.5) * 4.0) * step(0.86, rnd) * (0.3 + 0.8*uBeat);
      vec3 col = pal(a + uBass * 0.8 + uTime * 0.05, 0.3) * (disc + breach * 0.8 + part);
      col *= smoothstep(1.4, 0.2, r);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.7, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }],
    'high'
  ),

  createShader(
    'cx-mandel-waves', 'Mandel Waves', 'fractals',
    'Mandelbrot-lite waves with bass-driven zoom and coloring',
    ['mandelbrot', 'zoom', 'classic'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float zoom = 1.0 + uTime * 0.12 * speed + uBass * 0.35;
      vec2 c = uv / zoom + vec2(-0.726, 0.19) + uMid * 0.06;
      vec2 z = vec2(0.0);
      float iter = 0.0;
      for (int i = 0; i < 96; i++) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter += 1.0;
      }
      float t = iter / 96.0;
      vec3 col = 0.5 + 0.5 * cos(6.28318 * (t * 2.5 + uTime * 0.15 * speed + vec3(0.0, 0.33, 0.67) + uBass * 0.6));
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 2, default: 0, step: 0.05, group: 'audio' }],
    {},
    [{ signal: 'mid', param: 'distortion', amount: 0.3, curve: 'linear' }, { signal: 'treble', param: 'brightness', amount: 0.25, curve: 'linear' }],
    'high'
  ),

  createShader(
    'cx-star-warp', 'Star Warp', 'cosmic',
    'Warped starfield streaking by on the tempo, bass-breathed',
    ['starfield', 'warp', 'speed'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      vec2 p = uv * vec2(1.0, 1.0) + vec2(0.0, uTime * 0.1 * speed);
      vec2 id = floor(p * 14.0);
      vec2 fr = fract(p * 14.0) - 0.5;
      float rnd = hash(id);
      float layer = step(0.7, rnd);
      float spd = (0.35 + rnd * 0.6) * (1.0 + 0.5*uBeat);
      float travel = fract(uTime * spd * (0.3 + 0.5*uBass) + rnd * 10.0);
      vec2 dir = normalize(fr + 0.0001);
      float dd = length(fr - dir * travel * 0.7);
      float star = exp(-dd * dd * 60.0) * layer * (0.4 + 0.8*uBeat);
      float streak = exp(-abs(fr.y - travel * 0.7) * 26.0) * step(0.6, rnd) * 0.3;
      vec3 col = pal(rnd + uTime * 0.1 + uTreble, 0.1) * (star + streak) * (0.5 + 0.6*uMid);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'mid', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.5, curve: 'linear' }],
    'medium'
  ),

  createShader(
    'cx-grid-city', 'Grid City', 'synthwave',
    'Outrun grid city rolling on the beat, sun flashing to the kick',
    ['synthwave', 'retro', 'grid'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float horizon = 0.14;
      float y = uv.y - horizon;
      float proj = 1.0 / max(y + 0.35, 0.01);
      vec2 g = vec2((uv.x * proj * 1.4) * 3.0, (proj) * 0.9);
      float gp = fract(g.x) - 0.5;
      float gz = fract(g.y) - 0.5;
      vec3 line = vec3(0.0);
      float r = smoothstep(0.05, 0.0, abs(gp)) + smoothstep(0.05, 0.0, abs(gz));
      line += vec3(1.0, 0.2, 0.8) * r * exp(-y * 6.0) * (0.4 + 0.7*uBeat);
      float sun = exp(-abs(length(uv - vec2(0.0, 0.42)) - 0.16) * 60.0) * (0.5 + 0.6*uBeat);
      float street = exp(-abs(uv.x) * 9.0) * exp(-abs(uv.y - horizon) * 3.0) * uSub;
      vec3 col = vec3(0.15, 0.0, 0.3);
      col += line * (0.6 + 0.5*uMid);
      col += vec3(1.0, 0.5, 0.2) * sun + vec3(0.8, 0.3, 1.0) * street;
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.01)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'sub', param: 'distortion', amount: 0.6, curve: 'log' }, { signal: 'beat', param: 'intensity', amount: 0.6, curve: 'linear' }],
    'medium'
  ),

  createShader(
    'cx-spectral-tunnel', 'Spectral Tunnel', 'abstract',
    'Color-wheel tunnel with spectral banding and bass funnel',
    ['tunnel', 'spectral', 'funnel'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float funnel = 1.0 / (r + 0.04) * (0.8 + 0.5*uBass);
      float dst = funnel + uTime * 1.2 * speed;
      float band = sin(a * 4.0 + dst * 1.2) * 0.5 + 0.5;
      float ring = exp(-abs(fract(dst * 0.6 + noise(vec2(a, dst) * 1.4 + uTime * 0.3)) - 0.5) * 12.0);
      vec3 col = pal(a / 6.28318 + dst * 0.3 + uBass, 0.4) * (ring * (0.35 + 0.7*uBeat) + band * 0.12);
      col *= 1.0 - r * 1.6;
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'bass', param: 'distortion', amount: 0.7, curve: 'log' }, { signal: 'treble', param: 'brightness', amount: 0.3, curve: 'linear' }],
    'high'
  ),

  createShader(
    'cx-reactive-blob', 'Reactive Blob', 'liquid',
    'Metaball-ready energy blob deformed by spectral flux',
    ['blob', 'metaball', 'liquid'],
    `
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      float tB = uTime * 0.7 * speed;
      vec2 center = vec2(0.0);
      float flux = uMid * 0.6 + uBeat * 0.25;
      vec2 warp = vec2(noise(vec2(center.x + tB, flux)), noise(vec2(flux, center.y + tB * 0.7))) - 0.5;
      float rad = 0.55 + 0.2 * uBass + 0.18 * flux;
      float orbit = uBeatPhase * 6.28318;
      vec2 b1 = vec2(0.3 * cos(orbit), 0.3 * sin(orbit * 1.3)) * warp * 0.4;
      float d1 = length(uv - b1);
      vec2 b2 = vec2(-0.3 * cos(orbit * 0.7), -0.25 * sin(orbit)) * warp * 0.4;
      float d2 = length(uv - b2);
      vec2 b3 = vec2(0.15 * sin(orbit), -0.18 * cos(orbit * 1.7)) * 0.4;
      float d3 = length(uv - b3);
      float blob = exp(-d1 * d1 * 4.0) + exp(-d2 * d2 * 4.0) + exp(-d3 * d3 * 4.0);
      float sh = smoothstep(0.62, 0.55, blob) * (0.5 + 0.5 * flux);
      float inner = smoothstep(0.95, 1.15, blob);
      vec3 col = pal(atan(uv.y, uv.x) / 6.28318 + rad * 0.5 + uTreble, 0.6) * sh;
      col += vec3(0.8, 0.9, 1.0) * inner * (0.4 + 0.8*uBeat);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,
    [{ id: 'distortion', label: 'Distortion', min: 0, max: 3, default: 1, step: 0.1, group: 'audio' }],
    {},
    [{ signal: 'mid', param: 'distortion', amount: 0.5, curve: 'log' }, { signal: 'bass', param: 'scale', amount: 0.4, curve: 'log' }],
    'high'
  ),
]

export function getComplexCount() { return COMPLEX_SHADERS.length }