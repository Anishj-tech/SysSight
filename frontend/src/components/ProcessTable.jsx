import React, { useState, useMemo } from 'react';
import { ListFilter, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from './ui/Card';
import { ProcessStateBadge } from './StatusBadge';

function normalizeProcess(item, index) {
  if (!item || typeof item !== 'object') {
    return {
      id: index,
      pid: '—',
      ppid: '—',
      lwp: '—',
      nlwp: '—',
      state: '—',
      cpu: 0,
      mem: 0,
      command: String(item || '—'),
    };
  }

  const pid = item.pid ?? item.PID ?? '—';
  const ppid = item.ppid ?? item.PPID ?? '—';
  const lwp = item.lwp ?? item.LWP ?? item.tid ?? item.TID ?? '—';
  const nlwp = item.nlwp ?? item.NLWP ?? item.threads ?? item.threads_count ?? '—';
  const state = item.state ?? item.stat ?? item.s ?? item.State ?? item.S ?? '—';
  const rawCpu = item.cpu ?? item['%cpu'] ?? item.pcpu ?? item.CPU ?? 0;
  const rawMem = item.mem ?? item['%mem'] ?? item.pmem ?? item.MEM ?? 0;
  const cpu = parseFloat(rawCpu) || 0;
  const mem = parseFloat(rawMem) || 0;
  const command = item.cmd ?? item.command ?? item.args ?? item.CMD ?? item.COMMAND ?? '—';

  return {
    id: `${pid}-${lwp}-${index}`,
    pid,
    ppid,
    lwp,
    nlwp,
    state,
    cpu,
    mem,
    command,
  };
}

export function ProcessTable({
  data,
  loading = false,
  error = null,
  onRetry,
  onViewRaw,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('cpu');
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
    return rawList.map(normalizeProcess);
  }, [rawList]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedList;

    return normalizedList.filter((proc) => {
      const pidStr = String(proc.pid).toLowerCase();
      const ppidStr = String(proc.ppid).toLowerCase();
      const lwpStr = String(proc.lwp).toLowerCase();
      const cmdStr = String(proc.command).toLowerCase();
      return (
        pidStr.includes(q) ||
        ppidStr.includes(q) ||
        lwpStr.includes(q) ||
        cmdStr.includes(q)
      );
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
      setSortDirection(columnKey === 'cpu' || columnKey === 'mem' ? 'desc' : 'asc');
    }
  };

  const columns = [
    { key: 'pid', label: 'PID', align: 'left', sortable: true },
    { key: 'ppid', label: 'PPID', align: 'left', sortable: true },
    { key: 'lwp', label: 'LWP (TID)', align: 'left', sortable: true },
    { key: 'nlwp', label: 'NLWP', align: 'center', sortable: true },
    {
      key: 'state',
      label: 'State',
      align: 'center',
      sortable: true,
      render: (val) => <ProcessStateBadge state={val} />,
    },
    {
      key: 'cpu',
      label: '%CPU',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className={val > 5 ? 'text-amber font-bold' : 'text-ink'}>
          {val.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'mem',
      label: '%MEM',
      align: 'right',
      sortable: true,
      render: (val) => `${val.toFixed(1)}%`,
    },
    {
      key: 'command',
      label: 'Command',
      align: 'left',
      sortable: true,
      cellClassName: 'font-mono text-ink max-w-xs truncate',
      render: (val) => (
        <span title={val} className="truncate block font-mono">
          {val}
        </span>
      ),
    },
  ];

  return (
    <Card
      title="Thread & Process Table"
      subtitle={`${normalizedList.length} active threads tracked`}
      icon={ListFilter}
      commandBadge="ps -eLf"
      loading={loading}
      error={error}
      onRetry={onRetry}
      onViewRaw={onViewRaw}
      className="col-span-full"
    >
      <div className="space-y-3.5">
        {/* Filter and stats controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-navy/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by PID, TID, or command name..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-paper border border-mist text-xs font-mono text-ink placeholder:text-navy/40 focus:outline-none focus:border-amber transition-colors shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-navy">
            <span>
              Showing <strong className="text-amber font-bold">{sortedList.length}</strong> of{' '}
              {normalizedList.length} threads
            </span>
          </div>
        </div>

        {/* Desktop & Tablet View: Sortable Interactive Table */}
        <div className="hidden sm:block">
          <div className="w-full overflow-x-auto overflow-y-auto max-h-[420px] rounded border border-mist bg-paper">
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
                        ? 'No process data received from ps -eLf.'
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
                          className={`px-3 py-1.5 text-ink whitespace-nowrap text-[11px] ${
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

        {/* Mobile View: Process Card Deck */}
        <div className="sm:hidden space-y-2 max-h-[420px] overflow-y-auto">
          {sortedList.length === 0 ? (
            <div className="py-6 text-center text-navy/60 text-xs italic font-sans">
              {rawList.length === 0 ? 'No process data received.' : 'No matching processes.'}
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
                    <span className="text-navy/60 text-[10px]">PPID {proc.ppid}</span>
                    <span className="text-navy/60 text-[10px]">LWP {proc.lwp}</span>
                  </div>
                  <ProcessStateBadge state={proc.state} />
                </div>

                <div className="truncate text-ink text-[11px]" title={proc.command}>
                  {proc.command}
                </div>

                <div className="flex items-center justify-between text-[10px] text-navy/80 pt-1 border-t border-mist">
                  <span>CPU: <strong className={proc.cpu > 5 ? 'text-amber font-bold' : 'text-ink'}>{proc.cpu.toFixed(1)}%</strong></span>
                  <span>MEM: <strong className="text-ink">{proc.mem.toFixed(1)}%</strong></span>
                  <span>NLWP: <strong className="text-ink">{proc.nlwp}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
