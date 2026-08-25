import { useRef, useEffect, useState } from 'react'
import { useShaderStore } from '../state/stores'
import { initWebGL } from '../core/WebGL'
import { Renderer } from '../renderer/Renderer'
import { SHADER_LIBRARY } from '../shaders/library'
import { getAudioEngine } from '../audio/audioSingleton'
import { audioDataBridge } from '../state/stores'

export function CanvasLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const animFrameRef = useRef<number>(0)
  const mouseRef = useRef<[number, number]>([0, 0])
  const [error, setError] = useState<string | null>(null)

  const activeShader = useShaderStore(s => s.activeShader)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: Renderer | null = null

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

      const current = useShaderStore.getState().activeShader ?? SHADER_LIBRARY.find(s => s.id === 'fractal-sierpinski') ?? SHADER_LIBRARY[0]
      useShaderStore.getState().setActiveShader(current)
      renderer.setShader(current)

      const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current = [
          e.clientX / window.innerWidth,
          1.0 - e.clientY / window.innerHeight,
        ]
      }
      window.addEventListener('mousemove', handleMouseMove)

      const tick = (timestamp: number) => {
        if (!rendererRef.current) return

        const audio = getAudioEngine()
        const audioSnapshot = audio.tick(timestamp)
        audioDataBridge.snapshot = audioSnapshot

        const currentShader = useShaderStore.getState().activeShader
        if (currentShader && currentShader !== rendererRef.current.getCurrentShader()) {
          rendererRef.current.setShader(currentShader)
        }

        rendererRef.current.render(audioSnapshot, audioSnapshot.time, mouseRef.current)
        audioDataBridge.fps = rendererRef.current.getFPS()

        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)

      const cleanup = () => {
        cancelAnimationFrame(animFrameRef.current)
        window.removeEventListener('resize', resize)
        window.removeEventListener('mousemove', handleMouseMove)
        if (rendererRef.current) {
          rendererRef.current.dispose()
          rendererRef.current = null
        }
      }

      ;(canvas as any).__cleanup = cleanup
    } catch (e) {
      console.error('Renderer init failed:', e)
      setError(`Renderer init failed: ${e instanceof Error ? e.message : String(e)}`)
    }

    return () => {
      const cleanup = (canvas as any).__cleanup
      if (cleanup) cleanup()
    }
  }, [])

  useEffect(() => {
    if (activeShader && rendererRef.current && activeShader !== rendererRef.current.getCurrentShader()) {
      rendererRef.current.setShader(activeShader)
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
