export type ShaderCategory =
  | 'fractals' | 'vj' | 'geometric' | 'liquid'
  | 'cosmic' | 'synthwave' | 'abstract' | 'particle' | 'minimal'

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
  beat: boolean
  beatPhase: number
  beatIntensity: number
  waveform: Float32Array<ArrayBuffer>
  spectrum: Uint8Array<ArrayBuffer>
  bpm: number
  time: number
  spectralCentroid: number
}

export interface RenderState {
  gl: WebGL2RenderingContext
  canvas: HTMLCanvasElement
  program: WebGLProgram | null
  vao: WebGLVertexArrayObject | null
  quadBuffer: WebGLBuffer | null
  fboA: WebGLFramebuffer | null
  fboB: WebGLFramebuffer | null
  fboATexture: WebGLTexture | null
  fboBTexture: WebGLTexture | null
  width: number
  height: number
  dpr: number
  qualityTier: 'low' | 'medium' | 'high' | 'ultra'
}

export const DEFAULT_AUDIO: AudioSnapshot = {
  sub: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0,
  volume: 0, beat: false, beatPhase: 0, beatIntensity: 0,
  waveform: new Float32Array(1024),
  spectrum: new Uint8Array(1024),
  bpm: 128, time: 0, spectralCentroid: 0,
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
}

export const TIER_COLORS: Record<string, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
  ultra: '#A855F7',
}
