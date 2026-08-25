import { useState, useEffect } from 'react'
import { useUIStore } from '../state/stores'

export function BootSequence() {
  const [phase, setPhase] = useState(0)
  const setBootComplete = useUIStore(s => s.setBootComplete)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 2800),
      setTimeout(() => {
        setBootComplete(true)
      }, 4000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [setBootComplete])

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: '#000', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: phase >= 4 ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
      pointerEvents: phase >= 4 ? 'none' : 'auto',
    }}>
      {/* Horizontal line */}
      <div style={{
        width: phase >= 1 ? '200px' : '0px',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #6366F1, transparent)',
        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: '24px',
        boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
      }} />

      {/* Logo */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'scale(1)' : 'scale(0.95)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'center',
      }}>
        {/* Penrose Triangle SVG */}
        <svg width="80" height="80" viewBox="0 0 100 100" style={{
          marginBottom: '16px',
          filter: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.5))',
        }}>
          <polygon
            points="50,10 85,75 15,75"
            fill="none"
            stroke="#6366F1"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <polygon
            points="50,30 68,65 32,65"
            fill="none"
            stroke="#818CF8"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>

        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '32px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'rgba(255,255,255,0.92)',
        }}>
          ANIMESH
        </div>
        <div style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: '12px',
          fontWeight: 400,
          letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.4)',
          marginTop: '4px',
          textTransform: 'uppercase',
        }}>
          Audio-Reactive Shader Laboratory
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '200px', height: '2px', marginTop: '32px',
        background: 'rgba(255,255,255,0.06)', borderRadius: '1px',
        overflow: 'hidden',
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        <div style={{
          height: '100%',
          width: phase >= 3 ? '100%' : '0%',
          background: 'linear-gradient(90deg, #6366F1, #A855F7)',
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  )
}
