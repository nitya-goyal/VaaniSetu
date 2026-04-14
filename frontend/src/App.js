import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Recognize from './components/Recognize';
import Gestures from './components/Gestures';
import Analytics from './components/Analytics';
import { getHealth } from './api';

const PAGES = { dashboard: Dashboard, recognize: Recognize, gestures: Gestures, analytics: Analytics };

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    getHealth().then(() => setApiOnline(true)).catch(() => setApiOnline(false));
    const id = setInterval(() => {
      getHealth().then(() => setApiOnline(true)).catch(() => setApiOnline(false));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
          }
        }}
      />
      <div className="app-shell">
        <Sidebar active={page} onNav={setPage} apiOnline={apiOnline} />
        <main className="main-content">
          <PageComponent onNav={setPage} />
        </main>
      </div>
    </>
  );
}
