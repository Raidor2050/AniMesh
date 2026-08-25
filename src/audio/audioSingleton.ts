import { AudioEngine, AudioSourceType } from '../audio/AudioEngine'

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
