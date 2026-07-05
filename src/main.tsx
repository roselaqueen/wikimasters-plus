import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { loadSettings } from './storage'

const initialSettings = loadSettings()
document.documentElement.dataset.theme = initialSettings.theme
document.documentElement.style.setProperty('--accent', initialSettings.accent)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
