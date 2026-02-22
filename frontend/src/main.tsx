import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './app/Router'
import { initializeRituals } from './rituals/initRituals'
import { ritualEffectMapper } from './effects/RitualEffectMapper'

// Initialize the ritual system
initializeRituals();

// Initialize the effect system
ritualEffectMapper.initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
