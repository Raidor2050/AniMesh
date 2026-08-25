import { useState } from 'react'
import { connectAudio } from '../audio/audioSingleton'
import type { AudioSourceType } from '../audio/AudioEngine'

export function AudioInitBar() {
  const [show, setShow] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async (type: AudioSourceType) => {
    setConnecting(true)
    if (type === 'file') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'audio/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          await connectAudio('file', file)
        }
        setConnecting(false)
      }
      input.click()
      return
    }
    await connectAudio(type)
    setConnecting(false)
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{
          position: 'absolute', bottom: '72px', left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 20px',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '20px',
          color: '#818CF8',
          fontSize: '11px',
          fontFamily: '"Inter", sans-serif',
          fontWeight: 500,
          cursor: 'pointer',
          zIndex: 15,
          backdropFilter: 'blur(12px)',
          transition: 'all 0.2s ease',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      >
        ▶ Connect Audio Source
      </button>
    )
  }

  const sources: { type: AudioSourceType; label: string; icon: string }[] = [
    { type: 'demo', label: 'Demo', icon: '♪' },
    { type: 'mic', label: 'Microphone', icon: '🎤' },
    { type: 'system', label: 'System Audio', icon: '🔊' },
    { type: 'file', label: 'Audio File', icon: '📁' },
  ]

  return (
    <div style={{
      position: 'absolute', bottom: '72px', left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', gap: '6px',
      padding: '10px 14px',
      background: 'rgba(10,10,14,0.92)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      zIndex: 15,
      backdropFilter: 'blur(16px)',
    }}>
      {sources.map(s => (
        <button
          key={s.type}
          onClick={() => handleConnect(s.type)}
          disabled={connecting}
          style={{
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '11px',
            fontFamily: '"Inter", sans-serif',
            cursor: connecting ? 'wait' : 'pointer',
            opacity: connecting ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            if (!connecting) {
              e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          }}
        >
          <span style={{ marginRight: '4px' }}>{s.icon}</span>
          {s.label}
        </button>
      ))}
      <button
        onClick={() => setShow(false)}
        style={{
          padding: '8px 10px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </div>
  )
}
