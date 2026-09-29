import React, { useMemo } from 'react';
import { HardDrive, Activity, ArrowDownCircle, ArrowUpCircle, Clock, Zap } from 'lucide-react';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';

export function DiskCard({
  data,
  loading = false,
  error = null,
  onRetry,
  onViewRaw,
}) {
  const parsed = data?.parsed || null;

  const cpu = useMemo(() => {
    const defaultCpu = { user: 0.0, system: 0.0, iowait: 0.0, idle: 100.0 };
    if (!parsed || !parsed.cpu) return defaultCpu;
    return {
      user: Number(parsed.cpu.user ?? 0),
      system: Number(parsed.cpu.system ?? 0),
      iowait: Number(parsed.cpu.iowait ?? 0),
      idle: Number(parsed.cpu.idle ?? 100),
    };
  }, [parsed]);

  const devices = useMemo(() => {
    if (!parsed || !Array.isArray(parsed.devices)) return [];
    return parsed.devices;
  }, [parsed]);

  // Aggregate throughput metrics
  const totals = useMemo(() => {
    let totalReadMb = 0;
    let totalWriteMb = 0;
    let totalIops = 0;
    for (const d of devices) {
      totalReadMb += Number(d.read_mb_s || 0);
      totalWriteMb += Number(d.write_mb_s || 0);
      totalIops += Number(d.read_iops || 0) + Number(d.write_iops || 0);
    }
    return {
      readMb: totalReadMb.toFixed(2),
      writeMb: totalWriteMb.toFixed(2),
      iops: totalIops.toFixed(1),
    };
  }, [devices]);

  return (
    <Card
      title="Disk & I/O Performance"
      subtitle={`${devices.length} block devices tracked • ${totals.readMb} MB/s read, ${totals.writeMb} MB/s write`}
      icon={HardDrive}
      commandBadge="iostat -xz 1 3"
      loading={loading}
      error={error}
      onRetry={onRetry}
      onViewRaw={onViewRaw}
      className="col-span-full"
    >
      <div className="space-y-4">
        {/* CPU & I/O Wait Utilization Cards */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-navy/70" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-navy/70 font-semibold">
              CPU I/O State Snapshot
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* User CPU */}
            <div className="p-2.5 rounded-md bg-mist/30 border border-mist">
              <div className="flex items-center justify-between text-[10px] font-mono text-navy/60 uppercase mb-1">
                <span>User CPU</span>
                <span className="font-bold text-navy">{cpu.user.toFixed(1)}%</span>
              </div>
              <ProgressBar value={cpu.user} max={100} size="sm" variant="navy" />
            </div>

            {/* System CPU */}
            <div className="p-2.5 rounded-md bg-mist/30 border border-mist">
              <div className="flex items-center justify-between text-[10px] font-mono text-navy/60 uppercase mb-1">
                <span>System CPU</span>
                <span className="font-bold text-navy">{cpu.system.toFixed(1)}%</span>
              </div>
              <ProgressBar value={cpu.system} max={100} size="sm" variant="navy" />
            </div>

            {/* I/O Wait (Crucial metric for disk performance) */}
            <div className="p-2.5 rounded-md bg-mist/30 border border-mist">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase mb-1">
                <span className="text-navy/60">I/O Wait</span>
                <span
                  className={`font-bold ${
                    cpu.iowait > 2.0 ? 'text-amber' : 'text-navy'
                  }`}
                >
                  {cpu.iowait.toFixed(1)}%
                </span>
              </div>
              <ProgressBar
                value={cpu.iowait}
                max={100}
                size="sm"
                variant={cpu.iowait > 2.0 ? 'amber' : 'navy'}
              />
            </div>

            {/* Idle CPU */}
            <div className="p-2.5 rounded-md bg-mist/30 border border-mist">
              <div className="flex items-center justify-between text-[10px] font-mono text-navy/60 uppercase mb-1">
                <span>Idle CPU</span>
                <span className="font-bold text-navy">{cpu.idle.toFixed(1)}%</span>
              </div>
              <ProgressBar value={cpu.idle} max={100} size="sm" variant="navy" />
            </div>
          </div>
        </div>

        {/* Storage Devices Table */}
        <div className="border-t border-mist pt-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-navy/70 font-semibold">
              Storage Devices & Throughput
            </span>

            <div className="flex items-center gap-3 text-xs font-mono text-navy/80">
              <div className="flex items-center gap-1">
                <ArrowDownCircle className="w-3.5 h-3.5 text-navy" />
                <span>Read: <strong className="text-ink">{totals.readMb} MB/s</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowUpCircle className="w-3.5 h-3.5 text-amber" />
                <span>Write: <strong className="text-ink">{totals.writeMb} MB/s</strong></span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded border border-mist bg-paper">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-mist/60 border-b border-mist shadow-sm">
                <tr>
                  <th className="px-3 py-2 font-semibold text-navy whitespace-nowrap">Device</th>
                  <th className="px-3 py-2 font-semibold text-navy text-right whitespace-nowrap">Read MB/s</th>
                  <th className="px-3 py-2 font-semibold text-navy text-right whitespace-nowrap">Write MB/s</th>
                  <th className="px-3 py-2 font-semibold text-navy text-right whitespace-nowrap">IOPS (r / w)</th>
                  <th className="px-3 py-2 font-semibold text-navy text-right whitespace-nowrap">Await (ms)</th>
                  <th className="px-3 py-2 font-semibold text-navy text-left whitespace-nowrap min-w-[140px]">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60 bg-paper font-mono">
                {devices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-navy/60 italic font-sans"
                    >
                      No active storage device metrics captured by iostat -xz 1 3.
                    </td>
                  </tr>
                ) : (
                  devices.map((dev) => {
                    const readMb = Number(dev.read_mb_s || 0);
                    const writeMb = Number(dev.write_mb_s || 0);
                    const readIops = Number(dev.read_iops || 0);
                    const writeIops = Number(dev.write_iops || 0);
                    const util = Number(dev.util_percent || 0);
                    const awaitMs = Number(dev.await || 0);

                    return (
                      <tr
                        key={dev.device}
                        className="hover:bg-mist/30 transition-colors"
                      >
                        {/* Device Name */}
                        <td className="px-3 py-2 text-ink whitespace-nowrap font-bold text-xs text-navy">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 rounded bg-mist/60 text-navy">
                              <HardDrive className="w-3 h-3" />
                            </span>
                            <span>{dev.device}</span>
                          </div>
                        </td>

                        {/* Read Throughput */}
                        <td className="px-3 py-2 text-right whitespace-nowrap text-[11px]">
                          <span className={readMb > 0 ? 'text-navy font-semibold' : 'text-navy/50'}>
                            {readMb.toFixed(2)}
                          </span>
                        </td>

                        {/* Write Throughput */}
                        <td className="px-3 py-2 text-right whitespace-nowrap text-[11px]">
                          <span className={writeMb > 0 ? 'text-amber font-bold' : 'text-navy/50'}>
                            {writeMb.toFixed(2)}
                          </span>
                        </td>

                        {/* IOPS */}
                        <td className="px-3 py-2 text-right whitespace-nowrap text-[11px] text-navy/80">
                          <span>{readIops.toFixed(1)} r / {writeIops.toFixed(1)} w</span>
                        </td>

                        {/* Await */}
                        <td className="px-3 py-2 text-right whitespace-nowrap text-[11px]">
                          <span className={awaitMs > 10 ? 'text-amber font-bold' : 'text-navy/70'}>
                            {awaitMs > 0 ? awaitMs.toFixed(1) : '—'}
                          </span>
                        </td>

                        {/* Utilization Bar */}
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={util}
                              max={100}
                              size="sm"
                              variant={util > 60 ? 'amber' : 'navy'}
                              className="w-24"
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                util > 60 ? 'text-amber' : 'text-navy'
                              }`}
                            >
                              {util.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}
