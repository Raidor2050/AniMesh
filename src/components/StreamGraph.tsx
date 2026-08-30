import { useRef, useEffect, useCallback, useState } from 'react'
import { audioDataBridge, useAudioStore, useUIStore } from '../state/stores'
import { AudioSnapshot } from '../utils/types'
import { colors, radii, typography, spacing } from '../ui/tokens'
import { useDraggable } from '../hooks/useDraggable'
import { motion } from 'motion/react'

const BAND_KEYS = ['sub', 'bass', 'lowMid', 'mid', 'highMid', 'treble'] as const
const BAND_COLORS = [
  { r: 79, g: 70, b: 229, a: 0.72 },
  { r: 99, g: 102, b: 241, a: 0.72 },
  { r: 139, g: 92, b: 246, a: 0.72 },
  { r: 168, g: 85, b: 247, a: 0.72 },
  { r: 217, g: 70, b: 239, a: 0.72 },
  { r: 236, g: 72, b: 153, a: 0.72 },
]
const BAND_GLOW_COLORS = [
  'rgba(79,70,229,0.25)',
  'rgba(99,102,241,0.25)',
  'rgba(139,92,246,0.25)',
  'rgba(168,85,247,0.25)',
  'rgba(217,70,239,0.25)',
  'rgba(236,72,153,0.25)',
]
const HISTORY_LEN = 90
const BAND_COUNT = 6
const PAD_TOP = 12
const PAD_BOT = 12

const STREAM_MIN_W = 240
const STREAM_MIN_H = 360
const RESIZE_MIN_W = 160
const RESIZE_MIN_H = 120
const HANDLE = 10

const PRESETS = [
  { id: 'stream' as const, label: 'Stream' },
  { id: 'spectrum' as const, label: 'Spectrum' },
  { id: 'bars' as const, label: 'Bars' },
  { id: 'oscilloscope' as const, label: 'Scope' },
  { id: 'mirror' as const, label: 'Mirror' },
  { id: 'wavebars' as const, label: 'WaveBars' },
  { id: 'radial' as const, label: 'Radial' },
  { id: 'meter' as const, label: 'Peak Meter' },
  { id: 'vectorscope' as const, label: 'Vectorscope' },
]

const SPECTRUM_BAR_COUNT = 64

