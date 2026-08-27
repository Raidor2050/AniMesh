import { create } from 'zustand'
import { ShaderDefinition, AudioMapping, DEFAULT_AUDIO, AudioSnapshot } from '../utils/types'
import { SHADER_LIBRARY } from '../shaders/library'

function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}

// repo-hunter adoption (zustand persist pattern, zero-dep): UI preferences
// survive reloads so the instrument layout returns exactly as the VJ left it.
type QualityTier = 'low' | 'medium' | 'high' | 'ultra'
type StreamPreset = 'stream' | 'spectrum' | 'bars' | 'oscilloscope'

function saveUIPrefs(next: Partial<{ qualityTier: QualityTier; streamPreset: StreamPreset; minimizedPanels: string[]; panelsVisible: boolean }>) {
  const cur = JSON.parse(safeGetItem('animesh-ui-prefs') || '{}') as Record<string, unknown>
  safeSetItem('animesh-ui-prefs', JSON.stringify({ ...cur, ...next }))
}

const savedPrefs = JSON.parse(safeGetItem('animesh-ui-prefs') || '{}') as Record<string, unknown>

function createDefaultSnapshot(): AudioSnapshot {
  return {
    ...DEFAULT_AUDIO,
    waveform: new Float32Array(1024),
    spectrum: new Uint8Array(1024),
  }
}

interface UIStore {
  bootComplete: boolean
  immersive: boolean
  browserOpen: boolean
  carouselOpen: boolean
  creatorOpen: boolean
  commandPaletteOpen: boolean
  panelsVisible: boolean
  panelTab: 'browser' | 'creator' | null
  qualityTier: QualityTier
  reducedMotion: boolean
  minimizedPanels: string[]
  streamPreset: StreamPreset
  setBootComplete: (v: boolean) => void
  toggleImmersive: () => void
  toggleBrowser: () => void
  toggleCarousel: () => void
  toggleCreator: () => void
  toggleCommandPalette: () => void
  togglePanelsVisible: () => void
  setPanelTab: (tab: 'browser' | 'creator' | null) => void
  setQualityTier: (tier: QualityTier) => void
  setReducedMotion: (v: boolean) => void
  togglePanelMinimized: (id: string) => void
  isPanelMinimized: (id: string) => boolean
  setStreamPreset: (preset: StreamPreset) => void
}

const reducedMotionDefault = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

const uiQualityTier = (savedPrefs.qualityTier as QualityTier) ?? 'high'
const uiStreamPreset = (savedPrefs.streamPreset as StreamPreset) ?? 'stream'
const uiMinimizedPanels = Array.isArray(savedPrefs.minimizedPanels) ? savedPrefs.minimizedPanels as string[] : []
const uiPanelsVisible = typeof savedPrefs.panelsVisible === 'boolean' ? savedPrefs.panelsVisible : true

export const useUIStore = create<UIStore>((set, get) => ({
  bootComplete: false,
  immersive: false,
  browserOpen: false,
  carouselOpen: false,
  creatorOpen: false,
  commandPaletteOpen: false,
  panelsVisible: uiPanelsVisible,
  panelTab: null,
  qualityTier: uiQualityTier,
  reducedMotion: reducedMotionDefault,
  minimizedPanels: uiMinimizedPanels,
  streamPreset: uiStreamPreset,
  setBootComplete: (v) => set({ bootComplete: v }),
  toggleImmersive: () => set((s) => ({ immersive: !s.immersive, browserOpen: false, carouselOpen: false, creatorOpen: false, commandPaletteOpen: false })),
  toggleBrowser: () => set((s) => ({ browserOpen: !s.browserOpen, carouselOpen: false, creatorOpen: false, panelTab: s.browserOpen ? null : 'browser' })),
  toggleCarousel: () => set((s) => ({ carouselOpen: !s.carouselOpen, browserOpen: false, creatorOpen: false, panelTab: null })),
  toggleCreator: () => set((s) => ({ creatorOpen: !s.creatorOpen, browserOpen: false, carouselOpen: false, panelTab: s.creatorOpen ? null : 'creator' })),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  togglePanelsVisible: () => set((s) => {
    const panelsVisible = !s.panelsVisible
    saveUIPrefs({ panelsVisible })
    return { panelsVisible }
  }),
  setPanelTab: (tab) => set({ panelTab: tab }),
  setQualityTier: (tier) => { set({ qualityTier: tier }); saveUIPrefs({ qualityTier: tier }) },
  setReducedMotion: (v) => set({ reducedMotion: v }),
  togglePanelMinimized: (id) => set((s) => {
    const minimizedPanels = s.minimizedPanels.includes(id)
      ? s.minimizedPanels.filter(p => p !== id)
      : [...s.minimizedPanels, id]
    saveUIPrefs({ minimizedPanels })
    return { minimizedPanels }
  }),
  isPanelMinimized: (id) => get().minimizedPanels.includes(id),
  setStreamPreset: (streamPreset) => { set({ streamPreset }); saveUIPrefs({ streamPreset }) },
}))

