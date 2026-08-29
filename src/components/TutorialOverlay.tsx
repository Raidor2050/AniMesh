import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore } from '../state/stores'
import { markTutorialSeen } from '../state/tutorial'
import { colors, typography, radii, spacing } from '../ui/tokens'

interface Hotspot {
  x: number
  y: number
  w: number
  h: number
  label: string
}

type HotspotFn = (vw: number, vh: number) => Hotspot

interface TutorialStep {
  id: string
  title: string
  kicker: string
  blurb: string
  keys: string[]
  accent: string
  hotspot?: HotspotFn
  diagram?: 'immersiveBar'
}

const VW = () => typeof window !== 'undefined' ? window.innerWidth : 1280
const VH = () => typeof window !== 'undefined' ? window.innerHeight : 800

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

const connectAudio: HotspotFn = (vw, vh) => ({
  x: clamp(vw - 16 - 204, 8, Math.max(8, vw - 220)), y: clamp(vh - 16 - 46, 8, vh - 60),
  w: 204, h: 46, label: 'Connect Audio Source',
})

const shaderName: HotspotFn = (vw) => ({
  x: vw / 2 - 140, y: 12, w: 280, h: 26, label: 'Active shader',
})

const libraryBtn: HotspotFn = (_vw, vh) => ({
  x: 12, y: clamp(vh / 2 - 24, 70, vh - 130), w: 42, h: 42, label: 'Library',
})

const fullscreenBtn: HotspotFn = (_vw, vh) => ({
  x: 12, y: clamp(vh / 2 + 24, 118, vh - 82), w: 42, h: 42, label: 'Fullscreen',
})

const streamBox: HotspotFn = (vw, _vh) => ({
  x: Math.max(64, vw - 252), y: 52, w: 244, h: 150, label: 'Audio Stream box',
})

const panelsTab: HotspotFn = (vw, vh) => ({
  x: vw - 44, y: clamp(vh / 2 - 30, 70, vh - 96), w: 32, h: 60, label: 'Panels',
})

const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AniMesh',
    kicker: 'You are in control',
    blurb:
      'Every control has a button, a keyboard shortcut, or both. This quick guide highlights where everything lives, one piece at a time — like a game’s controller map.',
    keys: ['Space', 'F', 'Esc'],
    accent: '#818CF8',
  },
  {
    id: 'connect',
    title: 'Connect Audio',
    kicker: 'The visual engine needs a signal',
    blurb:
      'Tap “Connect Audio Source” in the bottom-right to feed the visuals — pick Demo (synthetic), Mic, System audio, or a File. Nothing plays until a source is connected.',
    keys: ['D'],
    accent: '#22C55E',
    hotspot: connectAudio,
  },
  {
    id: 'shader',
    title: 'Know what you are watching',
    kicker: 'Top bar',
    blurb:
      'The active shader’s name is always displayed in the top bar, so changes never go unnoticed. Hit Space to shuffle to a random visual.',
    keys: ['Space', '[', ']'],
    accent: '#818CF8',
    hotspot: shaderName,
  },
  {
    id: 'library',
    title: 'The Library',
    kicker: 'Browse 1000+ visuals',
    blurb:
      'The glowing book icon on the left opens a searchable Library of shaders and pattern objects. Keyboard shortcuts work from anywhere.',
    keys: ['?', '[' , ']'],
    accent: '#A855F7',
    hotspot: libraryBtn,
  },
  {
    id: 'fullscreen',
    title: 'Fullscreen Mode',
    kicker: 'Go immersive',
    blurb:
      'Press F (or the expand button) to drop every panel and absorb the visuals full-screen. The visuals crossfade between every change.',
    keys: ['F'],
    accent: '#6366F1',
    hotspot: fullscreenBtn,
  },
  {
    id: 'stream',
    title: 'The Audio Stream Box',
    kicker: 'See the signal',
    blurb:
      'The top-right box visualizes the raw signal in 9 views picked from its dropdown — waveform streams, spectrums, bars, a peak meter and a vectorscope.',
    keys: [],
    accent: '#06B6D4',
    hotspot: streamBox,
  },
  {
    id: 'panels',
    title: 'Parameter & EQ Mapping',
    kicker: 'Right side',
    blurb:
      'The slim tab on the right edge toggles the Parameter box and the EQ Mapping box (P). every shader exposes live sliders and audio-reactive mappings.',
    keys: ['P'],
    accent: '#EC4899',
    hotspot: panelsTab,
  },
  {
    id: 'immersive',
    title: 'Inside Immersive Mode',
    kicker: 'The navigation deck',
    blurb:
      'Move the mouse to the screen edges to reveal the HUD. PREV / RANDOM / NEXT swap visuals, AUTO cycles on the beat (4 → 8 → 16 → 32), and HIDE NAV tucks the deck away into the bottom-right corner.',
    keys: ['←→', 'Space', 'AUTO'],
    accent: '#34D399',
    diagram: 'immersiveBar',
  },
  {
    id: 'legend',
    title: 'Every Shortcut',
    kicker: 'Reference card',
    blurb:
      'A cheat-sheet for all the hotkeys. Dare to go keyboard-only — everything is reachable.',
    keys: ['?'],
    accent: '#CBD5E1',
  },
]

