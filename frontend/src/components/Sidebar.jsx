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
  Network,
  Disc,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, command: null },
  { id: 'cpu', label: 'CPU & ISA', icon: Cpu, command: 'lscpu' },
  { id: 'memory', label: 'Memory & Swap', icon: HardDrive, command: 'free -h' },
  { id: 'processes', label: 'Threads & Processes', icon: ListFilter, command: 'ps -eLf' },
  { id: 'network', label: 'Network & Ports', icon: Network, command: 'ss -tulnp' },
  { id: 'disk', label: 'Disk & I/O', icon: Disc, command: 'iostat' },
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
  collapsed = false,
  onToggleCollapse,
}) {
  const content = (isMobile = false) => {
    const isCollapsedRail = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full bg-navy text-mist border-r border-navy/80 select-none">
        {/* Mobile drawer header */}
        {isMobile && (
          <div className="p-4 flex items-center justify-between border-b border-mist/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-mist">
              Navigation
            </span>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded text-mist hover:text-paper hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Desktop Collapse/Expand Header Toggle */}
        {!isMobile && (
          <div className={`p-3 flex items-center border-b border-mist/10 ${isCollapsedRail ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsedRail && (
              <span className="text-[11px] font-mono uppercase tracking-wider text-mist/60 font-semibold pl-1">
                Monitors
              </span>
            )}
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded text-mist/80 hover:text-paper hover:bg-white/10 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-amber" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Nav links */}
        <div className={`flex-1 py-3 space-y-1.5 overflow-y-auto ${isCollapsedRail ? 'px-2' : 'px-3'}`}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    onSelectSection(item.id);
                    if (isMobile && onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-lg text-xs font-medium transition-all ${
                    isCollapsedRail
                      ? 'justify-center p-2.5'
                      : 'justify-between px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-amber text-navy font-bold shadow-sm'
                      : 'text-mist/80 hover:text-paper hover:bg-white/10'
                  }`}
                >
                  <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsedRail ? 'justify-center' : ''}`}>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-navy stroke-[2.5]' : 'text-mist/80 group-hover:text-paper'
                      }`}
                    />
                    {!isCollapsedRail && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!isCollapsedRail && item.command && (
                    <span
                      className={`text-[10px] font-mono shrink-0 ${
                        isActive ? 'text-navy/80 font-bold' : 'text-mist/50 group-hover:text-mist/80'
                      }`}
                    >
                      {item.command}
                    </span>
                  )}
                </button>

                {/* Tooltip on Hover in Collapsed State */}
                {isCollapsedRail && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 bg-navy text-paper border border-mist/20 text-xs font-sans rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="font-semibold">{item.label}</span>
                    {item.command && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber">
                        ({item.command})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info in expanded desktop state */}
        {!isCollapsedRail && !isMobile && (
          <div className="p-3 border-t border-mist/10 bg-navy/60">
            <div className="px-2 py-2 rounded border border-mist/15 text-[11px] font-mono text-mist/70">
              <div className="flex items-center justify-between text-[10px] text-mist/50 mb-1 font-semibold">
                <span>TARGET HOST</span>
                <span className="text-amber">WSL2 / Linux</span>
              </div>
              <div className="truncate text-mist/90">Kernel 5.15+ / Systemd</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Sidebar Rail */}
      <aside
        className={`hidden lg:block shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {content(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {content(true)}
          </div>
        </div>
      )}
    </>
  );
}
