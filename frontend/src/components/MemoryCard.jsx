import React from 'react';
import { HardDrive, PieChart } from 'lucide-react';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';

/**
 * Parses size strings like "15Gi", "15G", "512Mi", "4.2M" into a relative numeric value in MB
 */
function parseSizeToMb(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;

  const str = String(val).trim();
  const match = str.match(/^([\d.]+)\s*([KkMmGgTt]?[iI]?[Bb]?)$/);
  if (!match) {
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  if (unit.startsWith('T')) return num * 1024 * 1024;
  if (unit.startsWith('G')) return num * 1024;
  if (unit.startsWith('M')) return num;
  if (unit.startsWith('K')) return num / 1024;
  return num / (1024 * 1024);
}

/**
 * Defensive key accessor for free -h parsed data
 */
function getMemoryValues(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return {
      ram: { total: '—', used: '—', free: '—', shared: '—', buffCache: '—', available: '—', pct: 0 },
      swap: { total: '—', used: '—', free: '—', pct: 0 },
    };
  }

  // Check nested or flat structures
  const mem = parsed.mem || parsed.memory || parsed.RAM || parsed;
  const swap = parsed.swap || parsed.SWAP || parsed;

  const total = mem.total || mem.Total || '—';
  const used = mem.used || mem.Used || '—';
  const free = mem.free || mem.Free || '—';
  const shared = mem.shared || mem.Shared || '—';
  const buffCache = mem.buff_cache || mem.buffCache || mem['buff/cache'] || mem.BuffCache || '—';
  const available = mem.available || mem.Available || '—';

  const swapTotal = swap.swap_total || swap.total_swap || swap.total || (parsed !== swap ? swap.total : '—') || '—';
  const swapUsed = swap.swap_used || swap.used_swap || swap.used || (parsed !== swap ? swap.used : '—') || '—';
  const swapFree = swap.swap_free || swap.free_swap || swap.free || (parsed !== swap ? swap.free : '—') || '—';

  // Calculate percentage
  let ramPct = 0;
  const totalMb = parseSizeToMb(total);
  const usedMb = parseSizeToMb(used);
  if (totalMb > 0) {
    ramPct = (usedMb / totalMb) * 100;
  } else if (parsed.used_percent !== undefined) {
    ramPct = parseFloat(parsed.used_percent) || 0;
  }

  let swapPct = 0;
  const swapTotalMb = parseSizeToMb(swapTotal);
  const swapUsedMb = parseSizeToMb(swapUsed);
  if (swapTotalMb > 0) {
    swapPct = (swapUsedMb / swapTotalMb) * 100;
  }

  return {
    ram: { total, used, free, shared, buffCache, available, pct: Math.min(100, Math.max(0, ramPct)) },
    swap: { total: swapTotal, used: swapUsed, free: swapFree, pct: Math.min(100, Math.max(0, swapPct)) },
  };
}

export function MemoryCard({
  data,
  loading = false,
  error = null,
  onRetry,
  onViewRaw,
}) {
  const { ram, swap } = getMemoryValues(data?.parsed);

  return (
    <Card
      title="System Memory"
      subtitle="Physical RAM & Virtual Swap Allocation"
      icon={HardDrive}
      commandBadge="free -h"
      loading={loading}
      error={error}
      onRetry={onRetry}
      onViewRaw={onViewRaw}
    >
      <div className="space-y-4">
        {/* RAM Usage Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400 font-medium">RAM Utilization</span>
            <span className="text-slate-200 light:text-slate-800 font-semibold">
              {ram.used} / {ram.total} ({ram.pct > 0 ? `${ram.pct.toFixed(1)}%` : '—'})
            </span>
          </div>
          <ProgressBar value={ram.pct} variant="auto" size="md" />
        </div>

        {/* RAM Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-2 rounded bg-slate-950/50 light:bg-slate-50 border border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Available
            </span>
            <span className="text-sm font-semibold text-emerald-400 light:text-emerald-700">
              {ram.available}
            </span>
          </div>

          <div className="p-2 rounded bg-slate-950/50 light:bg-slate-50 border border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Free
            </span>
            <span className="text-sm font-semibold text-slate-200 light:text-slate-800">
              {ram.free}
            </span>
          </div>

          <div className="p-2 rounded bg-slate-950/50 light:bg-slate-50 border border-slate-800/80 light:border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Buff / Cache
            </span>
            <span className="text-sm font-semibold text-slate-200 light:text-slate-800">
              {ram.buffCache}
            </span>
          </div>
        </div>

        {/* Swap Usage Section */}
        <div className="border-t border-slate-800/80 light:border-slate-100 pt-3">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400 font-medium">Swap Utilization</span>
            <span className="text-slate-200 light:text-slate-800 font-semibold">
              {swap.used} / {swap.total} ({swap.pct > 0 ? `${swap.pct.toFixed(1)}%` : '0%'})
            </span>
          </div>
          <ProgressBar value={swap.pct} variant="auto" size="sm" />

          <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-slate-400">
            <span>Free Swap: <strong className="text-slate-300 light:text-slate-700">{swap.free}</strong></span>
            <span>Shared: <strong className="text-slate-300 light:text-slate-700">{ram.shared}</strong></span>
          </div>
        </div>
      </div>
    </Card>
  );
}
