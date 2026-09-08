import React, { useMemo } from 'react';
import { Binary, Play, Terminal, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { ExitCodeBadge } from './StatusBadge';

/**
 * Normalizes strace parsed syscall entries
 */
function normalizeSyscall(item, index) {
  if (!item || typeof item !== 'object') {
    return {
      syscall: String(item || '—'),
      calls: 0,
      errors: 0,
      timePct: 0,
      seconds: 0,
      usecsPerCall: 0,
    };
  }

  const syscall = item.syscall ?? item.name ?? item.Syscall ?? '—';
  const calls = parseInt(item.calls ?? item.count ?? item.Calls ?? 0, 10) || 0;
  const errors = parseInt(item.errors ?? item.Errors ?? 0, 10) || 0;
  const timePct = parseFloat(item.time_pct ?? item['%time'] ?? item.time_percent ?? 0) || 0;
  const seconds = parseFloat(item.seconds ?? item.time ?? item.total_seconds ?? 0) || 0;
  const usecsPerCall = parseInt(item.usecs_per_call ?? item['usecs/call'] ?? 0, 10) || 0;

  return {
    syscall,
    calls,
    errors,
    timePct,
    seconds,
    usecsPerCall,
  };
}

export function SyscallCard({
  data,
  loading = false,
  error = null,
  status = 'idle',
  onRunStrace,
  onViewRaw,
}) {
  const parsed = data?.parsed;
  const isIdle = status === 'idle' && !data && !loading && !error;

  const { syscallList, totalCalls, totalErrors, totalTime } = useMemo(() => {
    if (!parsed) {
      return { syscallList: [], totalCalls: 0, totalErrors: 0, totalTime: 0 };
    }

    let list = [];
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (Array.isArray(parsed.syscalls)) {
      list = parsed.syscalls;
    } else if (Array.isArray(parsed.items)) {
      list = parsed.items;
    } else if (typeof parsed === 'object') {
      // Key-value dictionary of syscalls
      list = Object.entries(parsed).map(([k, v]) => ({
        syscall: k,
        ...(typeof v === 'object' ? v : { calls: v }),
      }));
    }

    const normalized = list.map(normalizeSyscall);
    // Sort descending by calls or timePct
    normalized.sort((a, b) => b.timePct - a.timePct || b.calls - a.calls);

    const callsSum = parsed.total_calls ?? normalized.reduce((acc, cur) => acc + cur.calls, 0);
    const errorsSum = parsed.total_errors ?? normalized.reduce((acc, cur) => acc + cur.errors, 0);
    const timeSum = parsed.total_time ?? normalized.reduce((acc, cur) => acc + cur.seconds, 0);

    return {
      syscallList: normalized,
      totalCalls: callsSum,
      totalErrors: errorsSum,
      totalTime: timeSum,
    };
  }, [parsed]);

  return (
    <Card
      title="System Call Profiler"
      subtitle="Kernel syscall tracing via strace -c ls (Manual trigger only)"
      icon={Binary}
      commandBadge="strace -c ls"
      loading={loading}
      error={error}
      onRetry={onRunStrace}
      onViewRaw={data ? onViewRaw : null}
      headerAction={
        <button
          type="button"
          onClick={onRunStrace}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 light:bg-sky-600 light:hover:bg-sky-500 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-3 h-3 fill-white" />
          <span>{loading ? 'Tracing...' : 'Run strace'}</span>
        </button>
      }
    >
      {isIdle ? (
        /* Empty / Idle State before first run */
        <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 light:bg-slate-100 flex items-center justify-center text-sky-400">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200 light:text-slate-800">
              System Call Analysis Not Triggered
            </h4>
            <p className="text-xs text-slate-400 light:text-slate-600 max-w-sm mt-1">
              `strace -c ls` intercepts and counts each Linux kernel system call made when listing directory contents.
              Because tracing attaches ptrace to a child process, it is executed strictly on demand.
            </p>
          </div>
          <button
            type="button"
            onClick={onRunStrace}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Execute strace -c ls</span>
          </button>
        </div>
      ) : (
        /* Results Table and Metrics */
        <div className="space-y-3">
          {/* Summary metrics bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-slate-950/60 light:bg-slate-50 border border-slate-800/80 light:border-slate-200 text-xs font-mono">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 text-[10px] block">TOTAL CALLS</span>
                <span className="font-semibold text-sky-400">{totalCalls}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">ERRORS</span>
                <span className={`font-semibold ${totalErrors > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {totalErrors}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">TOTAL TIME</span>
                <span className="font-semibold text-slate-200 light:text-slate-800">
                  {typeof totalTime === 'number' ? `${totalTime.toFixed(6)}s` : totalTime}
                </span>
              </div>
            </div>

            {data?.exit_code !== undefined && (
              <ExitCodeBadge code={data.exit_code} />
            )}
          </div>

          {/* Syscalls table */}
          <div className="w-full overflow-x-auto max-h-72 rounded border border-slate-800 light:border-slate-200">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="sticky top-0 bg-slate-900 light:bg-slate-100 z-10 border-b border-slate-800 light:border-slate-200 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Syscall</th>
                  <th className="px-3 py-2 text-right">% Time</th>
                  <th className="px-3 py-2 text-right">Calls</th>
                  <th className="px-3 py-2 text-right">Errors</th>
                  <th className="px-3 py-2 text-right">Seconds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 light:divide-slate-200/80 bg-slate-950/40 light:bg-white">
                {syscallList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500 italic font-sans">
                      No parsed syscall statistics available in response. Inspect raw output.
                    </td>
                  </tr>
                ) : (
                  syscallList.map((row, idx) => (
                    <tr
                      key={`${row.syscall}-${idx}`}
                      className="hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-3 py-1.5 font-semibold text-slate-200 light:text-slate-900">
                        {row.syscall}
                      </td>
                      <td className="px-3 py-1.5 text-right text-sky-400">
                        {row.timePct > 0 ? `${row.timePct.toFixed(1)}%` : '0.0%'}
                      </td>
                      <td className="px-3 py-1.5 text-right text-slate-300 light:text-slate-700">
                        {row.calls}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {row.errors > 0 ? (
                          <span className="text-rose-400 font-bold">{row.errors}</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right text-slate-400">
                        {row.seconds ? row.seconds.toFixed(6) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
