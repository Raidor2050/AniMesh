import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
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

  const filteredShaders = useMemo(() => {
    let shaders = search ? searchShaders(search) : SHADER_LIBRARY
    if (activeCategory === 'favorites') {
      shaders = shaders.filter(s => favorites.includes(s.id))
    } else if (activeCategory === 'recent') {
      shaders = recent
        .map(id => SHADER_LIBRARY.find(s => s.id === id))
        .filter(Boolean) as ShaderDefinition[]
    } else if (activeCategory !== 'all') {
      shaders = shaders.filter(s => s.category === activeCategory)
    }
    return shaders
  }, [search, activeCategory, favorites, recent])

  useEffect(() => {
    if (browserOpen && filteredShaders.length > 0) {
      const manager = getShaderPreviewManager()
      manager.enqueue(filteredShaders)
    }
  }, [browserOpen, filteredShaders])

  if (!browserOpen) return null

  return (
    <AnimatePresence>
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
          padding: `${spacing.scale[4]}px ${spacing.scale[5]}px`,
          borderBottom: `1px solid ${colors.surface.secondary}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${spacing.scale[3]}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${spacing.scale[2]}px` }}>
              <span style={{
                fontFamily: typography.families.mono,
                fontSize: typography.scale.xl.size,
                fontWeight: typography.scale.xl.weight,
                color: colors.text.primary,
                letterSpacing: typography.scale.xl.tracking,
              }}>Shader Library</span>
              <span style={{
                fontSize: 10,
                color: colors.text.disabled,
                fontFamily: typography.families.mono,
                background: colors.surface.primary,
                padding: '2px 6px',
                borderRadius: radii.xs,
              }}>{SHADER_LIBRARY.length}</span>
            </div>
            <button onClick={toggleBrowser} style={{
              padding: '4px 10px',
              background: colors.surface.primary,
              border: `1px solid ${colors.surface.secondary}`,
              borderRadius: radii.xs,
              color: colors.text.tertiary,
              fontSize: 10,
              fontFamily: typography.families.mono,
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = colors.surface.hover; e.currentTarget.style.color = colors.text.secondary }}
              onMouseLeave={e => { e.currentTarget.style.background = colors.surface.primary; e.currentTarget.style.color = colors.text.tertiary }}
            >ESC</button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: colors.text.disabled, fontSize: 13,
            }}>⌕</span>
            <input
              type="text"
              placeholder="Search shaders by name, tag, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 30px',
                background: colors.surface.primary,
                border: `1px solid ${colors.surface.secondary}`,
                borderRadius: radii.sm,
                color: colors.text.primary,
                fontSize: typography.scale.sm.size,
                fontFamily: typography.families.sans,
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                color: colors.text.disabled, fontSize: 14, padding: '2px 4px',
              }}>×</button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div style={{
          display: 'flex', gap: '3px', padding: `${spacing.scale[2]}px ${spacing.scale[4]}px`,
          overflowX: 'auto', borderBottom: `1px solid ${colors.surface.secondary}`,
          flexShrink: 0,
        }}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat
            const icon = CATEGORY_ICONS[cat] || '◈'
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '5px 10px',
                  background: isActive ? colors.accent.subtle : 'transparent',
                  border: `1px solid ${isActive ? colors.accent.glow.replace('0.4', '0.25') : 'transparent'}`,
                  borderRadius: radii.xs,
                  color: isActive ? colors.accent.hover : colors.text.tertiary,
                  fontSize: 11,
                  fontFamily: typography.families.sans,
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <span style={{ fontSize: 10 }}>{icon}</span>
                {cat === 'all' ? 'All' : cat === 'favorites' ? 'Fav' : cat === 'recent' ? 'Recent' : (CATEGORY_LABELS[cat] || cat)}
              </button>
            )
          })}
        </div>

        {/* Shader grid */}
        <div ref={gridRef} style={{
          flex: 1, overflow: 'auto', padding: `${spacing.scale[3]}px ${spacing.scale[4]}px`,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: `${spacing.scale[2] + 2}px`,
          alignContent: 'start',
        }}>
          <AnimatePresence mode="popLayout">
            {filteredShaders.map((shader, i) => (
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
            ))}
          </AnimatePresence>
          {filteredShaders.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: `${spacing.scale[10]}px 0`,
              color: colors.text.disabled,
              fontSize: typography.scale.sm.size,
              fontFamily: typography.families.sans,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.3 }}>◈</div>
              No shaders found
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: `${spacing.scale[2]}px ${spacing.scale[4]}px`,
          borderTop: `1px solid ${colors.surface.secondary}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{
            fontSize: 10,
            color: colors.text.disabled,
            fontFamily: typography.families.mono,
          }}>
            {filteredShaders.length} shader{filteredShaders.length !== 1 ? 's' : ''}
          </span>
          <span style={{
            fontSize: 10,
            color: colors.text.disabled,
            fontFamily: typography.families.mono,
          }}>
            B browse · ↑↓ navigate · Enter select
          </span>
        </div>
      </motion.div>
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
  const previewRef = useRef<HTMLCanvasElement>(null)

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

  const tierColor = {
    low: colors.state.success,
    medium: colors.state.warning,
    high: colors.state.error,
    ultra: '#A855F7',
  }[shader.performanceTier]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.2 }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        background: isActive
          ? 'rgba(99,102,241,0.10)'
          : isHovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isActive ? 'rgba(99,102,241,0.35)' : isHovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: radii.lg,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isActive
          ? '0 0 32px rgba(99,102,241,0.15), inset 0 1px 0 rgba(99,102,241,0.1)'
          : isHovered
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : 'none',
      }}
    >
      {/* Preview area */}
      <div style={{
        height: '100px',
        background: previewUrl
          ? `url(${previewUrl}) center/cover`
          : `linear-gradient(135deg, rgba(20,20,30,0.95), rgba(30,20,50,0.7))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: `1px solid ${colors.surface.secondary}`,
      }}>
        {!previewUrl && (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, rgba(20,20,30,0.95), rgba(30,20,50,0.7))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: typography.families.mono,
              fontSize: 22,
              color: 'rgba(255,255,255,0.06)',
              fontWeight: 700,
            }}>{CATEGORY_ICONS[shader.category] || shader.name.charAt(0)}</span>
          </div>
        )}

        {/* Bottom gradient for text readability when preview loads */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Shimmer loading overlay */}
        {!previewUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
          }} />
        )}

        {/* Tier badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          width: 7, height: 7, borderRadius: '50%',
          background: tierColor,
          boxShadow: `0 0 6px ${tierColor}`,
          border: '1px solid rgba(0,0,0,0.3)',
        }} />

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
          style={{
            position: 'absolute', top: 4, right: 4,
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isFavorite ? 'rgba(99,102,241,0.35)' : 'rgba(0,0,0,0.35)',
            border: 'none', borderRadius: radii.xs,
            color: isFavorite ? '#818CF8' : 'rgba(255,255,255,0.25)',
            fontSize: 11, cursor: 'pointer',
            transition: 'all 0.15s ease',
            backdropFilter: 'blur(4px)',
          }}
        >
          {isFavorite ? '★' : '☆'}
        </button>

        {/* Active indicator */}
        {isActive && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 2,
            background: 'linear-gradient(90deg, #6366F1, #A855F7)',
          }} />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: `${spacing.scale[3]}px ${spacing.scale[3]}px ${spacing.scale[3] - 2}px` }}>
        <div style={{
          fontFamily: typography.families.sans,
          fontSize: typography.scale.base.size,
          fontWeight: 600,
          color: colors.text.primary,
          marginBottom: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: `${typography.scale.base.lineHeight}px`,
          letterSpacing: '-0.01em',
        }}>
          {shader.name}
        </div>
        <div style={{
          fontSize: 10,
          color: colors.text.tertiary,
          display: 'flex', gap: 5, alignItems: 'center',
          fontFamily: typography.families.mono,
        }}>
          <span style={{
            color: isActive ? colors.accent.hover : colors.text.tertiary,
            fontWeight: 500,
          }}>{CATEGORY_LABELS[shader.category] || shader.category}</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span style={{ opacity: 0.6 }}>{shader.tags[0]}</span>
        </div>
      </div>
    </motion.div>
  )
}
