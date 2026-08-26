import { useUIStore } from '../state/stores'
import { colors, typography, radii } from '../ui/tokens'

export function LeftToolbar() {
  const bootComplete = useUIStore(s => s.bootComplete)
  const immersive = useUIStore(s => s.immersive)
  const browserOpen = useUIStore(s => s.browserOpen)
  const carouselOpen = useUIStore(s => s.carouselOpen)
  const toggleBrowser = useUIStore(s => s.toggleBrowser)
  const toggleCarousel = useUIStore(s => s.toggleCarousel)
  const toggleImmersive = useUIStore(s => s.toggleImmersive)

  if (!bootComplete || immersive) return null

  const btnBase: React.CSSProperties = {
    width: 42,
    height: 42,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    backdropFilter: 'blur(16px)',
    position: 'relative',
  }

  return (
    <div style={{
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      {/* Library Button */}
      <button
        onClick={toggleBrowser}
        title="Library (press ? or [ )"
        style={{
          ...btnBase,
          background: browserOpen
            ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.15))'
            : 'rgba(255,255,255,0.05)',
          border: `1px solid ${browserOpen ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'}`,
          color: browserOpen ? colors.accent.hover : colors.text.tertiary,
          boxShadow: browserOpen ? '0 0 16px rgba(99,102,241,0.12)' : 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
          e.currentTarget.style.color = colors.accent.hover
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,0.15)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = browserOpen
            ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.15))'
            : 'rgba(255,255,255,0.05)'
          e.currentTarget.style.borderColor = browserOpen ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'
          e.currentTarget.style.color = browserOpen ? colors.accent.hover : colors.text.tertiary
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = browserOpen ? '0 0 16px rgba(99,102,241,0.12)' : 'none'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </button>

      {/* Carousel Button */}
      <button
        onClick={toggleCarousel}
        title="3D Carousel (C)"
        style={{
          ...btnBase,
          background: carouselOpen
            ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.15))'
            : 'rgba(255,255,255,0.05)',
          border: `1px solid ${carouselOpen ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'}`,
          color: carouselOpen ? colors.accent.hover : colors.text.tertiary,
          boxShadow: carouselOpen ? '0 0 16px rgba(99,102,241,0.12)' : 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
          e.currentTarget.style.color = colors.accent.hover
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,0.15)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = carouselOpen
            ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.15))'
            : 'rgba(255,255,255,0.05)'
          e.currentTarget.style.borderColor = carouselOpen ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'
          e.currentTarget.style.color = carouselOpen ? colors.accent.hover : colors.text.tertiary
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = carouselOpen ? '0 0 16px rgba(99,102,241,0.12)' : 'none'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M12 6V2M7 6V4M17 6V4"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      </button>

      {/* Fullscreen Button */}
      <button
        onClick={toggleImmersive}
        title="Fullscreen (F)"
        style={{
          ...btnBase,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: colors.text.tertiary,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
          e.currentTarget.style.color = colors.text.secondary
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
          e.currentTarget.style.color = colors.text.tertiary
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>
    </div>
  )
}
