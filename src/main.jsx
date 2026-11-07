import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@fontsource-variable/oswald'
import './styles/global.css'
import './styles/poster.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
