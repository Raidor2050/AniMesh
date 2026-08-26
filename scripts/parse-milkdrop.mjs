#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import { join, basename, relative, extname } from 'path'

const ROOT = join(import.meta.dirname, '..', 'NestDropResources')
const OUT = join(import.meta.dirname, '..', 'src', 'shaders', 'milkdrop-generated.ts')
const ADAPTER_PATH = join(import.meta.dirname, '..', 'src', 'shaders', 'milkdrop-adapter-glsl.ts')
const TOP_N = 15

const CATEGORY_MAP = {
  '! Transition': 'vj',
  Dancer: 'abstract',
  Drawing: 'abstract',
  Fractal: 'fractals',
  Geometric: 'geometric',
  Hypnotic: 'vj',
  Milkdrop2: 'vj',
  Particles: 'particle',
  Reaction: 'cosmic',
  Sparkle: 'cosmic',
  Supernova: 'cosmic',
  Waveform: 'liquid',
}

const PARAM_KEYS = [
  'zoom', 'rot', 'cx', 'cy', 'dx', 'dy', 'warp', 'sx', 'sy',
  'fDecay', 'fGammaAdj', 'fVideoEchoZoom', 'fVideoEchoAlpha', 'nVideoEchoOrientation',
  'nWaveMode', 'fWaveAlpha', 'fWaveScale', 'fWaveSmoothing', 'fWaveParam',
  'wave_r', 'wave_g', 'wave_b', 'wave_x', 'wave_y',
  'ob_size', 'ob_r', 'ob_g', 'ob_b', 'ob_a',
  'ib_size', 'ib_r', 'ib_g', 'ib_b', 'ib_a',
  'bAdditiveWaves', 'bTexWrap', 'bDarkenCenter', 'bBrighten', 'bDarken', 'bSolarize', 'bInvert',
  'fRating',
]

const DEFAULTS = {
  zoom: 1.0, rot: 0.0, cx: 0.5, cy: 0.5, dx: 0.0, dy: 0.0, warp: 0.0, sx: 1.0, sy: 1.0,
  fDecay: 0.95, fGammaAdj: 1.0, fVideoEchoZoom: 1.0, fVideoEchoAlpha: 0.0, nVideoEchoOrientation: 0,
  nWaveMode: 0, fWaveAlpha: 1.0, fWaveScale: 1.0, fWaveSmoothing: 0.0, fWaveParam: 0.0,
  wave_r: 1.0, wave_g: 1.0, wave_b: 1.0, wave_x: 0.5, wave_y: 0.5,
  ob_size: 0.0, ob_r: 0.0, ob_g: 0.0, ob_b: 0.0, ob_a: 0.0,
  ib_size: 0.0, ib_r: 0.0, ib_g: 0.0, ib_b: 0.0, ib_a: 0.0,
  bAdditiveWaves: 0, bTexWrap: 1, bDarkenCenter: 0, bBrighten: 0, bDarken: 0, bSolarize: 0, bInvert: 0,
  fRating: 3.0,
}

