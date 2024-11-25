import './lib/polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';

// Initialize app immediately
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Load analytics and monitoring asynchronously
const initAnalytics = async () => {
  if (import.meta.env.PROD) {
    // Load analytics in parallel
    const [sentryModule, analyticsModule] = await Promise.all([
      import('@sentry/react'),
      import('./lib/analytics')
    ]);

    // Initialize Sentry
    sentryModule.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new sentryModule.BrowserTracing(),
        new sentryModule.Replay()
      ],
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.2,
      tracePropagationTargets: [
        /^https:\/\/lakayalert\.com/,
        /^https:\/\/api\.lakayalert\.com/,
        /^http:\/\/localhost/,
        /^http:\/\/127\.0\.0\.1/
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });

    // Initialize GA
    await analyticsModule.initGA();
  }
};

// Initialize analytics after app render
window.requestIdleCallback?.(() => {
  initAnalytics().catch(console.error);
}) ?? setTimeout(() => {
  initAnalytics().catch(console.error);
}, 1000);