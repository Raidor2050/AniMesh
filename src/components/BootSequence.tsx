import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore } from '../state/stores'
import { colors, typography, spacing } from '../ui/tokens'

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
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: '#000', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: phase >= 4 ? 'none' : 'auto',
          }}
        >
          {/* Horizontal line */}
          <div style={{
            width: phase >= 1 ? 200 : 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${colors.accent.primary}, transparent)`,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            marginBottom: spacing.scale[6],
            boxShadow: `0 0 24px ${colors.accent.glow}`,
          }} />

          {/* Logo */}
          <div style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            textAlign: 'center',
          }}>
            <svg width="80" height="80" viewBox="0 0 100 100" style={{
              marginBottom: spacing.scale[4],
              filter: `drop-shadow(0 0 20px ${colors.accent.glow})`,
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
              fontFamily: typography.families.mono,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: colors.text.primary,
            }}>
              ANIMESH
            </div>
            <div style={{
              fontFamily: typography.families.sans,
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '0.2em',
              color: colors.text.disabled,
              marginTop: 6,
              textTransform: 'uppercase',
            }}>
              Audio-Reactive Shader Laboratory
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            width: 200, height: 2, marginTop: spacing.scale[8],
            background: colors.surface.secondary, borderRadius: 1,
            overflow: 'hidden',
            opacity: phase >= 3 ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}>
            <div style={{
              height: '100%',
              width: phase >= 3 ? '100%' : '0%',
              background: `linear-gradient(90deg, ${colors.accent.primary}, #A855F7)`,
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>

          {/* Loading text */}
          <div style={{
            marginTop: spacing.scale[3],
            fontSize: 9,
            fontFamily: typography.families.mono,
            color: colors.text.disabled,
            letterSpacing: '0.05em',
            opacity: phase >= 3 ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}>
            {phase >= 3 ? 'INITIALIZING RENDERER...' : ''}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
