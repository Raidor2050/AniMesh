import { useRef, useEffect, useCallback, useState } from 'react'
import { audioDataBridge, useAudioStore, useUIStore } from '../state/stores'
import { AudioSnapshot } from '../utils/types'
import { colors, radii, typography, spacing } from '../ui/tokens'
import { useDraggable } from '../hooks/useDraggable'
import { motion, AnimatePresence } from 'motion/react'

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

const PRESETS = [
  { id: 'stream' as const, label: 'Stream' },
  { id: 'spectrum' as const, label: 'Spectrum' },
  { id: 'bars' as const, label: 'Bars' },
  { id: 'oscilloscope' as const, label: 'Oscilloscope' },
]

type StreamPreset = 'stream' | 'spectrum' | 'bars' | 'oscilloscope'

const SPECTRUM_BAR_COUNT = 64

function colorForSpectrum(index: number, total: number): string {
  const hue = (index / total) * 270
  return `hsl(${hue}, 75%, 60%)`
}

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

  const { position, isDragging, containerRef, dragProps } = useDraggable({
    initialX: typeof window !== 'undefined' ? window.innerWidth - 252 : 800,
    initialY: 52,
    bounds: { left: 0, top: 48, right: 0, bottom: 0 },
  })

  const render = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) { animRef.current = requestAnimationFrame(render); return }

    const parent = canvas.parentElement
    if (!parent) { animRef.current = requestAnimationFrame(render); return }

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
    if (!ctx) { animRef.current = requestAnimationFrame(render); return }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

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
    }

    animRef.current = requestAnimationFrame(render)
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
      const y = PAD_TOP + usableH - barH

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

  useEffect(() => {
    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [render])

  if (!bootComplete || immersive || isMinimized) return null

  return (
    <motion.div
      ref={containerRef}
      {...dragProps}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'absolute',
        width: 240,
        height: 360,
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
          <div style={{ display: 'flex', gap: 2 }}>
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setStreamPreset(p.id)
                }}
                style={{
                  padding: '2px 6px',
                  background: streamPreset === p.id ? colors.accent.subtle : 'transparent',
                  border: `1px solid ${streamPreset === p.id ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                  borderRadius: radii.xs,
                  color: streamPreset === p.id ? colors.accent.hover : colors.text.disabled,
                  fontFamily: typography.families.mono,
                  fontSize: 8,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (streamPreset !== p.id) e.currentTarget.style.color = colors.text.secondary
                }}
                onMouseLeave={e => {
                  if (streamPreset !== p.id) e.currentTarget.style.color = colors.text.disabled
                }}
              >{p.label}</button>
            ))}
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
    </motion.div>
  )
}