const SHORTCUT_GROUPS: { group: string; items: { keys: string[]; label: string }[] }[] = [
  {
    group: 'Navigation',
    items: [
      { keys: ['Space'], label: 'Random visual' },
      { keys: ['[', ']'], label: 'Prev / Next shader' },
      { keys: ['←', '→'], label: 'Shuffle visuals (fullscreen)' },
    ],
  },
  {
    group: 'Audio',
    items: [
      { keys: ['D'], label: 'Toggle Demo audio' },
      { keys: ['T'], label: 'Tap BPM' },
      { keys: ['G'], label: 'Performance overlay' },
    ],
  },
  {
    group: 'Panels & Modes',
    items: [
      { keys: ['?'], label: 'Toggle Library' },
      { keys: ['N'], label: 'Create a shader' },
      { keys: ['F'], label: 'Fullscreen mode' },
      { keys: ['P'], label: 'Parameter + EQ panels' },
      { keys: ['H'], label: 'This controls guide' },
      { keys: ['Esc'], label: 'Close / exit' },
    ],
  },
  {
    group: 'Power',
    items: [
      { keys: ['⌘', 'K'], label: 'Command palette' },
      { keys: ['⌘', 'Z'], label: 'Undo changes' },
    ],
  },
]

function Kbd({ k }: { k: string }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 22, height: 20,
      padding: '0 6px',
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderBottomWidth: 2,
      borderRadius: 5,
      color: colors.text.secondary,
      fontFamily: typography.families.mono,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>{k}</kbd>
  )
}

