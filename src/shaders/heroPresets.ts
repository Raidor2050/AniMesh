/**
 * Preset chips (D27) for the ten Hero shaders. Each preset is a partial param
 * override applied on top of the shader defaults. Kept data-only so the UI and
 * tests can consume it without React.
 */
export interface ShaderPreset {
  name: string
  params: Record<string, number>
  /** true when the user saved it (rendered with a remove affordance) */
  custom?: boolean
}

export const HERO_PRESETS: Record<string, ShaderPreset[]> = {
  'hero-plasma-flow': [
    { name: 'Veins', params: { sparkle: 0.6, intensity: 1.2 } },
    { name: 'Cold Plasma', params: { hueShift: 2.6, sparkle: 0.2, speed: 1.4 } },
    { name: 'Ember', params: { hueShift: 4.2, brightness: 1.3, intensity: 1.1 } },
  ],
  'hero-vorton': [
    { name: 'Tight Cells', params: { cells: 10, intensity: 1.3 } },
    { name: 'Bloom Drift', params: { cells: 4, brightness: 1.2, speed: 0.8 } },
    { name: 'Sparse', params: { cells: 3, distortion: 0.5 } },
  ],
  'hero-ripple-grid': [
    { name: 'Deep Ripples', params: { rippleCount: 6, intensity: 1.15 } },
    { name: 'Quiet Pools', params: { rippleCount: 1, brightness: 0.8 } },
    { name: 'Fast Waves', params: { rippleCount: 4, speed: 1.6 } },
  ],
  'hero-spectrum-tower': [
    { name: 'Columns', params: { intensity: 1.2, saturation: 1.4 } },
    { name: 'Vivid Bands', params: { saturation: 1.8, brightness: 1.2 } },
    { name: 'Muted Stage', params: { brightness: 0.8, saturation: 0.7, intensity: 0.9 } },
  ],
  'hero-nebula': [
    { name: 'Deep Space', params: { intensity: 1.3, brightness: 1.1 } },
    { name: 'Magenta Dream', params: { hueShift: 3.4, saturation: 1.5 } },
    { name: 'Dark Mist', params: { brightness: 0.7, saturation: 0.8 } },
  ],
  'hero-lattice': [
    { name: 'Dense Lattice', params: { lattice: 8, intensity: 1.2 } },
    { name: 'Breathing Cores', params: { lattice: 5, speed: 0.8, brightness: 1.2 } },
    { name: 'Skeleton', params: { lattice: 3, saturation: 0.6, intensity: 0.8 } },
  ],
  'hero-aurora-drift': [
    { name: 'Northern', params: { saturation: 1.4, intensity: 1.15 } },
    { name: 'Violet Night', params: { hueShift: 4.8, brightness: 1.1 } },
    { name: 'Pale Veil', params: { brightness: 0.7, saturation: 0.6 } },
  ],
  'hero-mandala-bloom': [
    { name: 'Full Bloom', params: { petals: 16, intensity: 1.2 } },
    { name: 'Eightfold', params: { petals: 8, speed: 0.7 } },
    { name: 'Slow Dance', params: { petals: 6, speed: 0.5, brightness: 1.2 } },
  ],
  'hero-warp-speed': [
    { name: 'Hyperdrive', params: { intensity: 1.4, speed: 1.8 } },
    { name: 'Cruise', params: { speed: 0.9, intensity: 1.0 } },
    { name: 'Warp Idle', params: { speed: 0.5, brightness: 0.9 } },
  ],
  'hero-cosmic-web': [
    { name: 'Webbed', params: { webSize: 3, brightness: 1.1 } },
    { name: 'Filaments', params: { webSize: 2, saturation: 1.6 } },
    { name: 'Sparse Threads', params: { webSize: 1.5, intensity: 0.9 } },
  ],
}

export function getHeroPresets(id: string): ShaderPreset[] {
  return HERO_PRESETS[id] ?? []
}

export function mergePresets(builtin: ShaderPreset[], custom: ShaderPreset[]): ShaderPreset[] {
  return [...builtin, ...custom]
}