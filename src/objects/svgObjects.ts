// SVG pattern-object library (Phase-25). Pure definition data: each entry
// describes one audio-reactive SVG object (layout + tuning spec). The runtime
// lives in svgCore.ts; SvgObjectLayer mounts the active one. These are NOT
// ShaderDefinitions and are intentionally excluded from SHADER_LIBRARY (so the
// GL catalog / compile-sweep / prewarm pipeline stays untouched) — they join
// visuals via VISUAL_LIBRARY in visualLibrary.ts.
import { AudioMapping, ParameterSchema, ShaderCategory, SvgLayoutKey, SvgObjectDefinition } from '../utils/types'

const BASE_PARAMS = (countDefault: number): ParameterSchema[] => [
  { id: 'speed', label: 'Speed', min: 0.1, max: 5, default: 1, step: 0.05 },
  { id: 'intensity', label: 'Intensity', min: 0, max: 3, default: 1, step: 0.05, group: 'Shape' },
  { id: 'scale', label: 'Scale', min: 0.25, max: 2.5, default: 1, step: 0.05, group: 'Shape' },
  { id: 'brightness', label: 'Brightness', min: 0, max: 2, default: 1, step: 0.05, group: 'Color' },
  { id: 'hueShift', label: 'Hue Shift', min: 0, max: 1.5, default: 0, step: 0.01, unit: 'cyc', group: 'Color' },
  { id: 'count', label: 'Detail', min: 2, max: 32, default: countDefault, step: 1, group: 'Shape' },
]

const BASE_DEFAULTS = (countDefault: number) => ({
  speed: 1, intensity: 1, scale: 1, brightness: 1, hueShift: 0, count: countDefault,
})

const BASE_MAPPINGS: AudioMapping[] = [
  { signal: 'bass', param: 'scale', amount: 0.35, curve: 'linear' },
  { signal: 'volume', param: 'brightness', amount: 0.18, curve: 'linear' },
  { signal: 'beat', param: 'intensity', amount: 0.16, curve: 'linear' },
  { signal: 'beatPhase', param: 'hueShift', amount: 0.07, curve: 'linear' },
]

interface LayoutMeta {
  category: ShaderCategory
  tier: SvgObjectDefinition['performanceTier']
  countDefault: number
  description: string
  names: string[]
  specs: Record<string, number>[]
}

