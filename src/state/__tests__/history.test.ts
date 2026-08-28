import { describe, it, expect } from 'vitest'
import { pushEntry, applyUndo, HISTORY_CAP, HistoryEntry } from '../history'

const e = (n: number): HistoryEntry => ({ shaderId: `s${n}`, params: { speed: n } })

describe('history (D27)', () => {
  it('pushes entries and preserves order', () => {
    let stack: HistoryEntry[] = []
    stack = pushEntry(stack, e(1))
    stack = pushEntry(stack, e(2))
    expect(stack.map(s => s.params.speed)).toEqual([1, 2])
  })

  it('caps the stack at HISTORY_CAP', () => {
    let stack: HistoryEntry[] = []
    for (let i = 0; i < HISTORY_CAP + 5; i++) stack = pushEntry(stack, e(i))
    expect(stack.length).toBe(HISTORY_CAP)
    expect(stack[0].params.speed).toBe(5) // oldest dropped
    expect(stack[stack.length - 1].params.speed).toBe(HISTORY_CAP + 4)
  })

  it('undo pops and restores the most recent entry', () => {
    let stack: HistoryEntry[] = []
    stack = pushEntry(stack, e(1))
    stack = pushEntry(stack, e(2))
    const r = applyUndo(stack)
    expect(r.restored?.params.speed).toBe(2)
    expect(r.stack).toHaveLength(1)
  })

  it('undo on an empty stack is a no-op', () => {
    const r = applyUndo([])
    expect(r.restored).toBeNull()
    expect(r.stack).toEqual([])
  })
})