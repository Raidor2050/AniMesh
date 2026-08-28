// SVG audio-reactive object runtime (Phase-25). Ref-driven, zero React churn:
// SvgObjectLayer mounts a `<svg>` overlay; this module owns the nodes and a
// requestAnimationFrame loop that reads the shared AudioSnapshot bridge and the
// store params via getState() (plain refs, never subscriptions — AGENTS 1/2).
//
// Perf rules applied from Phase-25 research: transform/opacity preferred over
// path churn (path `d` rebuilds are throttled 1-in-N frames for heavy layouts),
// node counts capped ≤ ~64, single batched attribute write phase per frame.
import { AudioSnapshot, SvgObjectDefinition, SvgLayoutKey } from '../utils/types'
import { audioDataBridge, useUIStore, useShaderStore } from '../state/stores'

const SVG_NS = 'http://www.w3.org/2000/svg'

function el(tag: string, attrs: Record<string, string> = {}): SVGElement {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

function ptsToD(pts: number[][]): string {
  let d = 'M' + pts[0][0] + ' ' + pts[0][1]
  for (let i = 1; i < pts.length; i++) d += 'L' + pts[i][0] + ' ' + pts[i][1]
  return d
}

// HSL colour string (cheap, interpolable, hue-shiftable by param + centroid).
function hsl(h: number, s = 85, l = 55): string {
  const hh = ((h % 360) + 360) % 360
  const ll = Math.max(18, Math.min(78, l))
  return `hsl(${hh.toFixed(1)}, ${s.toFixed(0)}%, ${ll.toFixed(1)}%)`
}

// Sample a spectral band (0..1) from the live FFT spectrum (+ fallback synth so
// objects keep moving during silence/demo — AG3 autonomous motion).
function bandOf(a: AudioSnapshot, i: number, n: number): number {
  const bins = a.spectrum
  if (bins && bins.length > 0) {
    const idx = Math.min(bins.length - 1, Math.floor(((i + 0.5) / n) * 380))
    return bins[idx] / 255
  }
  return 0
}

export interface TickEnv {
  t: number
  dt: number
  frames: number
  a: AudioSnapshot
  params: Record<string, number>
}

interface Controller {
  update: (e: TickEnv) => void
}

type Builder = (def: SvgObjectDefinition, svg: SVGSVGElement) => Controller | null

const num = (v: number) => Math.round(v * 100) / 100
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// ——— layout builders ———

const buildRings: Builder = (def, svg) => {
  const count = Math.max(2, Math.round(def.spec.count ?? 6))
  const g = el('g', {})
  const cs: SVGElement[] = []
  for (let i = 0; i < count; i++) {
    const c = el('circle', { cx: '0', cy: '0', fill: 'none' })
    g.appendChild(c)
    cs.push(c)
  }
  const dot = el('circle', { cx: '0', cy: '0', r: '4', fill: 'none' })
  g.appendChild(dot)
  svg.appendChild(g)
  return {
    update: (e) => {
      const { a, t, params } = e
      const speed = params.speed ?? 1
      const lum = 42 + (params.brightness ?? 1) * 12
      g.setAttribute('transform', `rotate(${num((t * speed * 14 + a.beatPhase * 40) % 360)})`)
      for (let i = 0; i < count; i++) {
        const f = i / count
        const c = cs[i]
        const r = 16 + f * 52 + a.bass * 24 * (1 - f) + Math.sin(t * 2.2 * speed + i * 1.3) * 1.6
        c.setAttribute('r', num(r).toFixed(1))
        c.setAttribute('stroke-width', num(Math.max(0.6, (0.9 + (params.intensity ?? 1)) * (1 - f * 0.5))).toFixed(2))
        c.setAttribute('opacity', num(Math.min(1, 0.35 + f * 0.25 + (i === 0 ? a.beatIntensity * 0.6 : a.beatIntensity * 0.25 * (1 - f)))).toFixed(2))
        c.setAttribute('stroke', hsl(t * 3 + f * 90 + (params.hueShift ?? 0) * 57.3 + a.spectralCentroid * 160, 85, lum))
      }
      dot.setAttribute('r', num(3 + a.bass * 6).toFixed(1))
      dot.setAttribute('opacity', num(0.5 + a.mid * 0.5).toFixed(2))
      dot.setAttribute('stroke', hsl(t * 3 + (params.hueShift ?? 0) * 57.3, 90, lum))
    },
  }
}

const buildRose: Builder = (def, svg) => {
  const count = Math.max(2, Math.round(def.spec.count ?? 5))
  const path = el('path', { fill: 'none' })
  const g = el('g', {})
  g.appendChild(path)
  svg.appendChild(g)
  let lastD = ''
  const radius = (theta: number, bass: number, size: number) =>
    size * (1 + (0.35 + bass * 0.28) * Math.cos(count * theta)) * (0.8 + 0.2 * Math.sin(theta * 2))
  return {
    update: (e) => {
      const { a, t, params, frames } = e
      const speed = params.speed ?? 1
      const size = 52 * (params.scale ?? 1)
      g.setAttribute('transform', `rotate(${num((t * speed * 9 + a.beatPhase * 90) % 360)})`)
      path.setAttribute('stroke', hsl(t * 3 + (params.hueShift ?? 0) * 57.3 + a.bass * 40, 88, 50 + (params.brightness ?? 1) * 8))
      path.setAttribute('stroke-width', num(Math.max(0.7, 1.1 + (params.intensity ?? 1) * 0.6)).toFixed(2))
      path.setAttribute('opacity', num(Math.min(1, 0.6 + a.beatIntensity * 0.4)).toFixed(2))
      if (frames % 2 !== 0) return
      const pts: number[][] = []
      const N = 96
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2
        const r = Math.max(0.1, radius(th, a.bass, size))
        pts.push([Math.cos(th) * r, Math.sin(th) * r])
      }
      const d = ptsToD(pts)
      if (d !== lastD) { path.setAttribute('d', d); lastD = d }
    },
  }
}

