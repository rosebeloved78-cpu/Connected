
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Service Worker handling (disable on localhost to avoid caching dev assets)
if ('serviceWorker' in navigator) {
  if (window.location.hostname === 'localhost') {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    // Attempt to clear any caches created by previous SW
    try {
      // @ts-ignore
      caches?.keys?.().then((keys: string[]) => keys.forEach((k) => caches.delete(k)));
    } catch {}
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
