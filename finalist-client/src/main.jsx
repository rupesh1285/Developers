import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx' // 🌟 MUST POINT TO APP.JSX

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)