const buildSpiro: Builder = (def, svg) => {
  const g = el('g', {})
  const outer = el('path', { fill: 'none' })
  const inner = el('path', { fill: 'none' })
  g.appendChild(outer)
  g.appendChild(inner)
  svg.appendChild(g)
  let lastOuter = ''
  let lastInner = ''
  const R = 62
  const r = 12 + (def.spec.count ?? 6) * 1.4
  const d = 54
  return {
    update: (e) => {
      const { a, t, params, frames } = e
      const speed = params.speed ?? 1
      g.setAttribute('transform', `rotate(${num((t * speed * 6 + a.spectralCentroid * 60) % 360)})`)
      const hue = t * 2 + (params.hueShift ?? 0) * 57.3 + a.bass * 30
      outer.setAttribute('stroke', hsl(hue, 85, 50 + (params.brightness ?? 1) * 8))
      inner.setAttribute('stroke', hsl(hue + 40, 90, 55))
      if (frames % 3 !== 0) return
      const K = Math.max(2, Math.round(R / r))
      const ratio = num((R - r) / r)
      const N = 240
      const ptsO: number[][] = []
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2
        const x = (R - r) * Math.cos(th) + d * Math.cos(ratio * th)
        const y = (R - r) * Math.sin(th) - d * Math.sin(ratio * th)
        ptsO.push([num(x * 0.66), num(y * 0.66)])
      }
      const dOuter = ptsToD(ptsO)
      if (dOuter !== lastOuter) { outer.setAttribute('d', dOuter); lastOuter = dOuter }
      const ptsI: number[][] = []
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2
        const x = (R - r) * Math.cos(th) + d * Math.cos(ratio * th + Math.PI)
        const y = (R - r) * Math.sin(th) - d * Math.sin(ratio * th + Math.PI)
        ptsI.push([num(x * 0.5), num(y * 0.5)])
      }
      const dInner = ptsToD(ptsI)
      if (dInner !== lastInner) { inner.setAttribute('d', dInner); lastInner = dInner }
      void K
    },
  }
}

