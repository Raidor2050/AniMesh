import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore } from '../state/stores'
import { SHADER_LIBRARY } from '../shaders/library'
import { ShaderCategory, CATEGORY_LABELS } from '../utils/types'

type Mood = 'calm' | 'energetic' | 'dark' | 'cosmic' | 'organic' | 'chaotic'
type Movement = 'flow' | 'pulse' | 'spiral' | 'drift' | 'burst' | 'orbit'
type Palette = 'neon' | 'pastel' | 'monochrome' | 'sunset' | 'ocean' | 'custom'

const MOODS: { id: Mood; label: string; color: string }[] = [
  { id: 'calm', label: 'Calm', color: 'rgba(59,130,246,0.3)' },
  { id: 'energetic', label: 'Energetic', color: 'rgba(239,68,68,0.3)' },
  { id: 'dark', label: 'Dark', color: 'rgba(80,40,80,0.4)' },
  { id: 'cosmic', label: 'Cosmic', color: 'rgba(120,40,180,0.3)' },
  { id: 'organic', label: 'Organic', color: 'rgba(34,197,94,0.3)' },
  { id: 'chaotic', label: 'Chaotic', color: 'rgba(245,158,11,0.3)' },
]

const MOVEMENTS: { id: Movement; label: string }[] = [
  { id: 'flow', label: 'Flow' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'spiral', label: 'Spiral' },
  { id: 'drift', label: 'Drift' },
  { id: 'burst', label: 'Burst' },
  { id: 'orbit', label: 'Orbit' },
]

const PALETTES: { id: Palette; label: string; colors: string[] }[] = [
  { id: 'neon', label: 'Neon', colors: ['#6366F1', '#A855F7', '#EC4899', '#06B6D4'] },
  { id: 'pastel', label: 'Pastel', colors: ['#93C5FD', '#C4B5FD', '#FCA5A5', '#6EE7B7'] },
  { id: 'monochrome', label: 'Mono', colors: ['#FFFFFF', '#9CA3AF', '#4B5563', '#1F2937'] },
  { id: 'sunset', label: 'Sunset', colors: ['#F97316', '#EF4444', '#DB2777', '#7C3AED'] },
  { id: 'ocean', label: 'Ocean', colors: ['#06B6D4', '#3B82F6', '#1D4ED8', '#0F172A'] },
  { id: 'custom', label: 'Custom', colors: ['#6366F1', '#22C55E', '#F59E0B', '#EF4444'] },
]

const ADJECTIVES = ['Luminous', 'Silent', 'Pulse', 'Void', 'Neon', 'Drift', 'Wave', 'Echo', 'Prism', 'Flux', 'Astral', 'Chrome', 'Velvet', 'Crystal', 'Shadow', 'Nova', 'Eclipse', 'Phantom', 'Radiant', 'Frozen']
const NOUNS = ['Drift', 'Storm', 'Wave', 'Pulse', 'Flow', 'Bloom', 'Cascade', 'Meridian', 'Cascade', 'Resonance', 'Sphere', 'Lattice', 'Horizon', 'Vortex', 'Dream', 'Signal', 'Frequency', 'Harmonic', 'Surge', 'Field']

function generateName(seed: number): string {
  const a = ADJECTIVES[Math.floor(seed * 1000) % ADJECTIVES.length]
  const n = NOUNS[Math.floor(seed * 2000) % NOUNS.length]
  return `${a} ${n}`
}

