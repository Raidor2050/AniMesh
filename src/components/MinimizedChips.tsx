import { useUIStore } from '../state/stores'
import { colors, typography, radii } from '../ui/tokens'

const PANEL_CHIPS: Record<string, { glyph: string; label: string }> = {
  params: { glyph: '⚙', label: 'Parameters' },
  eq: { glyph: '◮', label: 'EQ Mapping' },
  stream: { glyph: '◉', label: 'Stream' },
}

/** Restore chips for individually-minimized boxes, docked with the
 *  Connect-Audio cluster in the bottom-right corner. Param/EQ chips hide
 *  while the panels button has stowed those boxes; Stream is independent. */
export function MinimizedChips() {
  const immersive = useUIStore(s => s.immersive)
  const panelsVisible = useUIStore(s => s.panelsVisible)
  const minimizedPanels = useUIStore(s => s.minimizedPanels)
  const togglePanelMinimized = useUIStore(s => s.togglePanelMinimized)

  if (immersive) return null

  const chips = (panelsVisible ? minimizedPanels : minimizedPanels.filter(id => id !== 'params' && id !== 'eq'))
    .filter(id => PANEL_CHIPS[id])

  if (chips.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
      pointerEvents: 'auto',
    }}>
      {chips.map(id => (
        <button
          key={id}
          onClick={() => togglePanelMinimized(id)}
          title={`Restore ${PANEL_CHIPS[id].label}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 24,
            padding: '0 10px 0 8px',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: radii.full,
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
          <span style={{ fontSize: 10, lineHeight: 1 }}>{PANEL_CHIPS[id].glyph}</span>
          <span>{PANEL_CHIPS[id].label}</span>
        </button>
      ))}
    </div>
  )
}