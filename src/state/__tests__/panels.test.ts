import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../stores'

describe('panel visibility toggle (params + eq with the panels button)', () => {
  beforeEach(() => {
    // Reset to a known clean state: panels visible, nothing minimized.
    useUIStore.setState({ panelsVisible: true, minimizedPanels: [] })
  })

  it('hides the Param + EQ boxes when toggled off', () => {
    useUIStore.getState().togglePanelsVisible()
    expect(useUIStore.getState().panelsVisible).toBe(false)
  })

  it('shows them again when toggled back on', () => {
    useUIStore.getState().togglePanelsVisible()
    useUIStore.getState().togglePanelsVisible()
    expect(useUIStore.getState().panelsVisible).toBe(true)
  })

  it('un-minimizes previously minimized Param/EQ boxes so they actually reappear', () => {
    useUIStore.setState({ minimizedPanels: ['params', 'eq', 'stream'] })
    useUIStore.getState().togglePanelsVisible() // hide
    expect(useUIStore.getState().panelsVisible).toBe(false)
    useUIStore.getState().togglePanelsVisible() // show
    const s = useUIStore.getState()
    expect(s.panelsVisible).toBe(true)
    expect(s.minimizedPanels).not.toContain('params')
    expect(s.minimizedPanels).not.toContain('eq')
    // Stream stays minimized — it is independent of the panels button.
    expect(s.minimizedPanels).toContain('stream')
  })

  it('keeps minimized state untouched while hiding', () => {
    useUIStore.setState({ minimizedPanels: ['stream'] })
    useUIStore.getState().togglePanelsVisible()
    expect(useUIStore.getState().minimizedPanels).toEqual(['stream'])
  })

  it('never minimizes the boxes itself — the button is a pure show/hide', () => {
    useUIStore.setState({ panelsVisible: true, minimizedPanels: [] })
    useUIStore.getState().togglePanelsVisible() // hide
    expect(useUIStore.getState().minimizedPanels).toEqual([])
    useUIStore.getState().togglePanelsVisible() // show again
    expect(useUIStore.getState().panelsVisible).toBe(true)
    expect(useUIStore.getState().minimizedPanels).toEqual([])
  })
})