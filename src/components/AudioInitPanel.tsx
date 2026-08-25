import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { connectAudio } from '../audio/audioSingleton'
import type { AudioSourceType } from '../audio/AudioEngine'
import { colors, typography, spacing, radii } from '../ui/tokens'

export function AudioInitBar() {
  const [show, setShow] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async (type: AudioSourceType) => {
    setConnecting(true)
    if (type === 'file') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'audio/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          await connectAudio('file', file)
        }
        setConnecting(false)
      }
      input.click()
      return
    }
    await connectAudio(type)
    setConnecting(false)
  }

  if (!show) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onClick={() => setShow(true)}
        style={{
          position: 'absolute', bottom: 68, left: '50%',
          transform: 'translateX(-50%)',
          padding: `${spacing.scale[2] + 1}px ${spacing.scale[5]}px`,
          background: colors.accent.subtle,
          border: `1px solid rgba(99,102,241,0.2)`,
          borderRadius: 20,
          color: colors.accent.hover,
          fontSize: typography.scale.sm.size,
          fontFamily: typography.families.sans,
          fontWeight: 500,
          cursor: 'pointer',
          zIndex: 15,
          backdropFilter: 'blur(12px)',
          transition: 'all 0.2s ease',
          animation: 'pulse-glow 2.5s ease-in-out infinite',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ fontSize: 10 }}>▶</span>
        Connect Audio Source
      </motion.button>
    )
  }

  const sources: { type: AudioSourceType; label: string; icon: string; desc: string }[] = [
    { type: 'demo', label: 'Demo', icon: '♪', desc: 'Built-in oscillator' },
    { type: 'mic', label: 'Mic', icon: '🎤', desc: 'Microphone input' },
    { type: 'system', label: 'System', icon: '🔊', desc: 'System audio' },
    { type: 'file', label: 'File', icon: '📄', desc: 'Audio file' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        position: 'absolute', bottom: 68, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 6,
        padding: `${spacing.scale[3]}px ${spacing.scale[3]}px`,
        background: colors.surface.panel,
        border: `1px solid ${colors.surface.secondary}`,
        borderRadius: radii.lg,
        zIndex: 15,
        backdropFilter: 'blur(24px) saturate(1.1)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}
    >
      {sources.map((s, i) => (
        <motion.button
          key={s.type}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => handleConnect(s.type)}
          disabled={connecting}
          style={{
            padding: `${spacing.scale[2]}px ${spacing.scale[3] + 2}px`,
            background: colors.surface.primary,
            border: `1px solid ${colors.surface.secondary}`,
            borderRadius: radii.sm,
            color: colors.text.secondary,
            fontSize: 11,
            fontFamily: typography.families.sans,
            fontWeight: 500,
            cursor: connecting ? 'wait' : 'pointer',
            opacity: connecting ? 0.4 : 1,
            transition: 'all 0.15s ease',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            minWidth: 64,
          }}
          onMouseEnter={e => {
            if (!connecting) {
              e.currentTarget.style.background = colors.accent.subtle
              e.currentTarget.style.borderColor = colors.accent.glow.replace('0.4', '0.25')
              e.currentTarget.style.color = colors.text.primary
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = colors.surface.primary
            e.currentTarget.style.borderColor = colors.surface.secondary
            e.currentTarget.style.color = colors.text.secondary
          }}
        >
          <span style={{ fontSize: 14 }}>{s.icon}</span>
          <span>{s.label}</span>
        </motion.button>
      ))}
      <button
        onClick={() => setShow(false)}
        style={{
          padding: `0 ${spacing.scale[1]}px`,
          background: 'transparent',
          border: 'none',
          color: colors.text.disabled,
          fontSize: 16,
          cursor: 'pointer',
          alignSelf: 'flex-start',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = colors.text.secondary }}
        onMouseLeave={e => { e.currentTarget.style.color = colors.text.disabled }}
      >
        ×
      </button>
    </motion.div>
  )
}
