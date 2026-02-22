import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './app/Router'
import { initializeRituals } from './rituals/initRituals'

// Initialize the ritual system
initializeRituals();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
