import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { useUIStore, useShaderStore, useAudioStore, audioDataBridge } from '../state/stores'
import { colors, typography, spacing, radii } from '../ui/tokens'
import { BPMControl } from './BPMControl'
import { connectAudio } from '../audio/audioSingleton'
import type { AudioSourceType } from '../audio/AudioEngine'

const sourceLabels: Record<string, { icon: string; label: string }> = {
  none: { icon: '○', label: 'None' },
  demo: { icon: '♪', label: 'Demo' },
  mic: { icon: '🎤', label: 'Mic' },
  system: { icon: '🔊', label: 'System' },
  file: { icon: '📄', label: 'File' },
}

export function TopBar() {
  const immersive = useUIStore(s => s.immersive)
  const toggleBrowser = useUIStore(s => s.toggleBrowser)
  const toggleImmersive = useUIStore(s => s.toggleImmersive)
  const activeShader = useShaderStore(s => s.activeShader)
  const sourceType = useAudioStore(s => s.sourceType)
  const setSourceType = useAudioStore(s => s.setSourceType)
  const [fps, setFps] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [bass, setBass] = useState(0)
  const [treble, setTreble] = useState(0)
  const [bpm, setBpm] = useState(128)
  const [beatPulse, setBeatPulse] = useState(false)
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(audioDataBridge.fps)
      setAudioLevel(audioDataBridge.snapshot.volume)
      setBass(audioDataBridge.snapshot.bass)
      setTreble(audioDataBridge.snapshot.treble)
      setBpm(audioDataBridge.snapshot.bpm)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioDataBridge.snapshot.beat) {
        setBeatPulse(true)
        setTimeout(() => setBeatPulse(false), 100)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // Close source menu on outside click
  useEffect(() => {
    if (!sourceMenuOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-source-menu]')) {
        setSourceMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sourceMenuOpen])

  const handleSourceConnect = useCallback(async (type: AudioSourceType) => {
    setConnecting(true)
    try {
      if (type === 'file') {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'audio/*'
        const fileResult = await new Promise<File | null>((resolve) => {
          input.onchange = (e) => resolve((e.target as HTMLInputElement).files?.[0] ?? null)
          input.oncancel = () => resolve(null)
          input.click()
        })
        if (fileResult) {
          const ok = await connectAudio('file', fileResult)
          if (ok) setSourceType('file')
        }
      } else {
        const ok = await connectAudio(type)
        if (ok) setSourceType(type)
      }
    } catch (e) {
      console.error('Audio connection error:', e)
    } finally {
      setConnecting(false)
      setSourceMenuOpen(false)
    }
  }, [setSourceType])

  if (immersive) return null

  const src = sourceLabels[sourceType] || sourceLabels.none

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      height: 52, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: `0 ${spacing.scale[4]}px`,
      background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
      pointerEvents: 'none',
    }}>
      {/* Left: Logo + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
        <button
          onClick={toggleBrowser}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 8px',
            background: 'transparent',
            border: 'none',
            borderRadius: radii.sm,
            cursor: 'pointer',
            transition: 'background 0.12s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="22" height="22" viewBox="0 0 100 100" style={{
            filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.5))',
          }}>
            <polygon points="50,10 85,75 15,75" fill="none" stroke="#6366F1" strokeWidth="5" strokeLinejoin="round" />
            <polygon points="50,30 68,65 32,65" fill="none" stroke="#818CF8" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <span style={{
            fontFamily: typography.families.mono,
            fontSize: 13, fontWeight: 700,
            color: colors.text.primary,
            letterSpacing: '-0.03em',
          }}>ANIMESH</span>
        </button>
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
              background: beatPulse ? '#22C55E' : colors.accent.primary,
              boxShadow: beatPulse
                ? '0 0 12px rgba(34,197,94,0.6)'
                : `0 0 8px ${colors.accent.glow}`,
              transition: 'all 0.06s ease',
              transform: beatPulse ? 'scale(1.3)' : 'scale(1)',
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

      {/* Right: Source + BPM + Audio bars + FPS + Fullscreen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
        {/* Source selector */}
        <div data-source-menu style={{ position: 'relative' }}>
          <button
            onClick={() => setSourceMenuOpen(!sourceMenuOpen)}
            style={{
              padding: '4px 8px',
              background: sourceMenuOpen ? colors.accent.subtle : 'rgba(255,255,255,0.04)',
              border: `1px solid ${sourceMenuOpen ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: radii.sm,
              color: sourceType !== 'none' ? colors.accent.hover : colors.text.secondary,
              fontSize: 10,
              fontFamily: typography.families.mono,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            onMouseEnter={e => { if (!sourceMenuOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}}
            onMouseLeave={e => { if (!sourceMenuOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}}
          >
            <span>{src.icon}</span>
            <span>{src.label}</span>
          </button>

          {sourceMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute', top: '100%', right: 0,
                marginTop: 4,
                background: colors.surface.panel,
                border: `1px solid ${colors.surface.secondary}`,
                borderRadius: radii.md,
                backdropFilter: 'blur(24px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                minWidth: 160,
                zIndex: 50,
              }}
            >
              {([
                { type: 'demo' as AudioSourceType, icon: '♪', label: 'Demo', hint: 'Synthetic audio' },
                { type: 'mic' as AudioSourceType, icon: '🎤', label: 'Microphone', hint: 'Use mic input' },
                { type: 'system' as AudioSourceType, icon: '🔊', label: 'System Audio', hint: 'Chrome recommended' },
                { type: 'file' as AudioSourceType, icon: '📄', label: 'Audio File', hint: 'Load from disk' },
              ]).map(s => (
                <button
                  key={s.type}
                  onClick={() => handleSourceConnect(s.type)}
                  disabled={connecting}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 12px',
                    background: sourceType === s.type ? colors.accent.subtle : 'transparent',
                    border: 'none',
                    cursor: connecting ? 'wait' : 'pointer',
                    transition: 'background 0.1s ease',
                    opacity: connecting ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (sourceType !== s.type) e.currentTarget.style.background = colors.surface.hover }}
                  onMouseLeave={e => { if (sourceType !== s.type) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>{s.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontSize: 11, fontFamily: typography.families.sans,
                      color: sourceType === s.type ? colors.accent.hover : colors.text.primary,
                      fontWeight: 500,
                    }}>{s.label}</div>
                    <div style={{
                      fontSize: 9, fontFamily: typography.families.sans,
                      color: colors.text.disabled, lineHeight: '12px',
                    }}>{s.hint}</div>
                  </div>
                  {sourceType === s.type && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 10,
                      color: colors.state.success,
                    }}>✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* BPM Control */}
        <BPMControl />

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

        {/* FPS */}
        <span style={{
          fontFamily: typography.families.mono,
          fontSize: 10,
          fontWeight: 500,
          color: fps > 55 ? colors.state.success : fps > 30 ? colors.state.warning : colors.state.error,
          minWidth: 36, textAlign: 'right',
        }}>
          {fps} <span style={{ color: colors.text.disabled }}>fps</span>
        </span>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleImmersive}
          style={{
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: radii.sm,
            color: colors.text.secondary,
            fontSize: 11,
            fontFamily: typography.families.sans,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.12s ease',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = colors.text.secondary }}
          title="Toggle fullscreen (F)"
        >
          <span style={{ fontSize: 10 }}>⛶</span>
        </button>
      </div>
    </div>
  )
}
