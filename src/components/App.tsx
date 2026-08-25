import { useEffect } from 'react'
import { useUIStore } from '../state/stores'
import { BootSequence } from './BootSequence'
import { CanvasLayer } from './CanvasLayer'
import { HUD } from './HUD'
import { ShaderBrowser } from './ShaderBrowser'
import { ShaderCreator } from './ShaderCreator'
import { CommandPalette } from './CommandPalette'
import { AudioInitBar } from './AudioInitPanel'
import { ParameterPanel } from './ParameterPanel'
import { ImmersiveMode } from './ImmersiveMode'

export function App() {
  const bootComplete = useUIStore(s => s.bootComplete)
  const immersive = useUIStore(s => s.immersive)
  const browserOpen = useUIStore(s => s.browserOpen)
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
      {bootComplete && !immersive && <HUD />}
      {bootComplete && !immersive && <ParameterPanel />}
      {bootComplete && !immersive && <AudioInitBar />}
      {bootComplete && browserOpen && !immersive && <ShaderBrowser />}
      {bootComplete && creatorOpen && !immersive && <ShaderCreator />}
      {commandPaletteOpen && <CommandPalette />}
    </div>
  )
}