export function ShaderCreator() {
  const creatorOpen = useUIStore(s => s.creatorOpen)
  const toggleCreator = useUIStore(s => s.toggleCreator)
  const setActiveShader = useShaderStore(s => s.setActiveShader)

  const [step, setStep] = useState(0)
  const [mood, setMood] = useState<Mood>('cosmic')
  const [movement, setMovement] = useState<Movement>('flow')
  const [intensity, setIntensity] = useState(0.5)
  const [palette, setPalette] = useState<Palette>('neon')
  const [seed, setSeed] = useState(() => Math.random())

  const generate = useCallback(() => {
    const moodToCategory: Record<Mood, ShaderCategory> = {
      calm: 'minimal', energetic: 'vj', dark: 'abstract', cosmic: 'cosmic', organic: 'liquid', chaotic: 'fractals',
    }
    const category = moodToCategory[mood]
    const candidates = SHADER_LIBRARY.filter(s => s.category === category)
    const base = candidates[Math.floor(seed * candidates.length) % candidates.length] || SHADER_LIBRARY[0]

    setActiveShader({
      ...base,
      name: generateName(seed),
      id: `generated-${Date.now()}`,
      defaults: {
        ...base.defaults,
        speed: movement === 'pulse' ? 1.5 : movement === 'drift' ? 0.5 : 1,
        intensity: intensity * 2,
      },
    })
    toggleCreator()
  }, [mood, movement, intensity, seed, setActiveShader, toggleCreator])

  const randomize = () => {
    setSeed(Math.random())
    setMood(MOODS[Math.floor(Math.random() * MOODS.length)].id)
    setMovement(MOVEMENTS[Math.floor(Math.random() * MOVEMENTS.length)].id)
    setIntensity(Math.random())
    setPalette(PALETTES[Math.floor(Math.random() * PALETTES.length)].id)
  }

  if (!creatorOpen) return null

  const steps = ['Mood', 'Movement', 'Intensity', 'Palette', 'Generate']

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) toggleCreator() }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            width: '560px', maxWidth: '90vw', maxHeight: '80vh',
            background: 'rgba(10,10,14,0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '16px', fontWeight: 600,
                color: 'rgba(255,255,255,0.92)',
              }}>Create Your Shader</span>
              <button onClick={toggleCreator} style={{
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: '4px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '11px', cursor: 'pointer',
              }}>ESC</button>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {steps.map((s, i) => (
                <div key={i} style={{
                  flex: 1, height: '2px',
                  background: i <= step ? '#6366F1' : 'rgba(255,255,255,0.08)',
                  borderRadius: '1px',
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>
            <div style={{
              fontSize: '10px', color: 'rgba(255,255,255,0.4)',
              marginTop: '8px',
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              Step {step + 1}: {steps[step]}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 24px', flex: 1, overflow: 'auto' }}>
            {step === 0 && (
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                  What's the vibe?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMood(m.id)}
                      style={{
                        padding: '16px',
                        background: mood === m.id ? m.color : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${mood === m.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                  How should it move?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {MOVEMENTS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMovement(m.id)}
                      style={{
                        padding: '16px',
                        background: movement === m.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${movement === m.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                  How intense? <span style={{ color: '#818CF8' }}>{Math.round(intensity * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={intensity}
                  onChange={e => setIntensity(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#6366F1',
                    height: '4px',
                  }}
                />
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '10px', color: 'rgba(255,255,255,0.3)',
                  marginTop: '8px',
                }}>
                  <span>Subtle</span>
                  <span>Overwhelming</span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                  Color mood?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {PALETTES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPalette(p.id)}
                      style={{
                        padding: '12px',
                        background: palette === p.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${palette === p.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '3px', marginBottom: '8px', justifyContent: 'center' }}>
                        {p.colors.map((c, i) => (
                          <div key={i} style={{
                            width: '14px', height: '14px', borderRadius: '3px',
                            background: c,
                          }} />
                        ))}
                      </div>
                      <div style={{
                        fontSize: '11px', color: 'rgba(255,255,255,0.7)',
                        textAlign: 'center',
                      }}>
                        {p.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '18px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.92)',
                  marginBottom: '8px',
                }}>
                  {generateName(seed)}
                </div>
                <div style={{
                  fontSize: '12px', color: 'rgba(255,255,255,0.4)',
                  marginBottom: '24px',
                }}>
                  {mood} · {movement} · {palette}
                </div>
                <button
                  onClick={randomize}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginBottom: '12px',
                  }}
                >
                  ↻ Randomize
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
          }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                style={{
                  padding: '8px 20px',
                  background: '#6366F1',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={generate}
                style={{
                  padding: '8px 20px',
                  background: '#6366F1',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                }}
              >
                Generate ✦
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
