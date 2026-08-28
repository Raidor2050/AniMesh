import { AudioSnapshot, AudioMapping } from '../utils/types'
import { expDecay } from '../utils/math'

export interface MappedParams {
  [key: string]: number
}

export class AudioMappingEngine {
  private decayValues: Map<string, number> = new Map()

  constructor() {}

  reset() {
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

      let mappedValue: number
      switch (mapping.curve) {
        case 'log':
          mappedValue = Math.log(1 + signalValue * mapping.amount * 9) / Math.log(10)
          break
        case 'exp':
          mappedValue = Math.pow(signalValue, 1 / Math.max(mapping.amount, 0.01))
          break
        default:
          mappedValue = signalValue * mapping.amount
      }

      const key = `${mapping.param}_${mapping.signal}`
      const prevDecayed = this.decayValues.get(key) ?? 0
      const decayed = expDecay(prevDecayed, mappedValue, 8, dt)
      this.decayValues.set(key, decayed)

      const currentVal = result[mapping.param] ?? 0
      result[mapping.param] = currentVal + decayed
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
