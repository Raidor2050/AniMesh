import { useEffect } from 'react'
import { useUIStore, useShaderStore } from '../state/stores'
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
import { PanelToggleButton } from './PanelToggleButton'
import { ImmersiveMode } from './ImmersiveMode'
import { MinimizedBar } from './MinimizedBar'
import { LeftToolbar } from './LeftToolbar'
import { ShaderCarousel } from './ShaderCarousel'
import { MacroBar } from './MacroBar'
import { A11yAnnouncer } from './A11yAnnouncer'
import { ErrorBoundary } from './ErrorBoundary'
import { getAudioEngine } from '../audio/audioSingleton'
import { announce } from '../a11y/announcer'
import { randomShader, cycleShader } from '../state/shaderActions'

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
        else if (store.carouselOpen) store.toggleCarousel()
        else if (store.browserOpen) store.toggleBrowser()
        else if (store.immersive) store.toggleImmersive()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        store.toggleCommandPalette()
      }
      // Undo (D27): preset/param/shader history
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z') && !isInput) {
        e.preventDefault()
        const had = useShaderStore.getState().history.length > 0
        useShaderStore.getState().undo()
        if (had) announce('Undo applied')
      }
      // Immersive-only shortcuts
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
      // Global shortcuts (not in input fields)
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '?') store.toggleBrowser()
        if (e.key === 'c') store.toggleCarousel()
        if (e.key === 'n') store.toggleCreator()
        if (e.key === 'f') store.toggleImmersive()
        if (e.key === 'p') store.togglePanelsVisible()
        // [ and ] cycle shaders from anywhere
        if (e.key === '[') { e.preventDefault(); cycleShader(-1) }
        if (e.key === ']') { e.preventDefault(); cycleShader(1) }
        if (e.key.toLowerCase() === 'r') { e.preventDefault(); randomShader() }
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault()
          const audio = getAudioEngine()
          if (audio.getSourceType() === 'demo') {
            audio.setSource('none')
          } else {
            audio.setSource('demo')
          }
        }
        if (e.key.toLowerCase() === 't') {
          e.preventDefault()
          const audio = getAudioEngine()
          audio.tap()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <ErrorBoundary panel="root" variant="root">
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
        {!bootComplete && <BootSequence />}
        <ErrorBoundary panel="canvas" variant="panel">
          <CanvasLayer />
        </ErrorBoundary>
        <ImmersiveMode />
        {bootComplete && !immersive && <TopBar />}
        {bootComplete && <LeftToolbar />}
        {bootComplete && !immersive && <ShaderCarousel />}
        {bootComplete && !immersive && <LeftPanel />}
        {bootComplete && !immersive && <StreamGraph />}
        {bootComplete && !immersive && <ParameterPanel />}
        {bootComplete && !immersive && <EQMappingPanel />}
        {bootComplete && !immersive && <MacroBar />}
        {bootComplete && !immersive && <PanelToggleButton />}
        {bootComplete && <MinimizedBar />}
        {bootComplete && <AudioInitBar />}
        {bootComplete && creatorOpen && !immersive && <ShaderCreator />}
        {commandPaletteOpen && <CommandPalette />}
        <A11yAnnouncer />
      </div>
    </ErrorBoundary>
  )
}
