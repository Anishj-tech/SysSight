import React from 'react';
import { AlertCircle, RefreshCw, Terminal } from 'lucide-react';

export function Card({
  title,
  subtitle,
  icon: Icon,
  commandBadge,
  onViewRaw,
  onRetry,
  loading = false,
  error = null,
  headerAction = null,
  className = '',
  children,
}) {
  return (
    <div
      className={`rounded-lg border border-slate-800 bg-slate-900/90 light:border-slate-200 light:bg-white text-slate-100 light:text-slate-900 transition-colors duration-150 flex flex-col overflow-hidden ${className}`}
    >
      {/* Card Header */}
      {(title || subtitle || Icon || commandBadge || onViewRaw || headerAction) && (
        <div className="px-4 py-3 border-b border-slate-800/80 light:border-slate-100 flex items-center justify-between gap-3 bg-slate-900/60 light:bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-1.5 rounded-md bg-slate-800 text-sky-400 light:bg-slate-100 light:text-sky-600 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100 light:text-slate-900 truncate">
                  {title}
                </h3>
                {commandBadge && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800/90 text-slate-300 light:bg-slate-100 light:text-slate-700 border border-slate-700/60 light:border-slate-200">
                    {commandBadge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-400 light:text-slate-500 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerAction}

            {onViewRaw && (
              <button
                type="button"
                onClick={onViewRaw}
                title="Inspect raw command output in console"
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 light:text-slate-500 light:hover:text-sky-600 light:hover:bg-slate-100 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Raw Output</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Content Area */}
      <div className="p-4 flex-1 relative min-w-0">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/40 light:bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-b-lg">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 light:bg-white light:border-slate-200 text-xs text-slate-300 light:text-slate-700 shadow-md">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Fetching live metrics...</span>
            </div>
          </div>
        )}

        {error ? (
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
            <div className="p-2 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-200 light:text-slate-800 max-w-sm">
              Failed to load live data
            </p>
            <p className="text-xs font-mono text-rose-400 light:text-rose-600 max-w-md break-words">
              {error.message || 'Unknown network or execution error.'}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 text-slate-200 light:text-slate-800 border border-slate-700 light:border-slate-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
