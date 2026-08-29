import { create } from 'zustand'
import { ShaderDefinition, AudioMapping, DEFAULT_AUDIO, AudioSnapshot, Visual } from '../utils/types'
import { SHADER_LIBRARY } from '../shaders/library'
import { DEFAULT_PROFILE, MACRO_IDS, MacroId } from '../mappings/featureGraph'
import { pushEntry, applyUndo, HistoryEntry } from './history'
import { ShaderPreset } from '../shaders/heroPresets'
import { announce } from '../a11y/announcer'

function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}
function safeJSONParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

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
  creatorOpen: boolean
  commandPaletteOpen: boolean
  panelsVisible: boolean
  panelTab: 'browser' | 'creator' | null
  reducedMotion: boolean
  minimizedPanels: string[]
  streamPreset: 'stream' | 'spectrum' | 'bars' | 'oscilloscope' | 'radial' | 'mirror' | 'wavebars' | 'meter' | 'vectorscope'
  perfVisible: boolean
  /** auto-transition interval in beats for immersive mode: 0 = off */
  autoCycleBeats: 0 | 4 | 8 | 16 | 32
  setBootComplete: (v: boolean) => void
  setAutoCycleBeats: (beats: 0 | 4 | 8 | 16 | 32) => void
  toggleImmersive: () => void
  toggleBrowser: () => void
  toggleCreator: () => void
  toggleCommandPalette: () => void
  togglePanelsVisible: () => void
  setPanelTab: (tab: 'browser' | 'creator' | null) => void
  setReducedMotion: (v: boolean) => void
  togglePanelMinimized: (id: string) => void
  isPanelMinimized: (id: string) => boolean
  setStreamPreset: (preset: UIStore['streamPreset']) => void
  togglePerf: () => void
}

const reducedMotionDefault = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

