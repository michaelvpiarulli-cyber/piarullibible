import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/karla/400.css'
import '@fontsource/karla/500.css'
import '@fontsource/karla/600.css'
import '@fontsource/karla/700.css'
import '@fontsource/kalam/700.css' // script wordmark
import './index.css'
import App from './App.jsx'
import { DataProvider } from './context/DataProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>,
)
