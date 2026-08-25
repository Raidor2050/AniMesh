import { useState, useEffect, useRef } from 'react'
import { useUIStore, useShaderStore, audioDataBridge } from '../state/stores'

export function ImmersiveMode() {
  const immersive = useUIStore(s => s.immersive)
  const toggleImmersive = useUIStore(s => s.toggleImmersive)
  const activeShader = useShaderStore(s => s.activeShader)
  const [showHUD, setShowHUD] = useState(false)
  const [mouseNear, setMouseNear] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!immersive) return

    const handleMouseMove = (e: MouseEvent) => {
      const threshold = 80
      const near =
        e.clientX < threshold ||
        e.clientX > window.innerWidth - threshold ||
        e.clientY < threshold ||
        e.clientY > window.innerHeight - threshold

      setMouseNear(near)
      if (near) {
        setShowHUD(true)
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        hideTimerRef.current = window.setTimeout(() => setShowHUD(false), 2000)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [immersive])

  if (!immersive) return null

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      {/* Proximity-reveal HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '48px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        opacity: showHUD ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="20" height="20" viewBox="0 0 100 100">
            <polygon points="50,10 85,75 15,75" fill="none" stroke="#6366F1" strokeWidth="5" strokeLinejoin="round" />
            <polygon points="50,30 68,65 32,65" fill="none" stroke="#818CF8" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <span style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '12px', fontWeight: 600,
            color: 'rgba(255,255,255,0.8)',
          }}>IMMERSIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {activeShader && (
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
            }}>
              {activeShader.name}
            </span>
          )}
          <span style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.3)',
          }}>
            ESC to exit
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '40px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: showHUD ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
      }}>
        <span style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.3)',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          ← → cycle shaders · F exit · Space pause
        </span>
      </div>
    </div>
  )
}