const LAYOUT_META: Record<SvgLayoutKey, LayoutMeta> = {
  rings: {
    category: 'geometric', tier: 'high', countDefault: 6,
    description: 'Concentric rings that bloom outward on bass while the whole suite spins with the beat phase; the innermost ring flashes on each kick.',
    names: ['Halo', 'Pulse', 'Nexus', 'Tide', 'Prism'],
    specs: [ {}, { count: 8 }, { count: 5 }, { count: 9 }, { count: 7 } ],
  },
  rose: {
    category: 'abstract', tier: 'high', countDefault: 5,
    description: 'Rose curve whose petal amplitude swells with bass; rotated by beat phase, hue riding the spectral centroid.',
    names: ['Aurora Rose', 'Bloom', 'Mandorla', 'Solar Rose', 'Ion Bloom'],
    specs: [ { count: 5 }, { count: 7 }, { count: 4 }, { count: 6 }, { count: 8 } ],
  },
  spiro: {
    category: 'cosmic', tier: 'ultra', countDefault: 6,
    description: 'Hypotrochoid spirograph — an outer trace and its phase-shifted echo redraw on a slow shutter while rotation is driven by the spectral centroid.',
    names: ['Nebula Trace', 'Hypno','Echo','Twin Orbit','Prism Carousel'],
    specs: [ { count: 5 }, { count: 7 }, { count: 6 }, { count: 9 }, { count: 8 } ],
  },
  lissajous: {
    category: 'vj', tier: 'high', countDefault: 3,
    description: 'Lissajous figure whose frequency pair and width react to bass while the phase advances with the beat phase — the classic oscilloscope figure.',
    names: ['Scope Field', 'Chord Curve', 'Quadrature', 'Sextant', 'Major Griffin'],
    specs: [ { count: 3 }, { count: 4 }, { count: 5 }, { count: 6 }, { count: 2 } ],
  },
  polarSpectrum: {
    category: 'particle', tier: 'high', countDefault: 64,
    description: 'Radial spectrum rings — 64 FFT bands laid out as rotating spokes that grow with the live spectrum.',
    names: ['Spectrum Crown', 'Bloom Bars', 'Aurora Spokes', 'FFT Sun', 'Polar Trace'],
    specs: [ { density: 1 }, { density: 0.8 }, { density: 1.2 }, { density: 0.9 }, { density: 1.1 } ],
  },
  radialBars: {
    category: 'vj', tier: 'medium', countDefault: 36,
    description: 'Classic spectrum bars arranged radially from a bass-swelled ring, spinning slowly through the track.',
    names: ['Bass Ring', 'Octave Wheel', 'Ring EQ', 'Pulse Halo', 'Reactor'],
    specs: [ {}, { count: 48 }, { count: 32 }, { count: 40 }, { count: 28 } ],
  },
  waveform: {
    category: 'minimal', tier: 'high', countDefault: 96,
    description: 'Live waveform painted stroke-by-stroke — the top trace follows the sample and the lower trace its mirror, both swelling on bass.',
    names: ['Oscillo', 'Stitch', 'Pulse Line', 'Heartbeat', 'Scribe'],
    specs: [ {}, { mirror: 0.66 }, { mirror: 1 }, { mirror: 0.4 }, { mirror: 0.8 } ],
  },
  mandala: {
    category: 'geometric', tier: 'high', countDefault: 10,
    description: 'Mandala of mirrored petals that breathe outward with treble; individual petals flicker with their own spectral band.',
    names: ['Kaleido Mandala', 'Radiance', 'Temple', 'Star Gate', 'Yantra'],
    specs: [ {}, { count: 8 }, { count: 12 }, { count: 6 }, { count: 14 } ],
  },
  orbits: {
    category: 'cosmic', tier: 'high', countDefault: 9,
    description: 'Planetary dots orbiting on a bass-expanding ring; each dot pulses with its own spectral band.',
    names: ['Solar System', 'Atom Shell', 'Satellite', 'Electron', 'Moon Dance'],
    specs: [ {}, { count: 7 }, { count: 11 }, { count: 5 }, { count: 13 } ],
  },
  flowDash: {
    category: 'synthwave', tier: 'low', countDefault: 12,
    description: 'A single dashed ring whose dash rhythm is carved from BPM and whose offset pours with the beat — deceptively cheap, hypnotic.',
    names: ['Retro Track', 'Sun Runner', 'Dash', 'Beatline', 'Warp Ring'],
    specs: [ {}, { gap: 1.4 }, { gap: 0.7 }, { gap: 2 }, { gap: 1 } ],
  },
  grid: {
    category: 'minimal', tier: 'medium', countDefault: 6,
    description: 'Dancing cell grid — each box lights with its mapped spectral band; mild breathing on sub-bass.',
    names: ['Equalizer', 'Tiles', 'Matrix Bloom', 'Pixor', 'Cells'],
    specs: [ {}, { count: 5 }, { count: 7 }, { count: 4 }, { count: 8 } ],
  },
  petals: {
    category: 'liquid', tier: 'high', countDefault: 10,
    description: 'Blooming petals radiate from center, scaling with individual bands and orbiting on the beat phase.',
    names: ['Lotus Wheel', 'Bloom', 'Ripple', 'Vortex', 'Sunburst'],
    specs: [ {}, { count: 12 }, { count: 8 }, { count: 14 }, { count: 16 } ],
  },
}

export function genSvgs(): SvgObjectDefinition[] {
  const out: SvgObjectDefinition[] = []
  ;(Object.keys(LAYOUT_META) as SvgLayoutKey[]).forEach((layout) => {
    const meta = LAYOUT_META[layout]
    meta.names.forEach((nameSuffix, k) => {
      const spec = { ...(meta.specs[k] ?? {}) }
      const countDefault = typeof meta.specs[k]?.count === 'number' ? (meta.specs[k]?.count as number) : meta.countDefault
      out.push({
        kind: 'svg',
        id: `svg-${layout}-${k + 1}`,
        name: `${layout === 'rose' ? 'Rose' : layout === 'rings' ? 'Rings' : name(layout)} · ${nameSuffix}`,
        category: meta.category,
        description: meta.description,
        tags: ['svg', layout, 'reactive', 'ai'],
        layout,
        spec,
        params: BASE_PARAMS(countDefault),
        defaults: BASE_DEFAULTS(countDefault),
        audioMappings: BASE_MAPPINGS,
        performanceTier: meta.tier,
      })
    })
  })
  return out
}

function name(layout: string): string {
  return layout === 'polarSpectrum' ? 'Spectrum' : layout.charAt(0).toUpperCase() + layout.slice(1)
}

export const SVG_OBJECTS: SvgObjectDefinition[] = genSvgs()

export function getSvgCount(): number {
  return SVG_OBJECTS.length
}
