import { useShaderStore, useUIStore, audioDataBridge } from '../state/stores'
import { useState, useEffect } from 'react'

export function ParameterPanel() {
  const activeShader = useShaderStore(s => s.activeShader)
  const params = useShaderStore(s => s.params)
  const setParam = useShaderStore(s => s.setParam)
  const immersive = useUIStore(s => s.immersive)
  const [audioLevel, setAudioLevel] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(audioDataBridge.snapshot.volume)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  if (!activeShader || immersive) return null

  const paramDefs = activeShader.params
  if (paramDefs.length === 0) return null

  return (
    <div style={{
      position: 'absolute',
      top: '56px', right: '12px', bottom: '72px',
      width: '260px',
      zIndex: 15,
      background: 'rgba(10,10,14,0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 14px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '11px', fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>Parameters</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 14px' }}>
        {paramDefs.map(param => (
          <div key={param.id} style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '4px',
            }}>
              <span style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: '"Inter", sans-serif',
              }}>{param.label}</span>
              <span style={{
                fontSize: '10px',
                color: 'rgba(99,102,241,0.8)',
                fontFamily: '"JetBrains Mono", monospace',
              }}>{(params[param.id] ?? param.default).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={params[param.id] ?? param.default}
              onChange={e => setParam(param.id, parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '3px',
                accentColor: '#6366F1',
                cursor: 'pointer',
              }}
            />
          </div>
        ))}
      </div>

      {/* Audio level indicator */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '4px',
        }}>
          <span style={{
            fontSize: '9px', color: 'rgba(255,255,255,0.3)',
            fontFamily: '"JetBrains Mono", monospace',
          }}>AUDIO</span>
        </div>
        <div style={{
          height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${audioLevel * 100}%`,
            background: 'linear-gradient(90deg, #6366F1, #A855F7)',
            borderRadius: '1px',
            transition: 'width 0.05s ease',
          }} />
        </div>
      </div>
    </div>
  )
}
