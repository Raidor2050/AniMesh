import { useShaderStore } from './stores'
import { SHADER_LIBRARY } from '../shaders/library'
import { VISUAL_LIBRARY } from '../shaders/visualLibrary'

/** Shader-only shuffle (global `r` key / random button). */
export function randomShader() {
  const current = useShaderStore.getState().activeShader
  if (SHADER_LIBRARY.length <= 1) return
  let next = current
  while (next?.id === current?.id && SHADER_LIBRARY.length > 1) {
    next = SHADER_LIBRARY[Math.floor(Math.random() * SHADER_LIBRARY.length)]
  }
  if (next) useShaderStore.getState().setActiveShader(next)
}

/** Shader-only directional cycle (global `[` / `]` keys). */
export function cycleShader(direction: 1 | -1) {
  const current = useShaderStore.getState().activeShader
  const idx = SHADER_LIBRARY.findIndex(s => s.id === current?.id) ?? 0
  const next = SHADER_LIBRARY[(idx + direction + SHADER_LIBRARY.length) % SHADER_LIBRARY.length]
  if (next) useShaderStore.getState().setActiveShader(next)
}

/**
 * Shuffle across EVERY visual — shaders and SVG pattern objects — used by the
 * immersive Spacebar and the immersive RANDOM button (Phase-25).
 */
export function randomVisual() {
  const current = useShaderStore.getState().activeVisual
  if (VISUAL_LIBRARY.length <= 1) return
  let next = current
  while (next?.id === current?.id && VISUAL_LIBRARY.length > 1) {
    next = VISUAL_LIBRARY[Math.floor(Math.random() * VISUAL_LIBRARY.length)]
  }
  if (next) useShaderStore.getState().setActiveVisual(next)
}

/** Directional cycle across ALL visuals (immersive PREV / NEXT). */
export function cycleVisual(direction: 1 | -1) {
  const current = useShaderStore.getState().activeVisual
  const idx = VISUAL_LIBRARY.findIndex(v => v.id === current?.id) ?? 0
  const next = VISUAL_LIBRARY[(idx + direction + VISUAL_LIBRARY.length) % VISUAL_LIBRARY.length]
  if (next) useShaderStore.getState().setActiveVisual(next)
}

/** True when the active visual is an SVG pattern object (for UI badge). */
export function isActiveSvg(): boolean {
  const v = useShaderStore.getState().activeVisual
  return !!v && v.kind === 'svg'
}