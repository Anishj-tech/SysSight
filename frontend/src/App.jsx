import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Persist sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('syssight_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('syssight_sidebar_collapsed', String(next));
      } catch {
        // LocalStorage fallback
      }
      return next;
    });
  };

  // Called when user clicks a sidebar item
  const handleSelectSection = useCallback((sectionId) => {
    setActiveSection(sectionId);

    // Suppress IntersectionObserver overrides while smooth scrolling completes
    isProgrammaticScrollRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 850);

    if (sectionId === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Called by IntersectionObserver as user scrolls manually
  const handleSectionVisible = useCallback((sectionId) => {
    if (isProgrammaticScrollRef.current) return;
    setActiveSection(sectionId);
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-amber selection:text-navy">
      {/* Top Fixed Header */}
      <Header
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main App Layout: Sidebar + Natural Scrolling Content Area */}
      <div className="flex-1 flex min-w-0">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main Content Viewport — No overflow-y-auto so window is scroll parent */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
          <Dashboard
            activeSection={activeSection}
            onSectionVisible={handleSectionVisible}
          />
        </main>
      </div>
    </div>
  );
}
