import { useRef, useEffect } from 'react'
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

  const activeShader = useShaderStore(s => s.activeShader)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = initWebGL(canvas)
    if (!gl) {
      console.error('WebGL2 not supported')
      return
    }

    const renderer = new Renderer(canvas, gl)
    rendererRef.current = renderer

    const resize = () => {
      renderer.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    // Load first shader immediately
    const defaultShader = SHADER_LIBRARY[0]
    useShaderStore.getState().setActiveShader(defaultShader)
    renderer.setShader(defaultShader)

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = [
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight,
      ]
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Main render loop — runs forever, audio is optional
    let lastTime = performance.now()
    const tick = (timestamp: number) => {
      const dt = (timestamp - lastTime) / 1000
      lastTime = timestamp

      // Audio (reads from shared engine, returns zeros if no source connected)
      const audio = getAudioEngine()
      const audioSnapshot = audio.tick(timestamp)
      audioDataBridge.snapshot = audioSnapshot

      // Check if shader changed
      const currentShader = useShaderStore.getState().activeShader
      if (currentShader && currentShader !== renderer.getCurrentShader()) {
        renderer.setShader(currentShader)
      }

      // Render
      renderer.render(audioSnapshot, audioSnapshot.time, mouseRef.current)
      audioDataBridge.fps = renderer.getFPS()

      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      renderer.dispose()
    }
  }, [])

  // Handle shader changes reactively
  useEffect(() => {
    if (activeShader && rendererRef.current) {
      rendererRef.current.setShader(activeShader)
    }
  }, [activeShader])

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
