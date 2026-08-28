/**
 * A11yAnnouncer — tiny sr-only message bus (D28/D25 UX). Zero-react core so
 * any module (stores, actions, renderer, error boundaries) can announce
 * without importing React; subscribers re-render on `count` bump which forces
 * the live region to re-announce identical text.
 */
export interface AnnounceRecord {
  message: string
  count: number
}

type Listener = (record: AnnounceRecord) => void

let current: AnnounceRecord = { message: '', count: 0 }
const listeners = new Set<Listener>()

export function announce(message: string): void {
  current = { message, count: current.count + 1 }
  for (const l of listeners) l(current)
}

export function subscribeAnnounce(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getAnnounce(): AnnounceRecord {
  return current
}