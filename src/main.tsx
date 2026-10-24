import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Adm from './Adm.tsx'
import SessionTracker from './SessionTracker.tsx'

function Root(){
  const path = window.location.pathname
  if(path==='/adm' || path==='/adm/'){ return <Adm/> }
  if(path==='/tracker' || path.startsWith('/tracker')){ return <SessionTracker/> }
  return <App/>
}

createRoot(document.getElementById('root')!).render(<StrictMode><Root/></StrictMode>,)
