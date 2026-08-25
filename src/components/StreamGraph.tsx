import { useRef, useEffect, useCallback } from 'react'
import { audioDataBridge, useAudioStore } from '../state/stores'
import { colors, radii, typography } from '../ui/tokens'

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

export function StreamGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const historyRef = useRef<Float32Array>(new Float32Array(HISTORY_LEN * BAND_COUNT))
  const smoothRef = useRef<Float32Array>(new Float32Array(BAND_COUNT))
  const animRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const sourceType = useAudioStore(s => s.sourceType)

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

    const t = timestamp * 0.001
    timeRef.current = t

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

    animRef.current = requestAnimationFrame(render)
  }, [sourceType])

  useEffect(() => {
    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [render])

  return (
    <div style={{
      position: 'absolute', top: 52, right: 0, bottom: 0,
      width: 240, zIndex: 15,
      display: 'flex', flexDirection: 'column',
      pointerEvents: 'none',
    }}>
      {/* Label */}
      <div style={{
        padding: '10px 14px 0',
        display: 'flex', alignItems: 'center', gap: 6,
        pointerEvents: 'auto',
      }}>
        <span style={{
          fontFamily: typography.families.mono,
          fontSize: 9, fontWeight: 600,
          color: colors.text.disabled,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}>Audio Stream</span>
        <span style={{
          width: 4, height: 4, borderRadius: '50%',
          background: sourceType !== 'none' ? colors.state.success : colors.text.disabled,
          boxShadow: sourceType !== 'none' ? `0 0 6px ${colors.state.success}` : 'none',
        }} />
      </div>

      {/* Canvas container */}
      <div style={{
        flex: 1, position: 'relative',
        pointerEvents: 'auto',
      }}>
        <canvas ref={canvasRef} style={{
          position: 'absolute', inset: 0,
          borderRadius: radii.lg,
        }} />
      </div>

      {/* Band legend */}
      <div style={{
        padding: '4px 14px 10px',
        display: 'flex', flexWrap: 'wrap', gap: '3px 10px',
        pointerEvents: 'auto',
      }}>
        {BAND_KEYS.map((key, i) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: `rgb(${BAND_COLORS[i].r},${BAND_COLORS[i].g},${BAND_COLORS[i].b})`,
              boxShadow: `0 0 4px ${BAND_GLOW_COLORS[i]}`,
            }} />
            <span style={{
              fontFamily: typography.families.mono,
              fontSize: 8,
              color: colors.text.disabled,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
            }}>{key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
