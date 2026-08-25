import { useUIStore } from '../state/stores'
import { colors, typography, radii } from '../ui/tokens'

export function LeftToolbar() {
  const bootComplete = useUIStore(s => s.bootComplete)
  const immersive = useUIStore(s => s.immersive)
  const browserOpen = useUIStore(s => s.browserOpen)
  const toggleBrowser = useUIStore(s => s.toggleBrowser)
  const toggleImmersive = useUIStore(s => s.toggleImmersive)

  if (!bootComplete || immersive) return null

  return (
    <div style={{
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Library Button */}
      <button
        onClick={toggleBrowser}
        title="Library (?)"
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          background: browserOpen ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${browserOpen ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: radii.md,
          color: browserOpen ? colors.accent.hover : colors.text.secondary,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          backdropFilter: 'blur(12px)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(99,102,241,0.12)'
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
          e.currentTarget.style.color = colors.text.primary
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = browserOpen ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)'
          e.currentTarget.style.borderColor = browserOpen ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = browserOpen ? colors.accent.hover : colors.text.secondary
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span style={{
          fontSize: 7,
          fontFamily: typography.families.mono,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          opacity: 0.8,
        }}>LIB</span>
      </button>

      {/* Fullscreen Button */}
      <button
        onClick={toggleImmersive}
        title="Fullscreen (F)"
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: radii.md,
          color: colors.text.secondary,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          backdropFilter: 'blur(12px)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          e.currentTarget.style.color = colors.text.primary
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = colors.text.secondary
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
        <span style={{
          fontSize: 7,
          fontFamily: typography.families.mono,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          opacity: 0.8,
        }}>FULL</span>
      </button>
    </div>
  )
}
