import React, { useState, useMemo } from 'react';
import { Network, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export function NetworkCard({
  data,
  loading = false,
  error = null,
  onRetry,
  onViewRaw,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('all'); // 'all' | 'tcp' | 'udp'
  const [sortColumn, setSortColumn] = useState('port');
  const [sortDirection, setSortDirection] = useState('asc');

  const sockets = useMemo(() => {
    if (!data?.parsed || !Array.isArray(data.parsed)) return [];
    return data.parsed;
  }, [data]);

  // Summary counts
  const summary = useMemo(() => {
    let tcpCount = 0;
    let udpCount = 0;
    for (const s of sockets) {
      const proto = (s.protocol || '').toLowerCase();
      if (proto.includes('tcp')) tcpCount++;
      else if (proto.includes('udp')) udpCount++;
    }
    return {
      total: sockets.length,
      tcp: tcpCount,
      udp: udpCount,
    };
  }, [sockets]);

  // Filtering
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sockets.filter((item) => {
      const proto = (item.protocol || '').toLowerCase();
      if (protocolFilter !== 'all' && !proto.includes(protocolFilter)) {
        return false;
      }
      if (!q) return true;
      const portStr = String(item.port || '').toLowerCase();
      const addrStr = String(item.local_address || '').toLowerCase();
      const procStr = String(item.process || '').toLowerCase();
      const pidStr = String(item.pid || '').toLowerCase();
      const stateStr = String(item.state || '').toLowerCase();
      return (
        portStr.includes(q) ||
        addrStr.includes(q) ||
        procStr.includes(q) ||
        pidStr.includes(q) ||
        stateStr.includes(q) ||
        proto.includes(q)
      );
    });
  }, [sockets, searchQuery, protocolFilter]);

  // Sorting
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (sortColumn === 'port') {
        const aNum = typeof aVal === 'number' ? aVal : parseInt(aVal, 10) || 0;
        const bNum = typeof bVal === 'number' ? bVal : parseInt(bVal, 10) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [filtered, sortColumn, sortDirection]);

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const columns = [
    {
      key: 'protocol',
      label: 'Protocol',
      align: 'left',
      sortable: true,
      render: (val) => {
        const isTcp = String(val).toLowerCase().includes('tcp');
        return (
          <Badge variant={isTcp ? 'amber' : 'navy'} size="xs">
            {String(val).toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'port',
      label: 'Port',
      align: 'left',
      sortable: true,
      render: (val) => (
        <span className="font-bold text-navy text-xs">{val}</span>
      ),
    },
    {
      key: 'state',
      label: 'State',
      align: 'center',
      sortable: true,
      render: (val) => {
        const isListen = String(val).toUpperCase() === 'LISTEN';
        return (
          <Badge variant={isListen ? 'default' : 'subtle'} size="xs">
            {val || '—'}
          </Badge>
        );
      },
    },
    {
      key: 'local_address',
      label: 'Address',
      align: 'left',
      sortable: true,
      render: (val) => (
        <span className="text-ink font-mono text-[11px] truncate block max-w-xs" title={val}>
          {val || '0.0.0.0'}
        </span>
      ),
    },
    {
      key: 'process',
      label: 'Process',
      align: 'left',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-ink truncate" title={val}>
            {val && val !== '—' ? val : '—'}
          </span>
          {row.pid && (
            <span className="text-[10px] text-navy/60 font-mono shrink-0">
              (PID {row.pid})
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Network & Port Activity"
      subtitle={`${summary.total} active network sockets (${summary.tcp} TCP, ${summary.udp} UDP)`}
      icon={Network}
      commandBadge="ss -tulnp"
      loading={loading}
      error={error}
      onRetry={onRetry}
      onViewRaw={onViewRaw}
      className="col-span-full"
    >
      <div className="space-y-3.5">
        {/* Summary Badges and Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Summary Metric Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setProtocolFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                protocolFilter === 'all'
                  ? 'bg-navy text-paper border-navy font-bold'
                  : 'bg-paper text-navy border-mist hover:bg-mist/40'
              }`}
            >
              All Ports ({summary.total})
            </button>
            <button
              type="button"
              onClick={() => setProtocolFilter('tcp')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                protocolFilter === 'tcp'
                  ? 'bg-amber text-navy border-amber font-bold'
                  : 'bg-paper text-navy border-mist hover:bg-mist/40'
              }`}
            >
              TCP ({summary.tcp})
            </button>
            <button
              type="button"
              onClick={() => setProtocolFilter('udp')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                protocolFilter === 'udp'
                  ? 'bg-navy/80 text-paper border-navy/80 font-bold'
                  : 'bg-paper text-navy border-mist hover:bg-mist/40'
              }`}
            >
              UDP ({summary.udp})
            </button>
          </div>

          {/* Search filter input */}
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-navy/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter port, process, address..."
              className="w-full pl-8 pr-3 py-1 rounded-md bg-paper border border-mist text-xs font-mono text-ink placeholder:text-navy/40 focus:outline-none focus:border-amber transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[380px] rounded border border-mist bg-paper">
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
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          col.align === 'center' ? 'justify-center w-full' : ''
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
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-navy/60 italic font-sans"
                  >
                    {sockets.length === 0
                      ? 'No active listening sockets found.'
                      : 'No sockets match the search query.'}
                  </td>
                </tr>
              ) : (
                sorted.map((row, idx) => (
                  <tr
                    key={`${row.protocol}-${row.local_address}-${row.port}-${idx}`}
                    className="hover:bg-mist/30 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 py-2 text-ink whitespace-nowrap text-[11px] ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
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
    </Card>
  );
}
