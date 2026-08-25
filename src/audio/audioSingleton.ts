import { AudioEngine, AudioSourceType, BPMMode } from '../audio/AudioEngine'

let engine: AudioEngine | null = null

export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine()
  return engine
}

export async function connectAudio(type: AudioSourceType, file?: File): Promise<boolean> {
  const eng = getAudioEngine()
  try {
    return await eng.setSource(type, file)
  } catch (e) {
    console.warn('Audio connection failed:', e)
    return false
  }
}

export function setBpmMode(mode: BPMMode) {
  getAudioEngine().setBpmMode(mode)
}

export function setManualBpm(bpm: number) {
  getAudioEngine().setManualBpm(bpm)
}

export function getManualBpm(): number {
  return getAudioEngine().getManualBpm()
}

export function tapTempo(): number | null {
  return getAudioEngine().tap()
}

export function getBpmMode(): BPMMode {
  return getAudioEngine().getBpmMode()
}
