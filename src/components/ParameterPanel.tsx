import { useShaderStore, useUIStore, audioDataBridge } from '../state/stores'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { colors, typography, spacing, radii } from '../ui/tokens'
import { useDraggable } from '../hooks/useDraggable'
import { ParameterSchema } from '../utils/types'
import { getHeroPresets, ShaderPreset } from '../shaders/heroPresets'
import { announce } from '../a11y/announcer'

function randomizeParams(paramDefs: ParameterSchema[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const p of paramDefs) {
    const range = p.max - p.min
    const raw = p.min + Math.random() * range
    const snapped = Math.round(raw / p.step) * p.step
    result[p.id] = Math.max(p.min, Math.min(p.max, parseFloat(snapped.toFixed(4))))
  }
  return result
}

export function ParameterPanel() {
  const activeShader = useShaderStore(s => s.activeShader)
  const params = useShaderStore(s => s.params)
  const setParam = useShaderStore(s => s.setParam)
  const setParams = useShaderStore(s => s.setParams)
  const immersive = useUIStore(s => s.immersive)
  const panelsVisible = useUIStore(s => s.panelsVisible)
  const isMinimized = useUIStore(s => s.minimizedPanels.includes('params'))
  const togglePanelMinimized = useUIStore(s => s.togglePanelMinimized)
  const savedChips = useShaderStore(s => s.savedChips)
  const commitParams = useShaderStore(s => s.commitParams)
  const saveChip = useShaderStore(s => s.saveChip)
  const removeChip = useShaderStore(s => s.removeChip)
  const [audioLevel, setAudioLevel] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [savingChip, setSavingChip] = useState(false)
  const [chipName, setChipName] = useState('')

  const chips: ShaderPreset[] = activeShader
    ? [...getHeroPresets(activeShader.id), ...(savedChips[activeShader.id] ?? [])]
    : []

  const applyPreset = (preset: ShaderPreset) => {
    if (!activeShader) return
    commitParams({ ...activeShader.defaults, ...preset.params })
    announce(`Preset ${preset.name} applied`)
  }

  const confirmSave = () => {
    if (chipName.trim() && activeShader) {
      saveChip(chipName, useShaderStore.getState().params)
    }
    setChipName('')
    setSavingChip(false)
  }

  const { isDragging, containerRef, dragProps } = useDraggable({
    initialX: typeof window !== 'undefined' ? window.innerWidth - 496 : 800,
    initialY: 60,
    bounds: { left: 0, top: 48, right: 0, bottom: 0 },
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(audioDataBridge.snapshot.volume)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  if (!activeShader || immersive || !panelsVisible || isMinimized) return null

  const paramDefs = activeShader.params
  if (paramDefs.length === 0) return null

  const audioParams = paramDefs.filter(p => p.group === 'audio')
  const visualParams = paramDefs.filter(p => p.group !== 'audio')

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
          width: collapsed ? 36 : 232,
          minHeight: collapsed ? 40 : 48,
          maxHeight: collapsed ? undefined : 'calc(100vh - 80px)',
          zIndex: isDragging ? 999 : 15,
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
                }}>Parameters</span>
                <span style={{
                  fontSize: 9,
                  color: colors.text.disabled,
                  fontFamily: typography.families.mono,
                  background: colors.surface.primary,
                  padding: '1px 5px',
                  borderRadius: radii.xs,
                }}>{paramDefs.length}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setParams(randomizeParams(paramDefs))
                  }}
                  aria-label="Randomize parameters"
                  title="Randomize all"
                  style={{
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: radii.xs,
                    color: colors.text.disabled,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = colors.accent.hover; e.currentTarget.style.background = colors.surface.primary }}
                  onMouseLeave={e => { e.currentTarget.style.color = colors.text.disabled; e.currentTarget.style.background = 'transparent' }}
                >🎲</button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (activeShader) setParams({ ...activeShader.defaults })
                  }}
                  aria-label="Reset parameters"
                  title="Reset to defaults"
                  style={{
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: radii.xs,
                    color: colors.text.disabled,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = colors.accent.hover; e.currentTarget.style.background = colors.surface.primary }}
                  onMouseLeave={e => { e.currentTarget.style.color = colors.text.disabled; e.currentTarget.style.background = 'transparent' }}
                >↺</button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePanelMinimized('params')
                  }}
                  aria-label="Minimize parameters"
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
                    marginLeft: 2,
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
            {/* Preset chips (D27) — instant recall + undo (Ctrl+Z) */}
            {(chips.length > 0 || savingChip) && (
              <div style={{ marginBottom: spacing.scale[4] }}>
                <div style={{
                  fontSize: 9,
                  fontFamily: typography.families.mono,
                  color: colors.text.disabled,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: spacing.scale[2],
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>Presets</span>
                  {!savingChip && (
                    <button
                      onClick={() => setSavingChip(true)}
                      aria-label="Save current parameters as a preset"
                      title="Save preset"
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: colors.text.disabled, fontSize: 12, padding: '2px 4px',
                      }}
                    >+ chip</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {savingChip && (
                    <input
                      autoFocus
                      value={chipName}
                      onChange={e => setChipName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmSave()
                        if (e.key === 'Escape') setSavingChip(false)
                      }}
                      onBlur={() => { if (!chipName.trim()) setSavingChip(false) }}
                      placeholder="preset name…"
                      aria-label="Preset name"
                      style={{
                        background: colors.surface.primary,
                        border: `1px solid ${colors.surface.secondary}`,
                        color: colors.text.primary,
                        fontFamily: typography.families.mono,
                        fontSize: 10,
                        padding: '4px 7px',
                        borderRadius: radii.sm,
                        width: 90,
                        outline: 'none',
                      }}
                    />
                  )}
                  {chips.map((preset, i) => (
                    <span key={`${preset.name}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <button
                        onClick={() => applyPreset(preset)}
                        aria-label={`Apply preset ${preset.name}`}
                        title={preset.name}
                        style={{
                          background: colors.accent.subtle,
                          border: 'none',
                          borderRadius: radii.sm,
                          color: preset.custom ? colors.accent.hover : colors.text.secondary,
                          fontFamily: typography.families.mono,
                          fontSize: 10,
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >{preset.name}</button>
                      {preset.custom && (
                        <button
                          onClick={() => { if (activeShader) removeChip(activeShader.id, i - getHeroPresets(activeShader.id).length) }}
                          aria-label={`Delete preset ${preset.name}`}
                          title="Delete preset"
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: colors.text.disabled, fontSize: 10, padding: 0,
                          }}
                        >×</button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Visual params */}
            {visualParams.length > 0 && (
              <div style={{ marginBottom: spacing.scale[4] }}>
                {visualParams.map(param => (
                  <ParamSlider
                    key={param.id}
                    param={param}
                    value={params[param.id] ?? param.default}
                    onChange={v => setParam(param.id, v)}
                  />
                ))}
              </div>
            )}

            {/* Audio-reactive params */}
            {audioParams.length > 0 && (
              <div>
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
                    background: colors.accent.primary,
                    boxShadow: `0 0 6px ${colors.accent.glow}`,
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }} />
                  Audio-Reactive
                </div>
                {audioParams.map(param => (
                  <ParamSlider
                    key={param.id}
                    param={param}
                    value={params[param.id] ?? param.default}
                    onChange={v => setParam(param.id, v)}
                    isAudio
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Audio level bar at bottom */}
        {!collapsed && (
          <div style={{
            padding: `${spacing.scale[2]}px ${spacing.scale[4]}px`,
            borderTop: `1px solid ${colors.surface.secondary}`,
            flexShrink: 0,
          }}>
            <div style={{
              height: 2,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 1,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${audioLevel * 100}%`,
                background: `linear-gradient(90deg, ${colors.accent.primary}, #A855F7)`,
                borderRadius: 1,
                transition: 'width 0.05s ease',
              }} />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function ParamSlider({
  param, value, onChange, isAudio = false
}: {
  param: { id: string; label: string; min: number; max: number; default: number; step: number }
  value: number
  onChange: (v: number) => void
  isAudio?: boolean
}) {
  const isAtDefault = Math.abs(value - param.default) < param.step * 0.5

  return (
    <div style={{ marginBottom: spacing.scale[3] }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 4,
      }}>
        <span
          onDoubleClick={(e) => { e.preventDefault(); onChange(param.default) }}
          style={{
            fontSize: 11,
            color: isAudio ? colors.accent.hover : colors.text.secondary,
            fontFamily: typography.families.sans,
            fontWeight: 500,
            cursor: isAtDefault ? 'default' : 'pointer',
            opacity: isAtDefault ? 1 : 0.9,
          }}
          title="Double-click to reset to default"
        >{param.label}</span>
        <span style={{
          fontSize: 10,
          color: isAtDefault ? colors.text.disabled : colors.accent.primary,
          fontFamily: typography.families.mono,
          fontWeight: 500,
          minWidth: 32, textAlign: 'right',
        }}>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={param.step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  )
}
