import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore } from '../state/stores'
import { SHADER_LIBRARY } from '../shaders/library'
import { ShaderCategory, ShaderDefinition, CATEGORY_LABELS } from '../utils/types'
import { colors, typography, spacing, radii } from '../ui/tokens'
import { useShaderPreview, requestPreviews } from '../hooks/useShaderPreview'

const CATEGORIES: (ShaderCategory | 'favorites' | 'recent')[] = [
  'favorites', 'recent', 'fractals', 'vj', 'geometric', 'liquid',
  'cosmic', 'synthwave', 'abstract', 'minimal', 'particle', 'milkdrop',
]

const CATEGORY_ICONS: Record<string, string> = {
  fractals: '✦', vj: '◎', geometric: '◇', liquid: '≈',
  cosmic: '✧', synthwave: '▶', abstract: '◆', minimal: '○', particle: '∴',
  favorites: '★', recent: '◷', milkdrop: '≋',
}

const CATEGORY_GRADIENTS: Record<string, [string, string, string]> = {
  fractals: ['#312e81', '#4338ca', '#6366f1'],
  vj: ['#1e1b4b', '#581c87', '#7c3aed'],
  geometric: ['#0c4a6e', '#0369a1', '#0ea5e9'],
  liquid: ['#164e63', '#0891b2', '#22d3ee'],
  cosmic: ['#3b0764', '#9333ea', '#c084fc'],
  synthwave: ['#831843', '#db2777', '#f472b6'],
  abstract: ['#1c1917', '#44403c', '#a8a29e'],
  minimal: ['#18181b', '#27272a', '#71717a'],
  particle: ['#14532d', '#16a34a', '#4ade80'],
  milkdrop: ['#1a1a2e', '#16213e', '#0f3460'],
  favorites: ['#78350f', '#d97706', '#fbbf24'],
  recent: ['#1e293b', '#475569', '#94a3b8'],
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c } else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c } else if (h < 300) { r = x; b = c } else { r = c; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function getShaderGradient(shader: ShaderDefinition): string {
  const grad = CATEGORY_GRADIENTS[shader.category] || CATEGORY_GRADIENTS.abstract
  const hash = hashString(shader.id)
  const hueShift = (hash % 60) - 30
  const [h1, s1, l1] = hexToHsl(grad[0])
  const [h2, s2, l2] = hexToHsl(grad[1])
  const [h3, s3, l3] = hexToHsl(grad[2])
  return `linear-gradient(135deg, ${hslToHex(h1 + hueShift, s1, l1)}, ${hslToHex(h2 + hueShift, s2, l2)}, ${hslToHex(h3 + hueShift, s3, l3)})`
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s * 100, l * 100]
}

function CarouselCard({ shader, offset, isActive, isCenter, absOffset, onClick }: {
  shader: ShaderDefinition
  offset: number
  isActive: boolean
  isCenter: boolean
  absOffset: number
  onClick: () => void
}) {
  const previewUrl = useShaderPreview(shader.id)
  const angle = offset * ANGLE_STEP
  const scale = isCenter ? 1.08 : Math.max(0.65, 1 - absOffset * 0.12)
  const opacity = absOffset > 2 ? 0 : isCenter ? 1 : Math.max(0.2, 1 - absOffset * 0.25)
  const brightness = isCenter ? 1.0 : Math.max(0.4, 1 - absOffset * 0.15)

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        width: CARD_W,
        height: CARD_H,
        left: 0,
        top: 0,
        transformStyle: 'preserve-3d',
        transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
        opacity,
        filter: `brightness(${brightness})`,
        zIndex: 10 - absOffset,
        cursor: isCenter ? 'pointer' : 'default',
        borderRadius: radii.md,
        overflow: 'hidden',
        border: isActive
          ? `2px solid ${colors.accent.hover}`
          : isCenter
            ? `1px solid rgba(255,255,255,0.15)`
            : `1px solid rgba(255,255,255,0.05)`,
        boxShadow: isActive
          ? `0 0 24px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)`
          : isCenter
            ? `0 8px 32px rgba(0,0,0,0.5)`
            : `0 4px 16px rgba(0,0,0,0.4)`,
        transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.4s ease, filter 0.4s ease',
        willChange: 'transform',
      }}
    >
      <div style={{
        width: '100%', height: '70%',
        background: previewUrl ? 'rgba(0,0,0,0.9)' : getShaderGradient(shader),
        position: 'relative',
        overflow: 'hidden',
      }}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={shader.name}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
            draggable={false}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: getShaderGradient(shader),
          }} />
        )}
        {isActive && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.15), transparent 70%)',
          }} />
        )}
      </div>

      <div style={{
        height: '30%', padding: '6px 8px',
        background: 'rgba(8,8,14,0.95)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 10, fontFamily: typography.families.sans,
          color: colors.text.primary, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {shader.name}
        </div>
        <div style={{
          fontSize: 8, fontFamily: typography.families.mono,
          color: colors.text.disabled, marginTop: 2,
        }}>
          {CATEGORY_ICONS[shader.category]} {shader.category}
        </div>
      </div>
    </div>
  )
}

