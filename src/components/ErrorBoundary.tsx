import { Component, ReactNode } from 'react'
import { colors, typography, spacing, radii } from '../ui/tokens'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// repo-hunter adoption (bvaughn/react-error-boundary pattern, zero-dep):
// isolates render crashes so a single broken shader/panel can't take the
// whole VJ session down. Recovery = reset the boundary + reload keeps the
// cached service worker shell fast.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('AniMesh UI error boundary caught:', error)
  }

  private handleRecover = () => {
    this.setState({ error: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: colors.amoledBlack,
        color: colors.text.secondary,
        fontFamily: typography.families.sans,
        padding: spacing.scale[6],
        textAlign: 'center',
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{
            fontSize: typography.scale.display.size,
            fontWeight: 700,
            color: colors.state.error,
            marginBottom: spacing.scale[3],
          }}>
            RENDER FAULT
          </div>
          <p style={{
            fontSize: typography.scale.base.size,
            lineHeight: '20px',
            marginBottom: spacing.scale[4],
          }}>
            The preview engine hit an unrecoverable error. Your shader library
            and preferences are safe.
          </p>
          <button
            onClick={this.handleRecover}
            style={{
              fontFamily: typography.families.sans,
              fontSize: typography.scale.md.size,
              fontWeight: 500,
              color: '#fff',
              background: colors.accent.primary,
              border: 'none',
              borderRadius: radii.sm,
              padding: `${spacing.scale[2]}px ${spacing.scale[5]}px`,
              cursor: 'pointer',
              marginRight: spacing.scale[3],
            }}
          >
            Try again
          </button>
          <button
            onClick={this.handleReload}
            style={{
              fontFamily: typography.families.sans,
              fontSize: typography.scale.md.size,
              fontWeight: 500,
              color: colors.text.primary,
              background: colors.surface.hover,
              border: `1px solid ${colors.surface.secondary}`,
              borderRadius: radii.sm,
              padding: `${spacing.scale[2]}px ${spacing.scale[5]}px`,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}