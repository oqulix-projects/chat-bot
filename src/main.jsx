import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// PWA service worker registration
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    // You could show a "refresh" button here if you want
    console.log("New content available, refresh needed.")
  },
  onOfflineReady() {
    // You could show a toast/snackbar here
    console.log("App ready to work offline.")
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
