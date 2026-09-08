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
  // Format last updated timestamp cleanly as HH:MM:SS
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
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 light:border-slate-200 light:bg-white text-slate-200 light:text-slate-800 shadow-sm">
      {/* Left: Auto Refresh Switch & Interval Dropdown */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Toggle Switch */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={autoRefresh}
            onClick={() => onToggleAutoRefresh(!autoRefresh)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
              autoRefresh ? 'bg-sky-600' : 'bg-slate-700 light:bg-slate-300'
            }`}
          >
            <span className="sr-only">Toggle Auto Refresh</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                autoRefresh ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs font-medium flex items-center gap-1.5 select-none">
            {autoRefresh ? (
              <>
                <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                <span>Auto Refresh</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Auto Refresh Paused</span>
              </>
            )}
          </span>
        </div>

        {/* Interval Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="refresh-interval" className="text-slate-400 light:text-slate-500 text-xs font-mono">
            Every:
          </label>
          <select
            id="refresh-interval"
            value={intervalSeconds}
            onChange={(e) => onChangeInterval(Number(e.target.value))}
            disabled={!autoRefresh}
            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 light:bg-slate-100 light:border-slate-300 text-xs font-mono text-slate-200 light:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-sky-500 transition-colors"
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>
        </div>
      </div>

      {/* Right: Last Updated info + Refresh Now Button */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 light:text-slate-500">
          <span className="relative flex h-2 w-2">
            {isRefreshing && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isRefreshing
                  ? 'bg-sky-400'
                  : isBackendConnected
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
            />
          </span>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last sync: {formatTime(lastUpdated)}</span>
        </div>

        <button
          type="button"
          onClick={onRefreshNow}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 text-slate-200 light:text-slate-800 border border-slate-700 light:border-slate-300 text-xs font-medium shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : 'text-slate-400'}`}
          />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
        </button>
      </div>
    </div>
  );
}
