import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { isPearlPath } from './game/pearl';
import './styles.css';
import './art.css';
import './street.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

if (import.meta.env.PROD && 'serviceWorker' in navigator && !isPearlPath(window.location.pathname)) {
  const registerOffline = () => { void navigator.serviceWorker.register('/sw.js').catch(() => {}); };
  if (document.readyState === 'complete') registerOffline();
  else window.addEventListener('load', registerOffline, {once: true});
}
