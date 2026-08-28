/**
 * Catalog metadata layer (D21). Pure data view over SHADER_LIBRARY used by the
 * browser UI and QA tooling: category breakdowns, hero markers, tier audit.
 * Does NOT hold fragment bodies — those live in library.ts/preset modules.
 *
 * NOTE: the master-plan's full per-category `import.meta.glob` body-split is
 * deferred to the perf pass (Phase 9): the milkdrop/reactive bodies (~300KB
 * raw) are the bulk of the bundle, but total gzip is ~106KB and a render-path
 * async switch would complicate the sync crossfade/cache flow. If metrics
 * demand, the 136 MILKDROP_PRESETS fragments move to lazy modules with
 * `setShaderAsync` first.
 */
import { SHADER_LIBRARY } from './library'
import { ShaderCategory, ShaderDefinition } from '../utils/types'

export const CATEGORIES: ShaderCategory[] = [
  'fractals', 'vj', 'geometric', 'liquid', 'cosmic', 'synthwave',
  'abstract', 'particle', 'minimal', 'milkdrop',
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