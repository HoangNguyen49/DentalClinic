import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './app/providers/i18n.ts'
import App from './app/App.tsx'
import { setupAxiosInterceptors } from './utils/axiosSetup'

// Setup axios interceptors (thêm token tự động vào mọi request)
setupAxiosInterceptors()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="font-instrument">
    <App />
    </div>
  </StrictMode>,
)
