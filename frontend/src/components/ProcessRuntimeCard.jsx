import React, { useState, useMemo } from 'react';
import { Clock, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from './ui/Card';
import { ProcessStateBadge } from './StatusBadge';

// Helper to parse STIME/STARTED to a JS Date
function parseStartTime(stimeStr, currentTimestampStr) {
  const now = currentTimestampStr ? new Date(currentTimestampStr) : new Date();
  
  if (!stimeStr || stimeStr === '—') return now;

  // 1. HH:MM or HH:MM:SS (e.g. 09:44 or 09:44:32)
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(stimeStr)) {
    const parts = stimeStr.split(':').map(Number);
    const d = new Date(now);
    d.setHours(parts[0], parts[1], parts.length === 3 ? parts[2] : 0, 0);
    // If parsed time is slightly in the future, it's from yesterday
    if (d > now) d.setDate(d.getDate() - 1);
    return d;
  }
  
  // 2. MmmDD or Mmm DD (e.g. Sep18 or Sep 18)
  const matchMmm = stimeStr.match(/^([A-Za-z]{3})\s*(\d{1,2})$/);
  if (matchMmm) {
    const d = new Date(`${matchMmm[1]} ${matchMmm[2]}, ${now.getFullYear()}`);
    if (d > now) d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  
  // 3. YYYY (e.g. 2023)
  if (/^\d{4}$/.test(stimeStr)) {
    return new Date(`${stimeStr}-01-01T00:00:00`);
  }
  
  // Fallback
  const parsed = new Date(stimeStr);
  if (!isNaN(parsed)) return parsed;
  
  return now;
}

// Helper to format ms duration to human-readable string
function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  
  if (d > 0) return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, '0')}s`;
  return `${sec}s`;
}

// Helper to parse ps etime format (DD-hh:mm:ss, hh:mm:ss, mm:ss) to milliseconds
function parseElapsedTimeToMs(elapsedStr) {
  if (!elapsedStr || elapsedStr === '—') return 0;
  let d = 0, h = 0, m = 0, s = 0;
  
  const daysSplit = elapsedStr.split('-');
  let timePart = elapsedStr;
  
  if (daysSplit.length === 2) {
    d = parseInt(daysSplit[0], 10) || 0;
    timePart = daysSplit[1];
  }
  
  const timeSplit = timePart.split(':');
  if (timeSplit.length === 3) {
    h = parseInt(timeSplit[0], 10) || 0;
    m = parseInt(timeSplit[1], 10) || 0;
    s = parseInt(timeSplit[2], 10) || 0;
  } else if (timeSplit.length === 2) {
    m = parseInt(timeSplit[0], 10) || 0;
    s = parseInt(timeSplit[1], 10) || 0;
  } else if (timeSplit.length === 1) {
    s = parseInt(timeSplit[0], 10) || 0;
  }
  
  return ((d * 86400) + (h * 3600) + (m * 60) + s) * 1000;
}

function normalizeProcess(item, index, currentTimestamp) {
  if (!item || typeof item !== 'object') return null;

  const pid = item.pid ?? item.PID ?? '—';
  const state = item.state ?? item.stat ?? item.s ?? item.State ?? item.S ?? '—';
  const command = item.cmd ?? item.command ?? item.args ?? item.CMD ?? item.COMMAND ?? '—';
  const stimeRaw = item.started ?? item.STARTED ?? item.stime ?? item.STIME ?? item.start ?? item.START ?? '—';
  const elapsedRaw = item.elapsed ?? item.ELAPSED ?? item.etime ?? item.ETIME;
  const rawCpu = item.cpu ?? item['%cpu'] ?? item.pcpu ?? item.CPU ?? 0;
  const rawMem = item.mem ?? item['%mem'] ?? item.pmem ?? item.MEM ?? 0;
  
  const cpu = parseFloat(rawCpu) || 0;
  const mem = parseFloat(rawMem) || 0;

  const now = currentTimestamp ? new Date(currentTimestamp) : new Date();
  
  let elapsedMs = 0;
  let startDate = null;

  if (elapsedRaw && elapsedRaw !== '—') {
    elapsedMs = parseElapsedTimeToMs(elapsedRaw);
    startDate = new Date(now.getTime() - elapsedMs);
  } else {
    // Fallback to STIME if etime is not provided
    startDate = parseStartTime(stimeRaw, currentTimestamp);
    elapsedMs = Math.max(0, now.getTime() - startDate.getTime());
  }

  // Filter out empty rows or headers that got mixed in
  if (pid === '—' && command === '—') return null;

  return {
    id: `${pid}-${index}`,
    pid,
    state,
    command,
    stimeRaw,
    startDate,
    elapsedMs,
    cpu,
    mem,
  };
}

export function ProcessRuntimeCard({
  data,
  loading = false,
  error = null,
  onRetry,
  onViewRaw,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('elapsedMs');
  const [sortDirection, setSortDirection] = useState('desc');

  const rawList = useMemo(() => {
    const parsed = data?.parsed;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.processes)) return parsed.processes;
    if (parsed && Array.isArray(parsed.threads)) return parsed.threads;
    if (parsed && Array.isArray(parsed.items)) return parsed.items;
    return [];
  }, [data]);

  const normalizedList = useMemo(() => {
    // We want unique processes by PID since ps -eLf returns threads. 
    // Usually the main process thread is where LWP == PID.
    // However, to keep it simple and robust, we can just deduplicate by PID.
    const deduped = new Map();
    rawList.forEach((item, index) => {
      const proc = normalizeProcess(item, index, data?.timestamp);
      if (proc && proc.pid !== '—') {
        if (!deduped.has(proc.pid)) {
          deduped.set(proc.pid, proc);
        }
      }
    });
    return Array.from(deduped.values());
  }, [rawList, data?.timestamp]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedList;

    return normalizedList.filter((proc) => {
      const pidStr = String(proc.pid).toLowerCase();
      const cmdStr = String(proc.command).toLowerCase();
      return pidStr.includes(q) || cmdStr.includes(q);
    });
  }, [normalizedList, searchQuery]);

  const sortedList = useMemo(() => {
    const list = [...filteredList];
    list.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
    return list;
  }, [filteredList, sortColumn, sortDirection]);

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection(
        columnKey === 'elapsedMs' || columnKey === 'cpu' || columnKey === 'mem'
          ? 'desc'
          : 'asc'
      );
    }
  };

  const columns = [
    { key: 'pid', label: 'PID', align: 'left', sortable: true },
    {
      key: 'command',
      label: 'Process',
      align: 'left',
      sortable: true,
      cellClassName: 'font-mono text-ink max-w-[200px] sm:max-w-xs truncate',
      render: (val) => (
        <span title={val} className="truncate block font-mono">
          {val}
        </span>
      ),
    },
    {
      key: 'state',
      label: 'State',
      align: 'center',
      sortable: true,
      render: (val) => <ProcessStateBadge state={val} />,
    },
    {
      key: 'stimeRaw',
      label: 'Started At',
      align: 'right',
      sortable: true,
      cellClassName: 'font-mono text-navy',
    },
    {
      key: 'elapsedMs',
      label: 'Running For',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="font-mono font-bold text-amber">
          {formatDuration(val)}
        </span>
      ),
    },
  ];

  // Optional Highlight Stats
  const longestRunning = normalizedList.length > 0 
    ? [...normalizedList].sort((a, b) => b.elapsedMs - a.elapsedMs)[0] 
    : null;
    
  return (
    <Card
      title="Process Runtime Analysis"
      subtitle="Track active processes and elapsed runtime"
      icon={Clock}
      commandBadge="ps -eLf"
      loading={loading}
      error={error}
      onRetry={onRetry}
      onViewRaw={onViewRaw}
      className="col-span-full"
    >
      <div className="space-y-4">
        {/* Highlight Summary */}
        {!loading && !error && normalizedList.length > 0 && (
          <div className="flex flex-wrap gap-4 p-3 rounded-md bg-mist/20 border border-mist/50">
            <div className="flex-1 min-w-[200px]">
              <div className="text-[10px] uppercase tracking-wider text-navy/70 font-bold mb-1">
                Longest Running
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-ink text-sm truncate max-w-[180px]" title={longestRunning?.command}>
                  {longestRunning?.command}
                </span>
                <span className="font-mono text-amber font-bold text-sm">
                  {formatDuration(longestRunning?.elapsedMs || 0)}
                </span>
              </div>
            </div>
            <div className="w-px bg-mist/50 hidden sm:block"></div>
            <div className="flex-1 min-w-[100px]">
              <div className="text-[10px] uppercase tracking-wider text-navy/70 font-bold mb-1">
                Active Processes
              </div>
              <div className="font-mono text-ink text-sm">
                {normalizedList.length}
              </div>
            </div>
          </div>
        )}

        {/* Filter and controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-navy/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PID or process name..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-paper border border-mist text-xs font-mono text-ink placeholder:text-navy/40 focus:outline-none focus:border-amber transition-colors shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-3 text-xs font-mono text-navy">
            <span className="flex items-center gap-2">
              <span className="hidden sm:inline">Sort by:</span>
              <select 
                value={sortColumn}
                onChange={(e) => handleSort(e.target.value)}
                className="bg-paper border border-mist rounded text-xs px-2 py-1 focus:outline-none focus:border-amber text-ink"
              >
                <option value="elapsedMs">Runtime</option>
                <option value="cpu">CPU Usage</option>
                <option value="mem">Memory Usage</option>
                <option value="pid">PID</option>
              </select>
            </span>
          </div>
        </div>

        {/* Desktop View Table */}
        <div className="hidden sm:block">
          <div className="w-full overflow-x-auto overflow-y-auto max-h-[360px] rounded border border-mist bg-paper">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-mist/60 backdrop-blur-sm z-10 border-b border-mist shadow-sm">
                <tr>
                  {columns.map((col) => {
                    const isSorted = sortColumn === col.key;
                    return (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`px-3 py-2 font-semibold text-navy select-none cursor-pointer hover:text-ink whitespace-nowrap ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-flex items-center gap-1.5 ${
                            col.align === 'right'
                              ? 'justify-end w-full'
                              : col.align === 'center'
                              ? 'justify-center w-full'
                              : ''
                          }`}
                        >
                          <span>{col.label}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-amber" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-amber" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30 hover:opacity-100" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60 bg-paper font-mono">
                {sortedList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-navy/60 italic font-sans"
                    >
                      {rawList.length === 0
                        ? 'No process data available.'
                        : 'No processes match your filter query.'}
                    </td>
                  </tr>
                ) : (
                  sortedList.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-mist/30 transition-colors"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-3 py-2 text-ink whitespace-nowrap text-[11px] ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                          } ${col.cellClassName || ''}`}
                        >
                          {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View List */}
        <div className="sm:hidden space-y-2 max-h-[360px] overflow-y-auto">
          {sortedList.length === 0 ? (
            <div className="py-6 text-center text-navy/60 text-xs italic font-sans">
              {rawList.length === 0 ? 'No process data available.' : 'No matching processes.'}
            </div>
          ) : (
            sortedList.map((proc) => (
              <div
                key={proc.id}
                className="p-2.5 rounded border border-mist bg-mist/20 text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy">PID {proc.pid}</span>
                  </div>
                  <ProcessStateBadge state={proc.state} />
                </div>
                <div className="truncate text-ink text-[11px]" title={proc.command}>
                  {proc.command}
                </div>
                <div className="flex items-center justify-between text-[10px] text-navy/80 pt-1 border-t border-mist">
                  <span>Started: <strong className="text-ink">{proc.stimeRaw}</strong></span>
                  <span>Runtime: <strong className="text-amber font-bold">{formatDuration(proc.elapsedMs)}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
