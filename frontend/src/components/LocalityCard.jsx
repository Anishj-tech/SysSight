import React, { useMemo } from 'react';
import { Layers, Zap, TrendingUp, Cpu } from 'lucide-react';
import { Card } from './ui/Card';

export function LocalityCard({
  data,
  loading = false,
  error = null,
  onRetry,
  onViewRaw,
}) {
  const result = data?.parsed || data || {};

  // Defensive extraction of locality metrics
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

  // Relative width calculation for comparison bar
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
        <div className="p-3 rounded-lg bg-sky-950/40 light:bg-sky-50 border border-sky-800/40 light:border-sky-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-sky-900/60 light:bg-sky-200 text-sky-400 light:text-sky-800">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200 light:text-slate-900 block">
                Row-Major Cache Speedup
              </span>
              <span className="text-[11px] text-slate-400 light:text-slate-600">
                Stride-1 sequential traversal vs strided column access
              </span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-lg font-bold text-sky-400 light:text-sky-700">
              {ratio > 0 ? `${ratio.toFixed(2)}x` : '—'}
            </span>
            <span className="text-[10px] text-slate-500 block uppercase">faster</span>
          </div>
        </div>

        {/* Visual Benchmark Comparison */}
        <div className="space-y-3 font-mono text-xs">
          {/* Row-Major Bar */}
          <div className="p-2.5 rounded bg-slate-950/60 light:bg-slate-50 border border-slate-800/80 light:border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-emerald-400 light:text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Row-Major (Sequential Cache Lines)
              </span>
              <span className="text-slate-200 light:text-slate-900 font-bold">
                {rowMajorTime > 0 ? `${rowMajorTime.toFixed(4)}s` : '—'}
              </span>
            </div>
            <div className="w-full bg-slate-800 light:bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${rowPct}%` }}
              />
            </div>
          </div>

          {/* Column-Major Bar */}
          <div className="p-2.5 rounded bg-slate-950/60 light:bg-slate-50 border border-slate-800/80 light:border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-amber-400 light:text-amber-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Column-Major (Frequent Cache Misses)
              </span>
              <span className="text-slate-200 light:text-slate-900 font-bold">
                {colMajorTime > 0 ? `${colMajorTime.toFixed(4)}s` : '—'}
              </span>
            </div>
            <div className="w-full bg-slate-800 light:bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${colPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Individual Iteration Runs if present */}
        {runs.length > 0 && (
          <div className="border-t border-slate-800/80 light:border-slate-100 pt-3">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
              Individual Benchmark Iterations
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              {runs.map((r, i) => (
                <div
                  key={i}
                  className="p-1.5 rounded bg-slate-950/40 light:bg-slate-100 border border-slate-800/60 light:border-slate-200"
                >
                  <span className="text-slate-500 text-[10px] block">Run #{r.run ?? i + 1}</span>
                  <div className="flex justify-between text-slate-300 light:text-slate-800">
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
