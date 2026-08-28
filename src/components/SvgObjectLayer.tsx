import { useEffect, useRef } from 'react'
import { useShaderStore } from '../state/stores'
import { SvgObjectDefinition } from '../utils/types'
import { mountSvgObject } from '../objects/svgCore'

/**
 * Renders the active SVG pattern object above the WebGL canvas. The mount
 * lifecycle is owned by svgCore (which writes attributes via rAF + the audio
 * bridge — zero React churn per AGENTS rules). When no SVG visual is active the
 * layer renders nothing and lets the canvas fill the screen.
 */
export function SvgObjectLayer() {
  const activeVisual = useShaderStore(s => s.activeVisual)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (!activeVisual || activeVisual.kind !== 'svg') return
    const def = activeVisual as SvgObjectDefinition
    const teardown = mountSvgObject(container, def)
    return teardown
  }, [activeVisual, containerRef])

  if (!activeVisual || activeVisual.kind !== 'svg') return null
  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  )
}