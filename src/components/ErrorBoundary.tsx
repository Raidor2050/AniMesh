import { Component, ErrorInfo, ReactNode } from 'react'
import { announce } from '../a11y/announcer'
import { colors, typography } from '../ui/tokens'

interface Props {
  children: ReactNode
  /** stable id, used to dedupe repeated announce chatter for the same panel */
  panel: string
  /** slim style used for inline panels (canvas + panels) vs the root fallback */
  variant?: 'root' | 'panel'
  onRetry?: () => void
}

interface State {
  error: string | null
}

/**
 * ErrorBoundary (D28): a crash must never blank the app. Panel-variant errors
 * render a slim inline block with retry; root-variant renders a single screen
 * with a reload action. Every failure is announced to screen readers.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(err: unknown): State {
    return { error: err instanceof Error ? err.message : String(err) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[boundary:${this.props.panel}]`, error, info)
    announce(`App error in ${this.props.panel}: ${error.message}`)
  }

  reset = () => {
    this.setState({ error: null })
    this.props.onRetry?.()
  }

  render() {
    if (!this.state.error) return this.props.children

    const isRoot = this.props.variant === 'root'
    return (
      <div
        role="alert"
        style={{
          position: isRoot ? 'fixed' : 'absolute',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          background: isRoot ? '#000' : 'rgba(0,0,0,0.72)',
          backdropFilter: isRoot ? 'none' : 'blur(12px)',
          fontFamily: typography.families.mono,
          color: '#ff6b6b',
          fontSize: 13,
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11 }}>
          {this.props.panel} crashed
        </div>
        <div style={{ maxWidth: 420, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
          {this.state.error}
        </div>
        <button
          onClick={this.reset}
          aria-label="Retry"
          style={{
            padding: '10px 22px',
            background: colors.accent.primary,
            color: '#000',
            border: 'none',
            borderRadius: 8,
            fontFamily: typography.families.mono,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
        {isRoot && (
          <button
            onClick={() => window.location.reload()}
            aria-label="Reload application"
            style={{
              padding: '10px 22px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              fontFamily: typography.families.mono,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        )}
      </div>
    )
  }
}