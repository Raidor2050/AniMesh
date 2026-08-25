import { useUIStore } from '../state/stores'
import { colors, typography, radii } from '../ui/tokens'

export function PanelToggleButton() {
  const panelsVisible = useUIStore(s => s.panelsVisible)
  const togglePanelsVisible = useUIStore(s => s.togglePanelsVisible)
  const immersive = useUIStore(s => s.immersive)
  const bootComplete = useUIStore(s => s.bootComplete)

  if (!bootComplete || immersive) return null

  return (
    <button
      onClick={togglePanelsVisible}
      aria-label={panelsVisible ? 'Hide right panels' : 'Show right panels'}
      title={panelsVisible ? 'Hide panels (right side)' : 'Show panels'}
      style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: panelsVisible ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${panelsVisible ? colors.surface.secondary : 'rgba(99,102,241,0.25)'}`,
        borderRadius: radii.sm,
        color: panelsVisible ? colors.text.disabled : colors.accent.hover,
        fontSize: 13,
        cursor: 'pointer',
        zIndex: 30,
        transition: 'all 0.15s ease',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
        e.currentTarget.style.color = colors.text.primary
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = panelsVisible ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'
        e.currentTarget.style.borderColor = panelsVisible ? colors.surface.secondary : 'rgba(99,102,241,0.25)'
        e.currentTarget.style.color = panelsVisible ? colors.text.disabled : colors.accent.hover
      }}
    >
      {panelsVisible ? '◂' : '▸'}
    </button>
  )
}
