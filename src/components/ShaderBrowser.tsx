import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore } from '../state/stores'
import { SHADER_LIBRARY, searchShaders } from '../shaders/library'
import { ShaderDefinition, ShaderCategory, CATEGORY_LABELS } from '../utils/types'
import { getShaderPreviewManager } from '../renderer/ShaderPreviewManager'
import { colors, typography, spacing, radii, animation } from '../ui/tokens'

const CATEGORIES: (ShaderCategory | 'all' | 'favorites' | 'recent')[] = [
  'all', 'fractals', 'vj', 'geometric', 'liquid', 'cosmic', 'synthwave', 'abstract', 'minimal', 'particle', 'favorites', 'recent',
]

const CATEGORY_ICONS: Record<string, string> = {
  all: '◈', fractals: '✦', vj: '◎', geometric: '◇', liquid: '≈',
  cosmic: '✧', synthwave: '▶', abstract: '◆', minimal: '○', particle: '∴',
  favorites: '★', recent: '◷',
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  fractals: 'linear-gradient(135deg, #1a1033 0%, #2d1b4e 45%, #1e1a3a 100%)',
  vj: 'linear-gradient(135deg, #0f1a2e 0%, #1a2a4a 45%, #1e293b 100%)',
  geometric: 'linear-gradient(135deg, #1a2332 0%, #1e3a3a 45%, #0f2e2e 100%)',
  liquid: 'linear-gradient(135deg, #0e1e2e 0%, #143a4a 45%, #0f2e3a 100%)',
  cosmic: 'linear-gradient(135deg, #1a1033 0%, #2d1b5e 45%, #1e1033 100%)',
  synthwave: 'linear-gradient(135deg, #2d1033 0%, #4a1a3a 45%, #2e0f2e 100%)',
  abstract: 'linear-gradient(135deg, #1a1a2e 0%, #2a1a3a 45%, #1e1e32 100%)',
  minimal: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 45%, #1e1e1e 100%)',
  particle: 'linear-gradient(135deg, #0f1f33 0%, #1a2e4a 45%, #0e1a2e 100%)',
  all: 'linear-gradient(135deg, #14141e 0%, #1e1e32 45%, #141428 100%)',
}

function getGradient(cat: string) {
  return CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.all
}

