import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);

// Register the service worker for PWA offline support.
// Change register() to unregister() to disable PWA.
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    const waitingServiceWorker = registration.waiting;
    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener('statechange', (event) => {
        if (event.target.state === 'activated') {
          window.location.reload();
        }
      });
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  },
});
