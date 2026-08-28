import { clamp } from '../utils/math'

/**
 * Comb-filter tempo tracker (D10/D11). Pure logic — no DOM/WebAudio deps so
 * it is unit-testable in isolation.
 *
 * Evidence for a candidate period p is gathered from inter-onset gaps by
 * matching each gap to a harmonic (k·p) or a subdivision (p ÷ k) of p.
 * The best candidate is octave-corrected toward the nearest tempo to the
 * 120 BPM prior (dance-music bias), then slew-limited so BPM never jumps.
 * Confidence = agreement of recent gaps with the chosen period × prior factor.
 */
export interface CombResult {
  bpm: number
  periodMs: number
  confidence: number
}

export class CombTracker {
  private impulses: number[] = []
  private currentPeriodMs: number | null = null
  private confidenceValue = 0

  private static readonly MAX_IMPULSES = 48
  private static readonly GAP_WINDOW = 24
  private static readonly MIN_PERIOD_MS = 300   // 200 BPM
  private static readonly MAX_PERIOD_MS = 1200  // 50 BPM
  private static readonly PERIOD_STEP = 10
  private static readonly HARMONICS = 4
  private static readonly TOL_FRAC = 0.12
  private static readonly SLEW_FRAC = 0.03
  private static readonly PRIOR_BPM = 120

  reset() {
    this.impulses = []
    this.currentPeriodMs = null
    this.confidenceValue = 0
  }

  getPeriodMs(): number | null { return this.currentPeriodMs }
  getConfidence(): number { return this.confidenceValue }
  getBpm(): number {
    return this.currentPeriodMs ? 60000 / this.currentPeriodMs : 0
  }

  /** Feed an onset timestamp (ms). Must be called on every onset. */
  onImpulse(t: number): void {
    this.impulses.push(t)
    if (this.impulses.length > CombTracker.MAX_IMPULSES) this.impulses.shift()
    if (this.impulses.length < 4) return

    const recent = this.impulses.slice(-CombTracker.GAP_WINDOW)
    const gaps: number[] = []
    for (let i = 1; i < recent.length; i++) {
      const g = recent[i] - recent[i - 1]
      if (g > 0) gaps.push(g)
    }
    if (gaps.length === 0) return

    let best = { p: 0, score: -Infinity }
    for (let p = CombTracker.MIN_PERIOD_MS; p <= CombTracker.MAX_PERIOD_MS; p += CombTracker.PERIOD_STEP) {
      const s = this.scorePeriod(p, gaps)
      if (s > best.score) best = { p, score: s }
    }
    if (best.p === 0) return

    // Harmonic family: the scan favours coarse harmonics (step 10ms), so pick
    // the octave correctly here. Reject anything beyond 200 BPM (MIN period).
    const family = [best.p / 8, best.p / 4, best.p / 2, best.p, best.p * 2, best.p * 4, best.p * 8]
      .filter(c => c >= CombTracker.MIN_PERIOD_MS && c <= CombTracker.MAX_PERIOD_MS)

    const scored = family.map(c => ({ c, s: this.scorePeriod(c, gaps) }))
    const maxS = Math.max(...scored.map(x => x.s))
    const nearPeak = scored.filter(x => x.s >= maxS * 0.85)

    // Octave rule (D11): onset trackers systematically report half/double
    // tempo. Prefer the FASTEST legal near-peak tempo (rejects the common
    // half-tempo error), EXCEPT — when a candidate sits in the 95–135 BPM
    // groove band (hip-hop 100, house 125), keep the slower musical identity.
    const slow = nearPeak.filter(x => {
      const bpm = 60000 / x.c
      return bpm >= 95 && bpm <= 135
    })
    let chosen: number
    if (slow.length > 0) {
      chosen = slow.reduce((a, b) => this.bias(b.c, gaps) > this.bias(a.c, gaps) ? b : a).c
    } else {
      chosen = nearPeak.reduce((a, b) => (b.c < a.c ? b : a)).c // fastest legal
    }

    // Slew-limit: max ±SLEW_FRAC of the current period per update (D14).
    if (this.currentPeriodMs && Math.abs(chosen - this.currentPeriodMs) > this.currentPeriodMs * CombTracker.SLEW_FRAC) {
      const maxMove = this.currentPeriodMs * CombTracker.SLEW_FRAC
      chosen = this.currentPeriodMs + clamp(chosen - this.currentPeriodMs, -maxMove, maxMove)
    }

    this.currentPeriodMs = chosen
    this.confidenceValue = this.computeConfidence(gaps, chosen)
  }

  /** Bias score: evidence × (1 + 0.2·proximity to 120 BPM), max 1.2×. */
  private bias(p: number, gaps: number[]): number {
    const prox = Math.exp(-0.5 * ((60000 / p - CombTracker.PRIOR_BPM) / 60) ** 2)
    return this.scorePeriod(p, gaps) * (1 + 0.2 * prox)
  }

  private scorePeriod(p: number, gaps: number[]): number {
    const tol = p * CombTracker.TOL_FRAC
    let score = 0
    for (const g of gaps) {
      let bestFit = g
      for (let k = 1; k <= CombTracker.HARMONICS; k++) {
        // g is k full periods (e.g. gap = 2×p ⇒ half-tempo octave)
        const harmonic = Math.abs(g - k * p)
        // g is a subdivision of the period (g·k = p ⇒ sub-beat of the period)
        const subdivision = Math.abs(g * k - p)
        if (harmonic < bestFit) bestFit = harmonic
        if (subdivision < bestFit) bestFit = subdivision
      }
      score += Math.exp(-bestFit / tol)
    }
    return score
  }

  private computeConfidence(gaps: number[], p: number): number {
    const tol = p * CombTracker.TOL_FRAC
    let hits = 0
    for (const g of gaps) {
      let bestE = Math.abs(g - p)
      for (let k = 1; k <= CombTracker.HARMONICS; k++) {
        const h = Math.abs(g - k * p)   // gap ≈ k periods
        const s = Math.abs(g * k - p)   // gap ≈ sub-beat of the period
        if (h < bestE) bestE = h
        if (s < bestE) bestE = s
      }
      if (bestE <= tol) hits++
    }
    const consistency = gaps.length ? hits / gaps.length : 0
    const prox = Math.exp(-0.5 * ((60000 / p - CombTracker.PRIOR_BPM) / 60) ** 2)
    return clamp(consistency * (1 + 0.2 * prox), 0, 1)
  }
}