const VISIBLE_COUNT = 9
const CARD_W = 140
const CARD_H = 180
const RADIUS = 320
const ANGLE_STEP = 360 / VISIBLE_COUNT

export function ShaderCarousel() {
  const carouselOpen = useUIStore(s => s.carouselOpen)
  const toggleCarousel = useUIStore(s => s.toggleCarousel)
  const activeShader = useShaderStore(s => s.activeShader)
  const setActiveShader = useShaderStore(s => s.setActiveShader)
  const favorites = useShaderStore(s => s.favorites)
  const recent = useShaderStore(s => s.recent)

  const [category, setCategory] = useState<ShaderCategory | 'favorites' | 'recent'>('favorites')
  const [centerIndex, setCenterIndex] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)

  const filteredShaders = useMemo(() => {
    if (category === 'favorites') return SHADER_LIBRARY.filter(s => favorites.includes(s.id))
    if (category === 'recent') return SHADER_LIBRARY.filter(s => recent.includes(s.id))
    if (category === 'milkdrop') return SHADER_LIBRARY.filter(s => s.tags.includes('milkdrop'))
    return SHADER_LIBRARY.filter(s => s.category === category)
  }, [category, favorites, recent])

  const total = filteredShaders.length

  const selectShader = useCallback((shader: ShaderDefinition) => {
    setActiveShader(shader)
  }, [setActiveShader])

  const goLeft = useCallback(() => {
    setCenterIndex(prev => (total > 0 ? (prev - 1 + total) % total : 0))
  }, [total])

  const goRight = useCallback(() => {
    setCenterIndex(prev => (total > 0 ? (prev + 1) % total : 0))
  }, [total])

  useEffect(() => {
    if (!carouselOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goLeft()
      else if (e.key === 'ArrowRight') goRight()
      else if (e.key === 'Escape') toggleCarousel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [carouselOpen, goLeft, goRight, toggleCarousel])

  useEffect(() => {
    if (!carouselOpen) return
    const vp = viewportRef.current
    if (!vp) return
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        if (e.deltaX > 0) goRight(); else goLeft()
      } else if (Math.abs(e.deltaY) > 5) {
        e.preventDefault()
        if (e.deltaY > 0) goRight(); else goLeft()
      }
    }
    vp.addEventListener('wheel', handleWheel, { passive: false })
    return () => vp.removeEventListener('wheel', handleWheel)
  }, [carouselOpen, goLeft, goRight])

  const getVisibleCards = useMemo(() => {
    if (total === 0) return []
    const half = Math.floor(VISIBLE_COUNT / 2)
    const cards: { shader: ShaderDefinition; offset: number; index: number }[] = []
    const seen = new Set<string>()
    for (let i = -half; i <= half; i++) {
      const idx = (centerIndex + i + total) % total
      const shader = filteredShaders[idx]
      if (!shader || seen.has(shader.id)) continue
      seen.add(shader.id)
      cards.push({ shader, offset: i, index: idx })
    }
    return cards
  }, [centerIndex, filteredShaders, total])

  useEffect(() => {
    if (!carouselOpen || getVisibleCards.length === 0) return
    requestPreviews(getVisibleCards.map(c => c.shader), true)
  }, [carouselOpen, getVisibleCards])

  return (
    <AnimatePresence>
      {carouselOpen && (
        <motion.div
          initial={{ x: -440, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -440, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            left: 56,
            top: 0,
            bottom: 0,
            width: 420,
            zIndex: 18,
            background: 'rgba(8,8,14,0.92)',
            backdropFilter: 'blur(24px) saturate(1.1)',
            borderRight: `1px solid ${colors.surface.secondary}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: `${spacing.scale[3]}px ${spacing.scale[4]}px`,
            borderBottom: `1px solid ${colors.surface.secondary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: 12, fontFamily: typography.families.mono,
              color: colors.text.secondary, fontWeight: 600, letterSpacing: '0.04em',
            }}>
              SHADER CAROUSEL
            </span>
            <button
              onClick={toggleCarousel}
              style={{
                width: 24, height: 24, background: 'transparent', border: 'none',
                color: colors.text.disabled, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: radii.xs,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = colors.text.secondary }}
              onMouseLeave={e => { e.currentTarget.style.color = colors.text.disabled }}
            >
              ×
            </button>
          </div>

          {/* Category pills */}
          <div style={{
            display: 'flex', gap: 4, padding: `${spacing.scale[2]}px ${spacing.scale[3]}px`,
            overflowX: 'auto', overflowY: 'hidden', flexShrink: 0,
          }}>
            {CATEGORIES.map(cat => {
              const active = category === cat
              return (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setCenterIndex(0) }}
                  style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 10,
                    fontFamily: typography.families.mono, fontWeight: 500,
                    cursor: 'pointer', whiteSpace: 'nowrap', border: 'none',
                    transition: 'all 0.15s ease',
                    background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    color: active ? colors.accent.hover : colors.text.disabled,
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                >
                  {CATEGORY_ICONS[cat]} {(CATEGORY_LABELS as Record<string, string>)[cat] || cat}
                </button>
              )
            })}
          </div>

          {/* 3D Carousel viewport */}
          <div
            ref={viewportRef}
            style={{
              flex: 1,
              perspective: 1200,
              perspectiveOrigin: '50% 50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              minHeight: 240,
            }}
          >
            {/* Left arrow */}
            <button
              onClick={goLeft}
              style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.06)', color: colors.text.secondary,
                fontSize: 16, cursor: 'pointer', zIndex: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            >
              ‹
            </button>

            {/* Carousel ring */}
            <div style={{
              width: CARD_W,
              height: CARD_H,
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
            }}>
              {getVisibleCards.map(({ shader, offset }) => {
                const isActive = activeShader?.id === shader.id
                const isCenter = offset === 0
                const absOffset = Math.abs(offset)

                return (
                  <CarouselCard
                    key={shader.id}
                    shader={shader}
                    offset={offset}
                    isActive={isActive}
                    isCenter={isCenter}
                    absOffset={absOffset}
                    onClick={() => {
                      if (isCenter) selectShader(shader)
                      else setCenterIndex(prev => (offset > 0 ? (prev + 1) % total : (prev - 1 + total) % total))
                    }}
                  />
                )
              })}
            </div>

            {/* Right arrow */}
            <button
              onClick={goRight}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.06)', color: colors.text.secondary,
                fontSize: 16, cursor: 'pointer', zIndex: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            >
              ›
            </button>
          </div>

          {/* Footer */}
          <div style={{
            padding: `${spacing.scale[2]}px ${spacing.scale[4]}px`,
            borderTop: `1px solid ${colors.surface.secondary}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: 9, fontFamily: typography.families.mono,
              color: colors.text.disabled,
            }}>
              {total} shaders
            </span>
            <span style={{
              fontSize: 9, fontFamily: typography.families.mono,
              color: colors.text.disabled,
            }}>
              ← → navigate &nbsp; Enter select
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
