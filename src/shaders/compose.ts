/**
 * Chunk template resolver (D22). Substitutes `{{chunk:name}}` grammar from
 * AGENTS.md convention #3 with registry GLSL, in body order. Unknown chunks
 * throw — a failing shader is better than a silently-broken one.
 */
import { CHUNKS, CHUNK_IDS } from './chunks'

export const RE_CHUNK = /\{\{chunk:([a-zA-Z0-9_]+)\}\}/g

export function hasChunkTemplate(src: string): boolean {
  RE_CHUNK.lastIndex = 0
  return RE_CHUNK.test(src)
}

export function listMissingChunks(src: string): string[] {
  const ids = new Set(CHUNK_IDS)
  const missing: string[] = []
  RE_CHUNK.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = RE_CHUNK.exec(src)) !== null) {
    if (!ids.has(m[1]) && !missing.includes(m[1])) missing.push(m[1])
  }
  return missing
}

export function resolveChunkTemplates(src: string): string {
  if (!hasChunkTemplate(src)) return src
  const missing = listMissingChunks(src)
  if (missing.length) {
    throw new Error(`[compose] unknown chunk(s): ${missing.join(', ')}`)
  }
  return src.replace(RE_CHUNK, (_, name: string) => CHUNKS[name].glsl)
}