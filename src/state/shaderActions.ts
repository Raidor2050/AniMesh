import { useShaderStore } from './stores'
import { SHADER_LIBRARY } from '../shaders/library'

export function randomShader() {
  const current = useShaderStore.getState().activeShader
  if (SHADER_LIBRARY.length <= 1) return
  let next = current
  while (next?.id === current?.id && SHADER_LIBRARY.length > 1) {
    next = SHADER_LIBRARY[Math.floor(Math.random() * SHADER_LIBRARY.length)]
  }
  if (next) useShaderStore.getState().setActiveShader(next)
}

export function cycleShader(direction: 1 | -1) {
  const current = useShaderStore.getState().activeShader
  const idx = SHADER_LIBRARY.findIndex(s => s.id === current?.id) ?? 0
  const next = SHADER_LIBRARY[(idx + direction + SHADER_LIBRARY.length) % SHADER_LIBRARY.length]
  if (next) useShaderStore.getState().setActiveShader(next)
}