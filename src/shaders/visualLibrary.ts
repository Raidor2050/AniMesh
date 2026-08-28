// Combined selectable-visual library for the immersive Space shuffle (Phase-25):
// full-screen shaders AND SVG pattern objects share one namespace so a single
// keypress can randomize across both worlds.
import { SHADER_LIBRARY } from './library'
import { SVG_OBJECTS } from '../objects/svgObjects'
import { SVG_BACKDROP } from './backdrop'
import { SvgObjectDefinition, ShaderDefinition, Visual } from '../utils/types'

export { SVG_BACKDROP }

/** Shaders first (preserves legacy cycle ordering) then SVG objects. */
export const VISUAL_LIBRARY: Visual[] = [...SHADER_LIBRARY, ...SVG_OBJECTS]

export function getVisualById(id: string): Visual | undefined {
  return VISUAL_LIBRARY.find(v => v.id === id)
}

export function isSvg(def: Visual): def is SvgObjectDefinition {
  return def.kind === 'svg'
}

export function asShader(def: Visual): ShaderDefinition {
  return isSvg(def) ? SVG_BACKDROP : def
}