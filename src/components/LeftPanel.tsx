import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore } from '../state/stores'
import { ShaderCategory, Visual, CATEGORY_LABELS, TIER_COLORS } from '../utils/types'
import { VISUAL_LIBRARY, searchVisuals, onlyShaders, getVisualById } from '../shaders/visualLibrary'
import { LayoutGlyph } from '../objects/LayoutGlyph'
import { colors, typography, radii, animation } from '../ui/tokens'
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
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
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
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c } else { r = c; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
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
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60
    : max === g ? ((b - r) / d + 2) * 60
    : ((r - g) / d + 4) * 60
  return [h, s * 100, l * 100]
}

function shiftHue(hex: string, degrees: number): string {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h + degrees, s, l)
}

function shaderPreviewGradient(shader: Visual): string {
  const cat = CATEGORY_GRADIENTS[shader.category] || CATEGORY_GRADIENTS.abstract
  const h = hashString(shader.id)
  const hueShift = (h % 90) - 45
  const angle = 100 + (h % 160)
  const c1 = shiftHue(cat[0], hueShift)
  const c2 = shiftHue(cat[1], hueShift * 0.7)
  const c3 = shiftHue(cat[2], hueShift * 1.3)
  return `linear-gradient(${angle}deg, ${c1} 0%, ${c2} ${35 + (h % 20)}%, ${c3} 100%)`
}

function VisualCard({ visual, isActive, isFav, onSelect, onToggleFavorite }: {
  visual: Visual
  isActive: boolean
  isFav: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}) {
  const isSvgVisual = visual.kind === 'svg'
  const tierColor = TIER_COLORS[visual.performanceTier] || colors.text.disabled
  const gradient = useMemo(() => shaderPreviewGradient(visual), [visual])
  const previewUrl = useShaderPreview(visual.id)

  return (
    <button
      onClick={onSelect}
      title={visual.name}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isActive ? colors.accent.subtle : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isActive ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.04)'}`,
        borderRadius: radii.sm,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
        textAlign: 'left',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.transform = 'scale(1.02)'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      {/* Preview area */}
      <div style={{
        width: '100%',
        height: 56,
        background: previewUrl ? 'rgba(0,0,0,0.9)' : gradient,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={visual.name}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
            draggable={false}
          />
        ) : (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(circle at ${30 + (hashString(visual.id) % 40)}% ${20 + (hashString(visual.id + 'y') % 60)}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(circle at ${70 - (hashString(visual.id + 'x') % 40)}% ${80 - (hashString(visual.id + 'z') % 40)}%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
            }} />
            {isSvgVisual && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LayoutGlyph layout={visual.layout} size={26} opacity={0.6} />
              </div>
            )}
          </>
        )}
        {/* Tier badge */}
        <div style={{
          position: 'absolute', top: 4, left: 4,
          width: 5, height: 5, borderRadius: '50%',
          background: tierColor,
          boxShadow: `0 0 6px ${tierColor}`,
        }} />
        {/* Favorite star */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite() }}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            position: 'absolute', top: 2, right: 2,
            width: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
            border: 'none',
            borderRadius: 4,
            color: isFav ? '#fbbf24' : 'rgba(255,255,255,0.3)',
            fontSize: 9,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            opacity: isFav ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={e => { if (!isFav) e.currentTarget.style.opacity = '0' }}
        >★</button>
      </div>

      {/* Info area */}
      <div style={{
        padding: '5px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <span style={{
          fontFamily: typography.families.sans,
          fontSize: 10,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? colors.accent.hover : colors.text.secondary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          textAlign: 'left',
          lineHeight: '13px',
        }}>{visual.name}</span>
        {isSvgVisual && (
          <span style={{
            fontSize: 7,
            fontFamily: typography.families.mono,
            color: '#10B981',
            background: 'rgba(16,185,129,0.12)',
            padding: '0 3px',
            borderRadius: 3,
            flexShrink: 0,
          }}>SVG</span>
        )}
        {!isSvgVisual && visual.performanceTier === 'low' && (
          <span style={{
            fontSize: 7,
            fontFamily: typography.families.mono,
            color: colors.state.success,
            background: 'rgba(34,197,94,0.1)',
            padding: '0 3px',
            borderRadius: 3,
            flexShrink: 0,
          }}>L</span>
        )}
      </div>
    </button>
  )
}

