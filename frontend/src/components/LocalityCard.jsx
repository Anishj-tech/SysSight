import React, { useMemo } from 'react';
import { Layers, Zap } from 'lucide-react';
import { Card } from './ui/Card';

export function LocalityCard({
  data,
  loading = false,
  error = null,
  onRetry,
  onViewRaw,
}) {
  const result = data?.parsed || data || {};

  const rowMajorTime = parseFloat(result.row_major_time ?? result.row_major ?? result.rowMajorTime ?? 0);
  const colMajorTime = parseFloat(result.col_major_time ?? result.col_major ?? result.colMajorTime ?? 0);

  const ratio = useMemo(() => {
    if (result.ratio !== undefined) return parseFloat(result.ratio);
    if (rowMajorTime > 0 && colMajorTime > 0) {
      return colMajorTime / rowMajorTime;
    }
    return 0;
  }, [result.ratio, rowMajorTime, colMajorTime]);

  const matrixSize = result.matrix_size ?? result.size ?? '2048 x 2048';
  const runs = Array.isArray(result.runs) ? result.runs : [];

  const maxTime = Math.max(rowMajorTime, colMajorTime, 0.0001);
  const rowPct = Math.max(2, (rowMajorTime / maxTime) * 100);
  const colPct = Math.max(2, (colMajorTime / maxTime) * 100);

  return (
    <Card
      title="Spatial Cache Locality"
      subtitle={`Matrix Benchmark (${matrixSize}) — Cache Miss Cost Analysis`}
      icon={Layers}
      commandBadge="locality.c"
      loading={loading}
      error={error}
      onRetry={onRetry}
      onViewRaw={data?.raw_output ? onViewRaw : null}
    >
      <div className="space-y-4">
        {/* Speedup Highlight Banner */}
        <div className="p-3 rounded-lg bg-mist/30 border border-mist flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-navy text-amber shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-navy block">
                Row-Major Cache Speedup
              </span>
              <span className="text-[11px] text-navy/70 font-sans">
                Stride-1 sequential traversal vs strided column access
              </span>
            </div>
          </div>
          <div className="text-right font-mono">
            {/* Key number highlight: amber */}
            <span className="text-xl font-extrabold text-amber">
              {ratio > 0 ? `${ratio.toFixed(2)}x` : '—'}
            </span>
            <span className="text-[10px] text-navy/60 block uppercase font-sans font-bold">faster</span>
          </div>
        </div>

        {/* Visual Benchmark Comparison */}
        <div className="space-y-3 font-mono text-xs">
          {/* Row-Major Bar */}
          <div className="p-2.5 rounded bg-mist/20 border border-mist">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-navy flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-navy"></span>
                Row-Major (Sequential Cache Lines)
              </span>
              <span className="text-ink font-bold">
                {rowMajorTime > 0 ? `${rowMajorTime.toFixed(4)}s` : '—'}
              </span>
            </div>
            <div className="w-full bg-mist h-2 rounded-full overflow-hidden">
              <div
                className="bg-navy h-full rounded-full transition-all duration-500"
                style={{ width: `${rowPct}%` }}
              />
            </div>
          </div>

          {/* Column-Major Bar */}
          <div className="p-2.5 rounded bg-mist/20 border border-mist">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-navy flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber"></span>
                Column-Major (Frequent Cache Misses)
              </span>
              <span className="text-ink font-bold">
                {colMajorTime > 0 ? `${colMajorTime.toFixed(4)}s` : '—'}
              </span>
            </div>
            <div className="w-full bg-mist h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber h-full rounded-full transition-all duration-500"
                style={{ width: `${colPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Individual Iteration Runs if present */}
        {runs.length > 0 && (
          <div className="border-t border-mist pt-3">
            <span className="text-[10px] font-mono text-navy/70 uppercase tracking-wider block mb-1.5 font-semibold">
              Individual Benchmark Iterations
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              {runs.map((r, i) => (
                <div
                  key={i}
                  className="p-1.5 rounded bg-mist/30 border border-mist"
                >
                  <span className="text-navy/60 text-[10px] block">Run #{r.run ?? i + 1}</span>
                  <div className="flex justify-between text-ink font-semibold">
                    <span>Row: {r.row_major ?? r.row ?? '—'}s</span>
                    <span>Col: {r.col_major ?? r.col ?? '—'}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
