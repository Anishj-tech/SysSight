import React from 'react';
import { RefreshCw, Clock, Pause, Play } from 'lucide-react';

export function RefreshControl({
  autoRefresh,
  onToggleAutoRefresh,
  intervalSeconds,
  onChangeInterval,
  onRefreshNow,
  isRefreshing,
  lastUpdated,
  isBackendConnected,
}) {
  const formatTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleTimeString([], { hour12: false });
    } catch {
      return '—';
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-mist bg-mist/30 text-ink shadow-sm">
      {/* Left: Auto Refresh Switch & Interval Dropdown */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Toggle Switch */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={autoRefresh}
            onClick={() => onToggleAutoRefresh(!autoRefresh)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoRefresh ? 'bg-amber' : 'bg-mist border border-mist'
            }`}
          >
            <span className="sr-only">Toggle Auto Refresh</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper shadow-md ring-0 transition duration-200 ease-in-out ${
                autoRefresh ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-navy flex items-center gap-1.5 select-none">
            {autoRefresh ? (
              <>
                <Play className="w-3.5 h-3.5 text-navy fill-navy" />
                <span>Auto Refresh Active</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-navy/60" />
                <span className="text-navy/70">Auto Refresh Paused</span>
              </>
            )}
          </span>
        </div>

        {/* Interval Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="refresh-interval" className="text-navy/70 text-xs font-mono font-medium">
            Interval:
          </label>
          <select
            id="refresh-interval"
            value={intervalSeconds}
            onChange={(e) => onChangeInterval(Number(e.target.value))}
            disabled={!autoRefresh}
            className="px-2.5 py-1 rounded bg-paper border border-mist text-xs font-mono text-navy font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-amber transition-colors shadow-sm"
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>
        </div>
      </div>

      {/* Right: Last Updated info + Refresh Now Button */}
      <div className="flex items-center gap-3.5 ml-auto">
        <div className="flex items-center gap-2 text-xs font-mono text-navy">
          <span className="relative flex h-2.5 w-2.5">
            {isBackendConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isBackendConnected ? 'bg-amber' : 'bg-mist border border-mist'
              }`}
              title={isBackendConnected ? 'Connected to live backend' : 'Backend offline'}
            />
          </span>
          <Clock className="w-3.5 h-3.5 text-navy/70" />
          <span className="font-medium">Sync: <strong className="font-bold text-navy">{formatTime(lastUpdated)}</strong></span>
        </div>

        {/* Primary Action Button: Amber */}
        <button
          type="button"
          onClick={onRefreshNow}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber hover:bg-amber/90 active:bg-amber/80 text-navy font-bold text-xs shadow-sm transition-all border border-amber disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-navy ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
        </button>
      </div>
    </div>
  );
}
