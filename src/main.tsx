import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import WebApp from './web/WebApp'
import './index.css'
import { seedIfEmpty } from './storage'
import { Capacitor } from '@capacitor/core'

const isNativePlatform =
  Capacitor.isNativePlatform() ||
  !!(window as any).electronAPI ||
  navigator.userAgent.includes('Electron');

if (isNativePlatform) {
  seedIfEmpty();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <WebApp />
    </React.StrictMode>,
  );
}
