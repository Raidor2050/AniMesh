import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore, audioDataBridge } from '../state/stores'
import { colors, typography, spacing } from '../ui/tokens'

export function ImmersiveMode() {
  const immersive = useUIStore(s => s.immersive)
  const activeShader = useShaderStore(s => s.activeShader)
  const [showHUD, setShowHUD] = useState(false)
  const [mouseNear, setMouseNear] = useState(false)
  const [shaderFlash, setShaderFlash] = useState(false)
  const hideTimerRef = useRef<number | null>(null)
  const prevShaderRef = useRef<string | null>(null)
  const [cursorVisible, setCursorVisible] = useState(true)

  // Show HUD near edges + cursor auto-hide (2s idle)
  useEffect(() => {
    if (!immersive) return

    let cursorTimer: ReturnType<typeof setTimeout> | null = null
    document.body.style.cursor = 'default'

    const handleMouseMove = (e: MouseEvent) => {
      const threshold = 80
      const near =
        e.clientX < threshold ||
        e.clientX > window.innerWidth - threshold ||
        e.clientY < threshold ||
        e.clientY > window.innerHeight - threshold

      setMouseNear(near)
      setCursorVisible(true)
      document.body.style.cursor = 'default'
      if (cursorTimer) clearTimeout(cursorTimer)

      if (near) {
        setShowHUD(true)
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        hideTimerRef.current = window.setTimeout(() => setShowHUD(false), 2500)
      }

      // Auto-hide cursor after 2s idle (anywhere on screen)
      cursorTimer = setTimeout(() => {
        setCursorVisible(false)
        document.body.style.cursor = 'none'
      }, 2000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      if (cursorTimer) clearTimeout(cursorTimer)
      document.body.style.cursor = 'default'
    }
  }, [immersive])

  // Flash when shader changes (spacebar, arrows, etc.)
  useEffect(() => {
    if (!immersive) return
    const id = activeShader?.id
    if (id && prevShaderRef.current && id !== prevShaderRef.current) {
      setShaderFlash(true)
      // Show HUD briefly on shader change
      setShowHUD(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => { setShowHUD(false); setShaderFlash(false) }, 1200)
    }
    prevShaderRef.current = id ?? null
  }, [activeShader?.id, immersive])

  if (!immersive) return null

  const bpm = Math.round(audioDataBridge.snapshot.bpm)

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5,
      pointerEvents: 'none',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 52,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${spacing.scale[4]}px`,
        opacity: showHUD ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 100 100" style={{
            filter: `drop-shadow(0 0 5px ${colors.accent.glow})`,
          }}>
            <polygon points="50,10 85,75 15,75" fill="none" stroke="#6366F1" strokeWidth="5" strokeLinejoin="round" />
            <polygon points="50,30 68,65 32,65" fill="none" stroke="#818CF8" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <span style={{
            fontFamily: typography.families.mono,
            fontSize: 12, fontWeight: 600,
            color: colors.text.secondary,
          }}>IMMERSIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 10,
            fontFamily: typography.families.mono,
            color: colors.text.disabled,
          }}>{bpm} BPM</span>
          <span style={{
            fontFamily: typography.families.mono,
            fontSize: 10,
            color: colors.text.disabled,
          }}>ESC to exit</span>
        </div>
      </div>

      {/* Center: shader name flash on change */}
      <AnimatePresence>
        {shaderFlash && activeShader && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '8px 20px',
              background: 'rgba(0,0,0,0.55)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 8,
              backdropFilter: 'blur(16px)',
            }}
          >
            <span style={{
              fontFamily: typography.families.mono,
              fontSize: 14, fontWeight: 600,
              color: colors.text.primary,
              letterSpacing: '-0.02em',
            }}>{activeShader.name}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 40,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: showHUD ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
      }}>
        <span style={{
          fontSize: 10,
          color: colors.text.disabled,
          fontFamily: typography.families.mono,
          display: 'flex', gap: 16,
        }}>
          <span>← → cycle</span>
          <span>Space random</span>
          <span>F exit</span>
        </span>
      </div>
    </div>
  )
}
