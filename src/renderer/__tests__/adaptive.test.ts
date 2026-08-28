import { describe, it, expect } from 'vitest'
import {
  ema, stepAdaptive, createAdaptiveState,
  MIN_SCALE, MAX_SCALE, FRAME_BUDGET_MS, SCALE_STEP_DOWN, SCALE_STEP_UP,
} from '../adaptive'

describe('adaptive resolution (D30)', () => {
  it('ema converges toward a steady sample', () => {
    let e = 0
    for (let i = 0; i < 200; i++) e = ema(e, 10)
    expect(e).toBeGreaterThan(9)
    expect(e).toBeLessThan(10.5)
  })

  it('steady-state within budget holds the current scale', () => {
    const s = createAdaptiveState()
    const out = stepAdaptive(s, 11, 8, 2000)
    expect(out.scale).toBe(1)
  })

  it('steps down when the frame misses the budget after cooldown', () => {
    const s = createAdaptiveState()
    const out = stepAdaptive(s, FRAME_BUDGET_MS + 5, FRAME_BUDGET_MS + 5, 2000)
    expect(Math.round(out.scale * 1000) / 1000).toBe(MAX_SCALE * SCALE_STEP_DOWN)
  })

  it('never steps below MIN_SCALE', () => {
    const s = { ...createAdaptiveState(), scale: MIN_SCALE }
    const out = stepAdaptive(s, 60, 60, 2000)
    expect(out.scale).toBe(MIN_SCALE)
  })

  it('steps back up only with sustained headroom, capped at MAX_SCALE', () => {
    const s = { ...createAdaptiveState(), scale: 0.7 }
    const out = stepAdaptive(s, 5, 5, 2000)
    expect(Math.round(out.scale * 1000) / 1000).toBe(0.7 * SCALE_STEP_UP)
    const clamped = stepAdaptive({ ...s, scale: MAX_SCALE }, 5, 5, 2000)
    expect(clamped.scale).toBe(MAX_SCALE)
  })

  it('respects the cooldown window (no per-frame thrash)', () => {
    const s = createAdaptiveState()
    const first = stepAdaptive(s, FRAME_BUDGET_MS + 5, FRAME_BUDGET_MS + 5, 2000)
    expect(first.scale).toBe(MAX_SCALE * SCALE_STEP_DOWN)
    const soon = stepAdaptive(first, FRAME_BUDGET_MS + 5, FRAME_BUDGET_MS + 5, 2010)
    expect(soon.scale).toBe(first.scale) // still inside cooldown
  })
})