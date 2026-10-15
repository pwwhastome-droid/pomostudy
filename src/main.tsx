import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { reconcileNativeTimer } from './utils/nativeTimer';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// On Android this first asks the native side whether a session is still running (takes a few ms).
// On the web it resolves immediately.
reconcileNativeTimer()
  .catch(() => {})
  .finally(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });

// Register Service Worker in the background after first frame
if ('serviceWorker' in navigator && !window.location.protocol.startsWith('file')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
