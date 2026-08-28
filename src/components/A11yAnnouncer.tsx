import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { subscribeAnnounce, AnnounceRecord } from '../a11y/announcer'

const SR_STYLE: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
  userSelect: 'none',
}

export function A11yAnnouncer() {
  const [record, setRecord] = useState<AnnounceRecord>({ message: '', count: 0 })

  useEffect(() => subscribeAnnounce(setRecord), [])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic
      aria-label="Application announcements"
      style={SR_STYLE}
    >
      {record.message && <span key={record.count}>{record.message}</span>}
    </div>
  )
}