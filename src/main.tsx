import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/global.css'

if (new URLSearchParams(window.location.search).has('kiosk')) {
  document.body.classList.add('kiosk-mode')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
