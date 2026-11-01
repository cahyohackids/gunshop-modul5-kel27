import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './config/queryClient'
import App from './App.jsx'

// Images used to be cached by the service worker; they now come from the
// browser HTTP cache (disk cache). Remove the old SW image cache once.
if ('caches' in window) {
  caches.delete('image-cache').catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