export function StreamGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const historyRef = useRef<Float32Array>(new Float32Array(HISTORY_LEN * BAND_COUNT))
  const smoothRef = useRef<Float32Array>(new Float32Array(BAND_COUNT))
  const animRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const sourceType = useAudioStore(s => s.sourceType)
  const streamPreset = useUIStore(s => s.streamPreset)
  const setStreamPreset = useUIStore(s => s.setStreamPreset)
  const isMinimized = useUIStore(s => s.minimizedPanels.includes('stream'))
  const togglePanelMinimized = useUIStore(s => s.togglePanelMinimized)
  const immersive = useUIStore(s => s.immersive)
  const bootComplete = useUIStore(s => s.bootComplete)

  const peakHoldRef = useRef<Float32Array>(new Float32Array(SPECTRUM_BAR_COUNT))
  const peakDecayRef = useRef<Float32Array>(new Float32Array(SPECTRUM_BAR_COUNT))
  const meterHoldRef = useRef<Float32Array>(new Float32Array(2))
  const viewMenuRef = useRef<HTMLDivElement>(null)
  const rootElemRef = useRef<HTMLDivElement | null>(null)
  const sizeRef = useRef({ w: STREAM_MIN_W, h: STREAM_MIN_H })
  const resizeStartRef = useRef<{
    dir: string
    startX: number
    startY: number
    startW: number
    startH: number
    startLeft: number
    startTop: number
  } | null>(null)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [size, setSize] = useState({ w: STREAM_MIN_W, h: STREAM_MIN_H })

  useEffect(() => {
    sizeRef.current = size
  }, [size])

  const currentPreset = PRESETS.find(p => p.id === streamPreset) ?? PRESETS[0]

  // Close the view menu on outside click (panels are draggable — stay put on drag).
  useEffect(() => {
    if (!viewMenuOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!viewMenuRef.current?.contains(target)) setViewMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [viewMenuOpen])

  const { isDragging, containerRef, dragProps, setPosition } = useDraggable({
    initialX: typeof window !== 'undefined' ? window.innerWidth - 252 : 800,
    initialY: 52,
    bounds: { left: 0, top: 48, right: 0, bottom: 0 },
  })

  // Single ref used by both the drag hook and local resize handling.
  const rootRef = useCallback((node: HTMLDivElement | null) => {
    containerRef(node)
    rootElemRef.current = node
  }, [containerRef])

  const startResize = (dir: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const el = rootElemRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    resizeStartRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startW: sizeRef.current.w,
      startH: sizeRef.current.h,
      startLeft: parseFloat(el.style.left) || 0,
      startTop: parseFloat(el.style.top) || 0,
    }
  }

  const moveResize = (e: React.PointerEvent) => {
    const r = resizeStartRef.current
    if (!r) return
    const dx = e.clientX - r.startX
    const dy = e.clientY - r.startY
    const vw = window.innerWidth
    const vh = window.innerHeight

    let w = r.startW
    let h = r.startH
    let left = r.startLeft
    let top = r.startTop

    if (r.dir.includes('w')) {
      const maxW = Math.max(RESIZE_MIN_W, vw - r.startLeft)
      w = Math.min(Math.max(r.startW - dx, RESIZE_MIN_W), maxW)
      left = r.startLeft + (r.startW - w) // keep the east edge anchored
    } else if (r.dir.includes('e')) {
      w = Math.min(Math.max(r.startW + dx, RESIZE_MIN_W), vw - r.startLeft)
    }
    if (r.dir.includes('n')) {
      const maxH = Math.max(RESIZE_MIN_H, vh - r.startTop)
      h = Math.min(Math.max(r.startH - dy, RESIZE_MIN_H), maxH)
      top = r.startTop + (r.startH - h) // keep the south edge anchored
    } else if (r.dir.includes('s')) {
      h = Math.min(Math.max(r.startH + dy, RESIZE_MIN_H), vh - r.startTop)
    }

    setSize({ w, h })
    setPosition(left, top)
  }

  const endResize = (e: React.PointerEvent) => {
    if (!resizeStartRef.current) return
    const el = rootElemRef.current
    if (el) { try { el.releasePointerCapture(e.pointerId) } catch { /* noop */ } }
    resizeStartRef.current = null
  }

  const RESIZE_HANDLES: { dir: string; inset: React.CSSProperties; cursor: string }[] = [
    { dir: 'nw', inset: { top: 0, left: 0, width: HANDLE, height: HANDLE }, cursor: 'nwse-resize' },
    { dir: 'n', inset: { top: 0, left: HANDLE, right: HANDLE, height: HANDLE }, cursor: 'ns-resize' },
    { dir: 'ne', inset: { top: 0, right: 0, width: HANDLE, height: HANDLE }, cursor: 'nesw-resize' },
    { dir: 'e', inset: { top: HANDLE, right: 0, bottom: HANDLE, width: HANDLE }, cursor: 'ew-resize' },
    { dir: 'se', inset: { bottom: 0, right: 0, width: HANDLE, height: HANDLE }, cursor: 'nwse-resize' },
    { dir: 's', inset: { bottom: 0, left: HANDLE, right: HANDLE, height: HANDLE }, cursor: 'ns-resize' },
    { dir: 'sw', inset: { bottom: 0, left: 0, width: HANDLE, height: HANDLE }, cursor: 'nesw-resize' },
    { dir: 'w', inset: { top: HANDLE, left: 0, bottom: HANDLE, width: HANDLE }, cursor: 'ew-resize' },
  ]

  const render = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) { cancelAnimationFrame(animRef.current); return }

    const parent = canvas.parentElement
    if (!parent || parent.clientWidth === 0 || parent.clientHeight === 0) { cancelAnimationFrame(animRef.current); return }

    const W = parent.clientWidth
    const H = parent.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) { cancelAnimationFrame(animRef.current); return }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (streamPreset === 'vectorscope') {
      // Phosphor-trail fade: keep prior frame and wash it out (WaveCandy-style).
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0, 0, W, H)
    } else {
      ctx.clearRect(0, 0, W, H)
    }

    const snap = audioDataBridge.snapshot
    const t = timestamp * 0.001
    timeRef.current = t

    if (streamPreset === 'stream') {
      renderStream(ctx, W, H, snap, timestamp)
    } else if (streamPreset === 'spectrum') {
      renderSpectrum(ctx, W, H, snap)
    } else if (streamPreset === 'bars') {
      renderBars(ctx, W, H, snap, timestamp)
    } else if (streamPreset === 'oscilloscope') {
      renderOscilloscope(ctx, W, H, snap)
    } else if (streamPreset === 'mirror') {
      renderMirror(ctx, W, H, snap, timestamp)
    } else if (streamPreset === 'wavebars') {
      renderWaveBars(ctx, W, H, snap)
    } else if (streamPreset === 'radial') {
      renderRadial(ctx, W, H, snap, timestamp)
    } else if (streamPreset === 'meter') {
      renderMeter(ctx, W, H, snap, timestamp)
    } else if (streamPreset === 'vectorscope') {
      renderVectorscope(ctx, W, H, snap)
    }

    animRef.current = requestAnimationFrame(render)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- render* are hoisted fn decls reading refs; deps pinned to store-picked values (re-adding them would rebuild the loop every render)
  }, [sourceType, streamPreset])

  function renderStream(ctx: CanvasRenderingContext2D, W: number, H: number, snap: AudioSnapshot, _timestamp: number) {
    const smooth = smoothRef.current
    const hist = historyRef.current

    const lerpFactor = sourceType === 'none' ? 0.04 : 0.18
    for (let i = 0; i < BAND_COUNT; i++) {
      const target = snap[BAND_KEYS[i]]
      smooth[i] += (target - smooth[i]) * lerpFactor
    }

    const shift = BAND_COUNT
    for (let i = 0; i < (HISTORY_LEN - 1) * BAND_COUNT; i++) {
      hist[i] = hist[i + shift]
    }
    for (let i = 0; i < BAND_COUNT; i++) {
      hist[(HISTORY_LEN - 1) * BAND_COUNT + i] = smooth[i]
    }

    const usableH = H - PAD_TOP - PAD_BOT
    const baseline = PAD_TOP + usableH * 0.5
    const bandH = usableH / (BAND_COUNT * 2)
    const t = timeRef.current
    const xStep = W / (HISTORY_LEN - 1)

    for (let band = 0; band < BAND_COUNT; band++) {
      const topPoints: [number, number][] = []
      const botPoints: [number, number][] = []

      for (let col = 0; col < HISTORY_LEN; col++) {
        const x = col * xStep
        const val = hist[col * BAND_COUNT + band]
        const wavePhase = t * 0.6 + col * 0.04 + band * 0.7
        const wave = Math.sin(wavePhase) * 0.15 + Math.sin(wavePhase * 0.7 + 1.3) * 0.08
        const bandOffset = (band - (BAND_COUNT - 1) * 0.5) * bandH * 1.8
        const extent = val * bandH * 2.2 + bandH * 0.15
        topPoints.push([x, baseline + bandOffset - extent + wave * usableH * 0.08])
        botPoints.push([x, baseline + bandOffset + extent - wave * usableH * 0.08])
      }

      const col = BAND_COLORS[band]
      const gradient = ctx.createLinearGradient(0, PAD_TOP, 0, H - PAD_BOT)
      gradient.addColorStop(0, `rgba(${col.r},${col.g},${col.b},${col.a * 0.4})`)
      gradient.addColorStop(0.5, `rgba(${col.r},${col.g},${col.b},${col.a})`)
      gradient.addColorStop(1, `rgba(${col.r},${col.g},${col.b},${col.a * 0.4})`)

      ctx.beginPath()
      ctx.moveTo(topPoints[0][0], topPoints[0][1])
      for (let i = 1; i < topPoints.length; i++) {
        const [x0, y0] = topPoints[i - 1]
        const [x1, y1] = topPoints[i]
        const mx = (x0 + x1) * 0.5
        ctx.bezierCurveTo(mx, y0, mx, y1, x1, y1)
      }
      for (let i = botPoints.length - 1; i >= 0; i--) {
        const [x, y] = botPoints[i]
        if (i === botPoints.length - 1) {
          ctx.lineTo(x, y)
        } else {
          const [x1, y1] = botPoints[i + 1]
          const mx = (x + x1) * 0.5
          ctx.bezierCurveTo(mx, y1, mx, y, x, y)
        }
      }
      ctx.closePath()

      ctx.fillStyle = gradient
      ctx.fill()

      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},0.2)`
      ctx.lineWidth = 0.8
      ctx.beginPath()
      for (let i = 0; i < topPoints.length; i++) {
        const [x, y] = topPoints[i]
        if (i === 0) { ctx.moveTo(x, y); continue }
        const [x0, y0] = topPoints[i - 1]
        const mx = (x0 + x) * 0.5
        ctx.bezierCurveTo(mx, y0, mx, y, x, y)
      }
      ctx.stroke()

      ctx.shadowColor = BAND_GLOW_COLORS[band]
      ctx.shadowBlur = 10
      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},0.12)`
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < topPoints.length; i++) {
        const [x, y] = topPoints[i]
        if (i === 0) { ctx.moveTo(x, y); continue }
        const [x0, y0] = topPoints[i - 1]
        const mx = (x0 + x) * 0.5
        ctx.bezierCurveTo(mx, y0, mx, y, x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }

  function renderSpectrum(ctx: CanvasRenderingContext2D, W: number, H: number, snap: AudioSnapshot) {
    const spectrum = snap.spectrum
    const barCount = SPECTRUM_BAR_COUNT
    const binSize = Math.floor(spectrum.length / barCount)
    const gap = 1
    const barWidth = (W - gap * (barCount - 1)) / barCount
    const usableH = H - PAD_TOP - PAD_BOT

    for (let i = 0; i < barCount; i++) {
      let sum = 0
      for (let j = 0; j < binSize; j++) {
        sum += spectrum[i * binSize + j] || 0
      }
      const avg = sum / binSize / 255

      const barH = avg * usableH * 0.9
      const x = i * (barWidth + gap)
      const y = PAD_TOP + usableH - barH

      const hue = (i / barCount) * 270
      const gradient = ctx.createLinearGradient(x, y, x, PAD_TOP + usableH)
      gradient.addColorStop(0, `hsla(${hue}, 80%, 65%, 0.9)`)
      gradient.addColorStop(1, `hsla(${hue}, 60%, 45%, 0.5)`)
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth, barH)

      ctx.fillStyle = `hsla(${hue}, 80%, 75%, 0.3)`
      ctx.fillRect(x, y - 2, barWidth, 2)
    }
  }

  function renderBars(ctx: CanvasRenderingContext2D, W: number, H: number, snap: AudioSnapshot, timestamp: number) {
    const spectrum = snap.spectrum
    const barCount = SPECTRUM_BAR_COUNT
    const binSize = Math.floor(spectrum.length / barCount)
    const gap = 2
    const barWidth = (W - gap * (barCount - 1)) / barCount
    const usableH = H - PAD_TOP - PAD_BOT
    const peakHold = peakHoldRef.current
    const peakDecay = peakDecayRef.current

    for (let i = 0; i < barCount; i++) {
      let sum = 0
      for (let j = 0; j < binSize; j++) {
        sum += spectrum[i * binSize + j] || 0
      }
      const avg = sum / binSize / 255

      // Peak hold logic
      if (avg > peakHold[i]) {
        peakHold[i] = avg
        peakDecay[i] = timestamp
      } else if (timestamp - peakDecay[i] > 1200) {
        peakHold[i] = Math.max(avg, peakHold[i] * 0.985)
      }

      const barH = avg * usableH * 0.9
      const x = i * (barWidth + gap)

      const hue = (i / barCount) * 270

      // Segmented bar
      const segH = 3
      const segGap = 1
      const segs = Math.floor(barH / (segH + segGap))
      for (let s = 0; s < segs; s++) {
        const segY = PAD_TOP + usableH - (s + 1) * (segH + segGap)
        const brightness = 50 + (s / (usableH / (segH + segGap))) * 20
        ctx.fillStyle = `hsla(${hue}, 70%, ${brightness}%, 0.85)`
        ctx.fillRect(x, segY, barWidth, segH)
      }

      // Peak hold indicator
      if (peakHold[i] > 0.01) {
        const peakY = PAD_TOP + usableH - peakHold[i] * usableH * 0.9
        ctx.fillStyle = `hsla(${hue}, 80%, 80%, 0.9)`
        ctx.fillRect(x, peakY - 1, barWidth, 2)
      }
    }
  }

  function renderOscilloscope(ctx: CanvasRenderingContext2D, W: number, H: number, snap: AudioSnapshot) {
    const waveform = snap.waveform
    const usableH = H - PAD_TOP - PAD_BOT
    const baseline = PAD_TOP + usableH * 0.5
    const len = waveform.length

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const gy = PAD_TOP + (usableH / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.lineTo(W, gy)
      ctx.stroke()
    }
    // Center line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(0, baseline)
    ctx.lineTo(W, baseline)
    ctx.stroke()

    // Glow layer
    ctx.strokeStyle = 'rgba(99,102,241,0.15)'
    ctx.lineWidth = 4
    ctx.shadowColor = 'rgba(99,102,241,0.4)'
    ctx.shadowBlur = 12
    ctx.beginPath()
    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * W
      const y = baseline + waveform[i] * usableH * 0.45
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // Main line
    const gradient = ctx.createLinearGradient(0, PAD_TOP, 0, H - PAD_BOT)
    gradient.addColorStop(0, 'rgba(129,140,248,0.9)')
    gradient.addColorStop(0.5, 'rgba(99,102,241,1)')
    gradient.addColorStop(1, 'rgba(168,85,247,0.9)')
    ctx.strokeStyle = gradient
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * W
      const y = baseline + waveform[i] * usableH * 0.45
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Dual waveform: top half is the raw wave, bottom half its mirror image —
  // reads like an analog push-pull scope with a soft reflected tail.
  function renderMirror(ctx: CanvasRenderingContext2D, W: number, H: number, snap: AudioSnapshot, timestamp: number) {
    const waveform = snap.waveform
    const len = waveform.length
    const usableH = H - PAD_TOP - PAD_BOT
    const midY = PAD_TOP + usableH * 0.5
    const half = usableH * 0.45
    const t = timestamp * 0.001

    const trace = (flip: number, gradTop: string, gradBot: string, glow: string) => {
      const grad = ctx.createLinearGradient(0, PAD_TOP, 0, H - PAD_BOT)
      grad.addColorStop(0, gradTop)
      grad.addColorStop(1, gradBot)
      const yFor = (v: number) => midY + flip * v * half + (flip > 0 ? -Math.sin(t * 0.8) * 0.04 * usableH : Math.sin(t * 0.8) * 0.04 * usableH)

      ctx.shadowColor = glow
      ctx.shadowBlur = 8
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.6
      ctx.beginPath()
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * W
        const y = yFor(waveform[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Center line
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(0, midY)
    ctx.lineTo(W, midY)
    ctx.stroke()

    // Reflected bottom trace
    trace(+1, 'rgba(99,102,241,0.9)', 'rgba(79,70,229,0.75)', 'rgba(99,102,241,0.35)')
    // Mirror image (flashed on the beat)
    trace(-1, 'rgba(217,70,239,0.85)', 'rgba(168,85,247,0.6)', 'rgba(217,70,239,0.3)')
  }

  // Bi-polar waveform columns: each sample becomes a bar rising (positive)
  // or falling (negative) from the centerline, with beat-synced glow.
  function renderWaveBars(ctx: CanvasRenderingContext2D, W: number, H: number, snap: AudioSnapshot) {
    const waveform = snap.waveform
    const cols = 72
    const step = Math.floor(waveform.length / cols)
    const usableH = H - PAD_TOP - PAD_BOT
    const midY = PAD_TOP + usableH * 0.5
    const gap = 1
    const colW = (W - gap * (cols - 1)) / cols
    const beat = snap.beatIntensity

    for (let col = 0; col < cols; col++) {
      let sum = 0
      for (let j = 0; j < step; j++) {
        sum += Math.abs(waveform[col * step + j] ?? 0)
      }
      const v = sum / step
      const h = v * usableH * 0.46
      const x = col * (colW + gap)
      const hue = (col / cols) * 270

      ctx.fillStyle = `hsla(${hue}, 80%, ${60 + beat * 15}%, 0.9)`
      ctx.fillRect(x, midY - h, colW, h)
      ctx.fillStyle = `hsla(${hue}, 80%, ${60 + beat * 15}%, 0.55)`
      ctx.fillRect(x, midY, colW, h)
    }
  }

  // Radial: spectrum wrapped into sectors around a rotating core, with six
  // band-energies rendered as nested glowing rings.
  function renderRadial(ctx: CanvasRenderingContext2D, W: number, H: number, snap: AudioSnapshot, timestamp: number) {
    const spectrum = snap.spectrum
    const cx = W / 2
    const cy = H / 2
    const maxR = Math.min(W, H) / 2 - 6
    const sectors = 48
    const binSize = Math.floor(spectrum.length / sectors)
    const t = timestamp * 0.001
    const spin = t * 0.25

    for (let i = 0; i < sectors; i++) {
      let sum = 0
      for (let j = 0; j < binSize; j++) {
        sum += spectrum[i * binSize + j] || 0
      }
      const avg = sum / binSize / 255
      const a = (i / sectors) * Math.PI * 2 + spin
      const inner = maxR * 0.28
      const outer = inner + avg * maxR * 0.72
      const hue = (i / sectors) * 270

      ctx.strokeStyle = `hsl(${hue} 80% 65% / 0.9)`
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer)
      ctx.stroke()

      // Cap dot on a beat
      if (snap.beatOn && i % 6 === 0) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(cx + Math.cos(a) * (outer + 2), cy + Math.sin(a) * (outer + 2), 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Nested band rings
    for (let b = 0; b < BAND_COUNT; b++) {
      const col = BAND_COLORS[b]
      const level = snap[BAND_KEYS[b]]
      const r = maxR * (0.95 - b * 0.11)
      ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},${0.25 + level * 0.6})`
      ctx.lineWidth = 1 + level * 3
      ctx.shadowColor = BAND_GLOW_COLORS[b]
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }

  // WaveCandy-style dual Peak Meter: left/right bars from the waveform halves
  // on a pseudo-dB scale with a slowly decaying peak-hold tick.
  function renderMeter(ctx: CanvasRenderingContext2D, W: number, H: number, snap: AudioSnapshot, _timestamp: number) {
    const len = snap.waveform.length
    const half = Math.floor(len / 2)
    let lsum = 0
    let rsum = 0
    for (let i = 0; i < half; i++) {
      const a = snap.waveform[i]
      lsum += a * a
    }
    for (let i = half; i < len; i++) {
      const a = snap.waveform[i]
      rsum += a * a
    }
    const l = Math.sqrt(lsum / half)
    const r = Math.sqrt(rsum / (len - half))

    const usableH = H - PAD_TOP - PAD_BOT
    const baseline = H - PAD_BOT
    // pseudo-dB curve: below ~-50dB read as ~0, -6dB sits ~96%
    const curve = (v: number) => {
      const db = 20 * Math.log10(Math.max(v, 1e-4))
      return Math.max(0, Math.min(1, (db + 50) / 44))
    }

    const holds = meterHoldRef.current
    const decay = 0.5 + snap.beatIntensity * 0.4
    holds[0] = Math.max(l, holds[0] * (1 - 0.06 * decay))
    holds[1] = Math.max(r, holds[1] * (1 - 0.06 * decay))

    const barW = Math.min(W * 0.12, 44)
    const gap = barW * 0.5
    const startX = (W - barW * 2 - gap) / 2
    const drawBar = (x: number, level: number, hold: number, color: string) => {
      const h = Math.max(curve(level) * usableH * 0.92, 2)
      const holdY = baseline - Math.max(curve(hold) * usableH * 0.92, 2)
      const grad = ctx.createLinearGradient(0, baseline, 0, PAD_TOP)
      grad.addColorStop(0, color.replace('0.9', '0.25'))
      grad.addColorStop(1, color)
      ctx.fillStyle = grad
      ctx.fillRect(x, baseline - h, barW, h)
      // Peak-hold tick
      ctx.fillStyle = '#fff'
      ctx.fillRect(x - 1, holdY, barW + 2, 1.5)
    }

    drawBar(startX, l, holds[0], 'rgba(99,102,241,0.9)')
    drawBar(startX + barW + gap, r, holds[1], 'rgba(139,92,246,0.9)')

    // dB gridlines at -24, -12, -6 (bottom -> top)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (const db of [-24, -12, -6]) {
      const v = 10 ** (db / 20)
      const y = baseline - curve(v) * usableH * 0.92
      ctx.beginPath()
      ctx.moveTo(6, y)
      ctx.lineTo(W - 6, y)
      ctx.stroke()
    }
  }

  // WaveCandy-style Vectorscope: Lissajous of the waveform against its 90°
  // phase-shifted self (mono source). Rendered with a phosphor trail that the
  // loop fades instead of clearing.
  function renderVectorscope(ctx: CanvasRenderingContext2D, W: number, H: number, snap: AudioSnapshot) {
    const waveform = snap.waveform
    const len = waveform.length
    const cx = W / 2
    const cy = H / 2
    const scale = Math.min(W, H) * 0.46
    const shift = Math.floor(len * 0.25)
    const step = Math.max(1, Math.floor(len / 256))

    ctx.lineWidth = 1.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    let first = true
    for (let i = 0; i < len; i += step) {
      const x = cx + waveform[i] * scale
      const y = cy + waveform[(i + shift) % len] * scale
      if (first) { ctx.moveTo(x, y); first = false } else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = 'rgba(99,102,241,0.85)'
    ctx.shadowColor = 'rgba(139,92,246,0.6)'
    ctx.shadowBlur = 8
    ctx.stroke()
    ctx.shadowBlur = 0

    // Center crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy)
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10)
    ctx.stroke()
  }

  const hidden = !bootComplete || immersive || isMinimized

  useEffect(() => {
    if (hidden) return
    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [render, hidden])

  if (hidden) return null

  return (
    <motion.div
      ref={rootRef}
      {...dragProps}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'absolute',
        width: size.w,
        height: size.h,
        zIndex: 15,
        display: 'flex',
        flexDirection: 'column',
        background: colors.surface.panel,
        backdropFilter: 'blur(24px) saturate(1.1)',
        border: `1px solid ${colors.surface.secondary}`,
        borderRadius: radii.lg,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : undefined,
        userSelect: isDragging ? 'none' : undefined,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${spacing.scale[2]}px ${spacing.scale[3]}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${colors.surface.secondary}`,
          cursor: isDragging ? 'grabbing' : 'pointer',
          touchAction: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 4, height: 4, borderRadius: '50%',
            background: sourceType !== 'none' ? colors.state.success : colors.text.disabled,
            boxShadow: sourceType !== 'none' ? `0 0 6px ${colors.state.success}` : 'none',
            flexShrink: 0,
          }} />
          <div ref={viewMenuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setViewMenuOpen(o => !o) }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Select stream view"
              title="Select stream view"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                maxWidth: 116,
                padding: '3px 7px',
                background: viewMenuOpen ? colors.accent.subtle : colors.surface.primary,
                border: `1px solid ${viewMenuOpen ? 'rgba(99,102,241,0.3)' : colors.surface.secondary}`,
                borderRadius: radii.xs,
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={e => { if (!viewMenuOpen) { e.currentTarget.style.background = colors.surface.hover; e.currentTarget.style.borderColor = colors.borderHover } }}
              onMouseLeave={e => { if (!viewMenuOpen) { e.currentTarget.style.background = colors.surface.primary; e.currentTarget.style.borderColor = colors.surface.secondary } }}
            >
              <span style={{
                color: streamPreset !== 'stream' && streamPreset !== 'spectrum' ? '#38BDF8' : colors.accent.hover,
                fontSize: 8,
              }}>◈</span>
              <span style={{
                color: colors.text.primary,
                fontFamily: typography.families.mono,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{currentPreset.label}</span>
              <span style={{
                color: colors.text.disabled,
                fontSize: 7,
                transition: 'transform 0.15s ease',
                transform: viewMenuOpen ? 'rotate(180deg)' : 'none',
              }}>▾</span>
            </button>

            {viewMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -3, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                  width: 170,
                  background: colors.surface.panel,
                  border: `1px solid ${colors.surface.secondary}`,
                  borderRadius: radii.md,
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  zIndex: 30,
                  padding: '3px',
                }}
              >
                {PRESETS.map(p => {
                  const active = streamPreset === p.id
                  return (
                    <button
                      key={p.id}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        setStreamPreset(p.id)
                        setViewMenuOpen(false)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '5px 8px',
                        background: active ? colors.accent.subtle : 'transparent',
                        border: 'none',
                        borderRadius: radii.sm,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = colors.surface.hover }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: active ? colors.accent.hover : colors.text.disabled,
                        boxShadow: active ? `0 0 6px ${colors.accent.glow}` : 'none',
                      }} />
                      <span style={{
                        flex: 1,
                        color: active ? colors.text.primary : colors.text.secondary,
                        fontFamily: typography.families.mono,
                        fontSize: 10,
                        fontWeight: active ? 600 : 500,
                      }}>{p.label}</span>
                      {active && (
                        <span style={{ color: colors.accent.hover, fontSize: 9 }}>✓</span>
                      )}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            togglePanelMinimized('stream')
          }}
          aria-label="Minimize stream"
          title="Minimize"
          style={{
            width: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: radii.xs,
            color: colors.text.disabled,
            fontSize: 13,
            lineHeight: 1,
            cursor: 'pointer',
            flexShrink: 0,
            marginLeft: 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = colors.text.secondary }}
          onMouseLeave={e => { e.currentTarget.style.color = colors.text.disabled }}
        >−</button>
      </div>

      {/* Canvas container */}
      <div style={{
        flex: 1, position: 'relative',
        pointerEvents: 'auto',
      }}>
        <canvas ref={canvasRef} style={{
          position: 'absolute', inset: 0,
          borderRadius: 0,
        }} />
      </div>

      {/* Band legend (only for stream mode) */}
      {streamPreset === 'stream' && (
        <div style={{
          padding: '4px 10px 6px',
          display: 'flex', flexWrap: 'wrap', gap: '3px 10px',
          pointerEvents: 'auto',
          flexShrink: 0,
        }}>
          {BAND_KEYS.map((key, i) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: `rgb(${BAND_COLORS[i].r},${BAND_COLORS[i].g},${BAND_COLORS[i].b})`,
                boxShadow: `0 0 4px ${BAND_GLOW_COLORS[i]}`,
              }} />
              <span style={{
                fontFamily: typography.families.mono,
                fontSize: 7,
                color: colors.text.disabled,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>{key}</span>
            </div>
          ))}
        </div>
      )}
    {/* Resize handles: drag any edge or corner */}
      {RESIZE_HANDLES.map(h => (
        <div
          key={h.dir}
          onPointerDown={startResize(h.dir)}
          onPointerMove={moveResize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          title={`Resize (${h.dir})`}
          style={{
            position: 'absolute',
            ...h.inset,
            cursor: h.cursor,
            pointerEvents: 'auto',
            touchAction: 'none',
            zIndex: 8,
          }}
        />
      ))}
      {/* Corner grip affordance (south-east) */}
      <div style={{
        position: 'absolute', bottom: 3, right: 4,
        width: 8, height: 8,
        pointerEvents: 'none',
        opacity: 0.35,
        background:
          'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.55) 42%, rgba(255,255,255,0.55) 50%, transparent 52%),' +
          'linear-gradient(135deg, transparent 60%, rgba(255,255,255,0.4) 62%, rgba(255,255,255,0.4) 70%, transparent 72%)',
      }} />
    </motion.div>
  )
}
