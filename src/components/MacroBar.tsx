import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useUIStore, audioDataBridge } from '../state/stores'
import { DEFAULT_PROFILE, MACRO_IDS, MacroId } from '../mappings/featureGraph'
import { announce } from '../a11y/announcer'
import { colors, typography, spacing, radii } from '../ui/tokens'

/**
 * MacroBar (D26) — the five semantic knobs (Energy / Complexity / Motion /
 * Musicality / Atmosphere). Writes straight into the ref bridge; the renderer
 * reads it every frame. No React state per pointer-motion: range inputs are
 * uncontrolled and the value labels refresh at 10Hz. "Advanced" reveals the
 * full EQ/mapping subview.
 */
export function MacroBar() {
  const bootComplete = useUIStore(s => s.bootComplete)
  const immersive = useUIStore(s => s.immersive)
  const panelsVisible = useUIStore(s => s.panelsVisible)
  const eqMinimized = useUIStore(s => s.minimizedPanels.includes('eq'))
  const togglePanelMinimized = useUIStore(s => s.togglePanelMinimized)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})
  // 10Hz label refresh only — sliders stay uncontrolled.
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 100)
    return () => window.clearInterval(id)
  }, [])

  if (!bootComplete || immersive || !panelsVisible) return null

  const setMacro = (id: MacroId, v: number) => {
    audioDataBridge.macros[id] = Math.max(0, Math.min(1, v))
  }

  const reset = () => {
    for (const id of MACRO_IDS) {
      audioDataBridge.macros[id] = DEFAULT_PROFILE.macros[id] ?? 1
      const el = inputs.current[id]
      if (el) el.value = String(audioDataBridge.macros[id])
    }
    announce('Macro bar reset')
  }

  const openAdvanced = () => {
    if (eqMinimized) togglePanelMinimized('eq')
    announce('Advanced mapping panel opened')
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: spacing.scale[4],
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 18,
        display: 'flex',
        alignItems: 'flex-end',
        gap: spacing.scale[3],
        padding: `${spacing.scale[3]}px ${spacing.scale[4]}px`,
        background: colors.surface.panel,
        backdropFilter: 'blur(24px) saturate(1.1)',
        border: `1px solid ${colors.surface.secondary}`,
        borderRadius: radii.lg,
        boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
        userSelect: 'none',
      }}
      role="group"
      aria-label="Audio macros"
    >
      {MACRO_IDS.map(id => {
        const def = DEFAULT_PROFILE.macroDefs.find(d => d.id === id)
        const value = audioDataBridge.macros[id] ?? 1
        return (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: typography.families.mono,
                fontSize: 9,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: colors.text.tertiary,
                lineHeight: 1.1,
                textAlign: 'center',
              }}
            >
              {def?.label ?? id}
            </span>
            <input
              ref={el => { inputs.current[id] = el }}
              type="range"
              defaultValue={value}
              min={0}
              max={1}
              step={0.02}
              aria-label={`${def?.label ?? id} macro, currently ${value.toFixed(2)}`}
              title={def?.description ?? ''}
              onChange={e => { setMacro(id, parseFloat(e.target.value)); e.currentTarget.setAttribute('aria-label', `${def?.label ?? id} macro, currently ${parseFloat(e.target.value).toFixed(2)}`) }}
              style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 96, cursor: 'pointer' }}
            />
            <span
              style={{
                fontFamily: typography.families.mono,
                fontSize: 10,
                color: value > 0.01 ? colors.accent.primary : colors.text.disabled,
                minWidth: 30,
                textAlign: 'center',
              }}
            >
              {value.toFixed(2)}
            </span>
          </div>
        )
      })}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, alignSelf: 'stretch' }}>
        <button
          onClick={reset}
          aria-label="Reset macros"
          title="Reset all macros"
          style={tinyButton}
        >
          ↺
        </button>
        <button
          onClick={openAdvanced}
          aria-label="Advanced EQ mapping"
          title="Advanced mapping panel"
          style={tinyButton}
        >
          ⇗
        </button>
      </div>
    </div>
  )
}

const tinyButton: CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${colors.surface.secondary}`,
  borderRadius: radii.sm,
  color: colors.text.secondary,
  fontSize: 13,
  cursor: 'pointer',
}