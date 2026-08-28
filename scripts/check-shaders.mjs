#!/usr/bin/env node
/**
 * check-shaders.mjs — static GLSL sanity gate over the shader source modules.
 *
 * AniMesh composes shaders from head/body/tail GLSL pieces (factory.ts, the
 * `{{chunk:...}}` grammar, milkdrop template pairs), so full-program invariants
 * only hold on assembled pieces. Checks that hold for THIS architecture:
 *   1. every template literal is terminated (`...` EOF implies corruption)
 *   2. any literal that contains `void main()` must itself have balanced
 *      braces (a complete fragment can never end with an open scope)
 * Exits non-zero on any failure. Cheap precursor to the vitest compile-facing
 * integrity suite; wired into CI via `npm run check:shaders`.
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const SHADERS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'shaders')

/** Extract template literals; throws on an unterminated literal. */
function extractTemplateLiterals(src) {
  const literals = []
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '`') continue
    let j = i + 1
    let body = ''
    let closed = false
    while (j < src.length) {
      const c = src[j]
      if (c === '\\') { body += src[j] + (src[j + 1] ?? ''); j += 2; continue }
      if (c === '$' && src[j + 1] === '{') {
        let depth = 1
        let k = j + 2
        while (k < src.length && depth > 0) {
          if (src[k] === '{') depth++
          else if (src[k] === '}') depth--
          k++
        }
        if (depth !== 0) return { literals: [], unterminated: true, at: i }
        body += '<expr>'
        j = k
        continue
      }
      if (c === '`') { closed = true; j++; break }
      body += c
      j++
    }
    literals.push({ text: body, start: i, closable: closed })
    i = j
  }
  return { literals }
}

function braceDelta(text) {
  let depth = 0
  for (const ch of text) {
    if (ch === '{') depth++
    else if (ch === '}') depth--
  }
  return depth
}

const errors = []
let literalCount = 0

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { if (entry.name !== '__tests__') walk(full); continue }
    if (!entry.name.endsWith('.ts')) continue
    const src = readFileSync(full, 'utf8')
    const path = full.split('src\\shaders\\').pop().replace(/\\/g, '/')
    const { literals, unterminated, at } = extractTemplateLiterals(src)
    if (unterminated) {
      errors.push(`${path}: unterminated template literal near byte ${at}`)
      continue
    }
    for (let n = 0; n < literals.length; n++) {
      literalCount++
      const { text } = literals[n]
      if (!text.includes('void main')) continue
      const d = braceDelta(text)
      if (d !== 0) {
        errors.push(`${path} fragment #${n}: 'void main()' literal is ${d > 0 ? 'unclosed' : 'over-closed'} by ${Math.abs(d)} braces`)
      }
    }
  }
}

walk(SHADERS_DIR)

console.log(`check-shaders: ${literalCount} GLSL template literals scanned across src/shaders`)

if (errors.length > 0) {
  for (const e of errors) console.error(`  FAIL  ${e}`)
  console.error('check-shaders: FAILED')
  process.exit(1)
}

console.log('check-shaders: OK')