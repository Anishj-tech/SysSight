import React from 'react';
import { Activity, Menu } from 'lucide-react';

export function Header({ onToggleMobileSidebar }) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-navy text-paper border-b border-navy/90 shadow-sm">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-1.5 rounded-md text-mist hover:text-paper hover:bg-navy/80 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            {/* Custom Modern OS utility mark */}
            <div className="w-8 h-8 rounded-lg bg-navy border border-mist/20 flex items-center justify-center text-amber shadow-sm">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-semibold text-base tracking-tight text-paper select-none">
              SysSight
            </span>
          </div>
        </div>

        {/* Right area: clean and intentional layout without deleted badges */}
        <div className="flex items-center gap-2 text-xs font-mono text-mist/70">
          <span className="hidden sm:inline">Linux/WSL System Monitor</span>
        </div>
      </div>
    </header>
  );
}
