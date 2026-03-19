import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { requestPersistentStorage, seedIfEmpty } from './storage'
import { Capacitor } from '@capacitor/core'

const isNativePlatform =
  Capacitor.isNativePlatform() ||
  !!(window as any).electronAPI ||
  navigator.userAgent.includes('Electron');

if (!isNativePlatform) {
  document.getElementById('root')!.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#fff;background:#1a1a1a;text-align:center;padding:2rem;font-family:sans-serif;">' +
    '<div><h1>Not Available</h1><p>This app is only available as a native application.<br/>Please install it on your device.</p></div></div>';
} else {
  requestPersistentStorage();
  seedIfEmpty();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
