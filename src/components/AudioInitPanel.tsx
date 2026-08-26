import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { connectAudio } from '../audio/audioSingleton'
import type { AudioSourceType } from '../audio/AudioEngine'
import { useAudioStore } from '../state/stores'
import { colors, typography, spacing, radii } from '../ui/tokens'

export function AudioInitBar() {
  const [show, setShow] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const sourceType = useAudioStore(s => s.sourceType)
  const setSourceType = useAudioStore(s => s.setSourceType)

  const handleConnect = useCallback(async (type: AudioSourceType) => {
    setConnecting(true)
    setStatus(null)

    try {
      if (type === 'file') {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'audio/*'

        const fileResult = await new Promise<File | null>((resolve) => {
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0] ?? null
            resolve(file)
          }
          input.oncancel = () => resolve(null)
          input.click()
        })

        if (!fileResult) {
          setConnecting(false)
          return
        }

        const ok = await connectAudio('file', fileResult)
        if (ok) {
          setSourceType('file')
          setStatus({ type: 'success', msg: `Playing: ${fileResult.name}` })
          setTimeout(() => setShow(false), 800)
        } else {
          setStatus({ type: 'error', msg: 'Failed to decode audio file' })
        }
      } else {
        const ok = await connectAudio(type)

        if (ok) {
          setSourceType(type)
          const labels: Record<string, string> = {
            demo: 'Demo mode active — synthetic audio running',
            mic: 'Microphone connected — speak or play audio nearby',
            system: 'System audio captured — analysis only, no output',
          }
          setStatus({ type: 'success', msg: labels[type] || 'Connected' })
          setTimeout(() => setShow(false), 1200)
        } else {
          let errorMsg = 'Connection failed'
          if (type === 'system') {
            errorMsg = 'No audio captured. In Chrome, check "Share audio" in the picker. Use Chrome for best results.'
          } else if (type === 'mic') {
            errorMsg = 'Microphone access denied or unavailable'
          } else if (type === 'demo') {
            errorMsg = 'Failed to start demo audio'
          }
          setStatus({ type: 'error', msg: errorMsg })
        }
      }
    } catch (e) {
      console.error('Audio connection error:', e)
      setStatus({ type: 'error', msg: 'Unexpected error connecting audio' })
    } finally {
      setConnecting(false)
    }
  }, [setSourceType])

  // Auto-dismiss after successful connection
  useEffect(() => {
    if (status?.type === 'success') {
      const t = setTimeout(() => setShow(false), 2000)
      return () => clearTimeout(t)
    }
  }, [status])

  // Compact mode: show source badge when connected
  if (!show && sourceType !== 'none') {
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShow(true)}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '5px 14px',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.18)',
          borderRadius: 20,
          color: '#22C55E',
          fontSize: 10,
          fontFamily: typography.families.mono,
          fontWeight: 500,
          cursor: 'pointer',
          zIndex: 15,
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(34,197,94,0.14)'
          e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(34,197,94,0.08)'
          e.currentTarget.style.borderColor = 'rgba(34,197,94,0.18)'
        }}
      >
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#22C55E',
          boxShadow: '0 0 6px rgba(34,197,94,0.5)',
        }} />
        {sourceType === 'demo' && '♪ Demo'}
        {sourceType === 'mic' && '🎤 Mic'}
        {sourceType === 'system' && '🔊 System'}
        {sourceType === 'file' && '📄 File'}
        <span style={{ opacity: 0.5, fontSize: 8 }}>click to change</span>
      </motion.button>
    )
  }

  // Collapsed state: show "Connect Audio Source" button
  if (!show && sourceType === 'none') {
    return (
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onClick={() => setShow(true)}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 22px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 24,
          color: colors.accent.hover,
          fontSize: 13,
          fontFamily: typography.families.sans,
          fontWeight: 500,
          cursor: 'pointer',
          zIndex: 15,
          backdropFilter: 'blur(16px) saturate(1.1)',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.05)',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.14))'
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.03)'
          e.currentTarget.style.boxShadow = '0 6px 32px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))'
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.05)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Connect Audio Source
      </motion.button>
    )
  }

  // Expanded: show all source options
  const sources: { type: AudioSourceType; label: string; icon: string; hint: string }[] = [
    { type: 'demo', label: 'Demo', icon: '♪', hint: 'Synthetic audio — no input needed' },
    { type: 'mic', label: 'Mic', icon: '🎤', hint: 'Use your microphone' },
    { type: 'system', label: 'System', icon: '🔊', hint: 'Chrome: check "Share audio"' },
    { type: 'file', label: 'File', icon: '📄', hint: 'Load an audio file' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: colors.surface.panel,
        border: `1px solid ${colors.surface.secondary}`,
        borderRadius: radii.lg,
        zIndex: 15,
        backdropFilter: 'blur(24px) saturate(1.1)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        minWidth: 320,
      }}
    >
      {/* Source buttons */}
      <div style={{
        display: 'flex', gap: 6,
        padding: `${spacing.scale[3]}px ${spacing.scale[3]}px`,
      }}>
        {sources.map((s, i) => (
          <motion.button
            key={s.type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleConnect(s.type)}
            disabled={connecting}
            style={{
              flex: 1,
              padding: `${spacing.scale[2] + 2}px ${spacing.scale[3]}px`,
              background: sourceType === s.type ? colors.accent.subtle : colors.surface.primary,
              border: `1px solid ${sourceType === s.type ? 'rgba(99,102,241,0.25)' : colors.surface.secondary}`,
              borderRadius: radii.sm,
              color: sourceType === s.type ? colors.accent.hover : colors.text.secondary,
              fontSize: 11,
              fontFamily: typography.families.sans,
              fontWeight: 500,
              cursor: connecting ? 'wait' : 'pointer',
              opacity: connecting ? 0.4 : 1,
              transition: 'all 0.15s ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}
            onMouseEnter={e => {
              if (!connecting && sourceType !== s.type) {
                e.currentTarget.style.background = colors.accent.subtle
                e.currentTarget.style.borderColor = colors.accent.glow.replace('0.4', '0.25')
                e.currentTarget.style.color = colors.text.primary
              }
            }}
            onMouseLeave={e => {
              if (sourceType !== s.type) {
                e.currentTarget.style.background = colors.surface.primary
                e.currentTarget.style.borderColor = colors.surface.secondary
                e.currentTarget.style.color = colors.text.secondary
              }
            }}
          >
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <span>{s.label}</span>
            {s.type === 'system' && (
              <span style={{ fontSize: 8, opacity: 0.5, lineHeight: '10px' }}>Chrome recommended</span>
            )}
          </motion.button>
        ))}
        <button
          onClick={() => { setShow(false); setStatus(null) }}
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
      </div>

      {/* Status message */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: `${spacing.scale[2]}px ${spacing.scale[4]}px`,
              borderTop: `1px solid ${colors.surface.secondary}`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                fontSize: 10,
                fontFamily: typography.families.sans,
                color: status.type === 'success' ? colors.state.success : colors.state.error,
                lineHeight: '15px',
              }}>
                {status.type === 'success' ? '✓' : '✗'} {status.msg}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
