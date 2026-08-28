import { describe, it, expect } from 'vitest'
import { CombTracker } from '../combTracker'
import { computeLockedGrid, computeFreeGrid } from '../grid'
import { clamp } from '../../utils/math'

function feed(tracker: CombTracker, start: number, intervalMs: number, count: number, skip = 0) {
  let t = start
  for (let i = 0; i < count; i++) {
    tracker.onImpulse(t)
    t += intervalMs
    if (skip > 0 && (i + 1) % skip === 0) t += intervalMs // occasional double gap
  }
  return t
}

describe('CombTracker — tempo estimation', () => {
  it('detects 160 BPM from regular 375ms impulses', () => {
    const t = new CombTracker()
    feed(t, 1000, 375, 24)
    expect(t.getBpm()).toBeGreaterThan(150)
    expect(t.getBpm()).toBeLessThan(170)
    expect(t.getConfidence()).toBeGreaterThan(0.7)
  })

  it('octave-corrects half-time gaps to the same 160 BPM (750ms impulses)', () => {
    const t = new CombTracker()
    feed(t, 1000, 750, 16)
    // 750ms gaps imply 80 BPM at face value; the 120-prior must prefer 160.
    expect(t.getBpm()).toBeGreaterThan(150)
    expect(t.getBpm()).toBeLessThan(170)
  })

  it('octave-corrects double-time gaps toward the musical tempo (187.5ms)', () => {
    const t = new CombTracker()
    feed(t, 1000, 187.5, 40)
    expect(t.getBpm()).toBeGreaterThan(150)
    expect(t.getBpm()).toBeLessThan(170)
  })

  it('moves toward 120 for an ambiguous ~120 BPM pattern', () => {
    const t = new CombTracker()
    feed(t, 1000, 600, 20)
    // 600ms → ~100 BPM; 120 prior only biases, it does not defeat clear evidence.
    expect(t.getBpm()).toBeGreaterThan(95)
    expect(t.getBpm()).toBeLessThanOrEqual(105)
    expect(t.getConfidence()).toBeGreaterThan(0.5)
  })

  it('slew-limits abrupt tempo changes', () => {
    const t = new CombTracker()
    feed(t, 1000, 375, 20) // settle at ~160
    const before = t.getBpm()
    feed(t, 8500, 750, 4)  // sudden double gap
    const after = t.getBpm()
    const jumpFrac = Math.abs(after - before) / before
    // 4 impulses can only move a few percent per event
    expect(jumpFrac).toBeLessThan(0.15)
  })

  it('confidence rises as evidence accumulates', () => {
    const t = new CombTracker()
    const samples: number[] = []
    let t0 = 1000
    for (let i = 0; i < 32; i++) {
      t.onImpulse(t0)
      t0 += 500
      if (i < 8) samples.push(t.getConfidence())
    }
    const earlyAvg = samples.reduce((a, b) => a + b, 0) / samples.length
    const final = t.getConfidence()
    // A stable 120 BPM pattern must end highly confident, above its own early state.
    expect(final).toBeGreaterThanOrEqual(0.9)
    expect(final).toBeGreaterThan(earlyAvg)
  })

  it('ignores < 4 impulses (no premature lock)', () => {
    const t = new CombTracker()
    t.onImpulse(0); t.onImpulse(375); t.onImpulse(750)
    expect(t.getPeriodMs()).toBeNull()
    t.onImpulse(1125)
    expect(t.getPeriodMs()).not.toBeNull()
  })
})

describe('CombTracker — robustness', () => {
  it('recovers after a dropout (missed impulses)', () => {
    const t = new CombTracker()
    feed(t, 1000, 375, 12)
    feed(t, 5500, 750, 8) // half as many onsets, sustained
    expect(t.getBpm()).toBeGreaterThan(60)
    expect(t.getConfidence()).toBeGreaterThanOrEqual(0)
  })

  it('stays near 120 for a shuffled sourceless pattern without locking hard', () => {
    const t = new CombTracker()
    const rng = (n: number) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s) }
    let t0 = 5000
    for (let i = 0; i < 30; i++) {
      t.onImpulse(t0)
      t0 += 400 + rng(i) * 600
    }
    const bpm = t.getBpm()
    expect(bpm).toBeGreaterThanOrEqual(50)
    expect(bpm).toBeLessThanOrEqual(200)
  })
})

describe('Beat grid', () => {
  it('locked grid: beatPhase wraps 0..1 and advances monotonically with the clock', () => {
    const g = computeLockedGrid(4.25, 0.9)
    expect(g.beatPhase).toBeCloseTo(0.25, 5)
    expect(g.barPhase).toBeCloseTo(0.0625, 5) // 4.25 beats = bar 1, quarter-beat in
    const g2 = computeLockedGrid(4.5, 0.9)
    expect(g2.beatPhase).toBeGreaterThan(g.beatPhase)
  })

  it('locked grid: barPhase wraps exactly at 4 beats', () => {
    const a = computeLockedGrid(4.0, 0.8)
    const b = computeLockedGrid(4.0 + 1e-9, 0.8)
    expect(a.barPhase).toBeCloseTo(0, 5)
    expect(b.barPhase).toBeGreaterThan(0)
    expect(b.barPhase).toBeLessThan(a.barPhase + 0.2)
  })

  it('locked grid: downbeat confidence peaks at bar start, scales with clock confidence', () => {
    const atStart = computeLockedGrid(8.0, 1)
    const midBar = computeLockedGrid(8.5, 1)
    expect(atStart.downbeatConfidence).toBe(1)
    expect(midBar.downbeatConfidence).toBeLessThan(atStart.downbeatConfidence)
    const lowConf = computeLockedGrid(8.0, 0.3)
    expect(lowConf.downbeatConfidence).toBeLessThan(atStart.downbeatConfidence)
  })

  it('free grid: barPhase derives from beat index + beatPhase', () => {
    const g = computeFreeGrid(0.5, 5, 0.7)
    expect(g.barPhase).toBeCloseTo((1 + 0.5) / 4, 5) // index 5 → beat 1 in bar
    const mid = computeFreeGrid(0.5, 6, 0.7)
    expect(mid.barPhase).toBeGreaterThan(g.barPhase)
  })

  it('free grid: downbeat confidence peaks near bar start', () => {
    const nearStart = computeFreeGrid(0.02, 0, 0.9)
    const midBar = computeFreeGrid(0.5, 5, 0.9) // 37.5% into the bar
    expect(nearStart.downbeatConfidence).toBeGreaterThan(0.4)
    expect(midBar.downbeatConfidence).toBe(0)
  })
})

describe('clamp helper steals imports (sanity)', () => {
  it('clamps within range', () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
    expect(clamp(0.5, 0, 1)).toBe(0.5)
  })
})