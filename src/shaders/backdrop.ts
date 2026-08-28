// Full-screen ambient wash rendered beneath SVG pattern objects while an SVG
// visual is active (CanvasLayer swaps the GL shader to this so the canvas
// keeps glowing behind the crisp vector shapes). Deliberately quiet: the object
// is the star. Strict GLSL, all float literals.
import { createShader } from './factory'

export const SVG_BACKDROP = createShader(
  'svg-backdrop',
  'Backdrop',
  'minimal',
  'Ambient drift wash rendered beneath SVG pattern objects so the vector layer reads on a living background.',
  ['svg', 'backdrop', 'ambient'],
  `
  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    float t = uTime * 0.12;
    float grain = 0.022 + 0.013 * sin(uv.y * 5.0 + t) * sin(uv.x * 4.0 - t * 0.7);
    float vig = smoothstep(1.7, 0.3, length(uv));
    float glow = 1.0 + uSub * 0.22 + uBeat * 0.06;
    vec3 col = vec3(grain * (0.6 + 0.4 * uSpectralCentroid)) * glow;
    col = mix(vec3(0.02, 0.03, 0.05), col, vig);
    col *= brightness;
    fragColor = vec4(col, 1.0);
  }`,
  [],
  { speed: 1, intensity: 1, scale: 1, brightness: 1, hueShift: 0, saturation: 1 },
  [],
  'low',
)