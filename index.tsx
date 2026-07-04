import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import InsiderApp from './insider/InsiderApp';

// Two apps share this repo: the travel booklet at "/" and the Polymarket
// insider-activity dashboard at "#/insider". Hash routing keeps it dependency-free.
const Root: React.FC = () => {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const insider = hash.startsWith('#/insider');
  return (
    <>
      {insider ? <InsiderApp /> : <App />}
      <a
        href={insider ? '#/' : '#/insider'}
        className={`fixed bottom-4 right-4 z-50 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition-colors ${
          insider
            ? 'border-white/15 bg-white/10 text-white hover:bg-white/20'
            : 'border-stone-300 bg-white/80 text-stone-600 hover:bg-white'
        }`}
      >
        {insider ? '✈ Travel Summary' : '⊚ Insider Radar'}
      </a>
    </>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
