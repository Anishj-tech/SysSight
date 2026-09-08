import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  HardDrive,
  ListFilter,
  Flame,
  Binary,
  Layers,
  Terminal,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, command: null },
  { id: 'cpu', label: 'CPU & ISA', icon: Cpu, command: 'lscpu' },
  { id: 'memory', label: 'Memory & Swap', icon: HardDrive, command: 'free -h' },
  { id: 'processes', label: 'Threads & Processes', icon: ListFilter, command: 'ps -eLf' },
  { id: 'top', label: 'Top Processes', icon: Flame, command: 'top' },
  { id: 'syscalls', label: 'Syscall Inspector', icon: Binary, command: 'strace' },
  { id: 'locality', label: 'Cache Locality', icon: Layers, command: 'locality.c' },
  { id: 'console', label: 'Live Console', icon: Terminal, command: 'raw' },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
}) {
  const content = (
    <div className="flex flex-col h-full bg-slate-950 light:bg-slate-50 border-r border-slate-800 light:border-slate-200">
      {/* Mobile drawer header */}
      <div className="lg:hidden p-4 flex items-center justify-between border-b border-slate-800 light:border-slate-200">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
          System Monitors
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 light:bg-sky-100 light:text-sky-800 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-sky-400 light:text-sky-700'
                      : 'text-slate-500 group-hover:text-slate-300 light:group-hover:text-slate-700'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.command && (
                <span className="text-[10px] font-mono text-slate-500 light:text-slate-400 group-hover:text-slate-400 transition-colors">
                  {item.command}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer info badge */}
      <div className="p-3 border-t border-slate-800/80 light:border-slate-200 bg-slate-900/40 light:bg-slate-100/50">
        <div className="px-2 py-2 rounded border border-slate-800 light:border-slate-200 text-[11px] font-mono text-slate-400 light:text-slate-600">
          <div className="flex items-center justify-between text-[10px] text-slate-500 light:text-slate-400 mb-1 font-semibold">
            <span>TARGET HOST</span>
            <span className="text-sky-400">WSL2 / Linux</span>
          </div>
          <div className="truncate">Kernel 5.15+ / Systemd</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
        {content}
      </aside>

      {/* Mobile Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