const PARAM_RANGES = {
  zoom: { min: 0.2, max: 3.0, step: 0.01 },
  rot: { min: -1.0, max: 1.0, step: 0.01 },
  cx: { min: 0.0, max: 1.0, step: 0.01 },
  cy: { min: 0.0, max: 1.0, step: 0.01 },
  dx: { min: -1.0, max: 1.0, step: 0.01 },
  dy: { min: -1.0, max: 1.0, step: 0.01 },
  warp: { min: 0.0, max: 2.0, step: 0.01 },
  sx: { min: 0.5, max: 2.0, step: 0.01 },
  sy: { min: 0.5, max: 2.0, step: 0.01 },
  fDecay: { min: 0.0, max: 1.0, step: 0.01 },
  fGammaAdj: { min: 0.1, max: 5.0, step: 0.1 },
  fVideoEchoZoom: { min: 0.5, max: 3.0, step: 0.01 },
  fVideoEchoAlpha: { min: 0.0, max: 1.0, step: 0.01 },
  nVideoEchoOrientation: { min: 0, max: 3, step: 1 },
  nWaveMode: { min: 0, max: 7, step: 1 },
  fWaveAlpha: { min: 0.0, max: 2.0, step: 0.01 },
  fWaveScale: { min: 0.1, max: 5.0, step: 0.01 },
  fWaveSmoothing: { min: 0.0, max: 1.0, step: 0.01 },
  fWaveParam: { min: -1.0, max: 1.0, step: 0.01 },
  wave_r: { min: 0.0, max: 1.0, step: 0.01 },
  wave_g: { min: 0.0, max: 1.0, step: 0.01 },
  wave_b: { min: 0.0, max: 1.0, step: 0.01 },
  wave_x: { min: 0.0, max: 1.0, step: 0.01 },
  wave_y: { min: 0.0, max: 1.0, step: 0.01 },
  ob_size: { min: 0.0, max: 1.0, step: 0.01 },
  ob_r: { min: 0.0, max: 1.0, step: 0.01 },
  ob_g: { min: 0.0, max: 1.0, step: 0.01 },
  ob_b: { min: 0.0, max: 1.0, step: 0.01 },
  ob_a: { min: 0.0, max: 1.0, step: 0.01 },
  ib_size: { min: 0.0, max: 1.0, step: 0.01 },
  ib_r: { min: 0.0, max: 1.0, step: 0.01 },
  ib_g: { min: 0.0, max: 1.0, step: 0.01 },
  ib_b: { min: 0.0, max: 1.0, step: 0.01 },
  ib_a: { min: 0.0, max: 1.0, step: 0.01 },
  bAdditiveWaves: { min: 0, max: 1, step: 1 },
  bTexWrap: { min: 0, max: 1, step: 1 },
  bDarkenCenter: { min: 0, max: 1, step: 1 },
  bBrighten: { min: 0, max: 1, step: 1 },
  bDarken: { min: 0, max: 1, step: 1 },
  bSolarize: { min: 0, max: 1, step: 1 },
  bInvert: { min: 0, max: 1, step: 1 },
}

const LABELS = {
  zoom: 'Zoom', rot: 'Rotation', cx: 'Center X', cy: 'Center Y',
  dx: 'Drift X', dy: 'Drift Y', warp: 'Warp', sx: 'Scale X', sy: 'Scale Y',
  fDecay: 'Decay', fGammaAdj: 'Gamma',
  fVideoEchoZoom: 'Echo Zoom', fVideoEchoAlpha: 'Echo Alpha',
  nVideoEchoOrientation: 'Echo Orientation', nWaveMode: 'Wave Mode',
  fWaveAlpha: 'Wave Alpha', fWaveScale: 'Wave Scale',
  fWaveSmoothing: 'Wave Smoothing', fWaveParam: 'Wave Param',
  wave_r: 'Wave R', wave_g: 'Wave G', wave_b: 'Wave B',
  wave_x: 'Wave X', wave_y: 'Wave Y',
  ob_size: 'Outer Border Size', ob_r: 'Outer Border R',
  ob_g: 'Outer Border G', ob_b: 'Outer Border B', ob_a: 'Outer Border A',
  ib_size: 'Inner Border Size', ib_r: 'Inner Border R',
  ib_g: 'Inner Border G', ib_b: 'Inner Border B', ib_a: 'Inner Border A',
  bAdditiveWaves: 'Additive Waves', bTexWrap: 'Tex Wrap',
  bDarkenCenter: 'Darken Center', bBrighten: 'Brighten',
  bDarken: 'Darken', bSolarize: 'Solarize', bInvert: 'Invert',
}

function walk(dir) {
  let results = []
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'desktop.ini') continue
      results = results.concat(walk(full))
    } else if (extname(entry.name).toLowerCase() === '.milk') {
      results.push(full)
    }
  }
  return results
}

function parseMilkFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8')
  const lines = raw.split(/\r?\n/)
  const params = { ...DEFAULTS }
  let inPreset = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '[preset00]') { inPreset = true; continue }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) { inPreset = false; continue }
    if (!inPreset) continue

    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.substring(0, eqIdx).trim()
    const valStr = trimmed.substring(eqIdx + 1).trim()

    if (PARAM_KEYS.includes(key)) {
      const num = parseFloat(valStr)
      if (!isNaN(num)) {
        params[key] = num
      }
    }
  }

  return params
}

function computeMeanParams(allParsed) {
  const means = {}
  for (const key of PARAM_KEYS) {
    let sum = 0
    for (const p of allParsed) sum += p[key]
    means[key] = sum / allParsed.length
  }
  return means
}

function computeUniqueness(parsedParams, means) {
  let score = 0
  for (const key of PARAM_KEYS) {
    const diff = parsedParams[key] - means[key]
    score += diff * diff
  }
  return score
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)
}

function extractTags(name, params) {
  const tags = ['milkdrop']
  const n = name.toLowerCase()
  if (n.includes('tunnel')) tags.push('tunnel')
  if (n.includes('spiral')) tags.push('spiral')
  if (n.includes('fractal') || n.includes('mandel') || n.includes('julia')) tags.push('fractal')
  if (n.includes('star') || n.includes('galaxy') || n.includes('nebula')) tags.push('space')
  if (n.includes('wave') || n.includes('waveform')) tags.push('wave')
  if (n.includes('ring') || n.includes('circle')) tags.push('ring')
  if (n.includes('plasma')) tags.push('plasma')
  if (n.includes('bass')) tags.push('bass')
  if (n.includes('geo') || n.includes('grid') || n.includes('mesh')) tags.push('geometric')
  if (n.includes('pulse') || n.includes('beat')) tags.push('beat')
  if (n.includes('kaleid')) tags.push('kaleidoscope')
  if (n.includes('mirror')) tags.push('mirror')
  if (n.includes('light') || n.includes('glow') || n.includes('neon')) tags.push('light')
  if (tags.length <= 1) {
    if (params.warp > 0.5) tags.push('warp')
    if (params.fDecay < 0.5) tags.push('trail')
    if (params.bSolarize > 0.5) tags.push('solarize')
  }
  return [...new Set(tags)].slice(0, 5)
}

console.log('Scanning .milk files...')
const files = walk(ROOT)
console.log(`Found ${files.length} .milk files`)

const byCategory = {}
let parsed = 0
let errors = 0

for (const filePath of files) {
  const relPath = relative(ROOT, filePath)
  const topFolder = relPath.split(/[/\\]/)[0]
  const category = CATEGORY_MAP[topFolder]
  if (!category) { errors++; continue }

  try {
    const params = parseMilkFile(filePath)
    const name = basename(filePath, '.milk')
    if (!byCategory[category]) byCategory[category] = []
    byCategory[category].push({ filePath, name, params, relPath })
    parsed++
  } catch (e) {
    errors++
  }
}
console.log(`Parsed ${parsed} files (${errors} errors/skipped)`)
for (const [cat, items] of Object.entries(byCategory)) {
  console.log(`  ${cat}: ${items.length} presets`)
}

const allPresets = []
const MEANS = {}
for (const [cat, items] of Object.entries(byCategory)) {
  MEANS[cat] = computeMeanParams(items.map(i => i.params))
}

for (const [cat, items] of Object.entries(byCategory)) {
  const means = MEANS[cat]
  for (const item of items) {
    item.uniqueness = computeUniqueness(item.params, means)
  }

  items.sort((a, b) => {
    const ratingDiff = b.params.fRating - a.params.fRating
    if (Math.abs(ratingDiff) > 0.01) return ratingDiff
    return b.uniqueness - a.uniqueness
  })

  const top = items.slice(0, TOP_N)
  for (const item of top) {
    allPresets.push({ ...item, category: cat })
  }
}

console.log(`\nSelected ${allPresets.length} total presets (${TOP_N} per category)`)

