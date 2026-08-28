/** Undo history (D27) — pure, independently-testable stack helpers. */

export interface HistoryEntry {
  shaderId: string
  params: Record<string, number>
}

export const HISTORY_CAP = 24

export function pushEntry(stack: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const next = [...stack, entry]
  return next.length > HISTORY_CAP ? next.slice(next.length - HISTORY_CAP) : next
}

/** Pops the most recent entry and returns it for restoration (walk-back undo). */
export function applyUndo(stack: HistoryEntry[]): { stack: HistoryEntry[]; restored: HistoryEntry | null } {
  if (stack.length === 0) return { stack, restored: null }
  const restored = stack[stack.length - 1]
  return { stack: stack.slice(0, -1), restored }
}