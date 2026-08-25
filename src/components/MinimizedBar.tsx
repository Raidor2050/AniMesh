import { useUIStore } from '../state/stores'
import { colors, typography, radii } from '../ui/tokens'

const PANEL_LABELS: Record<string, string> = {
  params: 'Parameters',
  eq: 'EQ Mapping',
  stream: 'Audio Stream',
}

export function MinimizedBar() {
  const bootComplete = useUIStore(s => s.bootComplete)
  const immersive = useUIStore(s => s.immersive)
  const minimizedPanels = useUIStore(s => s.minimizedPanels)
  const togglePanelMinimized = useUIStore(s => s.togglePanelMinimized)

  if (!bootComplete || immersive || minimizedPanels.length === 0) return null

  return (
    <div style={{
      position: 'absolute',
      top: 56,
      right: 12,
      zIndex: 30,
      display: 'flex',
      gap: 6,
      alignItems: 'center',
    }}>
      {minimizedPanels.map(id => (
        <button
          key={id}
          onClick={() => togglePanelMinimized(id)}
          title={`Restore ${PANEL_LABELS[id] ?? id}`}
          style={{
            height: 24,
            padding: '0 10px',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: radii.sm,
            color: colors.accent.hover,
            fontSize: 9,
            fontFamily: typography.families.mono,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.12s ease',
            backdropFilter: 'blur(12px)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.2)'
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.12)'
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
          }}
        >
          ▸ {PANEL_LABELS[id] ?? id}
        </button>
      ))}
    </div>
  )
}
