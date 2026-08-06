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

// --- GitHub Pages SPA redirect handling (must run before router) ---
// https://github.com/rafgraph/spa-github-pages
(function () {
  try {
    var l = window.location;
    if (l.search.includes('/?')) {
      // Peel off the redirect query param and restore the real path
      var replaced = l.search.slice(1).split('&').filter(function (p) {
        return p.startsWith('/');
      })[0];
      if (replaced) {
        var realPath = '/' + replaced.slice(2).replace(/~and~/g, '&');
        l.replace(l.pathname + realPath + l.hash);
        return;
      }
    }
  } catch (_) {
    // ignore
  }
})();
// -------------------------------------------------------------------

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
