import { useRef, useCallback, useEffect, useState } from 'react'

interface DraggableOptions {
  initialX?: number
  initialY?: number
  handleSelector?: string
  bounds?: { left?: number; top?: number; right?: number; bottom?: number }
  onDragEnd?: (x: number, y: number) => void
}

interface DraggableState {
  x: number
  y: number
  isDragging: boolean
}

export function useDraggable(options: DraggableOptions = {}) {
  const { initialX = 100, initialY = 100, handleSelector, bounds, onDragEnd } = options

  const [state, setState] = useState<DraggableState>({
    x: initialX,
    y: initialY,
    isDragging: false,
  })

  const dragRef = useRef<{
    startX: number
    startY: number
    origX: number
    origY: number
    handleEl: HTMLElement | null
  }>({ startX: 0, startY: 0, origX: 0, origY: 0, handleEl: null })

  const containerRef = useRef<HTMLDivElement>(null)

  const clamp = (val: number, min?: number, max?: number) => {
    if (min !== undefined && val < min) return min
    if (max !== undefined && val > max) return max
    return val
  }

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const container = containerRef.current
    if (!container) return

    // If handleSelector is set, only start drag from the handle element
    if (handleSelector) {
      const handle = container.querySelector(handleSelector) as HTMLElement | null
      if (!handle || !(handle === e.target || handle.contains(e.target as Node))) return
      handle.setPointerCapture(e.pointerId)
      dragRef.current.handleEl = handle
    } else {
      // Don't start drag on interactive elements
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return
      container.setPointerCapture(e.pointerId)
      dragRef.current.handleEl = container
    }

    dragRef.current.startX = e.clientX
    dragRef.current.startY = e.clientY
    dragRef.current.origX = state.x
    dragRef.current.origY = state.y

    setState(s => ({ ...s, isDragging: true }))

    e.preventDefault()
  }, [state.x, state.y, handleSelector])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!state.isDragging) return

    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    let newX = dragRef.current.origX + dx
    let newY = dragRef.current.origY + dy

    if (bounds) {
      const vw = window.innerWidth
      const vh = window.innerHeight
      newX = clamp(newX, bounds.left ?? -Infinity, bounds.right !== undefined ? vw - bounds.right : Infinity)
      newY = clamp(newY, bounds.top ?? -Infinity, bounds.bottom !== undefined ? vh - bounds.bottom : Infinity)
    }

    setState(s => ({ ...s, x: newX, y: newY }))
  }, [state.isDragging, bounds])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!state.isDragging) return

    const handle = dragRef.current.handleEl
    if (handle) {
      try { handle.releasePointerCapture(e.pointerId) } catch {}
    }

    setState(s => ({ ...s, isDragging: false }))
    dragRef.current.handleEl = null

    if (onDragEnd) {
      onDragEnd(state.x, state.y)
    }
  }, [state.isDragging, state.x, state.y, onDragEnd])

  // Reset position when initial values change (e.g. shader switch)
  const setPosition = useCallback((x: number, y: number) => {
    setState(s => ({ ...s, x, y }))
  }, [])

  return {
    position: { x: state.x, y: state.y },
    isDragging: state.isDragging,
    containerRef,
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
    setPosition,
  }
}
