import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore } from '../state/stores'
import { SHADER_LIBRARY } from '../shaders/library'
import { ShaderCategory } from '../utils/types'
import { colors, typography, spacing, radii, animation } from '../ui/tokens'

type Mood = 'calm' | 'energetic' | 'dark' | 'cosmic' | 'organic' | 'chaotic'
type Movement = 'flow' | 'pulse' | 'spiral' | 'drift' | 'burst' | 'orbit'
type Palette = 'neon' | 'pastel' | 'monochrome' | 'sunset' | 'ocean' | 'custom'

const MOODS: { id: Mood; label: string; icon: string; color: string; desc: string }[] = [
  { id: 'calm', label: 'Calm', icon: '○', color: 'rgba(59,130,246,0.15)', desc: 'Smooth, flowing visuals' },
  { id: 'energetic', label: 'Energetic', icon: '⚡', color: 'rgba(239,68,68,0.15)', desc: 'Fast, pulsing reactions' },
  { id: 'dark', label: 'Dark', icon: '◑', color: 'rgba(80,40,80,0.2)', desc: 'Deep, moody tones' },
  { id: 'cosmic', label: 'Cosmic', icon: '✧', color: 'rgba(120,40,180,0.15)', desc: 'Space-inspired wonder' },
  { id: 'organic', label: 'Organic', icon: '❋', color: 'rgba(34,197,94,0.15)', desc: 'Natural, growing forms' },
  { id: 'chaotic', label: 'Chaotic', icon: '◈', color: 'rgba(245,158,11,0.15)', desc: 'Unpredictable energy' },
]

