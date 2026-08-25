import { useRef, useCallback, useState } from 'react'

interface DraggableOptions {
  initialX?: number
  initialY?: number
  handleSelector?: string
  bounds?: { left?: number; top?: number; right?: number; bottom?: number }
  onDragEnd?: (x: number, y: number) => void
  dragThreshold?: number
}

export function useDraggable(options: DraggableOptions = {}) {
  const { initialX = 100, initialY = 100, handleSelector, bounds, onDragEnd, dragThreshold = 4 } = options

  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [isDragging, setIsDragging] = useState(false)

  const liveRef = useRef({
    x: initialX,
    y: initialY,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    handleEl: null as HTMLElement | null,
    hasMoved: false,
    el: null as HTMLDivElement | null,
  })

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    liveRef.current.el = node
  }, [])

  const clampVal = (val: number, min?: number, max?: number) => {
    if (min !== undefined && val < min) return min
    if (max !== undefined && val > max) return max
    return val
  }

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = liveRef.current.el
    if (!el) return

    if (handleSelector) {
      const handle = el.querySelector(handleSelector) as HTMLElement | null
      if (!handle || !(handle === e.target || handle.contains(e.target as Node))) return
      handle.setPointerCapture(e.pointerId)
      liveRef.current.handleEl = handle
    } else {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return
      el.setPointerCapture(e.pointerId)
      liveRef.current.handleEl = el
    }

    liveRef.current.startX = e.clientX
    liveRef.current.startY = e.clientY
    liveRef.current.origX = liveRef.current.x
    liveRef.current.origY = liveRef.current.y
    liveRef.current.hasMoved = false

    e.preventDefault()
  }, [handleSelector])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const el = liveRef.current.el
    if (!liveRef.current.handleEl) return

    const dx = e.clientX - liveRef.current.startX
    const dy = e.clientY - liveRef.current.startY

    if (!liveRef.current.hasMoved) {
      if (Math.abs(dx) < dragThreshold && Math.abs(dy) < dragThreshold) return
      liveRef.current.hasMoved = true
      setIsDragging(true)
    }

    let newX = liveRef.current.origX + dx
    let newY = liveRef.current.origY + dy

    if (bounds) {
      const vw = window.innerWidth
      const vh = window.innerHeight
      newX = clampVal(newX, bounds.left ?? -Infinity, bounds.right !== undefined ? vw - bounds.right : Infinity)
      newY = clampVal(newY, bounds.top ?? -Infinity, bounds.bottom !== undefined ? vh - bounds.bottom : Infinity)
    }

    liveRef.current.x = newX
    liveRef.current.y = newY

    if (el) {
      el.style.transform = `translate3d(${newX}px, ${newY}px, 0)`
    }
  }, [bounds, dragThreshold])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!liveRef.current.handleEl) return

    const handle = liveRef.current.handleEl
    try { handle.releasePointerCapture(e.pointerId) } catch {}

    liveRef.current.handleEl = null

    if (liveRef.current.hasMoved) {
      setIsDragging(false)
      setPosition({ x: liveRef.current.x, y: liveRef.current.y })
      if (onDragEnd) onDragEnd(liveRef.current.x, liveRef.current.y)
    }
  }, [onDragEnd])

  return {
    position,
    isDragging,
    containerRef,
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  }
}
