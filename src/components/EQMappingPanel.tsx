import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useShaderStore, useUIStore, audioDataBridge } from '../state/stores'
import { AudioSignal, AudioMapping } from '../utils/types'
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

/** Stable, toggleable id for a mapping (shared with the renderer filter). */
function mappingId(m: AudioMapping): string {
  return `${m.signal}->${m.param}`
}

export function EQMappingPanel() {
  const activeShader = useShaderStore(s => s.activeShader)
  const customMappings = useShaderStore(s => s.customAudioMappings)
  const addMapping = useShaderStore(s => s.addCustomAudioMapping)
  const removeMapping = useShaderStore(s => s.removeCustomAudioMapping)
  const updateMapping = useShaderStore(s => s.updateCustomAudioMapping)
  const disabledMappings = useShaderStore(s => s.disabledMappings)
  const toggleMappingDisabled = useShaderStore(s => s.toggleMappingDisabled)
  const immersive = useUIStore(s => s.immersive)
  const panelsVisible = useUIStore(s => s.panelsVisible)
  const isMinimized = useUIStore(s => s.minimizedPanels.includes('eq'))
  const togglePanelMinimized = useUIStore(s => s.togglePanelMinimized)
  const [bandLevels, setBandLevels] = useState<Record<string, number>>({})
  const [collapsed, setCollapsed] = useState(false)

  const { isDragging, containerRef, dragProps } = useDraggable({
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

  if (!activeShader || immersive || !panelsVisible || isMinimized) return null

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePanelMinimized('eq')
                  }}
                  aria-label="Minimize EQ mapping"
                  title="Minimize"
                  style={{
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: radii.xs,
                    color: colors.text.disabled,
                    fontSize: 14,
                    lineHeight: 1,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = colors.text.secondary; e.currentTarget.style.background = colors.surface.primary }}
                  onMouseLeave={e => { e.currentTarget.style.color = colors.text.disabled; e.currentTarget.style.background = 'transparent' }}
                >−</button>
              </div>
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
                    opacity: disabledMappings.includes(mappingId(m)) ? 0.45 : 1,
                  }}>
                    <ToggleButton
                      on={!disabledMappings.includes(mappingId(m))}
                      label={`Toggle ${m.signal} to ${m.param}`}
                      onClick={() => toggleMappingDisabled(mappingId(m))}
                    />
                    <span style={{
                      padding: '1px 4px',
                      borderRadius: 3,
                      background: BANDS.find(b => b.signal === m.signal)?.color + '22',
                      color: BANDS.find(b => b.signal === m.signal)?.color ?? colors.text.tertiary,
                      fontSize: 9,
                      textDecoration: disabledMappings.includes(mappingId(m)) ? 'line-through' : 'none',
                    }}>{m.signal}</span>
                    <span style={{ opacity: 0.4 }}>→</span>
                    <span style={{ color: colors.text.secondary, textDecoration: disabledMappings.includes(mappingId(m)) ? 'line-through' : 'none' }}>{m.param}</span>
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
                  availableParams={availableParams}
                  disabled={disabledMappings.includes(mappingId(mapping))}
                  onToggle={() => toggleMappingDisabled(mappingId(mapping))}
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

function MappingRow({ mapping, availableParams, disabled, onToggle, onUpdate, onRemove }: {
  mapping: AudioMapping
  availableParams: string[]
  disabled: boolean
  onToggle: () => void
  onUpdate: (m: AudioMapping) => void
  onRemove: () => void
}) {
  const band = BANDS.find(b => b.signal === mapping.signal)

  return (
    <div style={{
      padding: '6px 0',
      borderBottom: `1px solid ${colors.surface.secondary}`,
      opacity: disabled ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        {/* Enabled toggle — off lets the user tweak this param by hand */}
        <ToggleButton
          on={!disabled}
          label={`Toggle ${mapping.signal} to ${mapping.param}`}
          onClick={onToggle}
        />
        {/* Signal selector */}
        <select
          value={mapping.signal}
          disabled={disabled}
          onChange={e => onUpdate({ ...mapping, signal: e.target.value as AudioSignal })}
          style={{
            flex: 1,
            padding: '3px 4px',
            background: colors.surface.primary,
            border: `1px solid ${colors.surface.secondary}`,
            borderRadius: radii.xs,
            color: band?.color ?? colors.text.secondary,
            colorScheme: 'dark',
            fontSize: 10,
            fontFamily: typography.families.mono,
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
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
          disabled={disabled}
          onChange={e => onUpdate({ ...mapping, param: e.target.value })}
          style={{
            flex: 1,
            padding: '3px 4px',
            background: colors.surface.primary,
            border: `1px solid ${colors.surface.secondary}`,
            borderRadius: radii.xs,
            color: colors.text.secondary,
            colorScheme: 'dark',
            fontSize: 10,
            fontFamily: typography.families.mono,
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
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
          disabled={disabled}
          onChange={e => onUpdate({ ...mapping, amount: parseFloat(e.target.value) })}
          style={{ flex: 1, height: 3, opacity: disabled ? 0.5 : 1 }}
        />
        <span style={{
          fontFamily: typography.families.mono,
          fontSize: 9,
          color: colors.accent.primary,
          minWidth: 28, textAlign: 'right',
          opacity: disabled ? 0.5 : 1,
        }}>{(mapping.amount * 100).toFixed(0)}%</span>

        {/* Curve selector */}
        <select
          value={mapping.curve}
          disabled={disabled}
          onChange={e => onUpdate({ ...mapping, curve: e.target.value as AudioMapping['curve'] })}
          style={{
            padding: '2px 3px',
            background: colors.surface.primary,
            border: `1px solid ${colors.surface.secondary}`,
            borderRadius: radii.xs,
            color: colors.text.tertiary,
            colorScheme: 'dark',
            fontSize: 9,
            fontFamily: typography.families.mono,
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
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

/** Compact on/off pill used to enable/disable an audio mapping. */
function ToggleButton({ on, label, onClick }: {
  on: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      aria-label={label}
      title={on ? 'Audio mapping on — disable to tweak this parameter manually' : 'Audio mapping off — enable audio control'}
      aria-pressed={on}
      style={{
        width: 20, height: 14,
        flexShrink: 0,
        position: 'relative',
        border: `1px solid ${on ? 'rgba(99,102,241,0.5)' : colors.surface.secondary}`,
        borderRadius: 8,
        background: on ? 'rgba(99,102,241,0.25)' : colors.surface.primary,
        cursor: 'pointer',
        padding: 0,
        transition: 'all 0.12s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = on ? 'rgba(129,140,248,0.8)' : colors.borderHover }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = on ? 'rgba(99,102,241,0.5)' : colors.surface.secondary }}
    >
      <span style={{
        position: 'absolute',
        top: '50%',
        left: on ? 'auto' : 2,
        right: on ? 2 : 'auto',
        transform: 'translateY(-50%)',
        width: 9, height: 9,
        borderRadius: '50%',
        background: on ? '#A5B4FC' : colors.text.disabled,
        boxShadow: on ? '0 0 5px rgba(165,180,252,0.7)' : 'none',
        transition: 'all 0.12s ease',
      }} />
    </button>
  )
}
