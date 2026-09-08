import React, { useMemo } from 'react';
import { Flame, Clock, Cpu } from 'lucide-react';
import { Card } from './ui/Card';

/**
 * Normalizes top process entries
 */
function normalizeTopItem(item, index) {
  if (!item || typeof item !== 'object') {
    return {
      rank: index + 1,
      pid: '—',
      user: '—',
      cpu: 0,
      mem: 0,
      command: String(item || '—'),
    };
  }

  const pid = item.pid ?? item.PID ?? '—';
  const user = item.user ?? item.USER ?? 'root';
  const rawCpu = item.cpu ?? item['%cpu'] ?? item.pcpu ?? item.CPU ?? 0;
  const rawMem = item.mem ?? item['%mem'] ?? item.pmem ?? item.MEM ?? 0;
  const cpu = parseFloat(rawCpu) || 0;
  const mem = parseFloat(rawMem) || 0;
  const command = item.command ?? item.cmd ?? item.COMMAND ?? item.CMD ?? item.name ?? '—';

  return {
    rank: index + 1,
    pid,
    user,
    cpu,
    mem,
    command,
  };
}

export function TopProcessesCard({
  data,
  loading = false,
  error = null,
  onRetry,
  onViewRaw,
}) {
  const parsed = data?.parsed;

  // Extract load averages and task count if present
  const loadAvg = useMemo(() => {
    if (!parsed) return null;
    const loads = parsed.load_avg || parsed.load_average || parsed.load;
    if (Array.isArray(loads)) {
      return loads.map((n) => Number(n).toFixed(2)).join(', ');
    }
    if (typeof loads === 'string') return loads;
    return null;
  }, [parsed]);

  const tasksSummary = useMemo(() => {
    if (!parsed) return null;
    const tasks = parsed.tasks || parsed.processes_count;
    if (typeof tasks === 'object') {
      return `${tasks.total ?? '—'} total, ${tasks.running ?? '—'} running`;
    }
    return null;
  }, [parsed]);

  // Extract top process array
  const topProcesses = useMemo(() => {
    let list = [];
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed && Array.isArray(parsed.processes)) {
      list = parsed.processes;
    } else if (parsed && Array.isArray(parsed.top_processes)) {
      list = parsed.top_processes;
    } else if (parsed && Array.isArray(parsed.items)) {
      list = parsed.items;
    }

    const normalized = list.map(normalizeTopItem);
    // Sort descending by CPU% and take top 8
    normalized.sort((a, b) => b.cpu - a.cpu);
    return normalized.slice(0, 8);
  }, [parsed]);

  // Find max CPU for proportional bar calculation
  const maxCpu = useMemo(() => {
    if (topProcesses.length === 0) return 100;
    const highest = Math.max(...topProcesses.map((p) => p.cpu));
    return Math.max(highest, 10);
  }, [topProcesses]);

  return (
    <Card
      title="Top CPU Consumers"
      subtitle={loadAvg ? `Load Average: ${loadAvg}` : 'Ranked dynamic CPU load'}
      icon={Flame}
      commandBadge="top -b -n 1"
      loading={loading}
      error={error}
      onRetry={onRetry}
      onViewRaw={onViewRaw}
    >
      <div className="space-y-3">
        {/* Load average and tasks header bar */}
        {(loadAvg || tasksSummary) && (
          <div className="flex items-center justify-between text-xs font-mono px-2.5 py-1.5 rounded bg-slate-950/60 light:bg-slate-50 border border-slate-800/80 light:border-slate-200 text-slate-400">
            {loadAvg && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-sky-400" />
                <span>Load: <strong className="text-slate-200 light:text-slate-800">{loadAvg}</strong></span>
              </div>
            )}
            {tasksSummary && (
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span>Tasks: <strong className="text-slate-200 light:text-slate-800">{tasksSummary}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Ranked list of top processes */}
        <div className="space-y-2">
          {topProcesses.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500 italic">
              No top process data available from top -b -n 1.
            </div>
          ) : (
            topProcesses.map((proc) => {
              const barWidth = Math.min(100, Math.max(2, (proc.cpu / maxCpu) * 100));

              return (
                <div
                  key={`${proc.pid}-${proc.rank}`}
                  className="p-2 rounded bg-slate-950/40 light:bg-slate-50/80 border border-slate-800/60 light:border-slate-200 text-xs font-mono hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-[10px] text-slate-500 font-bold shrink-0">
                        #{proc.rank}
                      </span>
                      <span className="font-semibold text-slate-200 light:text-slate-800 truncate" title={proc.command}>
                        {proc.command}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        (PID {proc.pid})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {proc.user}
                      </span>
                      <span
                        className={`font-semibold text-xs ${
                          proc.cpu > 20
                            ? 'text-rose-400'
                            : proc.cpu > 5
                            ? 'text-amber-400'
                            : 'text-sky-400'
                        }`}
                      >
                        {proc.cpu.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Minimal flat relative CPU bar */}
                  <div className="w-full bg-slate-800/80 light:bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        proc.cpu > 20
                          ? 'bg-rose-500'
                          : proc.cpu > 5
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
