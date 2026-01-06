import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Add CRT overlay for arcade monitor effects
const crtOverlay = document.createElement('div')
crtOverlay.className = 'crt-overlay'
document.body.appendChild(crtOverlay)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
