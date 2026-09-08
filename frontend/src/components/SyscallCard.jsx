import React, { useMemo } from 'react';
import { Binary, Play } from 'lucide-react';
import { Card } from './ui/Card';
import { ExitCodeBadge } from './StatusBadge';

function normalizeSyscall(item) {
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
      list = Object.entries(parsed).map(([k, v]) => ({
        syscall: k,
        ...(typeof v === 'object' ? v : { calls: v }),
      }));
    }

    const normalized = list.map(normalizeSyscall);
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
        /* Primary Action Button: Amber */
        <button
          type="button"
          onClick={onRunStrace}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber hover:bg-amber/90 active:bg-amber/80 text-navy text-xs font-bold shadow-sm transition-all border border-amber disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-3 h-3 fill-navy text-navy" />
          <span>{loading ? 'Tracing...' : 'Run strace'}</span>
        </button>
      }
    >
      {isIdle ? (
        /* Empty / Idle State before first run */
        <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-mist/60 flex items-center justify-center text-navy">
            <Binary className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-navy">
              System Call Analysis Not Triggered
            </h4>
            <p className="text-xs text-navy/70 max-w-md mt-1 font-sans">
              `strace -c ls` intercepts and counts each Linux kernel system call made when listing directory contents.
              Because tracing attaches ptrace to a child process, it is executed strictly on demand.
            </p>
          </div>
          <button
            type="button"
            onClick={onRunStrace}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber hover:bg-amber/90 active:bg-amber/80 text-navy text-xs font-bold shadow-sm border border-amber transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-navy text-navy" />
            <span>Execute strace -c ls</span>
          </button>
        </div>
      ) : (
        /* Results Table and Metrics */
        <div className="space-y-3">
          {/* Summary metrics bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-mist/30 border border-mist text-xs font-mono">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-navy/60 text-[10px] block">TOTAL CALLS</span>
                <span className="font-bold text-navy">{totalCalls}</span>
              </div>
              <div>
                <span className="text-navy/60 text-[10px] block">ERRORS</span>
                <span className={`font-bold ${totalErrors > 0 ? 'text-amber' : 'text-navy'}`}>
                  {totalErrors}
                </span>
              </div>
              <div>
                <span className="text-navy/60 text-[10px] block">TOTAL TIME</span>
                <span className="font-bold text-ink">
                  {typeof totalTime === 'number' ? `${totalTime.toFixed(6)}s` : totalTime}
                </span>
              </div>
            </div>

            {data?.exit_code !== undefined && (
              <ExitCodeBadge code={data.exit_code} />
            )}
          </div>

          {/* Syscalls table */}
          <div className="w-full overflow-x-auto max-h-72 rounded border border-mist bg-paper">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="sticky top-0 bg-mist/60 backdrop-blur-sm z-10 border-b border-mist text-navy font-semibold">
                <tr>
                  <th className="px-3 py-2">Syscall</th>
                  <th className="px-3 py-2 text-right">% Time</th>
                  <th className="px-3 py-2 text-right">Calls</th>
                  <th className="px-3 py-2 text-right">Errors</th>
                  <th className="px-3 py-2 text-right">Seconds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60 bg-paper">
                {syscallList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-navy/60 italic font-sans">
                      No parsed syscall statistics available in response. Inspect raw output.
                    </td>
                  </tr>
                ) : (
                  syscallList.map((row, idx) => (
                    <tr
                      key={`${row.syscall}-${idx}`}
                      className="hover:bg-mist/30 transition-colors"
                    >
                      <td className="px-3 py-1.5 font-bold text-navy">
                        {row.syscall}
                      </td>
                      <td className="px-3 py-1.5 text-right font-semibold text-ink">
                        {row.timePct > 0 ? `${row.timePct.toFixed(1)}%` : '0.0%'}
                      </td>
                      <td className="px-3 py-1.5 text-right text-ink">
                        {row.calls}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {row.errors > 0 ? (
                          <span className="text-amber font-bold">{row.errors}</span>
                        ) : (
                          <span className="text-navy/50">0</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right text-navy/70">
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
