import React from 'react';
import { Activity, Sun, Moon, Menu, Radio } from 'lucide-react';

export function Header({
  isDark,
  onToggleTheme,
  onToggleMobileSidebar,
  isBackendConnected = true,
  lastUpdatedText = null,
}) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md light:border-slate-200 light:bg-white/80 transition-colors duration-150">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            {/* Custom Modern OS utility mark */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-slate-100 light:text-slate-900">
                  SysSight
                </span>
                <span className="text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 light:bg-sky-100 light:text-sky-700 border border-sky-500/20 font-bold">
                  WSL Detective
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Connection Beacon + Last Updated + Theme Switch */}
        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
              isBackendConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-200'
                : 'bg-rose-950/40 text-rose-400 border-rose-800/50 light:bg-rose-50 light:text-rose-700 light:border-rose-200'
            }`}
            title={isBackendConnected ? 'Connected to FastAPI backend' : 'Backend unreachable'}
          >
            <span className="relative flex h-2 w-2">
              {isBackendConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isBackendConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span className="hidden sm:inline">
              {isBackendConnected ? 'FastAPI Online' : 'FastAPI Offline'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle dark/light theme"
            className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-slate-100 light:border-slate-200 light:bg-slate-100 light:text-slate-700 light:hover:text-slate-900 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
