import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('syssight-theme');
    if (saved) return saved === 'dark';
    return true; // Dark mode default as specified
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Apply dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('syssight-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('syssight-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleSelectSection = (sectionId) => {
    setActiveSection(sectionId);
    if (sectionId === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 light:bg-slate-50 text-slate-100 light:text-slate-900 transition-colors duration-200 flex flex-col font-sans">
      {/* Top Fixed Header */}
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main App Layout: Sidebar + Content Area */}
      <div className="flex-1 flex">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 overflow-y-auto">
          <Dashboard
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
          />
        </main>
      </div>
    </div>
  );
}
