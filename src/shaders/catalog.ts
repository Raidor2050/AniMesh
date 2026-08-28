/**
 * Catalog metadata layer (D21). Pure data view over SHADER_LIBRARY used by the
 * browser UI and QA tooling: category breakdowns, hero markers, tier audit.
 * Does NOT hold fragment bodies — those live in library.ts/preset modules.
 *
 * NOTE: the master-plan's full per-category `import.meta.glob` body-split is
 * deliberately NOT done (decision re-scoped, see DECISIONS.md D21): the milkdrop
 * + reactive bodies (~275KB min) are isolated in a static `shader-data` chunk
 * via manualChunks, which clears the 500KB warning and cache-stabilizes the
 * bodies with zero render-path risk. Per-category async would require rewiring
 * every one of the 9 SHADER_LIBRARY importers (stores, canvas, catalog,
 * shaderActions, previews, browser) against a ~90KB-gz first-load saving.
 */
import { SHADER_LIBRARY } from './library'
import { ShaderCategory, ShaderDefinition } from '../utils/types'

export const CATEGORIES: ShaderCategory[] = [
  'fractals', 'vj', 'geometric', 'liquid', 'cosmic', 'synthwave',
  'abstract', 'particle', 'minimal', 'milkdrop', 'psychedelic',
]

export const TIERS = ['low', 'medium', 'high', 'ultra'] as const

export interface CatalogStats {
  total: number
  byCategory: Record<ShaderCategory, number>
  heroes: string[]
  milkdropCount: number
  tierCounts: Record<string, number>
}

export function getShadersByCategory(category: ShaderCategory): ShaderDefinition[] {
  return SHADER_LIBRARY.filter(s => s.category === category)
}

export function getShaderById(id: string): ShaderDefinition | undefined {
  return SHADER_LIBRARY.find(s => s.id === id)
}

export function isHero(def: ShaderDefinition): boolean {
  return def.tags.includes('hero')
}

export function catalogStats(): CatalogStats {
  const byCategory = {} as Record<ShaderCategory, number>
  for (const c of CATEGORIES) byCategory[c] = 0

  const tierCounts: Record<string, number> = {}
  const heroes: string[] = []
  let milkdropCount = 0

  for (const def of SHADER_LIBRARY) {
    byCategory[def.category] = (byCategory[def.category] ?? 0) + 1
    tierCounts[def.performanceTier] = (tierCounts[def.performanceTier] ?? 0) + 1
    if (def.category === 'milkdrop' || def.tags.includes('milkdrop')) milkdropCount++
    if (isHero(def)) heroes.push(def.id)
  }

  return { total: SHADER_LIBRARY.length, byCategory, heroes, milkdropCount, tierCounts }
}