const buildLissajous: Builder = (def, svg) => {
  const g = el('g', {})
  const orbit = el('circle', { cx: '0', cy: '0', fill: 'none' })
  const path = el('path', { fill: 'none' })
  g.appendChild(orbit)
  g.appendChild(path)
  svg.appendChild(g)
  const n = Math.max(2, Math.round(def.spec.count ?? 3))
  return {
    update: (e) => {
      const { a, t, params } = e
      const speed = params.speed ?? 1
      const fa = 1 + (n % 4)
      const fb = 2 + Math.floor(n / 2)
      const delta = a.beatPhase * Math.PI * 2 + a.spectralCentroid * 1.2
      const amp = 62 * (params.scale ?? 1) * (0.75 + a.bass * 0.45)
      const hue = t * 2 + (params.hueShift ?? 0) * 57.3 + a.spectralCentroid * 120
      orbit.setAttribute('r', num(amp + 6).toFixed(1))
      orbit.setAttribute('stroke', hsl(hue, 30, 24))
      path.setAttribute('stroke', hsl(hue, 92, 52 + (params.brightness ?? 1) * 8))
      path.setAttribute('stroke-width', num(1.2 + (params.intensity ?? 1) * 0.5).toFixed(2))
      path.setAttribute('opacity', num(Math.min(1, 0.55 + a.beatIntensity * 0.45)).toFixed(2))
      const pts: number[][] = []
      const N = 120
      for (let i = 0; i <= N; i++) {
        const lt = (i / N) * Math.PI * 2
        const x = amp * Math.cos(fa * lt + delta)
        const y = amp * Math.sin(fb * lt + t * speed * 0.05)
        pts.push([num(x), num(y)])
      }
      path.setAttribute('d', ptsToD(pts))
    },
  }
}

const buildPolarSpectrum: Builder = (def, svg) => {
  const N = 64
  const g = el('g', {})
  const lines: SVGElement[] = []
  for (let i = 0; i < N; i++) {
    const line = el('line', { x1: '0', y1: '0', x2: '0', y2: '0', 'stroke-linecap': 'round' })
    g.appendChild(line)
    lines.push(line)
  }
  svg.appendChild(g)
  return {
    update: (e) => {
      const { a, t, params } = e
      const speed = params.speed ?? 1
      const spin = t * speed * 6 + a.beatPhase * 30
      const lum = 40 + (params.brightness ?? 1) * 12
      for (let i = 0; i < N; i++) {
        const b = bandOf(a, i, N)
        const len = 6 + b * 72 * (params.intensity ?? 1)
        const l = lines[i]
        l.setAttribute('y2', num(-len).toFixed(1))
        l.setAttribute('transform', `rotate(${num((i * (360 / N) + spin * 2) % 360)})`)
        l.setAttribute('stroke', hsl(t * 3 + i * (360 / N) * 0.6 + (params.hueShift ?? 0) * 57.3 + a.bass * 25, 90, lum + b * 16))
        l.setAttribute('stroke-width', num(1 + (a.beatIntensity * 2)).toFixed(2))
        l.setAttribute('opacity', num(Math.min(1, 0.25 + b * 0.75)).toFixed(2))
      }
    },
  }
}

const buildRadialBars: Builder = (def, svg) => {
  const N = Math.max(12, Math.round(def.spec.count ?? 36))
  const g = el('g', {})
  const lines: SVGElement[] = []
  for (let i = 0; i < N; i++) {
    const line = el('line', { x1: '0', y1: '0', x2: '0', y2: '0', 'stroke-linecap': 'round' })
    g.appendChild(line)
    lines.push(line)
  }
  svg.appendChild(g)
  return {
    update: (e) => {
      const { a, t, params } = e
      const speed = params.speed ?? 1
      const base = 30 + a.bass * 14 * (params.scale ?? 1)
      const spin = t * speed * 5 + a.spectralCentroid * 40
      for (let i = 0; i < N; i++) {
        const b = bandOf(a, i, N)
        const len = 8 + b * 60 * (0.4 + a.mid * 0.7)
        const l = lines[i]
        l.setAttribute('y1', num(-base).toFixed(1))
        l.setAttribute('y2', num(-(base + len)).toFixed(1))
        l.setAttribute('transform', `rotate(${num((i * (360 / N) + spin) % 360)})`)
        l.setAttribute('stroke', hsl(t * 2 + i * 2.4 + (params.hueShift ?? 0) * 57.3, 90, 46 + b * 22))
        l.setAttribute('stroke-width', num(Math.max(1.4, 3.4 - b * 1.6)).toFixed(2))
        l.setAttribute('opacity', num(Math.min(1, 0.3 + b * 0.7)).toFixed(2))
      }
    },
  }
}

