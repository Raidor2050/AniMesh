// Combined selectable-visual library for the immersive Space shuffle (Phase-25):
// full-screen shaders AND SVG pattern objects share one namespace so a single
// keypress can randomize across both worlds.
import { SHADER_LIBRARY } from './library'
import { SVG_OBJECTS } from '../objects/svgObjects'
import { SVG_BACKDROP } from './backdrop'
import { ShaderCategory, SvgObjectDefinition, ShaderDefinition, Visual } from '../utils/types'

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

/** Shader-only subset of a visual list (feeds the WebGL preview pipeline). */
export function onlyShaders(visuals: Visual[]): ShaderDefinition[] {
  return visuals.filter((v): v is ShaderDefinition => !isSvg(v))
}

/** Mirror of searchShaders over the full visual library (name/desc/tags/category/layout). */
export function searchVisuals(query: string): Visual[] {
  const q = query.trim().toLowerCase()
  if (!q) return VISUAL_LIBRARY
  return VISUAL_LIBRARY.filter(v =>
    v.name.toLowerCase().includes(q) ||
    v.description.toLowerCase().includes(q) ||
    v.tags.some(t => t.toLowerCase().includes(q)) ||
    v.category.includes(q) ||
    ('layout' in v && v.layout.includes(q))
  )
}

/** Visuals whose category matches; SVG objects and shaders share these groups. */
export function visualsInCategory(category: ShaderCategory): Visual[] {
  return VISUAL_LIBRARY.filter(v => v.category === category)
}