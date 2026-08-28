import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'motion/react'
import { useUIStore, useShaderStore } from '../state/stores'
import { VISUAL_LIBRARY, isSvg } from '../shaders/visualLibrary'
import { colors, typography, spacing, radii } from '../ui/tokens'

interface CommandItem {
  label: string
  shortcut?: string
  action: () => void
  category: string
}

export function CommandPalette() {
  const open = useUIStore(s => s.commandPaletteOpen)
  const toggle = useUIStore(s => s.toggleCommandPalette)
  const toggleBrowser = useUIStore(s => s.toggleBrowser)
  const toggleCreator = useUIStore(s => s.toggleCreator)
  const toggleImmersive = useUIStore(s => s.toggleImmersive)
  const setActiveVisual = useShaderStore(s => s.setActiveVisual)

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  const commands: CommandItem[] = useMemo(() => {
    const visualCmds: CommandItem[] = VISUAL_LIBRARY.map(v => ({
      label: `${isSvg(v) ? '◦ ' : ''}${v.name}`,
      category: isSvg(v) ? `objects · ${v.layout}` : v.category,
      action: () => { setActiveVisual(v); toggle() },
    }))

    return [
      { label: 'Toggle Shader Browser', shortcut: 'B', category: 'Panels', action: () => { toggleBrowser(); toggle() } },
      { label: 'Create New Shader', shortcut: 'N', category: 'Panels', action: () => { toggleCreator(); toggle() } },
      { label: 'Toggle Fullscreen', shortcut: 'F', category: 'Panels', action: () => { toggleImmersive(); toggle() } },
      ...visualCmds,
    ]
  }, [setActiveVisual, toggle, toggleBrowser, toggleCreator, toggleImmersive])

  const filtered = useMemo(() => {
    if (!query) return commands
    const q = query.toLowerCase()
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    )
  }, [query, commands])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  const safeIndex = filtered.length === 0 ? 0 : Math.min(selectedIndex, filtered.length - 1)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 40,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '18vh',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) toggle() }}
    >
      <motion.div
        initial={{ y: -16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          width: 520, maxWidth: '92vw',
          background: 'rgba(12,12,16,0.96)',
          border: `1px solid ${colors.surface.secondary}`,
          borderRadius: radii.lg,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 1px rgba(99,102,241,0.2)',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: `${spacing.scale[4]}px ${spacing.scale[5]}px`,
          borderBottom: `1px solid ${colors.surface.secondary}`,
          gap: 10,
        }}>
          <span style={{ color: colors.text.disabled, fontSize: 16 }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search shaders, commands..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') toggle()
              if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => filtered.length === 0 ? 0 : Math.min(i + 1, filtered.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
              if (e.key === 'Enter' && filtered.length > 0) {
                const item = filtered[Math.min(selectedIndex, filtered.length - 1)]
                if (item) item.action()
              }
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: colors.text.primary,
              fontSize: typography.scale.md.size,
              fontFamily: typography.families.sans,
              outline: 'none',
            }}
          />
          <kbd style={{
            fontSize: 9,
            fontFamily: typography.families.mono,
            color: colors.text.disabled,
            background: colors.surface.primary,
            padding: '2px 6px',
            borderRadius: radii.xs,
            border: `1px solid ${colors.surface.secondary}`,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 340, overflow: 'auto', padding: spacing.scale[1] }}>
          {filtered.length === 0 && (
            <div style={{
              padding: `${spacing.scale[6]}px`,
              textAlign: 'center',
              color: colors.text.disabled,
              fontSize: typography.scale.sm.size,
            }}>
              No results found
            </div>
          )}
          {filtered.map((item, i) => {
            const isSelected = i === safeIndex
            return (
              <button
                key={i}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  width: '100%',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: `${spacing.scale[2] + 2}px ${spacing.scale[3]}px`,
                  background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: radii.sm,
                  color: isSelected ? colors.text.primary : colors.text.secondary,
                  fontSize: typography.scale.base.size,
                  fontFamily: typography.families.sans,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.08s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, color: isSelected ? colors.accent.hover : colors.text.disabled,
                    fontFamily: typography.families.mono,
                    minWidth: 18,
                  }}>
                    {item.shortcut ? '⌨' : '◈'}
                  </span>
                  <span>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 9,
                    color: colors.text.disabled,
                    fontFamily: typography.families.sans,
                  }}>
                    {item.category}
                  </span>
                  {item.shortcut && (
                    <kbd style={{
                      fontSize: 9,
                      color: colors.text.disabled,
                      fontFamily: typography.families.mono,
                      background: colors.surface.primary,
                      padding: '1px 5px',
                      borderRadius: 3,
                      border: `1px solid ${colors.surface.secondary}`,
                    }}>
                      {item.shortcut}
                    </kbd>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: `${spacing.scale[2]}px ${spacing.scale[4]}px`,
          borderTop: `1px solid ${colors.surface.secondary}`,
          display: 'flex', gap: 12,
        }}>
          <span style={{ fontSize: 9, color: colors.text.disabled, fontFamily: typography.families.mono }}>
            ↑↓ navigate
          </span>
          <span style={{ fontSize: 9, color: colors.text.disabled, fontFamily: typography.families.mono }}>
            ↵ select
          </span>
          <span style={{ fontSize: 9, color: colors.text.disabled, fontFamily: typography.families.mono }}>
            esc close
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