const buildWaveform: Builder = (def, svg) => {
  const g = el('g', {})
  const axis = el('line', { x1: '-96', y1: '0', x2: '96', y2: '0' })
  const top = el('path', { fill: 'none', 'stroke-linecap': 'round' })
  const bottom = el('path', { fill: 'none', 'stroke-linecap': 'round' })
  g.appendChild(axis)
  g.appendChild(top)
  g.appendChild(bottom)
  svg.appendChild(g)
  return {
    update: (e) => {
      const { a, t, params } = e
      const wf = a.waveform
      const amp = 46 * (params.scale ?? 1) * (0.6 + a.bass * 0.8)
      const hue = t * 2 + (params.hueShift ?? 0) * 57.3
      const lum = 44 + (params.brightness ?? 1) * 10
      axis.setAttribute('stroke', hsl(hue, 20, 16))
      top.setAttribute('stroke', hsl(hue, 90, lum))
      bottom.setAttribute('stroke', hsl(hue + 26, 92, lum))
      top.setAttribute('opacity', num(Math.min(1, 0.5 + a.volume * 0.5)).toFixed(2))
      bottom.setAttribute('opacity', num(Math.min(1, 0.28 + a.volume * 0.4)).toFixed(2))
      const ptsT: number[][] = []
      const ptsB: number[][] = []
      const N = 96
      const step = Math.max(1, Math.floor(wf.length / N))
      for (let i = 0; i <= N; i++) {
        const x = -96 + (i / N) * 192
        const s = wf[Math.min(wf.length - 1, i * step)] ?? 0
        const y = -clamp01(s) * amp
        ptsT.push([num(x), num(y)])
        ptsB.push([num(x), num(y * -0.82)])
      }
      top.setAttribute('d', ptsToD(ptsT))
      bottom.setAttribute('d', ptsToD(ptsB))
    },
  }
}

const buildMandala: Builder = (def, svg) => {
  const count = Math.max(4, Math.round(def.spec.count ?? 10))
  const g = el('g', {})
  const petalD = 'M0 -46 Q24 -30 0 -8 Q-24 -30 0 -46 Z'
  const innerD = 'M0 -34 Q14 -22 0 -13 Q-14 -22 0 -34 Z'
  const groups: { g: SVGElement; petal: SVGElement; inner: SVGElement }[] = []
  for (let i = 0; i < count; i++) {
    const grp = el('g', {})
    const petal = el('path', { d: petalD, fill: 'none' })
    const inner = el('path', { d: innerD, fill: 'none' })
    grp.appendChild(petal)
    grp.appendChild(inner)
    g.appendChild(grp)
    groups.push({ g: grp, petal, inner })
  }
  const core = el('circle', { cx: '0', cy: '0', r: '6', fill: 'none' })
  g.appendChild(core)
  svg.appendChild(g)
  return {
    update: (e) => {
      const { a, t, params, frames } = e
      const speed = params.speed ?? 1
      const spin = t * speed * 6 + a.beatPhase * 60
      const pulse = 0.92 + a.treble * 0.3 + a.beatIntensity * 0.12
      const hue = t * 2 + (params.hueShift ?? 0) * 57.3
      core.setAttribute('r', num((5 + a.bass * 5) * pulse).toFixed(1))
      core.setAttribute('stroke', hsl(hue, 90, 50 + (params.brightness ?? 1) * 8))
      if (frames % 2 !== 0) return
      for (let i = 0; i < count; i++) {
        const b = bandOf(a, i, count)
        const grp = groups[i]
        const ang = (i * (360 / count) + spin) % 360
        grp.g.setAttribute('transform', `rotate(${num(ang)}) scale(${num(0.9 + b * 0.6 + a.bass * 0.25)})`)
        grp.petal.setAttribute('stroke', hsl(hue + i * (360 / count) * 0.5, 88, 48 + b * 18))
        grp.petal.setAttribute('stroke-width', num(1.1 + (params.intensity ?? 1) * 0.5).toFixed(2))
        grp.inner.setAttribute('stroke', hsl(hue + 30 + i * 2, 92, 56))
      }
    },
  }
}

