// Static per-layout glyph for SVG-object library cards. Purely decorative
// (no audio, no rAF) — a recognizable shape per layout family so SVG visuals
// preview as visually distinct from GL shaders.
import { SvgLayoutKey } from '../utils/types'

function sample(d: (t: number) => [number, number], steps: number, t0: number, t1: number): string {
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = t0 + (t1 - t0) * (i / steps)
    const [x, y] = d(t)
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return pts.join(' ')
}

const CENTER = 20

function rosePath(): string {
  return sample(t => {
    const r = Math.abs(13 * Math.cos(2 * t))
    return [CENTER + r * Math.cos(t), CENTER + r * Math.sin(t)]
  }, 120, 0, Math.PI * 2)
}

function spiroPath(): string {
  const R = 13, r = 5, d = 7
  return sample(t => {
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t)
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)
    return [CENTER + x * 0.9, CENTER + y * 0.9]
  }, 220, 0, Math.PI * 2)
}

function lissajousPath(): string {
  return sample(t => [CENTER + 12 * Math.sin(3 * t), CENTER + 11 * Math.sin(2 * t + 0.7)], 140, 0, Math.PI * 2)
}

function waveformPath(): string {
  return sample(t => {
    const x = 4 + t * 32
    return [x, CENTER + 6 * Math.sin((x - CENTER) * 0.55)]
  }, 34, 0, 1)
}

function petal(d: number): string {
  return `M${CENTER} ${CENTER} Q${CENTER + 3} ${CENTER - d * 0.5} ${CENTER} ${CENTER - d} Q${CENTER - 3} ${CENTER - d * 0.5} ${CENTER} ${CENTER} Z`
}

function gridCells(): { key: string; x: number; y: number; w: number; h: number }[] {
  const cells: { key: string; x: number; y: number; w: number; h: number }[] = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      cells.push({
        key: `${r}-${c}`,
        x: 13 + c * 6 - (r === 1 ? 1.5 : 0),
        y: 13 + r * 6,
        w: 6 + (r === 1 ? 3 : 0),
        h: 4 + ((c * 7 + r) % 3),
      })
    }
  }
  return cells
}

const LAYOUT_GLYPHS: Record<SvgLayoutKey, React.ReactNode> = {
  rings: (
    <>
      <circle cx={CENTER} cy={CENTER} r={8} />
      <circle cx={CENTER} cy={CENTER} r={13} />
      <circle cx={CENTER} cy={CENTER} r={18} />
    </>
  ),
  rose: <path d={rosePath()} />,
  spiro: <path d={spiroPath()} />,
  lissajous: <path d={lissajousPath()} />,
  polarSpectrum: (
    <>
      <circle cx={CENTER} cy={CENTER} r={5} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        const len = 8 + ((i * 5) % 7)
        return (
          <line
            key={i}
            x1={CENTER + 6 * Math.cos(a)} y1={CENTER + 6 * Math.sin(a)}
            x2={CENTER + (6 + len) * Math.cos(a)} y2={CENTER + (6 + len) * Math.sin(a)}
          />
        )
      })}
    </>
  ),
  radialBars: (
    <>
      <circle cx={CENTER} cy={CENTER} r={8} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        const len = 7 + ((i * 3) % 6)
        return (
          <line
            key={i}
            x1={CENTER + 8 * Math.cos(a)} y1={CENTER + 8 * Math.sin(a)}
            x2={CENTER + (8 + len) * Math.cos(a)} y2={CENTER + (8 + len) * Math.sin(a)}
          />
        )
      })}
    </>
  ),
  waveform: <path d={waveformPath()} />,
  mandala: (
    <>
      <circle cx={CENTER} cy={CENTER} r={11} />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 45} ${CENTER} ${CENTER})`}>
          <path d={petal(9)} fill="rgba(255,255,255,0.14)" />
        </g>
      ))}
    </>
  ),
  orbits: (
    <>
      <circle cx={CENTER} cy={CENTER} r={12} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = i * 0.62
        return (
          <circle
            key={i}
            cx={CENTER + 12 * Math.cos(a)} cy={CENTER + 12 * Math.sin(a)}
            r={2.4} fill="rgba(255,255,255,0.6)" stroke="none"
          />
        )
      })}
    </>
  ),
  flowDash: <circle cx={CENTER} cy={CENTER} r={13} strokeDasharray="3 3.4" />,
  grid: (
    <>
      {gridCells().map(cell => (
        <rect
          key={cell.key}
          x={cell.x} y={cell.y}
          width={cell.w} height={cell.h}
          rx={1}
        />
      ))}
    </>
  ),
  petals: (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 72} ${CENTER} ${CENTER})`}>
          <path d={petal(14)} fill="rgba(255,255,255,0.12)" />
        </g>
      ))}
      <circle cx={CENTER} cy={CENTER} r={2.5} fill="rgba(255,255,255,0.5)" stroke="none" />
    </>
  ),
}

export function LayoutGlyph({ layout, size = 24, opacity = 0.5 }: {
  layout: SvgLayoutKey
  size?: number
  opacity?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{ display: 'block', opacity }}
      aria-hidden="true"
      fill="none"
      stroke="rgba(255,255,255,0.85)"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {LAYOUT_GLYPHS[layout] ?? LAYOUT_GLYPHS.rings}
    </svg>
  )
}