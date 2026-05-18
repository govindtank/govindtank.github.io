import React from 'react';
import { Outlet } from 'react-router-dom';
import InteractiveBackground from './InteractiveBackground';
import SystemMascot from './SystemMascot';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen relative">
      <InteractiveBackground />
      <SystemMascot />
      <Navbar />
      <main className="relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