export const useUIStore = create<UIStore>((set, get) => ({
  bootComplete: false,
  immersive: false,
  browserOpen: false,
  creatorOpen: false,
  commandPaletteOpen: false,
  panelsVisible: true,
  panelTab: null,
  reducedMotion: reducedMotionDefault,
  minimizedPanels: [],
  streamPreset: 'stream',
  perfVisible: false,
  autoCycleBeats: 16,
  setBootComplete: (v) => set({ bootComplete: v }),
  setAutoCycleBeats: (autoCycleBeats) => set({ autoCycleBeats }),
  toggleImmersive: () => set((s) => ({ immersive: !s.immersive, browserOpen: false, creatorOpen: false, commandPaletteOpen: false })),
  toggleBrowser: () => set((s) => ({ browserOpen: !s.browserOpen, creatorOpen: false, panelTab: s.browserOpen ? null : 'browser' })),
  toggleCreator: () => set((s) => ({ creatorOpen: !s.creatorOpen, browserOpen: false, panelTab: s.creatorOpen ? null : 'creator' })),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  togglePanelsVisible: () => set((s) => {
    const panelsVisible = !s.panelsVisible
    // Show right panels: also un-minimize the parameter + EQ mapping boxes so
    // they are actually visible again after being toggled back on.
    const minimizedPanels = panelsVisible
      ? s.minimizedPanels.filter(id => id !== 'params' && id !== 'eq')
      : s.minimizedPanels
    return { panelsVisible, minimizedPanels }
  }),
  setPanelTab: (tab) => set({ panelTab: tab }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  togglePanelMinimized: (id) => set((s) => {
    const minimized = s.minimizedPanels.includes(id)
      ? s.minimizedPanels.filter(p => p !== id)
      : [...s.minimizedPanels, id]
    return { minimizedPanels: minimized }
  }),
  isPanelMinimized: (id) => get().minimizedPanels.includes(id),
  setStreamPreset: (streamPreset) => set({ streamPreset }),
  togglePerf: () => set((s) => ({ perfVisible: !s.perfVisible })),
}))

interface ShaderStore {
  activeShader: ShaderDefinition | null
  activeVisual: Visual | null
  params: Record<string, number>
  favorites: string[]
  recent: string[]
  customAudioMappings: AudioMapping[]
  history: HistoryEntry[]
  savedChips: Record<string, ShaderPreset[]>
  setActiveShader: (shader: ShaderDefinition) => void
  setActiveVisual: (visual: Visual) => void
  setParam: (id: string, value: number) => void
  setParams: (params: Record<string, number>) => void
  commitParams: (params: Record<string, number>) => void
  undo: () => void
  saveChip: (name: string, params: Record<string, number>) => void
  removeChip: (shaderId: string, index: number) => void
  toggleFavorite: (id: string) => void
  setCustomAudioMappings: (mappings: AudioMapping[]) => void
  addCustomAudioMapping: (mapping: AudioMapping) => void
  removeCustomAudioMapping: (index: number) => void
  updateCustomAudioMapping: (index: number, mapping: AudioMapping) => void
}

const savedFavorites = safeJSONParse<string[]>(safeGetItem('animesh-favorites'), [])
const savedRecent = safeJSONParse<string[]>(safeGetItem('animesh-recent'), [])
const savedChips = safeJSONParse<Record<string, ShaderPreset[]>>(safeGetItem('animesh-chips'), {})

const defaultShader = SHADER_LIBRARY.length > 0
  ? SHADER_LIBRARY[Math.floor(Math.random() * SHADER_LIBRARY.length)]
  : null

export const useShaderStore = create<ShaderStore>((set) => ({
  activeShader: defaultShader,
  activeVisual: defaultShader,
  params: defaultShader ? { ...defaultShader.defaults } : {},
  favorites: savedFavorites,
  recent: savedRecent,
  customAudioMappings: [],
  history: [],
  savedChips,
  setActiveShader: (shader) => set((s) => {
    const newRecent = [shader.id, ...s.recent.filter(id => id !== shader.id)].slice(0, 20)
    safeSetItem('animesh-recent', JSON.stringify(newRecent))
    announce(`Switched to ${shader.name}`)
    return {
      activeShader: shader,
      activeVisual: shader,
      params: { ...shader.defaults },
      recent: newRecent,
      history: pushEntry(s.history, { shaderId: s.activeShader?.id ?? '', params: { ...s.params } }),
    }
  }),
  setActiveVisual: (visual) => set((s) => {
    const newRecent = [visual.id, ...s.recent.filter(id => id !== visual.id)].slice(0, 20)
    safeSetItem('animesh-recent', JSON.stringify(newRecent))
    announce(`Switched to ${visual.name}`)
    const prevShaderId = s.activeVisual?.kind === 'shader' ? s.activeVisual.id : (s.activeShader?.id ?? '')
    return {
      activeVisual: visual,
      activeShader: visual.kind === 'shader' ? visual : null,
      params: { ...visual.defaults },
      recent: newRecent,
      history: pushEntry(s.history, { shaderId: prevShaderId, params: { ...s.params } }),
    }
  }),
  setParam: (id, value) => set((s) => ({ params: { ...s.params, [id]: value } })),
  setParams: (params) => set({ params }),
  commitParams: (params) => set((s) => ({
    params,
    history: pushEntry(s.history, { shaderId: s.activeShader?.id ?? '', params: { ...s.params } }),
  })),
  undo: () => set((s) => {
    const { stack, restored } = applyUndo(s.history)
    if (!restored) return {}
    const shader = SHADER_LIBRARY.find(x => x.id === restored.shaderId)
    return {
      history: stack,
      activeShader: shader ?? s.activeShader,
      activeVisual: shader ?? s.activeVisual,
      params: { ...restored.params },
    }
  }),
  saveChip: (name, params) => set((s) => {
    const shaderId = s.activeShader?.id ?? ''
    if (!shaderId || !name.trim()) return {}
    const clean = name.trim()
    const existing = s.savedChips[shaderId] ?? []
    const next = { ...s.savedChips, [shaderId]: [...existing, { name: clean, params: { ...params }, custom: true }] }
    safeSetItem('animesh-chips', JSON.stringify(next))
    announce(`Preset ${clean} saved`)
    return { savedChips: next }
  }),
  removeChip: (shaderId, index) => set((s) => {
    const existing = s.savedChips[shaderId] ?? []
    const next = { ...s.savedChips, [shaderId]: existing.filter((_, i) => i !== index) }
    safeSetItem('animesh-chips', JSON.stringify(next))
    return { savedChips: next }
  }),
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
  frameMs: 0,
  gpuMs: 0,
  scale: 1,
  resolution: '',
  cacheSize: 0,
  // MacroBar (D26) faders: single pointer handler writes these; the renderer
  // reads them each frame via the graph profile (ref-driven, zero React churn).
  macros: { ...DEFAULT_PROFILE.macros } as Record<MacroId, number>,
}

export { MACRO_IDS }
