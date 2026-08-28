/**
 * GLSL chunk registry (D22 / AGENTS.md #3).
 *
 * Chunks are composable, dependency-ordered GLSL snippets injected into shader
 * bodies via `{{chunk:name}}` template syntax. The sink (`compose.ts`) does a
 * dumb substitution in body order — a chunk may reference helpers defined by
 * chunks EARLIER in the body, so author order matters.
 *
 * Chunks stay PURE GLSL (no `main()`, no uniforms, no `out`). Uniforms come
 * from UNIFORM_HEADER or a shader's extraUniforms. Header uniforms uTime,
 * uBeat, uBeatPhase, uBass/uMid/uTreble/uVolume, uMacro* are always available.
 */

export interface ChunkDef {
  glsl: string
  description: string
  /** chunk ids this chunk's code directly calls (must appear before it) */
  requires: string[]
}

export const CHUNKS: Record<string, ChunkDef> = {
  noise: {
    glsl: `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
`,
    description: '2D value noise (hash21 + vnoise)',
    requires: [],
  },

  fbm: {
    glsl: `
float fbm5(vec2 p) {
  float f = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { f += a * vnoise(p); p = p * 2.03 + vec2(11.3, 7.1); a *= 0.5; }
  return f;
}
`,
    description: '5-octave fractal brownian motion (needs noise chunk first)',
    requires: ['noise'],
  },

  domainWarp: {
    glsl: `
vec2 warp(vec2 p, float t) {
  vec2 q = vec2(fbm5(p + t * 0.25), fbm5(p + vec2(5.2, 1.3) - t * 0.19));
  return p + 1.1 * (q - 0.5);
}
`,
    description: 'domain-warped sampling point (needs fbm chunk first)',
    requires: ['fbm'],
  },

  palette: {
    glsl: `
vec3 iqp(float t, vec3 a, vec3 b, vec3 c, vec3 d) { return a + b * cos(6.28318 * (c * t + d)); }
`,
    description: 'IQ cosine palette helper',
    requires: [],
  },

  rotor: {
    glsl: `
mat2 rot2(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }
`,
    description: '2D rotation matrix',
    requires: [],
  },

  voronoi: {
    glsl: `
vec2 voronoi(vec2 p) {
  vec2 ip = floor(p); vec2 fp = fract(p);
  float md = 8.0; vec2 mpos = vec2(0.0);
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y));
    vec2 r = o + hash21(ip + o) - fp;
    float d = dot(r, r);
    if (d < md) { md = d; mpos = r; }
  }
  return vec2(sqrt(md), mpos.x + mpos.y);
}
`,
    description: 'F1 voronoi distance + hash (needs noise chunk for hash21)',
    requires: ['noise'],
  },

  tile: {
    glsl: `
vec2 tile(vec2 p, float n) { return (fract(p * n) - 0.5) / n; }
vec2 mirrorTile(vec2 p, float n) {
  p = p * n - 0.5;
  p = abs(fract(p * 0.5) * 2.0 - 1.0) - 0.5;
  return p / n;
}
`,
    description: 'tiled / mirrored tile reduction',
    requires: [],
  },

  vignette: {
    glsl: `
float vig(vec2 uv) { return smoothstep(1.2, 0.35, length(uv)); }
`,
    description: 'radial vignette factor',
    requires: [],
  },

  beatFlash: {
    glsl: `
float beatFlash(float k) { return pow(max(0.0, 1.0 - uBeatPhase) * uBeat * 2.0, k); }
`,
    description: 'beat-synced flash envelope',
    requires: [],
  },

  bassBar: {
    glsl: `
float bassBar(vec2 uv, float level, float w) {
  return step(0.0, uv.y) * step(uv.y, level) * smoothstep(w, 0.0, abs(uv.x));
}
`,
    description: 'audio bounce column (uv.y up to level)',
    requires: [],
  },

  flowField: {
    glsl: `
vec2 flow(vec2 p, float t) {
  float a = fbm5(p + t * 0.18) * 6.28318 * 3.0;
  return vec2(cos(a), sin(a));
}
`,
    description: 'fbm-borne wandering flow (needs fbm chunk first)',
    requires: ['fbm'],
  },

  gridLines: {
    glsl: `
float gridLine(vec2 uv, float spacing, float w) {
  vec2 g = abs(fract(uv * spacing) - 0.5);
  return smoothstep(w, 0.0, min(g.x, g.y));
}
`,
    description: 'antialiased grid line factor',
    requires: [],
  },

  mandala: {
    glsl: `
vec2 polarMirror(vec2 uv, int petals) {
  float ang = atan(uv.y, uv.x) * float(petals) / 2.0;
  ang = abs(mod(ang, 2.0) - 1.0);
  return vec2(length(uv), ang);
}
`,
    description: 'rotational mirror to wedge (for mandala/star motifs)',
    requires: [],
  },
}

export const CHUNK_IDS = Object.keys(CHUNKS)