interface ShaderStore {
  activeShader: ShaderDefinition | null
  params: Record<string, number>
  favorites: string[]
  recent: string[]
  customAudioMappings: AudioMapping[]
  setActiveShader: (shader: ShaderDefinition) => void
  setParam: (id: string, value: number) => void
  setParams: (params: Record<string, number>) => void
  toggleFavorite: (id: string) => void
  setCustomAudioMappings: (mappings: AudioMapping[]) => void
  addCustomAudioMapping: (mapping: AudioMapping) => void
  removeCustomAudioMapping: (index: number) => void
  updateCustomAudioMapping: (index: number, mapping: AudioMapping) => void
}

const savedFavorites = JSON.parse(safeGetItem('animesh-favorites') || '[]')
const savedRecent = JSON.parse(safeGetItem('animesh-recent') || '[]')

const defaultShader = SHADER_LIBRARY.length > 0
  ? SHADER_LIBRARY[Math.floor(Math.random() * SHADER_LIBRARY.length)]
  : null

export const useShaderStore = create<ShaderStore>((set) => ({
  activeShader: defaultShader,
  params: defaultShader ? { ...defaultShader.defaults } : {},
  favorites: savedFavorites,
  recent: savedRecent,
  customAudioMappings: [],
  setActiveShader: (shader) => set((s) => {
    const newRecent = [shader.id, ...s.recent.filter(id => id !== shader.id)].slice(0, 20)
    safeSetItem('animesh-recent', JSON.stringify(newRecent))
    return {
      activeShader: shader,
      params: { ...shader.defaults },
      recent: newRecent,
    }
  }),
  setParam: (id, value) => set((s) => ({ params: { ...s.params, [id]: value } })),
  setParams: (params) => set({ params }),
  toggleFavorite: (id) => set((s) => {
    const favs = s.favorites.includes(id)
      ? s.favorites.filter(f => f !== id)
      : [...s.favorites, id]
    safeSetItem('animesh-favorites', JSON.stringify(favs))
    return { favorites: favs }
  }),
  setCustomAudioMappings: (customAudioMappings) => set({ customAudioMappings }),
  addCustomAudioMapping: (mapping) => set((s) => ({ customAudioMappings: [...s.customAudioMappings, mapping] })),
  removeCustomAudioMapping: (index) => set((s) => ({
    customAudioMappings: s.customAudioMappings.filter((_, i) => i !== index),
  })),
  updateCustomAudioMapping: (index, mapping) => set((s) => ({
    customAudioMappings: s.customAudioMappings.map((m, i) => i === index ? mapping : m),
  })),
}))

type BPMMode = 'auto' | 'manual' | 'tap'

interface AudioStore {
  sourceType: 'none' | 'mic' | 'file' | 'demo' | 'system'
  bpmMode: BPMMode
  manualBpm: number
  setSourceType: (type: AudioStore['sourceType']) => void
  setBpmMode: (mode: BPMMode) => void
  setManualBpm: (bpm: number) => void
}

export const useAudioStore = create<AudioStore>((set) => ({
  sourceType: 'none',
  bpmMode: 'auto',
  manualBpm: 128,
  setSourceType: (sourceType) => set({ sourceType }),
  setBpmMode: (bpmMode) => set({ bpmMode }),
  setManualBpm: (manualBpm) => set({ manualBpm }),
}))

export const audioDataBridge = {
  snapshot: createDefaultSnapshot(),
  fps: 0,
}
