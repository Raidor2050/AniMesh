import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUIStore, useShaderStore } from '../state/stores'
import { SHADER_LIBRARY, searchShaders } from '../shaders/library'

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
  const setActiveShader = useShaderStore(s => s.setActiveShader)

  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
    }
  }, [open])

  const commands: CommandItem[] = useMemo(() => {
    const shaderCmds: CommandItem[] = SHADER_LIBRARY.map(s => ({
      label: s.name,
      category: 'Shaders',
      action: () => { setActiveShader(s); toggle() },
    }))

    return [
      { label: 'Toggle Shader Browser', shortcut: 'B', category: 'Panels', action: () => { toggleBrowser(); toggle() } },
      { label: 'Create New Shader', shortcut: 'N', category: 'Panels', action: () => { toggleCreator(); toggle() } },
      { label: 'Toggle Immersive Mode', shortcut: 'F', category: 'Panels', action: () => { toggleImmersive(); toggle() } },
      ...shaderCmds,
    ]
  }, [setActiveShader, toggle, toggleBrowser, toggleCreator, toggleImmersive])

  const filtered = useMemo(() => {
    if (!query) return commands
    const q = query.toLowerCase()
    return commands.filter(c => c.label.toLowerCase().includes(q))
  }, [query, commands])

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 40,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '20vh',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) toggle() }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          width: '480px', maxWidth: '90vw',
          background: 'rgba(15,15,20,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a command or shader name..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') toggle()
            if (e.key === 'Enter' && filtered.length > 0) {
              filtered[0].action()
            }
          }}
          style={{
            width: '100%',
            padding: '16px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.92)',
            fontSize: '14px',
            fontFamily: '"Inter", sans-serif',
            outline: 'none',
          }}
        />
        <div style={{ maxHeight: '300px', overflow: 'auto', padding: '4px' }}>
          {filtered.slice(0, 12).map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              style={{
                width: '100%',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none', borderRadius: '6px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px',
                fontFamily: '"Inter", sans-serif',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e: React.MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e: React.MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span style={{
                  fontSize: '10px', color: 'rgba(255,255,255,0.3)',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {item.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
