import { useEffect } from 'react'
import { useUIStore, useShaderStore } from '../state/stores'
import { SHADER_LIBRARY } from '../shaders/library'
import { BootSequence } from './BootSequence'
import { CanvasLayer } from './CanvasLayer'
import { TopBar } from './TopBar'
import { LeftPanel } from './LeftPanel'
import { StreamGraph } from './StreamGraph'
import { ShaderCreator } from './ShaderCreator'
import { CommandPalette } from './CommandPalette'
import { AudioInitBar } from './AudioInitPanel'
import { ParameterPanel } from './ParameterPanel'
import { EQMappingPanel } from './EQMappingPanel'
import { ImmersiveMode } from './ImmersiveMode'

function randomShader() {
  const current = useShaderStore.getState().activeShader
  if (SHADER_LIBRARY.length <= 1) return
  let next = current
  while (next?.id === current?.id && SHADER_LIBRARY.length > 1) {
    next = SHADER_LIBRARY[Math.floor(Math.random() * SHADER_LIBRARY.length)]
  }
  if (next) useShaderStore.getState().setActiveShader(next)
}

function cycleShader(direction: 1 | -1) {
  const current = useShaderStore.getState().activeShader
  const idx = SHADER_LIBRARY.findIndex(s => s.id === current?.id) ?? 0
  const next = SHADER_LIBRARY[(idx + direction + SHADER_LIBRARY.length) % SHADER_LIBRARY.length]
  if (next) useShaderStore.getState().setActiveShader(next)
}

export function App() {
  const bootComplete = useUIStore(s => s.bootComplete)
  const immersive = useUIStore(s => s.immersive)
  const creatorOpen = useUIStore(s => s.creatorOpen)
  const commandPaletteOpen = useUIStore(s => s.commandPaletteOpen)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const store = useUIStore.getState()
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      if (e.key === 'Escape') {
        if (store.commandPaletteOpen) store.toggleCommandPalette()
        else if (store.creatorOpen) store.toggleCreator()
        else if (store.browserOpen) store.toggleBrowser()
        else if (store.immersive) store.toggleImmersive()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        store.toggleCommandPalette()
      }
      if (store.immersive && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.code === 'Space') {
          e.preventDefault()
          randomShader()
          return
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          cycleShader(1)
          return
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          cycleShader(-1)
          return
        }
      }
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === 'b') store.toggleBrowser()
        if (e.key === 'n') store.toggleCreator()
        if (e.key === 'f') store.toggleImmersive()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
      {!bootComplete && <BootSequence />}
      <CanvasLayer />
      <ImmersiveMode />
      {bootComplete && !immersive && <TopBar />}
      {bootComplete && !immersive && <LeftPanel />}
      {bootComplete && !immersive && <StreamGraph />}
      {bootComplete && !immersive && <ParameterPanel />}
      {bootComplete && !immersive && <EQMappingPanel />}
      {bootComplete && <AudioInitBar />}
      {bootComplete && creatorOpen && !immersive && <ShaderCreator />}
      {commandPaletteOpen && <CommandPalette />}
    </div>
  )
}
