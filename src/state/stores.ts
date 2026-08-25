import { create } from 'zustand'
import { ShaderDefinition, AudioSnapshot, DEFAULT_AUDIO } from '../utils/types'

function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
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
  panelTab: 'browser' | 'creator' | null
  qualityTier: 'low' | 'medium' | 'high' | 'ultra'
  reducedMotion: boolean
  setBootComplete: (v: boolean) => void
  toggleImmersive: () => void
  toggleBrowser: () => void
  toggleCreator: () => void
  toggleCommandPalette: () => void
  setPanelTab: (tab: 'browser' | 'creator' | null) => void
  setQualityTier: (tier: 'low' | 'medium' | 'high' | 'ultra') => void
  setReducedMotion: (v: boolean) => void
}

const reducedMotionDefault = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

export const useUIStore = create<UIStore>((set) => ({
  bootComplete: false,
  immersive: false,
  browserOpen: false,
  creatorOpen: false,
  commandPaletteOpen: false,
  panelTab: null,
  qualityTier: 'high',
  reducedMotion: reducedMotionDefault,
  setBootComplete: (v) => set({ bootComplete: v }),
  toggleImmersive: () => set((s) => ({ immersive: !s.immersive, browserOpen: false, creatorOpen: false })),
  toggleBrowser: () => set((s) => ({ browserOpen: !s.browserOpen, creatorOpen: false, panelTab: s.browserOpen ? null : 'browser' })),
  toggleCreator: () => set((s) => ({ creatorOpen: !s.creatorOpen, browserOpen: false, panelTab: s.creatorOpen ? null : 'creator' })),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setPanelTab: (tab) => set({ panelTab: tab }),
  setQualityTier: (tier) => set({ qualityTier: tier }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
}))

interface ShaderStore {
  activeShader: ShaderDefinition | null
  params: Record<string, number>
  favorites: string[]
  recent: string[]
  setActiveShader: (shader: ShaderDefinition) => void
  setParam: (id: string, value: number) => void
  setParams: (params: Record<string, number>) => void
  toggleFavorite: (id: string) => void
}

const savedFavorites = JSON.parse(safeGetItem('animesh-favorites') || '[]')
const savedRecent = JSON.parse(safeGetItem('animesh-recent') || '[]')

export const useShaderStore = create<ShaderStore>((set) => ({
  activeShader: null,
  params: {},
  favorites: savedFavorites,
  recent: savedRecent,
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
}))

interface AudioStore {
  sourceType: 'none' | 'mic' | 'file' | 'demo' | 'system'
  permissionState: 'unknown' | 'granted' | 'denied' | 'prompt'
  snapshot: AudioSnapshot
  playing: boolean
  setSourceType: (type: AudioStore['sourceType']) => void
  setPermissionState: (state: AudioStore['permissionState']) => void
  setSnapshot: (snapshot: AudioSnapshot) => void
  setPlaying: (v: boolean) => void
}

export const useAudioStore = create<AudioStore>((set) => ({
  sourceType: 'none',
  permissionState: 'unknown',
  snapshot: createDefaultSnapshot(),
  playing: false,
  setSourceType: (sourceType) => set({ sourceType }),
  setPermissionState: (permissionState) => set({ permissionState }),
  setSnapshot: (snapshot) => set({ snapshot }),
  setPlaying: (playing) => set({ playing }),
}))

export const audioDataBridge = {
  snapshot: createDefaultSnapshot(),
  fps: 0,
  beatPulse: 0,
}
