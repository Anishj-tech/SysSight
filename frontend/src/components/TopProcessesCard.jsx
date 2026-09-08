import React, { useMemo } from 'react';
import { Flame, Clock, Cpu } from 'lucide-react';
import { Card } from './ui/Card';

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
    normalized.sort((a, b) => b.cpu - a.cpu);
    return normalized.slice(0, 8);
  }, [parsed]);

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
          <div className="flex items-center justify-between text-xs font-mono px-3 py-1.5 rounded bg-mist/30 border border-mist text-navy">
            {loadAvg && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-navy" />
                <span>Load: <strong className="text-ink font-bold">{loadAvg}</strong></span>
              </div>
            )}
            {tasksSummary && (
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-navy" />
                <span>Tasks: <strong className="text-ink font-bold">{tasksSummary}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Ranked list of top processes */}
        <div className="space-y-2">
          {topProcesses.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-navy/60 italic font-sans">
              No top process data available from top -b -n 1.
            </div>
          ) : (
            topProcesses.map((proc) => {
              const barWidth = Math.min(100, Math.max(2, (proc.cpu / maxCpu) * 100));

              return (
                <div
                  key={`${proc.pid}-${proc.rank}`}
                  className="p-2.5 rounded-md bg-paper border border-mist text-xs font-mono hover:bg-mist/15 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-[11px] text-navy/60 font-bold shrink-0">
                        #{proc.rank}
                      </span>
                      <span className="font-semibold text-ink truncate" title={proc.command}>
                        {proc.command}
                      </span>
                      <span className="text-[10px] text-navy/60 shrink-0">
                        (PID {proc.pid})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-navy/60 hidden sm:inline font-sans">
                        {proc.user}
                      </span>
                      <span
                        className={`font-bold text-xs ${
                          proc.cpu > 10 ? 'text-amber' : 'text-navy'
                        }`}
                      >
                        {proc.cpu.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Relative CPU bar */}
                  <div className="w-full bg-mist h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300 bg-amber"
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
