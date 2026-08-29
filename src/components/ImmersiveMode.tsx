import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore, audioDataBridge } from '../state/stores'
import { randomVisual, cycleVisual } from '../state/shaderActions'
import { colors, typography, spacing, radii } from '../ui/tokens'

const HUD_HIDE_DELAY = 2500

function IconButton({ label, glyph, onClick, ariaLabel }: {
  label: string
  glyph: string
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        minHeight: 44, padding: '0 14px',
        background: 'rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: radii.md,
        color: colors.text.primary,
        fontFamily: typography.families.mono,
        fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
        cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.35)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{glyph}</span>
      <span>{label}</span>
    </button>
  )
}

export function ImmersiveMode() {
  const immersive = useUIStore(s => s.immersive)
  const toggleImmersive = useUIStore(s => s.toggleImmersive)
  const autoCycleBeats = useUIStore(s => s.autoCycleBeats)
  const setAutoCycleBeats = useUIStore(s => s.setAutoCycleBeats)
  const activeVisual = useShaderStore(s => s.activeVisual)
  const [showHUD, setShowHUD] = useState(false)
  const [shaderFlash, setShaderFlash] = useState(false)
  const [beatCountdown, setBeatCountdown] = useState<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const prevShaderRef = useRef<string | null>(null)

  const revealHUD = () => {
    setShowHUD(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => setShowHUD(false), HUD_HIDE_DELAY)
  }

  // Show HUD near edges + cursor auto-hide (2s idle)
  useEffect(() => {
    if (!immersive) return

    let cursorTimer: ReturnType<typeof setTimeout> | null = null
    document.body.style.cursor = 'default'

    const handlePointerMove = (e: MouseEvent) => {
      const threshold = 80
      const near =
        e.clientX < threshold ||
        e.clientX > window.innerWidth - threshold ||
        e.clientY < threshold ||
        e.clientY > window.innerHeight - threshold

      document.body.style.cursor = 'default'
      if (cursorTimer) clearTimeout(cursorTimer)

      if (near) revealHUD()

      // Auto-hide cursor after 2s idle (anywhere on screen)
      cursorTimer = setTimeout(() => {
        document.body.style.cursor = 'none'
      }, 2000)
    }

    // Touch support: tap or touch near an edge reveals the HUD
    const handleTouchStart = () => revealHUD()

    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('touchstart', handleTouchStart)
    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('touchstart', handleTouchStart)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      if (cursorTimer) clearTimeout(cursorTimer)
      document.body.style.cursor = 'default'
    }
  }, [immersive])

  // Flash when the visual changes (spacebar, arrows, RANDOM, auto-cycle, etc.)
  useEffect(() => {
    if (!immersive) return
    const id = activeVisual?.id
    if (id && prevShaderRef.current && id !== prevShaderRef.current) {
      setShaderFlash(true)
      // Show HUD briefly on visual change
      setShowHUD(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => { setShowHUD(false); setShaderFlash(false) }, 1200)
    }
    prevShaderRef.current = id ?? null
  }, [activeVisual?.id, immersive])

  // Auto-transition (D07): cycle randomVisual on every Nth beat while in
  // immersive mode. Watches audioDataBridge.snapshot.beatCount (monotonic in
  // both free and locked engine modes) via rAF — ref-driven, never React state.
  const autoBeatRef = useRef<number | null>(null)
  useEffect(() => {
    if (!immersive || autoCycleBeats === 0) {
      setBeatCountdown(null)
      autoBeatRef.current = null
      return
    }
    if (autoBeatRef.current === null) autoBeatRef.current = audioDataBridge.snapshot.beatCount
    let raf = 0
    const loop = () => {
      const b = audioDataBridge.snapshot.beatCount
      if (b !== autoBeatRef.current) {
        autoBeatRef.current = b
        setBeatCountdown(autoCycleBeats - (b % autoCycleBeats))
        if (b > 0 && b % autoCycleBeats === 0) randomVisual()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); autoBeatRef.current = null }
  }, [immersive, autoCycleBeats])

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
        minHeight: 52,
        boxSizing: 'border-box',
        paddingTop: 'env(safe-area-inset-top)',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: `calc(${spacing.scale[4]}px + env(safe-area-inset-left))`,
        paddingRight: `calc(${spacing.scale[4]}px + env(safe-area-inset-right))`,
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
          <IconButton
            label="EXIT"
            glyph="✕"
            ariaLabel="Exit immersive mode"
            onClick={toggleImmersive}
          />
        </div>
      </div>

      {/* Center: visual name flash on change */}
      <AnimatePresence>
        {shaderFlash && activeVisual && (
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
            }}>{activeVisual.name}</span>
            <span style={{
              display: 'inline-flex', marginLeft: 10,
              fontFamily: typography.families.mono,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              color: activeVisual.kind === 'svg' ? '#34d399' : '#6366F1',
            }}>{activeVisual.kind === 'svg' ? 'SVG' : 'GL'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar: navigation controls */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        minHeight: 56,
        boxSizing: 'border-box',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12,
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        opacity: showHUD ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
      }}>
        <IconButton label="PREV" glyph="‹" ariaLabel="Previous visual" onClick={() => cycleVisual(-1)} />
        <IconButton label="RANDOM" glyph="∴" ariaLabel="Random visual" onClick={randomVisual} />
        <IconButton label="NEXT" glyph="›" ariaLabel="Next visual" onClick={() => cycleVisual(1)} />
        {/* Auto-transition control: cycles effort 4 -> 16 -> 32 -> OFF */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setAutoCycleBeats(autoCycleBeats === 0 ? 4 : autoCycleBeats === 4 ? 16 : autoCycleBeats === 16 ? 32 : 0)}
            aria-label={`Auto transition every ${autoCycleBeats === 0 ? 'off' : autoCycleBeats + ' beats'}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              minHeight: 44, padding: '0 14px',
              background: autoCycleBeats !== 0 ? 'rgba(99,102,241,0.25)' : 'rgba(0,0,0,0.45)',
              border: autoCycleBeats !== 0 ? '1px solid rgba(99,102,241,0.55)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: radii.md,
              color: colors.text.primary,
              fontFamily: typography.families.mono,
              fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = autoCycleBeats !== 0 ? 'rgba(99,102,241,0.25)' : 'rgba(0,0,0,0.45)' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>⟳</span>
            <span>AUTO {autoCycleBeats === 0 ? 'OFF' : `${autoCycleBeats}▸`}</span>
          </button>
          {autoCycleBeats !== 0 && beatCountdown !== null && (
            <span style={{
              fontFamily: typography.families.mono,
              fontSize: 11, fontWeight: 500, letterSpacing: '0.06em',
              color: beatCountdown <= 1 ? colors.accent.glow : colors.text.disabled,
            }}>
              next {Math.max(beatCountdown, 1)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}