export type ShaderCategory =
  | 'fractals' | 'vj' | 'geometric' | 'liquid'
  | 'cosmic' | 'synthwave' | 'abstract' | 'particle' | 'minimal' | 'milkdrop'

export interface UniformDef {
  name: string
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'sampler2D'
  default: number | number[]
  audioBindable: boolean
}

export interface ParameterSchema {
  id: string
  label: string
  min: number
  max: number
  default: number
  step: number
  unit?: string
  group?: string
}

export type AudioSignal = 'sub' | 'bass' | 'lowMid' | 'mid' | 'highMid' | 'treble' | 'volume' | 'beat' | 'beatPhase'

export type EngineMode = 'free' | 'locked'

export interface AudioMapping {
  signal: AudioSignal
  param: string
  amount: number
  curve: 'linear' | 'log' | 'exp'
}

export interface ShaderDefinition {
  id: string
  name: string
  category: ShaderCategory
  description: string
  tags: string[]
  fragment: string
  vertex?: string
  uniforms: UniformDef[]
  params: ParameterSchema[]
  defaults: Record<string, number>
  audioMappings: AudioMapping[]
  performanceTier: 'low' | 'medium' | 'high' | 'ultra'
}

export interface AudioSnapshot {
  sub: number
  bass: number
  lowMid: number
  mid: number
  highMid: number
  treble: number
  volume: number
  /** @deprecated alias of beatOn — kept for legacy shader mappings */
  beat: boolean
  beatOn: boolean
  beatPhase: number
  beatIntensity: number
  /** per-band smoothed energies, mirrored into named fields */
  bands: Float32Array<ArrayBuffer>
  rms: number
  bpm: number
  /** beat-clock trust 0..1 (comb tracker consistency × 120-prior) */
  confidence: number
  barPhase: number
  downbeatConfidence: number
  eighthPhase: number
  sixteenthPhase: number
  engineMode: EngineMode
  onsetStrength: number
  onsetOn: boolean
  spectralCentroid: number
  rolloff: number
  flatness: number
  zcr: number
  silence: boolean
  waveform: Float32Array<ArrayBuffer>
  spectrum: Uint8Array<ArrayBuffer>
  time: number
}

export const DEFAULT_AUDIO: AudioSnapshot = {
  sub: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0,
  volume: 0, beat: false, beatOn: false, beatPhase: 0, beatIntensity: 0,
  bands: new Float32Array(6),
  rms: 0, bpm: 128, confidence: 0,
  barPhase: 0, downbeatConfidence: 0, eighthPhase: 0, sixteenthPhase: 0,
  engineMode: 'free', onsetStrength: 0, onsetOn: false,
  spectralCentroid: 0, rolloff: 0, flatness: 0, zcr: 0, silence: false,
  waveform: new Float32Array(1024),
  spectrum: new Uint8Array(1024),
  time: 0,
}

export const CATEGORY_LABELS: Record<ShaderCategory, string> = {
  fractals: 'Fractals',
  vj: 'VJ',
  geometric: 'Geometric',
  liquid: 'Liquid',
  cosmic: 'Cosmic',
  synthwave: 'Synthwave',
  abstract: 'Abstract',
  particle: 'Particle',
  minimal: 'Minimal',
  milkdrop: 'MilkDrop',
}

export const TIER_COLORS: Record<string, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
  ultra: '#A855F7',
}
