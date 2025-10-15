import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './app/providers/i18n.ts'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="font-instrument">
    <App />
    </div>
  </StrictMode>,
)
