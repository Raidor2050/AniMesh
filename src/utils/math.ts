export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  if (edge0 === edge1) return 0
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}
export const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
  if (inMin === inMax) return (outMin + outMax) / 2
  return outMin + (outMax - outMin) * ((v - inMin) / (inMax - inMin))
}
export const expDecay = (current: number, target: number, decay: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-decay * dt))
export const DB_TO_LINEAR = (db: number) => Math.pow(10, db / 20)

export class Smoother {
  private attackCoeff: number
  private releaseCoeff: number
  private value: number = 0
  private ready = false

  constructor(
    attackMs: number = 10,
    releaseMs: number = 200,
  ) {
    this.attackCoeff = 1 - Math.exp(-1 / (attackMs * 0.06))
    this.releaseCoeff = 1 - Math.exp(-1 / (releaseMs * 0.06))
  }

  update(target: number): number {
    if (!this.ready) {
      this.ready = true
      this.value = target
      return target
    }
    const coeff = target > this.value ? this.attackCoeff : this.releaseCoeff
    this.value += (target - this.value) * coeff
    return this.value
  }

  reset(v: number = 0) { this.value = v; this.ready = false }
  get() { return this.value }
}

export function computeRMS(data: Float32Array): number {
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
  return Math.sqrt(sum / data.length)
}

export function hash21(p: [number, number]): number {
  let h = Math.sin(p[0] * 127.1 + p[1] * 311.7) * 43758.5453
  return h - Math.floor(h)
}

export function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const BPM_TO_MS = (bpm: number) => 60000 / bpm
export const MS_TO_BPM = (ms: number) => 60000 / ms
