import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
  registerSW({
    immediate: true,
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('bnc:pwa-offline-ready'));
    },
    onNeedRefresh() {
      // Auto-update active service worker smoothly without interrupting user lookup
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
