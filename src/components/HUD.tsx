import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { useUIStore, useShaderStore, audioDataBridge } from '../state/stores'
import { colors, typography, spacing, radii, animation } from '../ui/tokens'

export function HUD() {
  const immersive = useUIStore(s => s.immersive)
  const toggleBrowser = useUIStore(s => s.toggleBrowser)
  const toggleCreator = useUIStore(s => s.toggleCreator)
  const toggleImmersive = useUIStore(s => s.toggleImmersive)
  const activeShader = useShaderStore(s => s.activeShader)
  const [fps, setFps] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [bass, setBass] = useState(0)
  const [treble, setTreble] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(audioDataBridge.fps)
      setAudioLevel(audioDataBridge.snapshot.volume)
      setBass(audioDataBridge.snapshot.bass)
      setTreble(audioDataBridge.snapshot.treble)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleBtnEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
    e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
  }, [])

  const handleBtnLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
    e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
  }, [])

  return (
    <>
      {/* Top Bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 52, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${spacing.scale[4]}px`,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
          <svg width="26" height="26" viewBox="0 0 100 100" style={{
            filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.5))',
            cursor: 'pointer',
          }} onClick={toggleImmersive}>
            <polygon points="50,10 85,75 15,75" fill="none" stroke="#6366F1" strokeWidth="5" strokeLinejoin="round" />
            <polygon points="50,30 68,65 32,65" fill="none" stroke="#818CF8" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <span style={{
            fontFamily: typography.families.mono,
            fontSize: 15, fontWeight: 700,
            color: colors.text.primary,
            letterSpacing: '-0.03em',
          }}>ANIMESH</span>
        </div>

        {/* Center: Active shader */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {activeShader && (
            <>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: colors.accent.primary,
                boxShadow: `0 0 8px ${colors.accent.glow}`,
                animation: 'pulse-glow 2s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: typography.families.mono,
                fontSize: 12,
                fontWeight: 500,
                color: colors.text.secondary,
              }}>
                {activeShader.name}
              </span>
            </>
          )}
        </div>

        {/* Right: FPS + Audio bars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
          {/* Audio level micro-bars */}
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
            {[bass * 0.6 + 0.1, bass * 0.8 + 0.1, audioLevel, treble * 0.7 + 0.1, treble * 0.5 + 0.1].map((val, i) => (
              <div key={i} style={{
                width: 2,
                height: `${Math.max(val, 0.05) * 14}px`,
                background: i < 2
                  ? `rgba(99,102,241,${0.4 + val * 0.6})`
                  : i < 4
                    ? `rgba(168,85,247,${0.4 + val * 0.6})`
                    : `rgba(236,72,153,${0.4 + val * 0.6})`,
                borderRadius: 1,
                transition: 'height 0.08s ease',
              }} />
            ))}
          </div>
          <span style={{
            fontFamily: typography.families.mono,
            fontSize: 10,
            fontWeight: 500,
            color: fps > 55 ? colors.state.success : fps > 30 ? colors.state.warning : colors.state.error,
            minWidth: 36, textAlign: 'right',
          }}>
            {fps} <span style={{ color: colors.text.disabled }}>fps</span>
          </span>
        </div>
      </div>

      {/* Bottom Transport */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 56, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${spacing.scale[5]}px`,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        {/* Left: Navigation buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
          <button
            onClick={toggleBrowser}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: radii.sm,
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              fontFamily: typography.families.sans,
              fontWeight: 500,
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={handleBtnEnter}
            onMouseLeave={handleBtnLeave}
          >
            <span style={{ opacity: 0.5, fontSize: 10 }}>◈</span>
            Shaders
            <kbd style={{
              fontSize: 9,
              fontFamily: typography.families.mono,
              color: colors.text.disabled,
              background: 'rgba(255,255,255,0.06)',
              padding: '1px 5px',
              borderRadius: 3,
            }}>B</kbd>
          </button>

          <button
            onClick={toggleCreator}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: radii.sm,
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              fontFamily: typography.families.sans,
              fontWeight: 500,
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={handleBtnEnter}
            onMouseLeave={handleBtnLeave}
          >
            <span style={{ opacity: 0.5, fontSize: 10 }}>+</span>
            Create
            <kbd style={{
              fontSize: 9,
              fontFamily: typography.families.mono,
              color: colors.text.disabled,
              background: 'rgba(255,255,255,0.06)',
              padding: '1px 5px',
              borderRadius: 3,
            }}>N</kbd>
          </button>

          <button
            onClick={toggleImmersive}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: radii.sm,
              color: 'rgba(255,255,255,0.6)',
              fontSize: 11,
              fontFamily: typography.families.sans,
              fontWeight: 500,
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={handleBtnEnter}
            onMouseLeave={handleBtnLeave}
          >
            <span style={{ opacity: 0.5, fontSize: 10 }}>⛶</span>
            Fullscreen
            <kbd style={{
              fontSize: 9,
              fontFamily: typography.families.mono,
              color: colors.text.disabled,
              background: 'rgba(255,255,255,0.06)',
              padding: '1px 5px',
              borderRadius: 3,
            }}>F</kbd>
          </button>
        </div>

        {/* Right: Audio visualizer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 8,
              fontFamily: typography.families.mono,
              color: colors.text.disabled,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>Vol</span>
            <div style={{
              width: 60, height: 3,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${audioLevel * 100}%`,
                background: `linear-gradient(90deg, ${colors.accent.primary}, #A855F7)`,
                borderRadius: 2,
                transition: 'width 0.06s ease',
              }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
