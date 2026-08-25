import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useShaderStore, useUIStore, audioDataBridge } from '../state/stores'
import { AudioSignal, AudioMapping, ShaderCategory, CATEGORY_LABELS } from '../utils/types'
import { colors, typography, spacing, radii } from '../ui/tokens'
import { useDraggable } from '../hooks/useDraggable'

const BANDS: { signal: AudioSignal; label: string; color: string; glowColor: string }[] = [
  { signal: 'sub', label: 'Sub', color: '#4F46E5', glowColor: 'rgba(79,70,229,0.4)' },
  { signal: 'bass', label: 'Bass', color: '#6366F1', glowColor: 'rgba(99,102,241,0.4)' },
  { signal: 'lowMid', label: 'Low Mid', color: '#8B5CF6', glowColor: 'rgba(139,92,246,0.4)' },
  { signal: 'mid', label: 'Mid', color: '#A855F7', glowColor: 'rgba(168,85,247,0.4)' },
  { signal: 'highMid', label: 'High Mid', color: '#D946EF', glowColor: 'rgba(217,70,239,0.4)' },
  { signal: 'treble', label: 'Treble', color: '#EC4899', glowColor: 'rgba(236,72,153,0.4)' },
]

const CURVES: AudioMapping['curve'][] = ['linear', 'log', 'exp']
const CURVE_LABELS: Record<string, string> = { linear: 'Lin', log: 'Log', exp: 'Exp' }

