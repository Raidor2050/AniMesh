import { useEffect, useRef } from 'react'
import { useUIStore, audioDataBridge } from '../state/stores'
import { colors, typography } from '../ui/tokens'

/**
 * Perf overlay — ref-driven DOM text writes every frame (AGENTS.md #8/D12),
 * never React state. Reads the renderer's published bridge values.
 */
export function PerformanceOverlay() {
  const visible = useUIStore(s => s.perfVisible)
  const fpsRef = useRef<HTMLSpanElement>(null)
  const frameRef = useRef<HTMLSpanElement>(null)
  const gpuRef = useRef<HTMLSpanElement>(null)
  const resRef = useRef<HTMLSpanElement>(null)
  const scaleRef = useRef<HTMLSpanElement>(null)
  const cacheRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (fpsRef.current) fpsRef.current.textContent = String(audioDataBridge.fps)
      if (frameRef.current) frameRef.current.textContent = audioDataBridge.frameMs.toFixed(1)
      if (gpuRef.current) gpuRef.current.textContent = audioDataBridge.gpuMs > 0 ? audioDataBridge.gpuMs.toFixed(1) : '–'
      if (resRef.current) resRef.current.textContent = audioDataBridge.resolution || '–'
      if (scaleRef.current) scaleRef.current.textContent = `${Math.round(audioDataBridge.scale * 100)}%`
      if (cacheRef.current) cacheRef.current.textContent = String(audioDataBridge.cacheSize)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 44,
        left: 12,
        zIndex: 30,
        pointerEvents: 'none',
        fontFamily: typography.families.mono,
        fontSize: 10,
        lineHeight: 1.8,
        color: colors.text.secondary,
        background: colors.surface.panel,
        border: `1px solid ${colors.surface.secondary}`,
        borderRadius: 6,
        padding: '6px 10px',
        backdropFilter: 'blur(12px)',
        opacity: 0.85,
      }}
      aria-hidden="true"
    >
      <div>fps <span ref={fpsRef}>0</span></div>
      <div>frame <span ref={frameRef}>0</span>ms / gpu <span ref={gpuRef}>–</span>ms</div>
      <div>scale <span ref={scaleRef}>100%</span> · <span ref={resRef}>–</span></div>
      <div>cache <span ref={cacheRef}>0</span> programs</div>
    </div>
  )
}