const MOVEMENTS: { id: Movement; label: string; icon: string }[] = [
  { id: 'flow', label: 'Flow', icon: '≈' },
  { id: 'pulse', label: 'Pulse', icon: '◎' },
  { id: 'spiral', label: 'Spiral', icon: '🌀' },
  { id: 'drift', label: 'Drift', icon: '→' },
  { id: 'burst', label: 'Burst', icon: '✦' },
  { id: 'orbit', label: 'Orbit', icon: '◯' },
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
const NOUNS = ['Drift', 'Storm', 'Wave', 'Pulse', 'Flow', 'Bloom', 'Cascade', 'Meridian', 'Resonance', 'Sphere', 'Lattice', 'Horizon', 'Vortex', 'Dream', 'Signal', 'Frequency', 'Harmonic', 'Surge', 'Field', 'Nebula']

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

    const paletteColors = PALETTES.find(p => p.id === palette)?.colors ?? []

    setActiveShader({
      ...base,
      name: generateName(seed),
      id: `generated-${Date.now()}`,
      defaults: {
        ...base.defaults,
        speed: movement === 'pulse' ? 1.5 : movement === 'drift' ? 0.5 : 1,
        intensity: intensity * 2,
        ...(paletteColors.length > 0 ? {
          color1: parseInt(paletteColors[0].slice(1), 16) / 0xFFFFFF,
          color2: parseInt(paletteColors[1]?.slice(1) ?? paletteColors[0].slice(1), 16) / 0xFFFFFF,
        } : {}),
      },
    })
    toggleCreator()
  }, [mood, movement, intensity, palette, seed, setActiveShader, toggleCreator])

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
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(12px)',
        }}
        onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) toggleCreator() }}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={animation.spring.panel}
          style={{
            width: 580, maxWidth: '92vw', maxHeight: '82vh',
            background: colors.surface.panel,
            backdropFilter: 'blur(32px) saturate(1.2)',
            border: `1px solid ${colors.surface.secondary}`,
            borderRadius: radii.xl,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 1px rgba(99,102,241,0.15)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: `${spacing.scale[5]}px ${spacing.scale[6]}px ${spacing.scale[4]}px`,
            borderBottom: `1px solid ${colors.surface.secondary}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.scale[4] }}>
              <div>
                <span style={{
                  fontFamily: typography.families.mono,
                  fontSize: typography.scale.xl.size,
                  fontWeight: typography.scale.xl.weight,
                  color: colors.text.primary,
                  letterSpacing: typography.scale.xl.tracking,
                }}>Create Shader</span>
                <span style={{
                  fontSize: 10,
                  color: colors.text.disabled,
                  fontFamily: typography.families.mono,
                  marginLeft: 8,
                }}>Step {step + 1} of {steps.length}</span>
              </div>
              <button onClick={toggleCreator} style={{
                padding: '4px 10px',
                background: colors.surface.primary,
                border: `1px solid ${colors.surface.secondary}`,
                borderRadius: radii.xs,
                color: colors.text.tertiary,
                fontSize: 10, cursor: 'pointer',
                fontFamily: typography.families.mono,
                transition: 'all 0.15s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.surface.hover; e.currentTarget.style.color = colors.text.secondary }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.surface.primary; e.currentTarget.style.color = colors.text.tertiary }}
              >ESC</button>
            </div>

            {/* Step progress */}
            <div style={{ display: 'flex', gap: 3 }}>
              {steps.map((s, i) => (
                <div key={i} style={{
                  flex: 1, height: 2,
                  background: i <= step ? colors.accent.primary : colors.surface.secondary,
                  borderRadius: 1,
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>
            <div style={{
              fontSize: 10, color: colors.text.tertiary,
              marginTop: 8,
              fontFamily: typography.families.mono,
            }}>
              {steps[step]}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: `${spacing.scale[5]}px ${spacing.scale[6]}px`, flex: 1, overflow: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 && (
                  <div>
                    <div style={{ fontSize: typography.scale.base.size, color: colors.text.secondary, marginBottom: spacing.scale[4] }}>
                      What's the vibe?
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {MOODS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setMood(m.id)}
                          style={{
                            padding: `${spacing.scale[4]}px`,
                            background: mood === m.id ? m.color : colors.surface.primary,
                            border: `1px solid ${mood === m.id ? colors.accent.glow.replace('0.4', '0.25') : colors.surface.secondary}`,
                            borderRadius: radii.md,
                            color: colors.text.primary,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'left',
                          }}
                          onMouseEnter={e => { if (mood !== m.id) e.currentTarget.style.borderColor = colors.borderHover }}
                          onMouseLeave={e => { if (mood !== m.id) e.currentTarget.style.borderColor = colors.surface.secondary }}
                        >
                          <div style={{ fontSize: 18, marginBottom: 6 }}>{m.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: typography.families.mono, marginBottom: 2 }}>{m.label}</div>
                          <div style={{ fontSize: 10, color: colors.text.tertiary }}>{m.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <div style={{ fontSize: typography.scale.base.size, color: colors.text.secondary, marginBottom: spacing.scale[4] }}>
                      How should it move?
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {MOVEMENTS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setMovement(m.id)}
                          style={{
                            padding: `${spacing.scale[4]}px ${spacing.scale[3]}px`,
                            background: movement === m.id ? colors.accent.subtle : colors.surface.primary,
                            border: `1px solid ${movement === m.id ? colors.accent.glow.replace('0.4', '0.25') : colors.surface.secondary}`,
                            borderRadius: radii.md,
                            color: colors.text.primary,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'center',
                          }}
                          onMouseEnter={e => { if (movement !== m.id) e.currentTarget.style.borderColor = colors.borderHover }}
                          onMouseLeave={e => { if (movement !== m.id) e.currentTarget.style.borderColor = colors.surface.secondary }}
                        >
                          <div style={{ fontSize: 16, marginBottom: 4 }}>{m.icon}</div>
                          <div style={{ fontSize: 11, fontWeight: 500, fontFamily: typography.families.mono }}>{m.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div style={{ fontSize: typography.scale.base.size, color: colors.text.secondary, marginBottom: spacing.scale[4] }}>
                      Intensity: <span style={{ color: colors.accent.hover, fontFamily: typography.families.mono }}>{Math.round(intensity * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.01"
                      value={intensity}
                      onChange={e => setIntensity(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 10, color: colors.text.disabled,
                      marginTop: 8,
                      fontFamily: typography.families.mono,
                    }}>
                      <span>Subtle</span>
                      <span>Overwhelming</span>
                    </div>
                    {/* Intensity preview bar */}
                    <div style={{
                      marginTop: spacing.scale[4],
                      height: 4, borderRadius: 2,
                      background: 'rgba(255,255,255,0.04)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${intensity * 100}%`,
                        background: `linear-gradient(90deg, ${colors.accent.primary}, #A855F7, #EC4899)`,
                        borderRadius: 2,
                        transition: 'width 0.1s ease',
                      }} />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div style={{ fontSize: typography.scale.base.size, color: colors.text.secondary, marginBottom: spacing.scale[4] }}>
                      Color mood?
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {PALETTES.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setPalette(p.id)}
                          style={{
                            padding: spacing.scale[3],
                            background: palette === p.id ? colors.accent.subtle : colors.surface.primary,
                            border: `1px solid ${palette === p.id ? colors.accent.glow.replace('0.4', '0.25') : colors.surface.secondary}`,
                            borderRadius: radii.md,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { if (palette !== p.id) e.currentTarget.style.borderColor = colors.borderHover }}
                          onMouseLeave={e => { if (palette !== p.id) e.currentTarget.style.borderColor = colors.surface.secondary }}
                        >
                          <div style={{ display: 'flex', gap: 3, marginBottom: 8, justifyContent: 'center' }}>
                            {p.colors.map((c, i) => (
                              <div key={i} style={{
                                width: 16, height: 16, borderRadius: radii.xs,
                                background: c,
                                boxShadow: palette === p.id ? `0 0 8px ${c}40` : 'none',
                              }} />
                            ))}
                          </div>
                          <div style={{
                            fontSize: 11, color: palette === p.id ? colors.text.primary : colors.text.secondary,
                            textAlign: 'center',
                            fontFamily: typography.families.mono,
                            fontWeight: 500,
                          }}>
                            {p.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div style={{ textAlign: 'center', padding: `${spacing.scale[4]}px 0` }}>
                    <div style={{
                      fontFamily: typography.families.mono,
                      fontSize: typography.scale.xxl.size,
                      fontWeight: typography.scale.xxl.weight,
                      color: colors.text.primary,
                      letterSpacing: typography.scale.xxl.tracking,
                      marginBottom: 8,
                    }}>
                      {generateName(seed)}
                    </div>
                    <div style={{
                      fontSize: typography.scale.sm.size,
                      color: colors.text.tertiary,
                      fontFamily: typography.families.mono,
                      marginBottom: spacing.scale[5],
                      display: 'flex', gap: 8, justifyContent: 'center',
                    }}>
                      <span>{MOODS.find(m => m.id === mood)?.icon} {mood}</span>
                      <span style={{ color: colors.text.disabled }}>·</span>
                      <span>{MOVEMENTS.find(m => m.id === movement)?.icon} {movement}</span>
                      <span style={{ color: colors.text.disabled }}>·</span>
                      <span>{palette}</span>
                    </div>
                    <button
                      onClick={randomize}
                      style={{
                        padding: `${spacing.scale[2]}px ${spacing.scale[4]}px`,
                        background: colors.surface.primary,
                        border: `1px solid ${colors.surface.secondary}`,
                        borderRadius: radii.sm,
                        color: colors.text.secondary,
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: typography.families.sans,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = colors.surface.hover; e.currentTarget.style.borderColor = colors.borderHover }}
                      onMouseLeave={e => { e.currentTarget.style.background = colors.surface.primary; e.currentTarget.style.borderColor = colors.surface.secondary }}
                    >
                      ↻ Randomize
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div style={{
            padding: `${spacing.scale[4]}px ${spacing.scale[6]}px`,
            borderTop: `1px solid ${colors.surface.secondary}`,
            display: 'flex', justifyContent: 'flex-end', gap: 8,
          }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: `${spacing.scale[2]}px ${spacing.scale[4]}px`,
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  borderRadius: radii.sm,
                  color: colors.text.secondary,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.surface.hover; e.currentTarget.style.borderColor = colors.borderHover }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.surface.primary; e.currentTarget.style.borderColor = colors.surface.secondary }}
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                style={{
                  padding: `${spacing.scale[2]}px ${spacing.scale[5]}px`,
                  background: colors.accent.primary,
                  border: 'none',
                  borderRadius: radii.sm,
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: typography.families.sans,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.accent.hover }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.accent.primary }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={generate}
                style={{
                  padding: `${spacing.scale[2]}px ${spacing.scale[5]}px`,
                  background: colors.accent.primary,
                  border: 'none',
                  borderRadius: radii.sm,
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: `0 0 24px ${colors.accent.glow}`,
                  transition: 'all 0.15s ease',
                  fontFamily: typography.families.sans,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.accent.hover; e.currentTarget.style.boxShadow = `0 0 32px ${colors.accent.glow}` }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.accent.primary; e.currentTarget.style.boxShadow = `0 0 24px ${colors.accent.glow}` }}
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
