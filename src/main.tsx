import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './App.tsx';
import Layout from './components/Layout.tsx';
import BlogList from './pages/BlogList.tsx';
import BlogDetail from './pages/BlogDetail.tsx';
import './index.css';

// Disable browser scroll restoration — React Router manages scroll positions
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Track SPA route changes in GoatCounter
function TrackPageViews() {
  const { pathname } = useLocation();
  useEffect(() => {
    (window as any).goatcounter?.count?.();
  }, [pathname]);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TrackPageViews />
      <Routes>
        <Route path="/" element={<App />} />
        <Route element={<Layout />}>
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