let adapterSource = ''
try {
  adapterSource = readFileSync(ADAPTER_PATH, 'utf-8')
  const match = adapterSource.match(/MILKDROP_ADAPTER_FRAG\s*=\s*`([\s\S]*?)`/)
  if (match) {
    adapterSource = match[1]
  } else {
    throw new Error('Could not extract MILKDROP_ADAPTER_FRAG from adapter file')
  }
} catch (e) {
  console.error('Warning: Could not read adapter file, using inline placeholder:', e.message)
  adapterSource = '// Adapter not found - run milkdrop-adapter-glsl.ts build first'
}

const lines = []
lines.push(`import { ShaderDefinition } from '../utils/types'`)
lines.push('')
lines.push(`const ADAPTER_FRAG = \`${adapterSource}\``)
lines.push('')
lines.push(`export const MILKDROP_PRESETS: ShaderDefinition[] = [`)

for (const preset of allPresets) {
  const p = preset.params
  const slug = slugify(preset.name)
  const id = `md-${slug}`
  const tags = extractTags(preset.name, p)

  const descParts = []
  if (p.nWaveMode === 0) descParts.push('circular')
  else if (p.nWaveMode === 1) descParts.push('radial')
  else if (p.nWaveMode === 2) descParts.push('spectrum')
  else if (p.nWaveMode === 3) descParts.push('rose')
  else if (p.nWaveMode === 4) descParts.push('tunnel')
  else descParts.push('generative')
  if (p.warp > 0.3) descParts.push('warped')
  if (p.fDecay < 0.5) descParts.push('trailing')
  if (p.bSolarize > 0.5) descParts.push('solarized')
  const description = `MilkDrop preset: ${descParts.join(' ')}`

  lines.push(`  {`)
  lines.push(`    id: '${id}',`)
  lines.push(`    name: ${JSON.stringify(preset.name)},`)
  lines.push(`    category: '${preset.category}',`)
  lines.push(`    description: ${JSON.stringify(description)},`)
  lines.push(`    tags: ${JSON.stringify(tags)},`)
  lines.push(`    fragment: ADAPTER_FRAG,`)
  lines.push(`    uniforms: [],`)
  lines.push(`    params: [`)

  const paramIds = Object.keys(DEFAULTS).filter(k => k !== 'fRating')
  for (const key of paramIds) {
    const range = PARAM_RANGES[key]
    if (!range) continue
    lines.push(`      { id: 'md${key.charAt(0).toUpperCase() + key.slice(1)}', label: '${LABELS[key] || key}', min: ${range.min}, max: ${range.max}, default: ${Number(p[key].toFixed(4))}, step: ${range.step} },`)
  }

  lines.push(`    ],`)
  lines.push(`    defaults: {`)

  for (const key of paramIds) {
    lines.push(`      md${key.charAt(0).toUpperCase() + key.slice(1)}: ${Number(p[key].toFixed(4))},`)
  }

  lines.push(`      speed: 1, intensity: 1, distortion: 0, scale: 1, brightness: 1, hueShift: 0, saturation: 1,`)
  lines.push(`    },`)
  lines.push(`    audioMappings: [`)

  if (p.warp > 0.3) {
    lines.push(`      { signal: 'bass', param: 'mdWarp', amount: 0.3, curve: 'log' },`)
  }
  if (p.fDecay < 0.7) {
    lines.push(`      { signal: 'beat', param: 'mdDecay', amount: 0.15, curve: 'linear' },`)
  }
  lines.push(`      { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'linear' },`)
  lines.push(`      { signal: 'treble', param: 'mdWaveAlpha', amount: 0.3, curve: 'linear' },`)

  lines.push(`    ],`)
  lines.push(`    performanceTier: '${preset.category === 'particle' ? 'high' : preset.category === 'fractals' ? 'medium' : 'medium'}',`)
  lines.push(`  },`)
}

lines.push(`]`)
lines.push('')

writeFileSync(OUT, lines.join('\n'), 'utf-8')
console.log(`\nGenerated ${OUT}`)
console.log(`Total presets: ${allPresets.length}`)