const buildOrbits: Builder = (def, svg) => {
  const count = Math.max(5, Math.round(def.spec.count ?? 9))
  const g = el('g', {})
  const dots: SVGElement[] = []
  for (let i = 0; i < count; i++) {
    const dot = el('circle', { cx: '0', cy: '0', r: '3' })
    g.appendChild(dot)
    dots.push(dot)
  }
  svg.appendChild(g)
  return {
    update: (e) => {
      const { a, t, params } = e
      const speed = params.speed ?? 1
      const R = 40 + a.bass * 30 + a.sub * 16
      const spinDeg = (t * speed * 22 + a.beatPhase * 360) % 360
      const hue = t * 2 + (params.hueShift ?? 0) * 57.3 + a.bass * 20
      for (let i = 0; i < count; i++) {
        const b = bandOf(a, i, count)
        const dot = dots[i]
        const ang = (i * (360 / count)) % 360
        const own = Math.sin(t * speed * 2 + i * 1.7) * 6
        dot.setAttribute('transform', `rotate(${num(ang + spinDeg)}) translate(0 ${num(-(R + own))})`)
        dot.setAttribute('r', num(2.2 + b * 5 + a.beatIntensity * 0.8).toFixed(1))
        dot.setAttribute('fill', hsl(hue + i * (360 / count), 90, 52 + b * 16))
        dot.setAttribute('opacity', num(Math.min(1, 0.35 + b * 0.65)).toFixed(2))
      }
      g.setAttribute('transform', `scale(${num(1 + a.treble * 0.08)})`)
    },
  }
}

const buildFlowDash: Builder = (def, svg) => {
  const ring = el('circle', { cx: '0', cy: '0', r: '64', fill: 'none', 'stroke-linecap': 'round' })
  svg.appendChild(ring)
  const C = 2 * Math.PI * 64
  return {
    update: (e) => {
      const { a, t, params, dt } = e
      const speed = params.speed ?? 1
      const pulse = 1 + a.bass * 0.22 + Math.sin(t * speed * 2.4) * 0.03
      ring.setAttribute('transform', `scale(${num(pulse)})`)
      const len = 4 + a.bpm * 0.12 + a.beatIntensity * 10
      const gap = Math.max(3, C - len)
      ring.setAttribute('stroke-dasharray', `${num(Math.max(1, len)).toFixed(1)} ${num(gap).toFixed(1)}`)
      const off = ((t * speed * 110 + a.beatPhase * 60) % C + C) % C
      ring.setAttribute('stroke-dashoffset', num(-off).toFixed(1))
      ring.setAttribute('stroke-width', num(Math.max(1, 1.5 + a.mid * 2 + a.beatIntensity * 1.5)).toFixed(2))
      ring.setAttribute('stroke', hsl(t * 2 + (params.hueShift ?? 0) * 57.3 + a.bass * 30, 90, 46 + (params.brightness ?? 1) * 8))
      ring.setAttribute('opacity', num(Math.min(1, 0.45 + a.volume * 0.55)).toFixed(2))
      void dt
    },
  }
}

