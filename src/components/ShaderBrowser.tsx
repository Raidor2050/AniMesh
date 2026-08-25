import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore } from '../state/stores'
import { SHADER_LIBRARY, searchShaders } from '../shaders/library'
import { ShaderDefinition, ShaderCategory, CATEGORY_LABELS } from '../utils/types'

const CATEGORIES: (ShaderCategory | 'all' | 'favorites' | 'recent')[] = [
  'all', 'fractals', 'vj', 'geometric', 'liquid', 'cosmic', 'synthwave', 'abstract', 'minimal', 'favorites', 'recent',
]

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

  if (!browserOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: '420px', maxWidth: '90vw',
          zIndex: 25,
          background: 'rgba(10,10,14,0.92)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '14px', fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
            }}>Shader Library</span>
            <button onClick={toggleBrowser} style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: '4px',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '11px', cursor: 'pointer',
            }}>ESC</button>
          </div>
          <input
            type="text"
            placeholder="Search shaders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.92)',
              fontSize: '12px',
              fontFamily: '"Inter", sans-serif',
              outline: 'none',
            }}
          />
        </div>

        {/* Category tabs */}
        <div style={{
          display: 'flex', gap: '4px', padding: '8px 16px',
          overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '4px 10px',
                background: activeCategory === cat ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: `1px solid ${activeCategory === cat ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                borderRadius: '4px',
                color: activeCategory === cat ? '#818CF8' : 'rgba(255,255,255,0.5)',
                fontSize: '10px',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500,
                textTransform: 'capitalize',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat === 'all' ? 'All' : cat === 'favorites' ? '★ Fav' : cat === 'recent' ? 'Recent' : (CATEGORY_LABELS[cat] || cat)}
            </button>
          ))}
        </div>

        {/* Shader grid */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          alignContent: 'start',
        }}>
          {filteredShaders.map((shader, i) => (
            <ShaderCard
              key={shader.id}
              shader={shader}
              isActive={activeShader?.id === shader.id}
              isFavorite={favorites.includes(shader.id)}
              onClick={() => setActiveShader(shader)}
              onToggleFavorite={() => toggleFavorite(shader.id)}
              index={i}
            />
          ))}
          {filteredShaders.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 0',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '12px',
              fontFamily: '"Inter", sans-serif',
            }}>
              No shaders found
            </div>
          )}
        </div>

        {/* Footer count */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.3)',
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          {filteredShaders.length} shaders
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function ShaderCard({
  shader, isActive, isFavorite, onClick, onToggleFavorite, index
}: {
  shader: ShaderDefinition
  isActive: boolean
  isFavorite: boolean
  onClick: () => void
  onToggleFavorite: () => void
  index: number
}) {
  const [hovered, setHovered] = useState(false)

  const tierColor = {
    low: '#22C55E', medium: '#F59E0B', high: '#EF4444', ultra: '#A855F7',
  }[shader.performanceTier]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isActive
          ? 'rgba(99,102,241,0.12)'
          : hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: isActive ? '0 0 20px rgba(99,102,241,0.15)' : 'none',
      }}
    >
      {/* Preview placeholder */}
      <div style={{
        height: '90px',
        background: `linear-gradient(135deg, 
          ${shader.category === 'fractals' ? 'rgba(99,102,241,0.3), rgba(168,85,247,0.2)' :
            shader.category === 'cosmic' ? 'rgba(30,10,60,0.8), rgba(80,20,120,0.4)' :
            shader.category === 'synthwave' ? 'rgba(255,50,100,0.3), rgba(100,0,200,0.4)' :
            shader.category === 'liquid' ? 'rgba(20,100,180,0.3), rgba(180,40,120,0.3)' :
            shader.category === 'minimal' ? 'rgba(30,30,40,0.8), rgba(50,50,70,0.6)' :
            'rgba(20,20,30,0.8), rgba(40,20,60,0.4)'
          })`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '20px',
          color: 'rgba(255,255,255,0.15)',
          fontWeight: 700,
        }}>
          {shader.name.charAt(0)}
        </span>

        {/* Tier badge */}
        <div style={{
          position: 'absolute', top: '6px', left: '6px',
          width: '6px', height: '6px', borderRadius: '50%',
          background: tierColor,
          boxShadow: `0 0 6px ${tierColor}`,
        }} />

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite() }}
          style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '24px', height: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isFavorite ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.3)',
            border: 'none', borderRadius: '4px',
            color: isFavorite ? '#818CF8' : 'rgba(255,255,255,0.3)',
            fontSize: '12px', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '11px', fontWeight: 600,
          color: 'rgba(255,255,255,0.92)',
          marginBottom: '2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {shader.name}
        </div>
        <div style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          display: 'flex', gap: '6px', alignItems: 'center',
        }}>
          <span style={{ textTransform: 'capitalize' }}>{shader.category}</span>
          <span>·</span>
          <span>{shader.tags[0]}</span>
        </div>
      </div>
    </motion.div>
  )
}
