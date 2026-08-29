const TUTORIAL_SEEN_KEY = 'animesh:tutorialSeen'

/** Mark that the controls tour has been seen so it does not auto-open again. */
export function markTutorialSeen() {
  try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1') } catch { /* private mode */ }
}

export function tutorialSeen() {
  try { return localStorage.getItem(TUTORIAL_SEEN_KEY) === '1' } catch { return true }
}