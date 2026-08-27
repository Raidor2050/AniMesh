import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './components/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './ui/global.css'

// PWA-lite: precache the app shell + runtime-cache hashed assets so repeat
// visits (and mid-set crashes) load instantly, even offline.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => { /* SW is progressive enhancement — failure is fine */ })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)