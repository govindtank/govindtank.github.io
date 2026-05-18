import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import App from './App.tsx';
import BlogList from './pages/BlogList.tsx';
import BlogDetail from './pages/BlogDetail.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path="blogs" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
