import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAudioStore } from '../state/stores'
import { setBpmMode, setManualBpm, tapTempo, getAudioEngine } from '../audio/audioSingleton'
import { colors, typography, spacing, radii } from '../ui/tokens'

export function BPMControl() {
  const bpmMode = useAudioStore(s => s.bpmMode)
  const manualBpm = useAudioStore(s => s.manualBpm)
  const setBpmModeStore = useAudioStore(s => s.setBpmMode)
  const setManualBpmStore = useAudioStore(s => s.setManualBpm)
  const snapshot = useAudioStore(s => s.snapshot)
  const [open, setOpen] = useState(false)
  const [tapFlash, setTapFlash] = useState(false)
  const [inputValue, setInputValue] = useState(String(manualBpm))
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync displayed BPM from auto-detect
  useEffect(() => {
    if (!editing) {
      setInputValue(bpmMode === 'auto' ? String(Math.round(snapshot.bpm)) : String(manualBpm))
    }
  }, [snapshot.bpm, manualBpm, bpmMode, editing])

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleModeChange = useCallback((mode: 'auto' | 'manual' | 'tap') => {
    setBpmModeStore(mode)
    setBpmMode(mode)
    if (mode === 'manual') {
      setManualBpm(manualBpm)
      setManualBpmStore(manualBpm)
    }
  }, [manualBpm, setBpmModeStore, setManualBpmStore])

  const handleTap = useCallback(() => {
    const result = tapTempo()
    if (result !== null) {
      setManualBpmStore(result)
      setInputValue(String(result))
    }
    // Flash feedback
    setTapFlash(true)
    setTimeout(() => setTapFlash(false), 120)
  }, [setManualBpmStore])

  const handleBpmSubmit = useCallback(() => {
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed)) {
      const clamped = Math.max(30, Math.min(300, parsed))
      setManualBpmStore(clamped)
      setManualBpm(clamped)
      setInputValue(String(clamped))
    }
    setEditing(false)
  }, [inputValue, setManualBpmStore])

  const handleInputFocus = useCallback(() => {
    setEditing(true)
    setInputValue('')
  }, [])

  const handleInputBlur = useCallback(() => {
    handleBpmSubmit()
  }, [handleBpmSubmit])

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBpmSubmit()
    if (e.key === 'Escape') {
      setInputValue(String(manualBpm))
      setEditing(false)
      ;(e.target as HTMLInputElement).blur()
    }
  }, [handleBpmSubmit, manualBpm])

  const effectiveBpm = bpmMode === 'auto' ? Math.round(snapshot.bpm) : manualBpm

  // Tap BPM mode: listen for spacebar
  useEffect(() => {
    if (bpmMode !== 'tap' || !open) return
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        handleTap()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [bpmMode, open, handleTap])

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* BPM Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '5px 10px',
          background: open ? colors.accent.subtle : 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: radii.sm,
          color: open ? colors.accent.hover : colors.text.secondary,
          fontSize: 11,
          fontFamily: typography.families.mono,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          display: 'flex', alignItems: 'center', gap: 5,
          minWidth: 68,
        }}
      >
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: tapFlash ? '#22C55E' : bpmMode === 'auto' ? colors.state.success : colors.accent.primary,
          boxShadow: tapFlash
            ? '0 0 8px rgba(34,197,94,0.6)'
            : bpmMode === 'auto' ? `0 0 6px ${colors.state.success}40` : `0 0 6px ${colors.accent.glow}`,
          transition: 'all 0.1s ease',
        }} />
        {effectiveBpm} <span style={{ fontSize: 8, fontWeight: 400, opacity: 0.6 }}>BPM</span>
      </button>

      {/* BPM Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'absolute', bottom: '100%', right: 0,
              marginBottom: 8,
              width: 240,
              background: colors.surface.panel,
              border: `1px solid ${colors.surface.secondary}`,
              borderRadius: radii.lg,
              backdropFilter: 'blur(24px) saturate(1.1)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              zIndex: 50,
            }}
          >
            {/* Header */}
            <div style={{
              padding: `${spacing.scale[3]}px ${spacing.scale[4]}px`,
              borderBottom: `1px solid ${colors.surface.secondary}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: typography.families.mono,
                fontSize: 11, fontWeight: 600,
                color: colors.text.tertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>Tempo</span>
              <span style={{
                fontFamily: typography.families.mono,
                fontSize: 18, fontWeight: 700,
                color: colors.text.primary,
              }}>
                {effectiveBpm} <span style={{ fontSize: 10, fontWeight: 400, color: colors.text.tertiary }}>BPM</span>
              </span>
            </div>

            {/* Mode selector */}
            <div style={{
              padding: `${spacing.scale[3]}px ${spacing.scale[4]}px`,
              display: 'flex', gap: 4,
            }}>
              {([
                { id: 'auto' as const, label: 'Auto', icon: '◎', desc: 'Detect from audio' },
                { id: 'manual' as const, label: 'Manual', icon: '✎', desc: 'Set BPM yourself' },
                { id: 'tap' as const, label: 'Tap', icon: '◉', desc: 'Tap to tempo' },
              ]).map(m => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    background: bpmMode === m.id ? colors.accent.subtle : colors.surface.primary,
                    border: `1px solid ${bpmMode === m.id ? 'rgba(99,102,241,0.25)' : colors.surface.secondary}`,
                    borderRadius: radii.sm,
                    color: bpmMode === m.id ? colors.accent.hover : colors.text.tertiary,
                    fontSize: 10,
                    fontFamily: typography.families.sans,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 12, marginBottom: 1 }}>{m.icon}</div>
                  <div>{m.label}</div>
                </button>
              ))}
            </div>

            {/* Mode-specific content */}
            <div style={{ padding: `${spacing.scale[2]}px ${spacing.scale[4]}px ${spacing.scale[4]}px` }}>
              {bpmMode === 'auto' && (
                <div>
                  <div style={{
                    fontSize: 10, color: colors.text.tertiary,
                    fontFamily: typography.families.sans,
                    lineHeight: '15px',
                  }}>
                    Beat intervals are averaged to estimate tempo. Detected: <span style={{
                      color: colors.accent.hover, fontFamily: typography.families.mono,
                    }}>{Math.round(snapshot.bpm)}</span> BPM
                  </div>
                </div>
              )}

              {bpmMode === 'manual' && (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <input
                      ref={inputRef}
                      type="number"
                      min={30}
                      max={300}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onKeyDown={handleInputKeyDown}
                      style={{
                        width: 64,
                        padding: '6px 8px',
                        background: colors.surface.primary,
                        border: `1px solid ${editing ? 'rgba(99,102,241,0.4)' : colors.surface.secondary}`,
                        borderRadius: radii.sm,
                        color: colors.text.primary,
                        fontSize: 16,
                        fontFamily: typography.families.mono,
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                    <span style={{
                      fontSize: 10, color: colors.text.tertiary,
                      fontFamily: typography.families.sans,
                    }}>
                      BPM (30–300)
                    </span>
                  </div>
                  {/* BPM slider */}
                  <input
                    type="range" min={30} max={300} step={1}
                    value={manualBpm}
                    onChange={e => {
                      const v = parseInt(e.target.value)
                      setManualBpmStore(v)
                      setManualBpm(v)
                      setInputValue(String(v))
                    }}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 9, color: colors.text.disabled,
                    fontFamily: typography.families.mono,
                    marginTop: 2,
                  }}>
                    <span>30</span>
                    <span>165</span>
                    <span>300</span>
                  </div>
                </div>
              )}

              {bpmMode === 'tap' && (
                <div>
                  <button
                    onClick={handleTap}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: tapFlash
                        ? 'rgba(34,197,94,0.2)'
                        : 'rgba(99,102,241,0.1)',
                      border: `1px solid ${tapFlash ? 'rgba(34,197,94,0.4)' : 'rgba(99,102,241,0.2)'}`,
                      borderRadius: radii.md,
                      color: tapFlash ? '#22C55E' : colors.text.primary,
                      fontSize: 14,
                      fontFamily: typography.families.mono,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      textAlign: 'center',
                    }}
                  >
                    Tap Here
                  </button>
                  <div style={{
                    fontSize: 9, color: colors.text.disabled,
                    fontFamily: typography.families.sans,
                    marginTop: 6,
                    textAlign: 'center',
                    lineHeight: '14px',
                  }}>
                    Tap the button or press <kbd style={{
                      fontSize: 8,
                      fontFamily: typography.families.mono,
                      background: colors.surface.primary,
                      padding: '1px 4px',
                      borderRadius: 3,
                      border: `1px solid ${colors.surface.secondary}`,
                    }}>Space</kbd> on each beat
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
