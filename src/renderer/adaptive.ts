/**
 * Adaptive resolution controller (D30). Pure logic so it is unit-testable in
 * vitest without a GPU. The renderer feeds it an EMA of frame time (JS wall
 * clock) plus, when supported, GPU ms from EXT_disjoint_timer_query; the
 * controller nudges the resolution scale toward a frame budget.
 *
 * Policy: overshoot the budget hard → step down 10%; comfortably under → step
 * up 5% to claw back quality. Low/high clamps keep the picture legible while
 * still guaranteeing the <14ms budget on demand.
 */
export const MIN_SCALE = 0.5
export const MAX_SCALE = 1.0
export const SCALE_STEP_DOWN = 0.9
export const SCALE_STEP_UP = 1.05
export const FRAME_BUDGET_MS = 14
const EMA_ALPHA = 0.15
const COOLDOWN_MS = 1000

/** Exponential moving average (shared by frame + GPU timings). */
export function ema(prev: number, sample: number, alpha = EMA_ALPHA): number {
  return prev === 0 ? sample : prev * (1 - alpha) + sample * alpha
}

export interface AdaptiveState {
  scale: number
  frameMs: number
  gpuMs: number
  lastAdjust: number
}

export function createAdaptiveState(): AdaptiveState {
  return { scale: 1, frameMs: 0, gpuMs: 0, lastAdjust: 0 }
}

/**
 * Advance the controller by one sample. `wallMs` and `gpuMs` are the current
 * frame's measured durations (GPU ms optional, pass 0 when unavailable).
 * `now` is a monotonic timestamp used for the cooldown; when the budget is
 * missed repeatedly the scale steps down, and it only climbs back after a
 * sustained headroom so it never flutters.
 */
export function stepAdaptive(state: AdaptiveState, wallMs: number, gpuMs: number | undefined, now: number): AdaptiveState {
  const frame = ema(state.frameMs, wallMs)
  const gpu = gpuMs !== undefined && gpuMs > 0 ? ema(state.gpuMs, gpuMs) : state.gpuMs

  const next: AdaptiveState = { ...state, frameMs: frame, gpuMs: gpu }
  const effective = Math.max(frame, gpu)
  if (now - state.lastAdjust < COOLDOWN_MS) return next

  if (effective > FRAME_BUDGET_MS && state.scale > MIN_SCALE) {
    next.scale = Math.max(MIN_SCALE, state.scale * SCALE_STEP_DOWN)
    next.lastAdjust = now
  } else if (effective < FRAME_BUDGET_MS * 0.7 && state.scale < MAX_SCALE) {
    next.scale = Math.min(MAX_SCALE, state.scale * SCALE_STEP_UP)
    next.lastAdjust = now
  }
  return next
}