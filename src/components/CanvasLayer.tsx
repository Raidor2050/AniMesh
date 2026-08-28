import { useRef, useEffect, useState } from 'react'
import { useShaderStore } from '../state/stores'
import { initWebGL } from '../core/WebGL'
import { Renderer } from '../renderer/Renderer'
import { SHADER_LIBRARY } from '../shaders/library'
import { getAudioEngine } from '../audio/audioSingleton'
import { audioDataBridge } from '../state/stores'

let warmed: string | null = null

// Idle pre-warm (D2/D6): compile the adjacent catalog entries in the LRU cache
// so browsing next/prev is near-instant (cache hit, no recompile).
function warmNeighbors(renderer: Renderer, around: string) {
  const index = SHADER_LIBRARY.findIndex(s => s.id === around)
  if (index < 0) return
  for (let i = 1; i <= 3; i++) {
    const nextDef = SHADER_LIBRARY[(index + i) % SHADER_LIBRARY.length]
    if (nextDef) renderer.warmShader(nextDef)
  }
}

export function CanvasLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const mouseRef = useRef<[number, number]>([0, 0])
  const [error, setError] = useState<string | null>(null)

  const activeShader = useShaderStore(s => s.activeShader)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: Renderer | null = null
    let animFrame = 0
    let disposeListeners: (() => void) | null = null

    const init = () => {
      try {
        const gl = initWebGL(canvas)
        if (!gl) {
          setError('WebGL2 is not supported in this browser')
          return
        }

        renderer = new Renderer(canvas, gl)
        rendererRef.current = renderer

        const resize = () => {
          renderer!.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        // Store defaults to a random shader; fallback for HMR / edge cases
        const stored = useShaderStore.getState().activeShader
        const fallback = SHADER_LIBRARY[Math.floor(Math.random() * SHADER_LIBRARY.length)] ?? SHADER_LIBRARY[0]
        const current = stored ?? fallback
        if (!stored) useShaderStore.getState().setActiveShader(current)
        renderer.setShader(current)
        warmed = current.id
        // Pre-warm neighbors after the boot frame settles (450ms) — the
        // browser is idle during this window, so compilation is free.
        window.setTimeout(() => {
          if (rendererRef.current && warmed === current.id) warmNeighbors(rendererRef.current, current.id)
        }, 450)

        const handleMouseMove = (e: MouseEvent) => {
          mouseRef.current = [
            e.clientX / window.innerWidth,
            1.0 - e.clientY / window.innerHeight,
          ]
        }
        window.addEventListener('mousemove', handleMouseMove)

        const stop = () => {
          cancelAnimationFrame(animFrame)
          animFrame = 0
          window.removeEventListener('resize', resize)
          window.removeEventListener('mousemove', handleMouseMove)
          if (renderer) {
            renderer.dispose()
            renderer = null
          }
          rendererRef.current = null
        }

        disposeListeners = stop

        const tick = (timestamp: number) => {
          if (!rendererRef.current) return

          const audio = getAudioEngine()
          const audioSnapshot = audio.tick(timestamp)
          audioDataBridge.snapshot = audioSnapshot

          const currentShader = useShaderStore.getState().activeShader
          if (currentShader && currentShader !== rendererRef.current.getCurrentShader()) {
            rendererRef.current.setShader(currentShader)
          }

          const customMappings = useShaderStore.getState().customAudioMappings
          const userParams = useShaderStore.getState().params
          rendererRef.current.render(audioSnapshot, audioSnapshot.time, mouseRef.current, customMappings, userParams)
          audioDataBridge.fps = rendererRef.current.getFPS()

          animFrame = requestAnimationFrame(tick)
        }
        animFrame = requestAnimationFrame(tick)
      } catch (e) {
        console.error('Renderer init failed:', e)
        setError(`Renderer init failed: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    init()

    // Recover from GPU resets: on context loss tear the renderer down (the rAF
    // loop stops because rendererRef.current is nulled); on restore rebuild it.
    const handleLost = (e: Event) => {
      e.preventDefault()
      disposeListeners?.()
    }
    const handleRestored = () => {
      init()
    }
    canvas.addEventListener('webglcontextlost', handleLost)
    canvas.addEventListener('webglcontextrestored', handleRestored)

    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost)
      canvas.removeEventListener('webglcontextrestored', handleRestored)
      disposeListeners?.()
    }
  }, [])

  useEffect(() => {
    if (activeShader && rendererRef.current && activeShader !== rendererRef.current.getCurrentShader()) {
      rendererRef.current.setShader(activeShader)
      warmed = activeShader.id
      warmNeighbors(rendererRef.current, activeShader.id)
    }
  }, [activeShader])

  if (error) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000', color: '#ff4444',
        fontFamily: '"JetBrains Mono", monospace', fontSize: '13px',
        padding: '20px', textAlign: 'center',
      }}>
        {error}
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  )
}
