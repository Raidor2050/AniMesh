import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore } from '../state/stores'
import { SHADER_LIBRARY, searchShaders } from '../shaders/library'
import { ShaderCategory, ShaderDefinition, CATEGORY_LABELS, TIER_COLORS } from '../utils/types'
import { colors, typography, spacing, radii, animation } from '../ui/tokens'

const CATEGORIES: (ShaderCategory | 'favorites' | 'recent')[] = [
  'favorites', 'recent', 'fractals', 'vj', 'geometric', 'liquid',
  'cosmic', 'synthwave', 'abstract', 'minimal', 'particle',
]

const CATEGORY_ICONS: Record<string, string> = {
  fractals: '✦', vj: '◎', geometric: '◇', liquid: '≈',
  cosmic: '✧', synthwave: '▶', abstract: '◆', minimal: '○', particle: '∴',
  favorites: '★', recent: '◷',
}

interface CategorySectionProps {
  category: ShaderCategory | 'favorites' | 'recent'
  shaders: ShaderDefinition[]
  activeShader: ShaderDefinition | null
  favorites: string[]
  onSelect: (shader: ShaderDefinition) => void
  onToggleFavorite: (id: string) => void
  defaultOpen?: boolean
}

function CategorySection({ category, shaders, activeShader, favorites, onSelect, onToggleFavorite, defaultOpen = false }: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const count = shaders.length
  const label = category === 'favorites' ? 'Favorites' : category === 'recent' ? 'Recent' : (CATEGORY_LABELS[category as ShaderCategory] || category)
  const icon = CATEGORY_ICONS[category] || '◈'

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
          fontSize: 11, fontWeight: 500,
          color: colors.text.secondary,
          flex: 1, textAlign: 'left',
        }}>{label}</span>
        <span style={{
          fontFamily: typography.families.mono,
          fontSize: 9,
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
            <div style={{ padding: '2px 0 4px 0' }}>
              {shaders.map(shader => {
                const isActive = activeShader?.id === shader.id
                const isFav = favorites.includes(shader.id)
                const tierColor = TIER_COLORS[shader.performanceTier] || colors.text.disabled

                return (
                  <button
                    key={shader.id}
                    onClick={() => onSelect(shader)}
                    title={shader.name}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 8px 4px 24px',
                      background: isActive ? colors.accent.subtle : 'transparent',
                      border: 'none',
                      borderRadius: radii.xs,
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = colors.surface.primary
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                      background: tierColor,
                      boxShadow: `0 0 4px ${tierColor}`,
                    }} />
                    <span style={{
                      fontFamily: typography.families.sans,
                      fontSize: 11,
                      color: isActive ? colors.accent.hover : colors.text.secondary,
                      fontWeight: isActive ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      textAlign: 'left',
                    }}>{shader.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(shader.id) }}
                      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      style={{
                        width: 16, height: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 3,
                        color: isFav ? colors.accent.hover : colors.text.disabled,
                        fontSize: 9,
                        cursor: 'pointer',
                        flexShrink: 0,
                        opacity: isFav ? 1 : 0,
                        transition: 'opacity 0.12s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                      onMouseLeave={e => { if (!isFav) e.currentTarget.style.opacity = '0' }}
                    >★</button>
                  </button>
                )
              })}
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
  const activeShader = useShaderStore(s => s.activeShader)
  const setActiveShader = useShaderStore(s => s.setActiveShader)
  const favorites = useShaderStore(s => s.favorites)
  const recent = useShaderStore(s => s.recent)
  const toggleFavorite = useShaderStore(s => s.toggleFavorite)

  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const filteredShaders = useMemo(() => {
    return search ? searchShaders(search) : SHADER_LIBRARY
  }, [search])

  const categoryShaders = useMemo(() => {
    const map: Record<string, ShaderDefinition[]> = {}
    for (const cat of CATEGORIES) {
      if (cat === 'favorites') {
        map[cat] = filteredShaders.filter(s => favorites.includes(s.id))
      } else if (cat === 'recent') {
        const ordered = recent
          .map(id => SHADER_LIBRARY.find(s => s.id === id))
          .filter(Boolean) as ShaderDefinition[]
        map[cat] = search ? ordered.filter(s => filteredShaders.some(x => x.id === s.id)) : ordered
      } else {
        map[cat] = filteredShaders.filter(s => s.category === cat)
      }
    }
    return map
  }, [filteredShaders, favorites, recent, search])

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
            top: 52, left: 0, bottom: 0,
            width: 260, maxWidth: '85vw',
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
                  fontSize: 10, fontWeight: 600,
                  color: colors.text.primary,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                }}>Library</span>
                <span style={{
                  fontSize: 9,
                  color: colors.text.disabled,
                  fontFamily: typography.families.mono,
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  padding: '1px 5px',
                  borderRadius: radii.xs,
                  fontWeight: 500,
                }}>{SHADER_LIBRARY.length}</span>
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
                  height: 30,
                  padding: '6px 28px 6px 26px',
                  background: colors.surface.primary,
                  border: `1px solid ${colors.surface.secondary}`,
                  borderRadius: radii.sm,
                  color: colors.text.primary,
                  fontSize: 11,
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

          {/* Category list */}
          <div style={{
            flex: 1, minHeight: 0,
            overflow: 'auto',
            padding: '4px 4px',
            scrollbarWidth: 'thin' as any,
          }}>
            {CATEGORIES.map(cat => (
              <CategorySection
                key={cat}
                category={cat}
                shaders={categoryShaders[cat] || []}
                activeShader={activeShader}
                favorites={favorites}
                onSelect={setActiveShader}
                onToggleFavorite={toggleFavorite}
                defaultOpen={cat === 'favorites' || cat === 'recent'}
              />
            ))}

            {/* Empty state */}
            {search && filteredShaders.length === 0 && (
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
              fontSize: 9,
              color: colors.text.disabled,
              fontFamily: typography.families.mono,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 4, height: 4, borderRadius: '50%',
                background: colors.state.success,
                boxShadow: `0 0 4px ${colors.state.success}`,
              }} />
              {filteredShaders.length}/{SHADER_LIBRARY.length}
            </span>
            <span style={{
              fontSize: 9,
              color: colors.text.disabled,
              fontFamily: typography.families.mono,
            }}>B close · ★ save</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