export function ShaderBrowser() {
  const browserOpen = useUIStore(s => s.browserOpen)
  const toggleBrowser = useUIStore(s => s.toggleBrowser)
  const activeShader = useShaderStore(s => s.activeShader)
  const setActiveShader = useShaderStore(s => s.setActiveShader)
  const favorites = useShaderStore(s => s.favorites)
  const recent = useShaderStore(s => s.recent)
  const toggleFavorite = useShaderStore(s => s.toggleFavorite)

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<ShaderCategory | 'all' | 'favorites' | 'recent'>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filteredShaders = useMemo(() => {
    let shaders = search ? searchShaders(search) : SHADER_LIBRARY
    if (activeCategory === 'favorites') {
      shaders = shaders.filter(s => favorites.includes(s.id))
    } else if (activeCategory === 'recent') {
      const ordered = recent
        .map(id => SHADER_LIBRARY.find(s => s.id === id))
        .filter(Boolean) as ShaderDefinition[]
      // When searching, filter recent by search as well
      shaders = search ? ordered.filter(s => shaders.some(x => x.id === s.id)) : ordered
    } else if (activeCategory !== 'all') {
      shaders = shaders.filter(s => s.category === activeCategory)
    }
    return shaders
  }, [search, activeCategory, favorites, recent])

  // Per-category counts for tabs
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: SHADER_LIBRARY.length }
    for (const cat of CATEGORIES) {
      if (cat === 'all' || cat === 'favorites' || cat === 'recent') continue
      counts[cat] = SHADER_LIBRARY.filter(s => s.category === cat).length
    }
    counts.favorites = favorites.length
    counts.recent = recent.length
    return counts
  }, [favorites, recent])

  useEffect(() => {
    if (browserOpen && filteredShaders.length > 0) {
      const manager = getShaderPreviewManager()
      manager.enqueue(filteredShaders)
    }
  }, [browserOpen, filteredShaders])

  // Autofocus search on open
  useEffect(() => {
    if (browserOpen) {
      const t = setTimeout(() => searchRef.current?.focus(), 150)
      return () => clearTimeout(t)
    }
  }, [browserOpen])

  return (
    <AnimatePresence>
      {browserOpen && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={animation.spring.panel}
          style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            width: '460px', maxWidth: '92vw',
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
            padding: `16px 16px 12px`,
            borderBottom: `1px solid ${colors.surface.secondary}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: typography.families.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.text.primary,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>Shader Library</span>
                <span style={{
                  fontSize: 10,
                  color: colors.text.tertiary,
                  fontFamily: typography.families.mono,
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  padding: '2px 6px',
                  borderRadius: radii.xs,
                  fontWeight: 500,
                }}>{filteredShaders.length !== SHADER_LIBRARY.length ? `${filteredShaders.length}/${SHADER_LIBRARY.length}` : SHADER_LIBRARY.length}</span>
              </div>
              <button
                onClick={toggleBrowser}
                aria-label="Close shader library"
                style={{
                  padding: '5px 10px',
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  borderRadius: radii.xs,
                  color: colors.text.tertiary,
                  fontSize: 10,
                  fontFamily: typography.families.mono,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.surface.hover; e.currentTarget.style.color = colors.text.secondary; e.currentTarget.style.borderColor = colors.borderHover }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.surface.primary; e.currentTarget.style.color = colors.text.tertiary; e.currentTarget.style.borderColor = colors.surface.secondary }}
              >
                <span>ESC</span>
                <span style={{ opacity: 0.4 }}>×</span>
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: colors.text.disabled, fontSize: 12, pointerEvents: 'none',
              }}>⌕</span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search shaders…"
                aria-label="Search shaders"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape' && search) { e.stopPropagation(); setSearch('') } }}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '8px 32px 8px 30px',
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  borderRadius: radii.sm,
                  color: colors.text.primary,
                  fontSize: 12,
                  fontFamily: typography.families.sans,
                  outline: 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.10)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onBlur={e => { e.currentTarget.style.borderColor = colors.surface.secondary; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = colors.surface.primary }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: colors.surface.secondary,
                    borderRadius: radii.xs,
                    color: colors.text.tertiary, fontSize: 12, cursor: 'pointer',
                    border: 'none',
                  }}
                >×</button>
              )}
            </div>

            {/* Active filter chips */}
            {(search || activeCategory !== 'all') && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {search && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 8px',
                    background: colors.accent.subtle,
                    border: `1px solid ${colors.accent.glow.replace('0.4', '0.2')}`,
                    borderRadius: 20,
                    fontSize: 10, fontFamily: typography.families.mono,
                    color: colors.accent.hover,
                  }}>
                    “{search}”
                    <button onClick={() => setSearch('')} style={{ color: colors.accent.hover, fontSize: 11, opacity: 0.7, cursor: 'pointer' }}>×</button>
                  </span>
                )}
                {activeCategory !== 'all' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 8px',
                    background: colors.surface.secondary,
                    border: `1px solid ${colors.surface.secondary}`,
                    borderRadius: 20,
                    fontSize: 10, fontFamily: typography.families.mono,
                    color: colors.text.secondary,
                  }}>
                    {CATEGORY_ICONS[activeCategory]} {CATEGORY_LABELS[activeCategory as ShaderCategory] || activeCategory}
                    <button onClick={() => setActiveCategory('all')} style={{ color: colors.text.tertiary, fontSize: 11, cursor: 'pointer' }}>×</button>
                  </span>
                )}
                <button
                  onClick={() => { setSearch(''); setActiveCategory('all') }}
                  style={{
                    fontSize: 10, fontFamily: typography.families.mono,
                    color: colors.text.disabled, cursor: 'pointer',
                    textDecoration: 'underline', textUnderlineOffset: 2,
                  }}
                >Clear all</button>
              </div>
            )}
          </div>

          {/* Category tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: `8px 12px`,
            overflowX: 'auto', overflowY: 'hidden',
            borderBottom: `1px solid ${colors.surface.secondary}`,
            flexShrink: 0,
            minWidth: 0,
            scrollbarWidth: 'thin' as any,
            // Fade edges for scroll affordance
            maskImage: 'linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)',
          }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat
              const icon = CATEGORY_ICONS[cat] || '◈'
              const count = categoryCounts[cat] ?? 0
              const isEmpty = cat !== 'all' && count === 0
              return (
                <button
                  key={cat}
                  onClick={() => !isEmpty && setActiveCategory(cat)}
                  disabled={isEmpty}
                  aria-pressed={isActive}
                  title={isEmpty ? 'No shaders in this category' : `${count} shader${count !== 1 ? 's' : ''}`}
                  style={{
                    padding: '6px 10px',
                    background: isActive ? colors.accent.subtle : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(99,102,241,0.22)' : 'transparent'}`,
                    borderRadius: radii.xs,
                    color: isEmpty ? colors.text.disabled : isActive ? colors.accent.hover : colors.text.tertiary,
                    fontSize: 11,
                    fontFamily: typography.families.sans,
                    fontWeight: isActive ? 600 : 400,
                    cursor: isEmpty ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', gap: 5,
                    opacity: isEmpty ? 0.45 : 1,
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    if (!isActive && !isEmpty) {
                      e.currentTarget.style.background = colors.surface.primary
                      e.currentTarget.style.color = colors.text.secondary
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive && !isEmpty) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = colors.text.tertiary
                    }
                  }}
                >
                  <span style={{ fontSize: 10, opacity: isActive ? 1 : 0.7 }}>{icon}</span>
                  <span>{cat === 'all' ? 'All' : cat === 'favorites' ? 'Favorites' : cat === 'recent' ? 'Recent' : (CATEGORY_LABELS[cat as ShaderCategory] || cat)}</span>
                  <span style={{
                    fontSize: 10,
                    fontFamily: typography.families.mono,
                    background: isActive ? 'rgba(99,102,241,0.18)' : colors.surface.primary,
                    border: `1px solid ${isActive ? 'rgba(99,102,241,0.18)' : colors.surface.secondary}`,
                    padding: '1px 4px',
                    borderRadius: 4,
                    minWidth: 18, textAlign: 'center',
                    color: isActive ? colors.accent.hover : colors.text.disabled,
                  }}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* Shader grid */}
          <div ref={gridRef} style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            padding: `12px 12px`,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
            alignContent: 'start',
            gridAutoRows: 'minmax(148px, auto)',
          }}>
            {filteredShaders.length > 0 ? (
              filteredShaders.map((shader, i) => (
                <ShaderCard
                  key={shader.id}
                  shader={shader}
                  isActive={activeShader?.id === shader.id}
                  isFavorite={favorites.includes(shader.id)}
                  isHovered={hoveredId === shader.id}
                  onClick={() => setActiveShader(shader)}
                  onToggleFavorite={() => toggleFavorite(shader.id)}
                  onHover={() => setHoveredId(shader.id)}
                  onLeave={() => setHoveredId(null)}
                  index={i}
                />
              ))
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: `40px 20px`,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12, fontSize: 18, color: colors.text.disabled,
                }}>
                  {activeCategory === 'favorites' ? '★' : activeCategory === 'recent' ? '◷' : '◈'}
                </div>
                <div style={{
                  fontFamily: typography.families.sans,
                  fontSize: 13, fontWeight: 600,
                  color: colors.text.secondary,
                  marginBottom: 4,
                }}>
                  {activeCategory === 'favorites' && !search && 'No favorites yet'}
                  {activeCategory === 'favorites' && search && `No favorites match “${search}”`}
                  {activeCategory === 'recent' && !search && 'No recent shaders'}
                  {activeCategory === 'recent' && search && `No recent match for “${search}”`}
                  {activeCategory !== 'favorites' && activeCategory !== 'recent' && search && `No results for “${search}”`}
                  {activeCategory !== 'favorites' && activeCategory !== 'recent' && !search && 'No shaders found'}
                </div>
                <div style={{
                  fontSize: 11, color: colors.text.tertiary,
                  lineHeight: '15px', maxWidth: 260, marginBottom: 14,
                }}>
                  {activeCategory === 'favorites' && 'Tap ★ on any card to save it here for quick access.'}
                  {activeCategory === 'recent' && 'Shaders you open will appear here.'}
                  {activeCategory !== 'favorites' && activeCategory !== 'recent' && search && `Try a different search or clear filters to see all ${SHADER_LIBRARY.length} shaders.`}
                  {activeCategory !== 'favorites' && activeCategory !== 'recent' && !search && 'Try adjusting your filters.'}
                </div>
                <button
                  onClick={() => { setSearch(''); setActiveCategory('all') }}
                  style={{
                    padding: '6px 12px',
                    background: colors.accent.subtle,
                    border: `1px solid rgba(99,102,241,0.22)`,
                    borderRadius: radii.sm,
                    color: colors.accent.hover,
                    fontSize: 11, fontWeight: 500,
                    fontFamily: typography.families.sans,
                    cursor: 'pointer',
                  }}
                >
                  {search || activeCategory !== 'all' ? 'Clear filters' : 'Browse all shaders'}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: `8px 12px`,
            borderTop: `1px solid ${colors.surface.secondary}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0,
            background: 'rgba(10,10,14,0.4)',
          }}>
            <span style={{
              fontSize: 10,
              color: colors.text.disabled,
              fontFamily: typography.families.mono,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.state.success, boxShadow: `0 0 6px ${colors.state.success}` }} />
              {filteredShaders.length} of {SHADER_LIBRARY.length}
            </span>
            <span style={{
              fontSize: 10,
              color: colors.text.disabled,
              fontFamily: typography.families.mono,
              letterSpacing: '0.02em',
            }}>
              B close · Click to apply · ★ to save
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ShaderCard({
  shader, isActive, isFavorite, isHovered, onClick, onToggleFavorite, onHover, onLeave, index
}: {
  shader: ShaderDefinition
  isActive: boolean
  isFavorite: boolean
  isHovered: boolean
  onClick: () => void
  onToggleFavorite: () => void
  onHover: () => void
  onLeave: () => void
  index: number
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const manager = getShaderPreviewManager()
    const cached = manager.getCached(shader.id)
    if (cached) {
      setPreviewUrl(cached)
      return
    }
    const unsub = manager.subscribe(shader.id, (url) => {
      setPreviewUrl(url)
    })
    return unsub
  }, [shader.id])

  const tierInfo = {
    low: { color: colors.state.success, label: 'Low' },
    medium: { color: colors.state.warning, label: 'Med' },
    high: { color: colors.state.error, label: 'High' },
    ultra: { color: '#A855F7', label: 'Ultra' },
  }[shader.performanceTier] || { color: colors.text.disabled, label: shader.performanceTier }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: Math.min(index * 0.015, 0.2), duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      title={`${shader.name} — ${shader.description}`}
      style={{
        minHeight: 148,
        background: isActive
          ? 'rgba(99,102,241,0.10)'
          : isHovered ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.028)',
        border: `1px solid ${isActive ? 'rgba(99,102,241,0.32)' : isHovered ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: radii.md,
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        transform: isHovered ? 'translateY(-1px)' : 'none',
        boxShadow: isActive
          ? '0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
          : isHovered
            ? '0 4px 16px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)'
            : 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Preview area */}
      <div style={{
        height: 92,
        flexShrink: 0,
        background: previewUrl
          ? `url(${previewUrl}) center / cover no-repeat`
          : getGradient(shader.category),
        position: 'relative',
        overflow: 'hidden',
        borderBottom: `1px solid ${colors.surface.secondary}`,
      }}>
        {/* Category-tinted fallback icon */}
        {!previewUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            background: getGradient(shader.category),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 26,
              color: 'rgba(255,255,255,0.14)',
              fontWeight: 700,
              filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.5))',
            }}>{CATEGORY_ICONS[shader.category] || shader.name.charAt(0)}</span>
          </div>
        )}

        {/* Top inner highlight */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Bottom gradient for depth */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Shimmer */}
        {!previewUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.6s infinite',
          }} />
        )}

        {/* Tier dot */}
        <div
          title={`Performance: ${tierInfo.label}`}
          style={{
            position: 'absolute', top: 7, left: 7,
            width: 8, height: 8, borderRadius: '50%',
            background: tierInfo.color,
            boxShadow: `0 0 8px ${tierInfo.color}`,
            border: '1.5px solid rgba(0,0,0,0.4)',
          }}
        />

        {/* Active checkmark */}
        {isActive && (
          <div style={{
            position: 'absolute', top: 6, left: 20,
            padding: '1px 5px',
            background: 'rgba(99,102,241,0.9)',
            borderRadius: 4,
            fontSize: 8, fontWeight: 700,
            fontFamily: typography.families.mono,
            color: '#fff',
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
          }}>ACTIVE</div>
        )}

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            position: 'absolute', top: 5, right: 5,
            width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isFavorite ? 'rgba(99,102,241,0.85)' : 'rgba(0,0,0,0.42)',
            border: `1px solid ${isFavorite ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: radii.xs,
            color: isFavorite ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 11, cursor: 'pointer',
            transition: 'all 0.15s ease',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => {
            if (!isFavorite) { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)' }
          }}
          onMouseLeave={e => {
            if (!isFavorite) { e.currentTarget.style.background = 'rgba(0,0,0,0.42)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }
          }}
        >
          {isFavorite ? '★' : '☆'}
        </button>

        {/* Active bottom bar */}
        {isActive && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 2,
            background: 'linear-gradient(90deg, #6366F1, #A855F7)',
          }} />
        )}
      </div>

      {/* Info */}
      <div style={{
        flex: 1,
        padding: `10px 10px 8px`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        minHeight: 0,
      }}>
        <div
          title={shader.name}
          style={{
            fontFamily: typography.families.sans,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#fff' : colors.text.primary,
            lineHeight: '16px',
            letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 4,
          }}
        >
          {shader.name}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 10,
          fontFamily: typography.families.mono,
          minWidth: 0,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            color: isActive ? colors.accent.hover : colors.text.tertiary,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 9, opacity: 0.7 }}>{CATEGORY_ICONS[shader.category]}</span>
            {CATEGORY_LABELS[shader.category] || shader.category}
          </span>
          <span style={{ width: 2, height: 2, borderRadius: '50%', background: colors.text.disabled, opacity: 0.5, flexShrink: 0 }} />
          <span style={{
            color: colors.text.tertiary, opacity: 0.7,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            minWidth: 0,
          }}>{shader.tags[0]}</span>
          <span style={{
            marginLeft: 'auto',
            flexShrink: 0,
            width: 6, height: 6, borderRadius: '50%',
            background: tierInfo.color, opacity: 0.9,
            boxShadow: `0 0 4px ${tierInfo.color}`,
          }} title={tierInfo.label} />
        </div>
      </div>
    </motion.div>
  )
}