export function EQMappingPanel() {
  const activeShader = useShaderStore(s => s.activeShader)
  const customMappings = useShaderStore(s => s.customAudioMappings)
  const addMapping = useShaderStore(s => s.addCustomAudioMapping)
  const removeMapping = useShaderStore(s => s.removeCustomAudioMapping)
  const updateMapping = useShaderStore(s => s.updateCustomAudioMapping)
  const immersive = useUIStore(s => s.immersive)
  const panelsVisible = useUIStore(s => s.panelsVisible)
  const [bandLevels, setBandLevels] = useState<Record<string, number>>({})
  const [collapsed, setCollapsed] = useState(false)

  const { position, isDragging, containerRef, dragProps } = useDraggable({
    initialX: typeof window !== 'undefined' ? window.innerWidth - 496 : 800,
    initialY: 330,
    bounds: { left: 0, top: 48, right: 0, bottom: 0 },
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const snap = audioDataBridge.snapshot
      setBandLevels({
        sub: snap.sub,
        bass: snap.bass,
        lowMid: snap.lowMid,
        mid: snap.mid,
        highMid: snap.highMid,
        treble: snap.treble,
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  if (!activeShader || immersive || !panelsVisible) return null

  const availableParams = activeShader.params.map(p => p.id)
  const shaderMappings = activeShader.audioMappings

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        {...dragProps}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: collapsed ? 36 : 248,
          minHeight: collapsed ? 40 : 48,
          maxHeight: collapsed ? undefined : 'calc(100vh - 80px)',
          zIndex: isDragging ? 999 : 16,
          background: colors.surface.panel,
          backdropFilter: 'blur(24px) saturate(1.1)',
          border: `1px solid ${colors.surface.secondary}`,
          borderRadius: radii.lg,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          transition: isDragging ? 'none' : 'width 0.2s ease',
          cursor: isDragging ? 'grabbing' : undefined,
          userSelect: isDragging ? 'none' : undefined,
        }}
      >
        {/* Header — drag handle */}
        <div
          style={{
            padding: collapsed ? '12px 0' : `${spacing.scale[3]}px ${spacing.scale[4]}px`,
            borderBottom: collapsed ? 'none' : `1px solid ${colors.surface.secondary}`,
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
            cursor: isDragging ? 'grabbing' : 'pointer',
            touchAction: 'none',
          }}
          onClick={() => {
            if (!isDragging) setCollapsed(!collapsed)
          }}
        >
          {collapsed ? (
            <span style={{ fontSize: 14, color: colors.text.tertiary, transform: 'rotate(180deg)' }}>◂</span>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontFamily: typography.families.mono,
                  fontSize: 10, fontWeight: 600,
                  color: colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>EQ Mapping</span>
                <span style={{
                  fontSize: 9,
                  color: colors.text.disabled,
                  fontFamily: typography.families.mono,
                  background: colors.surface.primary,
                  padding: '1px 5px',
                  borderRadius: radii.xs,
                }}>{customMappings.length}</span>
              </div>
              <span style={{ fontSize: 12, color: colors.text.disabled, transform: 'rotate(180deg)' }}>◂</span>
            </>
          )}
        </div>

        {!collapsed && (
          <div style={{ flex: 1, overflow: 'auto', padding: `${spacing.scale[3]}px ${spacing.scale[4]}px` }}>
            {/* Live Band Levels */}
            <div style={{ marginBottom: spacing.scale[4] }}>
              <div style={{
                fontSize: 9,
                fontFamily: typography.families.mono,
                color: colors.text.disabled,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: spacing.scale[2],
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: colors.state.success,
                  boxShadow: `0 0 6px ${colors.state.success}`,
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }} />
                Live Bands
              </div>
              {BANDS.map(band => (
                <BandLevelRow
                  key={band.signal}
                  band={band}
                  level={bandLevels[band.signal] ?? 0}
                />
              ))}
            </div>

            {/* Shader's built-in mappings (read-only display) */}
            {shaderMappings.length > 0 && (
              <div style={{ marginBottom: spacing.scale[4] }}>
                <div style={{
                  fontSize: 9,
                  fontFamily: typography.families.mono,
                  color: colors.text.disabled,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: spacing.scale[2],
                }}>Built-in Mappings</div>
                {shaderMappings.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '3px 0',
                    fontSize: 10, fontFamily: typography.families.mono,
                    color: colors.text.tertiary,
                  }}>
                    <span style={{
                      padding: '1px 4px',
                      borderRadius: 3,
                      background: BANDS.find(b => b.signal === m.signal)?.color + '22',
                      color: BANDS.find(b => b.signal === m.signal)?.color ?? colors.text.tertiary,
                      fontSize: 9,
                    }}>{m.signal}</span>
                    <span style={{ opacity: 0.4 }}>→</span>
                    <span style={{ color: colors.text.secondary }}>{m.param}</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: 9 }}>
                      {CURVE_LABELS[m.curve] || m.curve} {(m.amount * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Custom mappings */}
            <div>
              <div style={{
                fontSize: 9,
                fontFamily: typography.families.mono,
                color: colors.text.disabled,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: spacing.scale[2],
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>Custom Mappings</span>
              </div>

              {customMappings.map((mapping, index) => (
                <MappingRow
                  key={index}
                  mapping={mapping}
                  index={index}
                  availableParams={availableParams}
                  onUpdate={(m) => updateMapping(index, m)}
                  onRemove={() => removeMapping(index)}
                />
              ))}

              {/* Add mapping button */}
              <button
                onClick={() => {
                  addMapping({
                    signal: 'bass',
                    param: availableParams[0] || 'speed',
                    amount: 0.5,
                    curve: 'linear',
                  })
                }}
                style={{
                  width: '100%',
                  padding: '6px 0',
                  background: colors.surface.primary,
                  border: `1px dashed ${colors.surface.secondary}`,
                  borderRadius: radii.sm,
                  color: colors.text.disabled,
                  fontSize: 10,
                  fontFamily: typography.families.sans,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  marginTop: 4,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = colors.surface.hover
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
                  e.currentTarget.style.color = colors.accent.hover
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = colors.surface.primary
                  e.currentTarget.style.borderColor = colors.surface.secondary
                  e.currentTarget.style.color = colors.text.disabled
                }}
              >
                + Add Mapping
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function BandLevelRow({ band, level }: {
  band: typeof BANDS[number]
  level: number
}) {
  const peakRef = useRef(level)
  const peakTimeRef = useRef(0)
  const [peak, setPeak] = useState(level)
  const prevLevelRef = useRef(level)

  useEffect(() => {
    const now = Date.now()
    const prev = prevLevelRef.current
    prevLevelRef.current = level

    // New peak: level is higher than stored peak
    if (level > peakRef.current) {
      peakRef.current = level
      peakTimeRef.current = now
      setPeak(level)
    }
    // Decay: hold peak for 1.5s then decay toward current level
    else if (now - peakTimeRef.current > 1500) {
      peakRef.current = Math.max(level, peakRef.current * 0.96)
      setPeak(peakRef.current)
    }
  }, [level])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      marginBottom: 3,
    }}>
      <span style={{
        fontFamily: typography.families.mono,
        fontSize: 9,
        color: band.color,
        width: 48, flexShrink: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>{band.label}</span>
      <div style={{
        flex: 1, height: 4,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.max(level * 100, 1)}%`,
          background: `linear-gradient(90deg, ${band.color}, ${band.color}aa)`,
          borderRadius: 2,
          boxShadow: `0 0 6px ${band.glowColor}`,
          transition: 'width 0.05s ease',
        }} />
        {/* Peak hold marker */}
        {peak > 0.02 && (
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${peak * 100}%`,
            width: 2,
            background: '#fff',
            opacity: 0.7,
            borderRadius: 1,
            boxShadow: '0 0 4px rgba(255,255,255,0.5)',
          }} />
        )}
      </div>
      <span style={{
        fontFamily: typography.families.mono,
        fontSize: 8,
        color: colors.text.disabled,
        width: 28, textAlign: 'right',
      }}>{(level * 100).toFixed(0)}%</span>
    </div>
  )
}

function MappingRow({ mapping, index, availableParams, onUpdate, onRemove }: {
  mapping: AudioMapping
  index: number
  availableParams: string[]
  onUpdate: (m: AudioMapping) => void
  onRemove: () => void
}) {
  const band = BANDS.find(b => b.signal === mapping.signal)

  return (
    <div style={{
      padding: '6px 0',
      borderBottom: `1px solid ${colors.surface.secondary}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        {/* Signal selector */}
        <select
          value={mapping.signal}
          onChange={e => onUpdate({ ...mapping, signal: e.target.value as AudioSignal })}
          style={{
            flex: 1,
            padding: '3px 4px',
            background: colors.surface.primary,
            border: `1px solid ${colors.surface.secondary}`,
            borderRadius: radii.xs,
            color: band?.color ?? colors.text.secondary,
            fontSize: 10,
            fontFamily: typography.families.mono,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {BANDS.map(b => (
            <option key={b.signal} value={b.signal} style={{ background: '#0a0a0e', color: b.color }}>
              {b.label}
            </option>
          ))}
        </select>

        <span style={{ color: colors.text.disabled, fontSize: 9 }}>→</span>

        {/* Param selector */}
        <select
          value={mapping.param}
          onChange={e => onUpdate({ ...mapping, param: e.target.value })}
          style={{
            flex: 1,
            padding: '3px 4px',
            background: colors.surface.primary,
            border: `1px solid ${colors.surface.secondary}`,
            borderRadius: radii.xs,
            color: colors.text.secondary,
            fontSize: 10,
            fontFamily: typography.families.mono,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {availableParams.map(p => (
            <option key={p} value={p} style={{ background: '#0a0a0e', color: colors.text.secondary }}>
              {p}
            </option>
          ))}
        </select>

        {/* Remove */}
        <button
          onClick={onRemove}
          style={{
            width: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 3,
            color: colors.text.disabled,
            fontSize: 10,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = colors.state.error }}
          onMouseLeave={e => { e.currentTarget.style.color = colors.text.disabled }}
        >×</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Amount slider */}
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={mapping.amount}
          onChange={e => onUpdate({ ...mapping, amount: parseFloat(e.target.value) })}
          style={{ flex: 1, height: 3 }}
        />
        <span style={{
          fontFamily: typography.families.mono,
          fontSize: 9,
          color: colors.accent.primary,
          minWidth: 28, textAlign: 'right',
        }}>{(mapping.amount * 100).toFixed(0)}%</span>

        {/* Curve selector */}
        <select
          value={mapping.curve}
          onChange={e => onUpdate({ ...mapping, curve: e.target.value as AudioMapping['curve'] })}
          style={{
            padding: '2px 3px',
            background: colors.surface.primary,
            border: `1px solid ${colors.surface.secondary}`,
            borderRadius: radii.xs,
            color: colors.text.tertiary,
            fontSize: 9,
            fontFamily: typography.families.mono,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {CURVES.map(c => (
            <option key={c} value={c} style={{ background: '#0a0a0e' }}>
              {CURVE_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
