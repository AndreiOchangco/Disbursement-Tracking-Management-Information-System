import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DTMISToastContainer } from './components/DTMISToast'
import './css/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DTMISToastContainer />
    <App />
  </StrictMode>,
)