export function TutorialOverlay() {
  const open = useUIStore(s => s.tutorialOpen)
  const toggleTutorial = useUIStore(s => s.toggleTutorial)
  const immersive = useUIStore(s => s.immersive)
  const reducedMotion = useUIStore(s => s.reducedMotion)
  const [stepIndex, setStepIndex] = useState(0)

  const step = STEPS[Math.min(stepIndex, STEPS.length - 1)]
  const [vw, setVw] = useState(VW())
  const [vh, setVh] = useState(VH())

  useEffect(() => {
    const onResize = () => { setVw(VW()); setVh(VH()) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Leave immersion if the user activates it mid-tour (canvas takes over).
  useEffect(() => {
    if (open && immersive) {
      markTutorialSeen()
      toggleTutorial()
    }
  }, [open, immersive, toggleTutorial])

  const close = () => {
    markTutorialSeen()
    toggleTutorial()
  }

  const next = () => {
    if (stepIndex >= STEPS.length - 1) { close(); return }
    setStepIndex(i => i + 1)
  }
  const prev = () => setStepIndex(i => Math.max(0, i - 1))

  useEffect(() => {
    if (!open) { setStepIndex(0); return }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close() }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex])

  if (!open) return null

  const hot = step.hotspot ? step.hotspot(vw, vh) : undefined
  const spotX = hot ? clamp(hot.x, 0, vw - hot.w) : 0
  const spotY = hot ? clamp(hot.y, 0, vh - hot.h) : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 60,
        background: 'rgba(2,4,14,0.55)',
        backdropFilter: 'blur(3px)',
        pointerEvents: 'auto',
      }}
      aria-label="Controls tutorial"
      role="dialog"
    >
      {/* Brand */}
      <div style={{
        position: 'absolute', top: 16, left: 20,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="18" height="18" viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 5px ${colors.accent.glow})` }}>
          <polygon points="50,10 85,75 15,75" fill="none" stroke="#6366F1" strokeWidth="5" strokeLinejoin="round" />
        </svg>
        <span style={{
          fontFamily: typography.families.mono,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          color: colors.text.secondary,
        }}>ANIMESH · CONTROL GUIDE</span>
        <span style={{
          fontFamily: typography.families.mono,
          fontSize: 9, letterSpacing: '0.06em',
          color: colors.text.disabled,
          marginLeft: spacing.scale[2],
        }}>{stepIndex + 1} / {STEPS.length}</span>
      </div>

      {/* Closed caption hint */}
      <div style={{
        position: 'absolute', top: 16, right: 20,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontFamily: typography.families.mono,
          fontSize: 9, color: colors.text.disabled,
        }}>ESC closes</span>
        <Kbd k="←" />
        <Kbd k="→" />
      </div>

      {/* Spotlight on the control being explained */}
      {hot && (
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              left: spotX - 6, top: spotY - 6,
              width: hot.w + 12, height: hot.h + 12,
              pointerEvents: 'none',
              zIndex: 61,
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              border: `1px solid ${step.accent}66`,
              borderRadius: radii.md,
              background: `${step.accent}14`,
              boxShadow: `0 0 0 1px ${step.accent}22, 0 0 40px ${step.accent}30, inset 0 0 30px ${step.accent}14`,
            }} />
            {/* Pulsing lasso ring */}
            <motion.div
              style={{
                position: 'absolute', inset: -8,
                border: `2px solid ${step.accent}`,
                borderRadius: radii.lg,
              }}
              animate={reducedMotion ? undefined : {
                scale: [1, 1.18, 1],
                opacity: [0.9, 0.15, 0.9],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span style={{
              position: 'absolute', top: -22, left: 0,
              fontFamily: typography.families.mono,
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              color: step.accent, textTransform: 'uppercase',
            }}>{hot.label}</span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Immersive deck schematic */}
      {step.diagram === 'immersiveBar' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute', bottom: 230, left: '50%', transform: 'translateX(-50%)',
            pointerEvents: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {[['‹', 'PREV'], ['∴', 'RANDOM'], ['›', 'NEXT'], ['⟳', 'AUTO']].map(([g, l]) => (
            <div key={l as string} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: radii.md,
            }}>
              <span style={{ fontSize: 16, color: '#34D399' }}>{g}</span>
              <span style={{
                fontFamily: typography.families.mono, fontSize: 10,
                color: colors.text.secondary, fontWeight: 600,
              }}>{l}</span>
            </div>
          ))}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: radii.md,
            marginLeft: 10,
          }}>
            <span style={{ fontSize: 14, color: colors.text.disabled }}>−</span>
            <span style={{
              fontFamily: typography.families.mono, fontSize: 10,
              color: colors.text.disabled, fontWeight: 600,
            }}>HIDE NAV</span>
          </div>
        </motion.div>
      )}

      {/* Bottom HUD card */}
      <div style={{
        position: 'absolute', bottom: clamp(vh * 0.06, 20, 64), left: '50%', transform: 'translateX(-50%)',
        width: 'min(680px, calc(100vw - 32px))',
        background: 'rgba(8,10,24,0.82)',
        border: `1px solid ${colors.surface.secondary}`,
        borderRadius: radii.lg,
        backdropFilter: 'blur(24px) saturate(1.2)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03)',
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ height: 2, background: colors.surface.secondary }}>
          <div style={{
            height: '100%', width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
            background: `linear-gradient(90deg, ${step.accent}, #a78bfa)`,
            transition: 'width 0.25s ease',
          }} />
        </div>

        <div style={{ padding: `${spacing.scale[4]}px ${spacing.scale[5]}px` }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6,
          }}>
            <span style={{
              fontFamily: typography.families.mono,
              fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
              color: step.accent, textTransform: 'uppercase',
            }}>{step.kicker}</span>
          </div>
          <h2 style={{
            margin: 0, marginBottom: 6,
            fontFamily: typography.families.sans,
            fontSize: 20, fontWeight: 700,
            color: colors.text.primary, letterSpacing: '-0.02em',
          }}>{step.title}</h2>
          <p style={{
            margin: 0, marginBottom: step.keys.length ? spacing.scale[3] : 0,
            fontFamily: typography.families.sans,
            fontSize: 13, lineHeight: '19px',
            color: colors.text.secondary,
          }}>{step.blurb}</p>

          {step.keys.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: typography.families.mono,
                fontSize: 9, color: colors.text.disabled,
                marginRight: 2,
              }}>shortcut</span>
              {step.keys.map(k => <Kbd key={k} k={k} />)}
            </div>
          )}

          {/* Legend step: full shortcut grid */}
          {step.id === 'legend' && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: spacing.scale[3], marginTop: spacing.scale[4],
            }}>
              {SHORTCUT_GROUPS.map(g => (
                <div key={g.group}>
                  <div style={{
                    fontFamily: typography.families.mono,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                    color: colors.text.disabled, textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>{g.group}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {g.items.map(it => (
                      <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 3, minWidth: 52 }}>
                          {it.keys.map(k => <Kbd key={k} k={k} />)}
                        </div>
                        <span style={{
                          fontFamily: typography.families.sans,
                          fontSize: 11, color: colors.text.secondary,
                        }}>{it.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step dots */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: spacing.scale[3],
        }}>
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStepIndex(i)}
              aria-label={`Step ${i + 1}: ${s.title}`}
              style={{
                width: i === stepIndex ? 18 : 6, height: 6,
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                background: i === stepIndex ? step.accent : 'rgba(255,255,255,0.14)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          borderTop: `1px solid ${colors.surface.secondary}`,
          background: 'rgba(0,0,0,0.25)',
          padding: `${spacing.scale[2]}px ${spacing.scale[4]}px`,
        }}>
          <button
            onClick={prev}
            disabled={stepIndex === 0}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${colors.surface.secondary}`,
              borderRadius: radii.sm,
              color: stepIndex === 0 ? colors.text.disabled : colors.text.secondary,
              fontFamily: typography.families.mono,
              fontSize: 11, fontWeight: 600,
              cursor: stepIndex === 0 ? 'default' : 'pointer',
            }}
          >‹ Prev</button>
          <button
            onClick={next}
            style={{
              padding: '6px 16px',
              background: `linear-gradient(135deg, ${step.accent}cc, #7c3aedcc)`,
              border: 'none',
              borderRadius: radii.sm,
              color: '#fff',
              fontFamily: typography.families.mono,
              fontSize: 11, fontWeight: 700,
              cursor: 'pointer',
            }}
          >{stepIndex >= STEPS.length - 1 ? 'Done ✕' : 'Next ›'}</button>
          <span style={{
            marginLeft: 'auto',
            fontFamily: typography.families.mono,
            fontSize: 9, color: colors.text.disabled,
          }}>
            {stepIndex >= STEPS.length - 1 ? 'Esc to close' : '← → to navigate'}
          </span>
          <button
            onClick={close}
            style={{
              padding: '6px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: radii.sm,
              color: colors.text.disabled,
              fontFamily: typography.families.mono,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >Skip</button>
        </div>
      </div>
    </motion.div>
  )
}