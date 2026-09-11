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
      className={`rounded-lg border border-mist bg-paper text-ink shadow-sm flex flex-col overflow-hidden transition-all ${className}`}
    >
      {/* Card Header */}
      {(title || subtitle || Icon || commandBadge || onViewRaw || headerAction) && (
        <div className="px-4 py-3 border-b border-mist flex items-center justify-between gap-3 bg-mist/30">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-1.5 rounded-md bg-navy text-amber shrink-0 shadow-sm">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-navy truncate">
                  {title}
                </h3>
                {commandBadge && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-mist text-navy border border-mist">
                    {commandBadge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-navy/70 truncate mt-0.5 font-sans">
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium text-navy bg-mist/60 hover:bg-mist hover:text-ink transition-colors border border-mist"
              >
                <Terminal className="w-3.5 h-3.5 text-navy" />
                <span className="hidden sm:inline">Raw Output</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Content Area */}
      <div className="p-4 flex-1 relative min-w-0 bg-paper">
        {loading && (
          <div className="absolute inset-0 bg-paper/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-b-lg">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-navy text-paper text-xs shadow-md">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber" />
              <span>Fetching live metrics...</span>
            </div>
          </div>
        )}

        {error ? (
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
            <div className="p-2 rounded-full bg-mist text-navy border border-mist">
              <AlertCircle className="w-5 h-5 text-navy" />
            </div>
            <p className="text-sm font-semibold text-navy max-w-sm">
              Failed to load live data
            </p>
            <p className="text-xs font-mono text-ink/70 max-w-md break-words">
              {error.message || 'Unknown network or execution error.'}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-mist hover:bg-mist/80 text-navy border border-mist transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-navy" />
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
