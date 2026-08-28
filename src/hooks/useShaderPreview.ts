import { useSyncExternalStore, useCallback } from 'react'
import { getShaderPreviewManager } from '../renderer/ShaderPreviewManager'
import { ShaderDefinition } from '../utils/types'

const globalListeners: Set<() => void> = new Set()

function subscribeGlobal(callback: () => void) {
  globalListeners.add(callback)
  return () => { globalListeners.delete(callback) }
}

const pm = getShaderPreviewManager()

pm.subscribeAll(() => {
  globalListeners.forEach(cb => cb())
})

export function useShaderPreview(shaderId: string): string | null {
  return useSyncExternalStore(
    subscribeGlobal,
    useCallback(() => pm.getCached(shaderId), [shaderId])
  )
}

export function requestPreviews(shaders: ShaderDefinition[], priority?: boolean) {
  if (priority) {
    pm.enqueueFront(shaders)
  } else {
    pm.enqueue(shaders)
  }
}

export function prefetchCategory(shaders: ShaderDefinition[]) {
  pm.enqueue(shaders)
}