const buildGrid: Builder = (def, svg) => {
  const n = Math.max(3, Math.round(def.spec.count ?? 6))
  const g = el('g', {})
  const cells: SVGElement[] = []
  for (let i = 0; i < n * n; i++) {
    const c = el('rect', { width: '200', height: '200' })
    g.appendChild(c)
    cells.push(c)
  }
  svg.appendChild(g)
  return {
    update: (e) => {
      const { a, t, params } = e
      const size = 200 / n
      const x0 = -100
      const hue = t * 2 + (params.hueShift ?? 0) * 57.3
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const idx = i * n + j
          const b = bandOf(a, idx, n * n)
          const c = cells[idx]
          const x = x0 + i * size + 1
          const y = x0 + j * size + 1
          c.setAttribute('x', num(x).toFixed(1))
          c.setAttribute('y', num(y).toFixed(1))
          c.setAttribute('width', num(size - 2 + a.bass * 4).toFixed(1))
          c.setAttribute('height', num(size - 2 + a.bass * 4).toFixed(1))
          c.setAttribute('fill', hsl(hue + i * 20 + j * 14 + b * 60, 82, 12 + b * 55))
          c.setAttribute('opacity', num(Math.min(1, 0.3 + b * 0.7)).toFixed(2))
        }
      }
      g.setAttribute('transform', `scale(${num(0.94 + a.sub * 0.12)})`)
    },
  }
}

const buildPetals: Builder = (def, svg) => {
  const count = Math.max(4, Math.round(def.spec.count ?? 10))
  const g = el('g', {})
  const spokes: SVGElement[] = []
  const pts = '0,-11 6,-3 0,-4 -6,-3'
  for (let i = 0; i < count; i++) {
    const poly = el('polygon', { points: pts, fill: 'none' })
    g.appendChild(poly)
    spokes.push(poly)
  }
  svg.appendChild(g)
  return {
    update: (e) => {
      const { a, t, params } = e
      const speed = params.speed ?? 1
      const spin = t * speed * 7 + a.beatPhase * 40
      const R = 36 + a.bass * 22 + a.sub * 10
      const hue = t * 2 + (params.hueShift ?? 0) * 57.3
      for (let i = 0; i < count; i++) {
        const b = bandOf(a, i, count)
        const p = spokes[i]
        const ang = (i * (360 / count) + spin) % 360
        const s = 0.8 + b * 0.9 + a.beatIntensity * 0.25
        p.setAttribute('transform', `rotate(${num(ang)}) translate(0 ${num(-R)}) scale(${num(s)})`)
        p.setAttribute('stroke', hsl(hue + i * (360 / count) * 0.6, 90, 48 + b * 18))
        p.setAttribute('stroke-width', num(1.2 + (params.intensity ?? 1) * 0.6).toFixed(2))
        p.setAttribute('opacity', num(Math.min(1, 0.4 + b * 0.6)).toFixed(2))
      }
    },
  }
}

const BUILDERS: Record<SvgLayoutKey, Builder> = {
  rings: buildRings,
  rose: buildRose,
  spiro: buildSpiro,
  lissajous: buildLissajous,
  polarSpectrum: buildPolarSpectrum,
  radialBars: buildRadialBars,
  waveform: buildWaveform,
  mandala: buildMandala,
  orbits: buildOrbits,
  flowDash: buildFlowDash,
  grid: buildGrid,
  petals: buildPetals,
}

/**
 * Mount an SVG object into `container` and start its audio-reactive loop.
 * Returns a teardown that stops the loop and clears the container.
 */
export function mountSvgObject(container: HTMLElement, def: SvgObjectDefinition): () => void {
  container.innerHTML = ''
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement
  svg.setAttribute('viewBox', '-100 -100 200 200')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.style.display = 'block'
  container.appendChild(svg)

  const builder = BUILDERS[def.layout]
  const controller = builder ? builder(def, svg) : null
  let raf = 0
  let prev = 0
  let frames = 0

  const tick = (ts: number) => {
    raf = requestAnimationFrame(tick)
    if (!controller) return
    if (useUIStore.getState().reducedMotion) return
    const dt = prev > 0 ? Math.min((ts - prev) / 1000, 0.1) : 1 / 60
    prev = ts
    frames++
    const raw = useShaderStore.getState().params
    const params = { ...def.defaults, ...raw }
    controller.update({ t: ts / 1000, dt, frames, a: audioDataBridge.snapshot, params })
  }
  raf = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(raf)
    container.innerHTML = ''
  }
}