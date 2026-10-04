import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Immediate render to eliminate initial paint latency
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker in the background after first frame
if ('serviceWorker' in navigator && !window.location.protocol.startsWith('file')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
