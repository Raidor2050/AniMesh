import { useShaderStore, useUIStore, audioDataBridge } from '../state/stores'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { colors, typography, spacing, radii } from '../ui/tokens'

export function ParameterPanel() {
  const activeShader = useShaderStore(s => s.activeShader)
  const params = useShaderStore(s => s.params)
  const setParam = useShaderStore(s => s.setParam)
  const immersive = useUIStore(s => s.immersive)
  const [audioLevel, setAudioLevel] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(audioDataBridge.snapshot.volume)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  if (!activeShader || immersive) return null

  const paramDefs = activeShader.params
  if (paramDefs.length === 0) return null

  const audioParams = paramDefs.filter(p => p.group === 'audio')
  const visualParams = paramDefs.filter(p => !p.group)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'absolute',
          top: 60, right: 252,
          height: collapsed ? 40 : 260,
          width: collapsed ? 36 : 232,
          zIndex: 15,
          background: colors.surface.panel,
          backdropFilter: 'blur(24px) saturate(1.1)',
          border: `1px solid ${colors.surface.secondary}`,
          borderRadius: radii.lg,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: collapsed ? '12px 0' : `${spacing.scale[3]}px ${spacing.scale[4]}px`,
          borderBottom: collapsed ? 'none' : `1px solid ${colors.surface.secondary}`,
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
          cursor: 'pointer',
        }}
          onClick={() => setCollapsed(!collapsed)}
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
              <span style={{ fontSize: 12, color: colors.text.disabled, transform: 'rotate(180deg)' }}>◂</span>
            </>
          )}
        </div>

        {!collapsed && (
          <div style={{ flex: 1, overflow: 'auto', padding: `${spacing.scale[3]}px ${spacing.scale[4]}px` }}>
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
  return (
    <div style={{ marginBottom: spacing.scale[3] }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 4,
      }}>
        <span style={{
          fontSize: 11,
          color: isAudio ? colors.accent.hover : colors.text.secondary,
          fontFamily: typography.families.sans,
          fontWeight: 500,
        }}>{param.label}</span>
        <span style={{
          fontSize: 10,
          color: colors.accent.primary,
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