interface CategorySectionProps {
  category: ShaderCategory | 'favorites' | 'recent'
  visuals: Visual[]
  activeVisual: Visual | null
  favorites: string[]
  onSelect: (visual: Visual) => void
  onToggleFavorite: (id: string) => void
  defaultOpen?: boolean
}

function CategorySection({ category, visuals, activeVisual, favorites, onSelect, onToggleFavorite, defaultOpen = false }: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const count = visuals.length
  const label = category === 'favorites' ? 'Favorites' : category === 'recent' ? 'Recent' : (CATEGORY_LABELS[category as ShaderCategory] || category)
  const icon = CATEGORY_ICONS[category] || '◈'

  useEffect(() => {
    if (open && visuals.length > 0) {
      requestPreviews(onlyShaders(visuals))
    }
  }, [open, visuals])

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 8px',
          background: 'transparent',
          border: 'none',
          borderRadius: radii.xs,
          cursor: 'pointer',
          transition: 'background 0.12s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = colors.surface.primary }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{
          fontSize: 9,
          color: colors.text.tertiary,
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          width: 10, flexShrink: 0,
          textAlign: 'center',
        }}>▸</span>
        <span style={{ fontSize: 10, opacity: 0.6, flexShrink: 0 }}>{icon}</span>
        <span style={{
          fontFamily: typography.families.sans,
          fontSize: 13, fontWeight: 500,
          color: colors.text.secondary,
          flex: 1, textAlign: 'left',
        }}>{label}</span>
        <span style={{
          fontFamily: typography.families.mono,
          fontSize: 10,
          color: colors.text.disabled,
          background: colors.surface.primary,
          padding: '1px 5px',
          borderRadius: 4,
          minWidth: 18, textAlign: 'center',
        }}>{count}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && count > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 5,
              padding: '4px 4px 6px',
            }}>
              {visuals.map(visual => (
                <VisualCard
                  key={visual.id}
                  visual={visual}
                  isActive={activeVisual?.id === visual.id}
                  isFav={favorites.includes(visual.id)}
                  onSelect={() => onSelect(visual)}
                  onToggleFavorite={() => onToggleFavorite(visual.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LeftPanel() {
  const browserOpen = useUIStore(s => s.browserOpen)
  const toggleBrowser = useUIStore(s => s.toggleBrowser)
  const activeVisual = useShaderStore(s => s.activeVisual)
  const setActiveVisual = useShaderStore(s => s.setActiveVisual)
  const favorites = useShaderStore(s => s.favorites)
  const recent = useShaderStore(s => s.recent)
  const toggleFavorite = useShaderStore(s => s.toggleFavorite)

  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const filteredVisuals = useMemo(() => {
    return search ? searchVisuals(search) : VISUAL_LIBRARY
  }, [search])

  const categoryVisuals = useMemo(() => {
    const map: Record<string, Visual[]> = {}
    for (const cat of CATEGORIES) {
      if (cat === 'favorites') {
        map[cat] = filteredVisuals.filter(v => favorites.includes(v.id))
      } else if (cat === 'recent') {
        const ordered = recent
          .map(id => getVisualById(id))
          .filter(Boolean) as Visual[]
        map[cat] = search ? ordered.filter(v => filteredVisuals.some(x => x.id === v.id)) : ordered
      } else if (cat === 'milkdrop') {
        map[cat] = filteredVisuals.filter(v => v.tags.includes('milkdrop'))
      } else {
        map[cat] = filteredVisuals.filter(v => v.category === cat)
      }
    }
    return map
  }, [filteredVisuals, favorites, recent, search])

  useEffect(() => {
    if (browserOpen) {
      const t = setTimeout(() => searchRef.current?.focus(), 150)
      return () => clearTimeout(t)
    }
  }, [browserOpen])

  useEffect(() => {
    if (search && filteredVisuals.length > 0) {
      requestPreviews(onlyShaders(filteredVisuals.slice(0, 50)))
    }
  }, [search, filteredVisuals])

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!browserOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        toggleBrowser()
      }
    }
    const t = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside)
    }, 100)
    return () => {
      clearTimeout(t)
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [browserOpen, toggleBrowser])

  return (
    <>
      <AnimatePresence>
      {browserOpen && (
        <motion.div
          ref={panelRef}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={animation.spring.panel}
          style={{
            position: 'absolute',
            top: 52, left: 0, bottom: 0,
            width: 340, maxWidth: '85vw',
            zIndex: 25,
            background: colors.surface.panel,
            backdropFilter: 'blur(32px) saturate(1.2)',
            borderRight: `1px solid ${colors.surface.secondary}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '10px 10px 8px',
            borderBottom: `1px solid ${colors.surface.secondary}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontFamily: typography.families.mono,
                  fontSize: 12, fontWeight: 600,
                  color: colors.text.primary,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                }}>Library</span>
                <span style={{
                  fontSize: 10,
                  color: colors.text.disabled,
                  fontFamily: typography.families.mono,
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  padding: '1px 5px',
                  borderRadius: radii.xs,
                  fontWeight: 500,
                }}>{VISUAL_LIBRARY.length}</span>
              </div>
              <button
                onClick={toggleBrowser}
                aria-label="Close library"
                style={{
                  padding: '3px 8px',
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  borderRadius: radii.xs,
                  color: colors.text.disabled,
                  fontSize: 9,
                  fontFamily: typography.families.mono,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.surface.hover; e.currentTarget.style.color = colors.text.secondary }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.surface.primary; e.currentTarget.style.color = colors.text.disabled }}
              >ESC</button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                color: colors.text.disabled, fontSize: 11, pointerEvents: 'none',
              }}>⌕</span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search shaders..."
                aria-label="Search shaders"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape' && search) { e.stopPropagation(); setSearch('') } }}
                style={{
                  width: '100%',
                  height: 34,
                  padding: '6px 28px 6px 26px',
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  borderRadius: radii.sm,
                  color: colors.text.primary,
                  fontSize: 13,
                  fontFamily: typography.families.sans,
                  outline: 'none',
                  transition: 'border-color 0.12s ease, box-shadow 0.12s ease',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.08)' }}
                onBlur={e => { e.currentTarget.style.borderColor = colors.surface.secondary; e.currentTarget.style.boxShadow = 'none' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
                    width: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: colors.surface.secondary,
                    borderRadius: radii.xs,
                    color: colors.text.tertiary, fontSize: 10, cursor: 'pointer',
                    border: 'none',
                  }}
                >×</button>
              )}
            </div>
          </div>

          {/* Category list with card grid */}
          <div style={{
            flex: 1, minHeight: 0,
            overflow: 'auto',
            padding: '4px 0',
            scrollbarWidth: 'thin' as any,
          }}>
            {search && filteredVisuals.length > 0 && (
              <div style={{
                padding: '2px 8px 6px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 5,
              }}>
                {filteredVisuals.slice(0, 50).map(visual => (
                  <VisualCard
                    key={visual.id}
                    visual={visual}
                    isActive={activeVisual?.id === visual.id}
                    isFav={favorites.includes(visual.id)}
                    onSelect={() => setActiveVisual(visual)}
                    onToggleFavorite={() => toggleFavorite(visual.id)}
                  />
                ))}
              </div>
            )}

            {!search && CATEGORIES.map(cat => (
              <CategorySection
                key={cat}
                category={cat}
                visuals={categoryVisuals[cat] || []}
                activeVisual={activeVisual}
                favorites={favorites}
                onSelect={setActiveVisual}
                onToggleFavorite={toggleFavorite}
                defaultOpen={cat === 'favorites' || cat === 'recent'}
              />
            ))}

            {/* Empty state */}
            {search && filteredVisuals.length === 0 && (
              <div style={{
                padding: '24px 12px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 11, color: colors.text.secondary,
                  fontFamily: typography.families.sans,
                  fontWeight: 500,
                  marginBottom: 4,
                }}>No results for "{search}"</div>
                <button
                  onClick={() => setSearch('')}
                  style={{
                    fontSize: 10, color: colors.accent.hover,
                    fontFamily: typography.families.sans,
                    background: 'none', border: 'none',
                    cursor: 'pointer', textDecoration: 'underline',
                  }}
                >Clear search</button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '6px 10px',
            borderTop: `1px solid ${colors.surface.secondary}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0,
            background: 'rgba(10,10,14,0.4)',
          }}>
            <span style={{
              fontSize: 10,
              color: colors.text.disabled,
              fontFamily: typography.families.mono,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 4, height: 4, borderRadius: '50%',
                background: colors.state.success,
                boxShadow: `0 0 4px ${colors.state.success}`,
              }} />
              {filteredVisuals.length}/{VISUAL_LIBRARY.length}
            </span>
            <span style={{
              fontSize: 10,
              color: colors.text.disabled,
              fontFamily: typography.families.mono,
            }}>ESC close · ★ save</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
