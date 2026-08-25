import { useState, useEffect, useRef } from 'react'
import { useUIStore, useShaderStore, audioDataBridge } from '../state/stores'

export function HUD() {
  const immersive = useUIStore(s => s.immersive)
  const toggleBrowser = useUIStore(s => s.toggleBrowser)
  const toggleImmersive = useUIStore(s => s.toggleImmersive)
  const activeShader = useShaderStore(s => s.activeShader)
  const [fps, setFps] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(audioDataBridge.fps)
      setAudioLevel(audioDataBridge.snapshot.volume)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Top Bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '48px', zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
          {/* Penrose logo small */}
          <svg width="24" height="24" viewBox="0 0 100 100" style={{
            filter: 'drop-shadow(0 0 5px rgba(99, 102, 241, 0.4))',
            cursor: 'pointer',
          }} onClick={toggleImmersive}>
            <polygon points="50,10 85,75 15,75" fill="none" stroke="#6366F1" strokeWidth="5" strokeLinejoin="round" />
            <polygon points="50,30 68,65 32,65" fill="none" stroke="#818CF8" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <span style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '14px', fontWeight: 700,
            color: 'rgba(255,255,255,0.92)',
            letterSpacing: '-0.02em',
          }}>ANIMESH</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', pointerEvents: 'auto' }}>
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
            color: fps > 50 ? '#22C55E' : fps > 30 ? '#F59E0B' : '#EF4444',
          }}>
            {fps} FPS
          </span>
        </div>
      </div>

      {/* Bottom Transport */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '64px', zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
          <button
            onClick={toggleBrowser}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '11px',
              fontFamily: '"Inter", sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >
            Shaders (B)
          </button>
          <button
            onClick={toggleImmersive}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '11px',
              fontFamily: '"Inter", sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Immersive (F)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', pointerEvents: 'auto' }}>
          {/* Audio level meter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              display: 'flex', gap: '2px', alignItems: 'flex-end', height: '16px',
            }}>
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
                <div key={i} style={{
                  width: '3px',
                  height: `${Math.min(audioLevel / threshold, 1) * 16}px`,
                  background: audioLevel > threshold
                    ? (i < 3 ? '#22C55E' : i < 4 ? '#F59E0B' : '#EF4444')
                    : 'rgba(255,255,255,0.1)',
                  borderRadius: '1px',
                  transition: 'height 0.05s ease',
                  minHeight: '1px',
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
