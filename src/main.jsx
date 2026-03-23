import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initDB } from './services/mockDataService';

function AppLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDB().then(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', background: 'var(--bg-color)', fontSize: '1.25rem', fontWeight: 600}}>
      Booting High-Performance Database Engine...
    </div>
  );

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppLoader />
  </StrictMode>,
)
