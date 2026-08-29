import { useEffect } from 'react'
import { useUIStore, useShaderStore, useAudioStore } from '../state/stores'
import { BootSequence } from './BootSequence'
import { CanvasLayer } from './CanvasLayer'
import { SvgObjectLayer } from './SvgObjectLayer'
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
import { MacroBar } from './MacroBar'
import { A11yAnnouncer } from './A11yAnnouncer'
import { ErrorBoundary } from './ErrorBoundary'
import { PerformanceOverlay } from './PerformanceOverlay'
import { TutorialOverlay } from './TutorialOverlay'
import { tutorialSeen } from '../state/tutorial'
import { getAudioEngine } from '../audio/audioSingleton'
import { announce } from '../a11y/announcer'
import { randomShader, cycleShader, randomVisual, cycleVisual } from '../state/shaderActions'

export function App() {
  const bootComplete = useUIStore(s => s.bootComplete)
  const immersive = useUIStore(s => s.immersive)
  const creatorOpen = useUIStore(s => s.creatorOpen)
  const commandPaletteOpen = useUIStore(s => s.commandPaletteOpen)
  const toggleTutorial = useUIStore(s => s.toggleTutorial)

  // First-run: show the controls tour once boot sequence completes.
  useEffect(() => {
    if (bootComplete && !tutorialSeen()) {
      toggleTutorial()
    }
  }, [bootComplete, toggleTutorial])

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
      // Undo (D27): preset/param/shader history
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z') && !isInput) {
        e.preventDefault()
        const had = useShaderStore.getState().history.length > 0
        useShaderStore.getState().undo()
        if (had) announce('Undo applied')
      }
      // Immersive-only shortcuts: arrows shuffle across the FULL visual library
      // (shaders AND SVG pattern objects — Phase-25). Space is handled globally
      // below so it also works in normal mode.
      if (store.immersive && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          cycleVisual(1)
          return
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          cycleVisual(-1)
          return
        }
      }
      // Global shortcuts (not in input fields)
      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Space: shuffle across shaders AND SVG objects — works in normal and
        // immersive modes (crossfade handled by the renderer transition queue).
        if (e.code === 'Space') {
          if (useAudioStore.getState().bpmMode === 'tap') {
            // Space is reserved for BPM tapping when tap mode is active.
            return
          }
          e.preventDefault()
          randomVisual()
          return
        }
        if (e.key === '?') store.toggleBrowser()
        if (e.key === 'n') store.toggleCreator()
        if (e.key === 'f') store.toggleImmersive()
        if (e.key === 'p') store.togglePanelsVisible()
        // Controls tour (also reopened via the ? button in the top bar)
        if (e.key === 'h') store.toggleTutorial()
        // Perf overlay (D12): ref-driven DOM meter for the frame budget audit
        if (e.key === 'g') store.togglePerf()
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
          <SvgObjectLayer />
        </ErrorBoundary>
        <ImmersiveMode />
        {bootComplete && !immersive && <TopBar />}
        {bootComplete && <LeftToolbar />}
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
        {bootComplete && <TutorialOverlay />}
        <PerformanceOverlay />
        <A11yAnnouncer />
      </div>
    </ErrorBoundary>
  )
}
