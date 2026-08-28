import { clamp } from '../utils/math'

/**
 * Beat grid snapshots (D13). Pure phase math shared by free and locked modes.
 */

export interface Grid {
  beatPhase: number        // 0..1 within the current quarter note
  barPhase: number         // 0..1 within the current 4/4 bar
  eighthPhase: number      // 0..1 within the current eighth note
  sixteenthPhase: number   // 0..1 within the current sixteenth note
  downbeatConfidence: number
}

const BEATS_PER_BAR = 4

/** Free mode: beatPhase resets on each detected beat; grid from beat counter. */
export function computeFreeGrid(beatPhase: number, beatIndex: number, confidence: number): Grid {
  const bp = clamp(beatPhase, 0, 1)
  const inBar = (beatIndex % BEATS_PER_BAR) + bp
  return {
    beatPhase: bp,
    barPhase: inBar / BEATS_PER_BAR,
    eighthPhase: (bp * 2) % 1,
    sixteenthPhase: (bp * 4) % 1,
    downbeatConfidence: confidence * barPhaseNearStart(inBar / BEATS_PER_BAR),
  }
}

/** Locked mode: continuous beat count; grid derived from phase (D14, never resets). */
export function computeLockedGrid(clockBeats: number, confidence: number): Grid {
  const bp = phase(clockBeats, 1)
  const barPhase = phase(clockBeats, BEATS_PER_BAR)
  return {
    beatPhase: bp,
    barPhase,
    eighthPhase: phase(clockBeats, 2),
    sixteenthPhase: phase(clockBeats, 4),
    downbeatConfidence: confidence * barPhaseNearStart(barPhase),
  }
}

export function phase(clockBeats: number, divisor: number): number {
  return ((clockBeats % divisor) + divisor) % divisor / divisor
}

/** 1 near the bar start, decaying to 0 by 15% into the bar. */
function barPhaseNearStart(barPhase: number): number {
  return clamp(1 - (barPhase * 100) / 15, 0, 1)
}