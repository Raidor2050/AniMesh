import { AudioSnapshot, AudioMapping } from '../utils/types'
import { clamp, expDecay } from '../utils/math'

export interface MappedParams {
  [key: string]: number
}

export class AudioMappingEngine {
  private params: MappedParams = {}
  private decayValues: Map<string, number> = new Map()

  constructor() {}

  reset() {
    this.params = {}
    this.decayValues.clear()
  }

  applyMappings(
    snapshot: AudioSnapshot,
    mappings: AudioMapping[],
    baseParams: Record<string, number>,
    dt: number = 1 / 60
  ): MappedParams {
    const result: MappedParams = { ...baseParams }

    for (const mapping of mappings) {
      const signalValue = this.getSignalValue(snapshot, mapping.signal)
      const baseValue = baseParams[mapping.param] ?? 0

      let mappedValue: number
      switch (mapping.curve) {
        case 'log':
          mappedValue = Math.log(1 + signalValue * mapping.amount * 9) / Math.log(10)
          break
        case 'exp':
          mappedValue = Math.pow(signalValue * mapping.amount, 2)
          break
        default:
          mappedValue = signalValue * mapping.amount
      }

      const key = `${mapping.param}_${mapping.signal}`
      const decayed = expDecay(this.decayValues.get(key) ?? 0, mappedValue, 8, dt)
      this.decayValues.set(key, decayed)

      result[mapping.param] = clamp(baseValue + decayed, 0, 1)
    }

    return result
  }

  private getSignalValue(snapshot: AudioSnapshot, signal: string): number {
    switch (signal) {
      case 'sub': return snapshot.sub
      case 'bass': return snapshot.bass
      case 'lowMid': return snapshot.lowMid
      case 'mid': return snapshot.mid
      case 'highMid': return snapshot.highMid
      case 'treble': return snapshot.treble
      case 'volume': return snapshot.volume
      case 'beat': return snapshot.beatIntensity
      case 'beatPhase': return snapshot.beatPhase
      default: return 0
    }
  }
}
