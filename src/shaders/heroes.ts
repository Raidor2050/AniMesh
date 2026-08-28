/**
 * The Ten Heroes (D24) — flagship shaders authored with the {{chunk:name}}
 * composition grammar. Each isolates its own uniforms via extraUniforms and its
 * own params, and is the reference style for the catalog going forward.
 *
 * Chunk templates MUST precede main() — GLSL ES 3.00 requires declarations
 * before use. The factory resolves them before wireParams/universals inject.
 */
import { ShaderDefinition } from '../utils/types'
import { createShader } from './factory'

export const HERO_SHADERS: ShaderDefinition[] = [
  createShader(
    'hero-plasma-flow', 'Plasma Flow', 'abstract',
    'Warped fbm plasma with treble-driven sparkle veins and a cosine-palette wash',
    ['hero', 'plasma', 'warp', 'flow', 'fbm'],
    `
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:domainWarp}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y) * 1.4;
      vec2 p = warp(uv, uTime * 0.12 * speed) + uBass * 0.6 * vec2(sin(uv.y * 3.0), cos(uv.x * 3.0));
      float f = fbm5(p * 2.0 + uBeat * 0.1) + uBass * 0.35;
      vec3 col = iqp(f + uTime * 0.05 * speed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
      col *= brightness * intensity * (1.0 + 0.25 * beatFlash(3.0));
      col = mix(col, vec3(1.0), f * f * sparkle);
      fragColor = vec4(col, 1.0);
    }
    `,
    [
      { id: 'sparkle', label: 'Sparkle Veins', min: 0, max: 1, default: 0, step: 0.05 },
    ],
    { sparkle: 0 },
    [
      { signal: 'treble', param: 'sparkle', amount: 0.8, curve: 'linear' },
    ],
    'medium',
    'uniform float sparkle;\n'
  ),

  createShader(
    'hero-vorton', 'Vorton', 'abstract',
    'Organic voronoi lattice riding a flow field, with bass-driven cell growth',
    ['hero', 'voronoi', 'lattice', 'flow-field'],
    `
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:flowField}}
    {{chunk:voronoi}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = uv * cells + 0.15 * flow(uv, uTime * 0.1 * speed);
      vec2 v = voronoi(p);
      float cell = 1.0 - smoothstep(0.35, 0.6, v.x);
      float edge = smoothstep(0.18, 0.0, abs(v.x - 0.55) - 0.02);
      vec3 col = iqp(v.y + uTime * 0.06 * speed + uBass * 0.8, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.25, 0.45, 0.6));
      col = mix(col, vec3(1.0), edge * (0.6 + uTreble * 0.6));
      col *= cell * intensity * brightness;
      vec2 ring = abs(length(uv) - 0.55 - 0.35 * uBeat * intensity);
      col += vec3(0.3, 0.5, 1.0) * smoothstep(0.03, 0.0, ring) * beatFlash(2.0);
      fragColor = vec4(col, 1.0);
    }
    `,
    [
      { id: 'cells', label: 'Cells', min: 2, max: 12, default: 6, step: 0.5 },
    ],
    { cells: 6 },
    [
      { signal: 'bass', param: 'cells', amount: 2, curve: 'log' },
    ],
    'medium',
    'uniform float cells;\n'
  ),

  createShader(
    'hero-ripple-grid', 'Ripple Grid', 'geometric',
    'Mirror-tiled ripples radiating over a faint grid, beat-pulsed ring',
    ['hero', 'ripple', 'grid', 'radial', 'minimal'],
    `
    {{chunk:tile}}
    {{chunk:rotor}}
    {{chunk:gridLines}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = mirrorTile(uv * rot2(uTime * 0.05 * speed), 4.0 + rippleCount);
      float d = length(p);
      float wave = sin(d * 14.0 - uTime * 3.0 * speed + uBass * 6.0) * 0.5 + 0.5;
      vec2 g = uv * 9.0;
      float grid = gridLine(g, 1.0, 0.03);
      vec3 col = iqp(d + uTime * 0.1 * speed + wave * 0.6, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.2, 0.4));
      col = mix(col, vec3(1.0), grid * 0.85);
      col *= (0.25 + wave * 0.75) * intensity * brightness;
      col += vec3(0.6, 0.85, 1.0) * smoothstep(0.05, 0.0, abs(length(uv) - 0.42 - 0.28 * uBeat)) * beatFlash(2.0);
      fragColor = vec4(col, 1.0);
    }
    `,
    [
      { id: 'rippleCount', label: 'Ripples', min: 0, max: 6, default: 3, step: 1 },
    ],
    { rippleCount: 3 },
    [],
    'medium',
    'uniform float rippleCount;\n'
  ),

  createShader(
    'hero-spectrum-tower', 'Spectrum Tower', 'vj',
    'Rotating 5-band spectrum columns ringing a central gridstone',
    ['hero', 'spectrum', 'vj', 'bass-bars'],
    `
    {{chunk:rotor}}
    {{chunk:bassBar}}
    {{chunk:gridLines}}
    {{chunk:vignette}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y) * 2.0;
      vec3 col = vec3(0.0);
      mat2 r = rot2(uTime * 0.2 * speed);
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float lvl = fi < 1.5 ? uBass * (1.3 + 0.5*sin(uTime*3.0))
                  : fi < 3.5 ? uMid * (1.1 + 0.4*sin(uTime*5.0))
                  : uTreble * 0.9;
        vec2 q = uv * r;
        col += vec3(0.35 + 0.65*fi/5.0, 0.2, 0.9 - 0.6*fi/5.0) * bassBar(q + vec2((fi-2.0)*0.42, 0.0), lvl, 0.12);
      }
      col += vec3(0.4, 0.4, 0.45) * gridLine(uv, 6.0, 0.04) * 0.5;
      col *= intensity * brightness;
      col *= vig(uv * 0.9);
      fragColor = vec4(col, 1.0);
    }
    `,
    [],
    {},
    [],
    'medium',
    ''
  ),

  createShader(
    'hero-nebula', 'Nebula', 'cosmic',
    'Deep warped-fbm nebula in magenta false-colour, bright patch pulse on beats',
    ['hero', 'nebula', 'cosmic', 'fbm'],
    `
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:domainWarp}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    {{chunk:vignette}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = warp(uv * 1.7 + vec2(3.1, 8.7), uTime * 0.1 * speed);
      float n = fbm5(p + vec2(0.0, uTime * 0.03 * speed));
      float m = fbm5(p * 2.3 - 4.2 + vec2(0.1 * uBass, 0.0));
      vec3 col = iqp(n * 1.4 - m * 0.8 + uBass * 1.2, vec3(0.45, 0.25, 0.6), vec3(0.5), vec3(1.0, 1.2, 1.6), vec3(0.0, 0.33, 0.67));
      col = mix(col, vec3(1.0), smoothstep(0.78, 1.0, n) * 0.9);
      col *= 0.7 + 0.5 * beatFlash(3.0);
      col *= vig(uv) * intensity * brightness * 1.2;
      fragColor = vec4(col, 1.0);
    }
    `,
    [],
    {},
    [],
    'high',
    ''
  ),

  createShader(
    'hero-lattice', 'Lattice', 'geometric',
    'Living mirrored lattice of glowing cores with a breathe ring on the beat',
    ['hero', 'lattice', 'geometric', 'core'],
    `
    {{chunk:tile}}
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:flowField}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y) * 2.0;
      vec2 p = mirrorTile(uv, lattice) + 0.12 * flow(uv, uTime * 0.08 * speed);
      float d = length(p);
      float core = 1.0 - smoothstep(0.05, 0.32, d);
      float link = smoothstep(0.36, 0.22, d);
      vec3 col = iqp(d * 3.0 + uTime * 0.12 * speed + uBass * 1.5, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.1, 0.3, 0.55));
      col = mix(col, vec3(1.0), link * 0.6);
      col *= (0.35 + core) * intensity * brightness;
      col += vec3(0.5, 0.8, 1.0) * smoothstep(0.06, 0.0, abs(d - 0.24 - 0.1 * uBeat * intensity * 2.0)) * beatFlash(1.5);
      fragColor = vec4(col, 1.0);
    }
    `,
    [
      { id: 'lattice', label: 'Lattice', min: 2, max: 10, default: 5, step: 1 },
    ],
    { lattice: 5 },
    [
      { signal: 'volume', param: 'lattice', amount: 2, curve: 'log' },
    ],
    'medium',
    'uniform float lattice;\n'
  ),

  createShader(
    'hero-aurora-drift', 'Aurora Drift', 'cosmic',
    'Two drifting aurora sheets, cyan-green and violet, on a warped fbm field',
    ['hero', 'aurora', 'cosmic', 'curtain'],
    `
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:domainWarp}}
    {{chunk:vignette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= (uResolution.x / uResolution.y);
      vec2 p = warp(uv * vec2(2.6, 1.0), uTime * 0.1 * speed);
      p.x += uTime * 0.05 * speed;
      float a = smoothstep(0.9, 0.15, abs(p.y - 0.55 * sin(p.x * 2.0 + uTime * 0.3 * speed + uBass * 2.0)));
      float b = smoothstep(0.95, 0.3, abs(p.y - 0.25 * sin(p.x * 1.6 - uTime * 0.2 * speed)));
      float n = fbm5(warp(p * 2.4, uTime * 0.06 * speed));
      vec3 col = mix(vec3(0.1, 0.5, 0.9), vec3(0.2, 1.0, 0.7), n) * a;
      col += vec3(0.8, 0.25, 1.0) * b * 0.7;
      col *= intensity * brightness * (0.6 + uVolume * 0.5) * vig(uv * 1.3);
      col += vec3(1.0) * beatFlash(4.0) * 0.25;
      fragColor = vec4(col, 1.0);
    }
    `,
    [],
    {},
    [],
    'high',
    ''
  ),

  createShader(
    'hero-mandala-bloom', 'Mandala Bloom', 'fractals',
    'Rotating polar-mirror mandala carved by fbm, petals breathing on the bass',
    ['hero', 'mandala', 'fractal', 'rotational'],
    `
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:rotor}}
    {{chunk:mandala}}
    {{chunk:palette}}
    {{chunk:gridLines}}
    {{chunk:vignette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv *= rot2(uTime * 0.05 * speed + uBass * 0.4);
      vec2 rp = polarMirror(uv, int(petals));
      float r = rp.x;
      float t = rp.y;
      float scale = 1.0 / (r * petals * (0.55 + 0.2 * sin(t * 6.28318 * 2.0)) + 0.35 + uBass * 0.6);
      float g = fbm5(vec2(scale * 0.5, t * petals * 2.0 - uTime * 0.15 * speed));
      float ring = gridLine(vec2(r * 18.0, 0.0), 3.0, 0.03);
      vec3 col = iqp(g + uTime * 0.04 * speed + uBass * 0.7, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.15, 0.4, 0.62));
      col *= (0.4 + ring * 0.6) * intensity * brightness * smoothstep(0.0, 0.6, r);
      col *= vig(uv);
      col += vec3(1.0) * beatFlash(3.0) * 0.3;
      fragColor = vec4(col, 1.0);
    }
    `,
    [
      { id: 'petals', label: 'Petals', min: 3, max: 20, default: 8, step: 1 },
    ],
    { petals: 8 },
    [
      { signal: 'bass', param: 'petals', amount: 2, curve: 'log' },
    ],
    'high',
    'uniform float petals;\n'
  ),

  createShader(
    'hero-warp-speed', 'Warp Speed', 'vj',
    'Hyperspace tunnel with beat-boosted velocity scaling and warm centre bloom',
    ['hero', 'tunnel', 'warp', 'vj', 'hyperspace'],
    `
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:rotor}}
    {{chunk:palette}}
    {{chunk:vignette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 uvx = uv * rot2(uTime * 0.04 * speed + uBass * 0.5);
      float r = length(uvx);
      float ang = atan(uvx.y, uvx.x);
      float tunnel = 0.16 / (r + 0.05);
      float boost = 1.0 + uBeat * 0.8 * intensity;
      vec2 p = vec2(ang * 3.0, tunnel * (0.5 + 0.5 * uBass)) + uTime * 0.5 * speed * boost;
      float n = fbm5(p * 1.4);
      vec3 col = iqp(n * 2.0 - tunnel * 0.5 + uTreble * 0.6, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
      col *= intensity * brightness * (0.5 + 1.2 * exp(-r * 4.0));
      col *= vig(uv);
      col += vec3(1.0, 0.9, 0.8) * smoothstep(0.0, 0.32, r) * beatFlash(2.0);
      fragColor = vec4(col, 1.0);
    }
    `,
    [],
    {},
    [],
    'medium',
    ''
  ),

  createShader(
    'hero-cosmic-web', 'Cosmic Web', 'abstract',
    'Voronoi filament web glowing in deep blue, treble brightening the edges',
    ['hero', 'voronoi', 'web', 'filaments', 'dark'],
    `
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:flowField}}
    {{chunk:voronoi}}
    {{chunk:palette}}
    {{chunk:vignette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = uv * webSize + 0.12 * flow(uv, uTime * 0.08 * speed) + vec2(uBass * 1.4, 0.0);
      vec2 v = voronoi(p);
      float edge = smoothstep(0.12, 0.0, abs(v.x - 0.5) - 0.045);
      float glow = exp(-v.x * 2.6) * 0.9;
      float n = fbm5(p * 1.6 + vec2(7.2, 3.4));
      vec3 col = iqp(v.y * 2.0 + n * 0.8 + uTime * 0.04 * speed + uBass * 0.5, vec3(0.08), vec3(0.5), vec3(1.0), vec3(0.35, 0.55, 0.7));
      col = mix(col, vec3(0.9, 0.95, 1.0), edge * (0.5 + uTreble * 0.8));
      col *= (0.15 + glow) * intensity * brightness;
      col *= vig(uv * 1.15);
      col += vec3(0.7, 0.9, 1.0) * beatFlash(3.0) * edge * 0.8;
      fragColor = vec4(col, 1.0);
    }
    `,
    [
      { id: 'webSize', label: 'Web Size', min: 1, max: 6, default: 2, step: 0.5 },
    ],
    { webSize: 2 },
    [
      { signal: 'volume', param: 'webSize', amount: 2, curve: 'log' },
    ],
    'medium',
    'uniform float webSize;\n'
  ),
]