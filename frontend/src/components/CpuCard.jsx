import React from 'react';
import { Cpu } from 'lucide-react';
import { Card } from './ui/Card';

function getField(parsed, ...candidateKeys) {
  if (!parsed || typeof parsed !== 'object') return null;

  for (const key of candidateKeys) {
    if (parsed[key] !== undefined && parsed[key] !== null && parsed[key] !== '') {
      return String(parsed[key]);
    }
    const normalizedKey = key.toLowerCase().replace(/[\s\-_():]+/g, '');
    for (const [k, v] of Object.entries(parsed)) {
      const normalizedK = k.toLowerCase().replace(/[\s\-_():]+/g, '');
      if (normalizedK === normalizedKey && v !== undefined && v !== null && v !== '') {
        return String(v);
      }
    }
  }
  return null;
}

export function CpuCard({
  data,
  loading = false,
  error = null,
  onRetry,
  onViewRaw,
}) {
  const parsed = data?.parsed || null;

  const architecture = getField(parsed, 'architecture', 'Architecture') || '—';
  const modelName = getField(parsed, 'model_name', 'Model name', 'Model Name') || 'Linux CPU / WSL Host';
  const vendorId = getField(parsed, 'vendor_id', 'Vendor ID', 'vendor') || '—';
  const cpus = getField(parsed, 'cpus', 'CPU(s)', 'cpus_count') || '—';
  const threadsPerCore = getField(parsed, 'threads_per_core', 'Thread(s) per core') || '—';
  const coresPerSocket = getField(parsed, 'cores_per_socket', 'Core(s) per socket') || '—';
  const sockets = getField(parsed, 'sockets', 'Socket(s)') || '—';
  const cpuMhz = getField(parsed, 'cpu_mhz', 'CPU MHz', 'cpu_max_mhz', 'CPU max MHz') || '—';
  const bogoMips = getField(parsed, 'bogomips', 'BogoMIPS') || '—';
  const opModes = getField(parsed, 'cpu_op_modes', 'CPU op-mode(s)') || '—';
  const byteOrder = getField(parsed, 'byte_order', 'Byte Order') || '—';
  const virtualization = getField(parsed, 'hypervisor_vendor', 'Hypervisor vendor', 'Virtualization') || 'WSL2 (Hyper-V)';

  const l1d = getField(parsed, 'l1d_cache', 'L1d cache') || '—';
  const l1i = getField(parsed, 'l1i_cache', 'L1i cache') || '—';
  const l2 = getField(parsed, 'l2_cache', 'L2 cache') || '—';
  const l3 = getField(parsed, 'l3_cache', 'L3 cache') || '—';

  return (
    <Card
      title="Processor & ISA"
      subtitle={modelName}
      icon={Cpu}
      commandBadge="lscpu"
      loading={loading}
      error={error}
      onRetry={onRetry}
      onViewRaw={onViewRaw}
    >
      <div className="space-y-4">
        {/* Core Hardware Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-md bg-mist/30 border border-mist">
            <span className="text-[10px] font-mono text-navy/60 uppercase tracking-wider block">
              Architecture
            </span>
            <span className="text-sm font-bold font-mono text-navy">
              {architecture}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-mist/30 border border-mist">
            <span className="text-[10px] font-mono text-navy/60 uppercase tracking-wider block">
              Logical CPUs
            </span>
            <span className="text-sm font-bold font-mono text-navy">
              {cpus}
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-mist/30 border border-mist">
            <span className="text-[10px] font-mono text-navy/60 uppercase tracking-wider block">
              Cores / Sockets
            </span>
            <span className="text-sm font-bold font-mono text-navy">
              {coresPerSocket}c / {sockets}s
            </span>
          </div>

          <div className="p-2.5 rounded-md bg-mist/30 border border-mist">
            <span className="text-[10px] font-mono text-navy/60 uppercase tracking-wider block">
              Threads/Core
            </span>
            <span className="text-sm font-bold font-mono text-navy">
              {threadsPerCore}
            </span>
          </div>
        </div>

        {/* Detailed Spec Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4 text-xs font-mono border-t border-mist pt-3">
          <div>
            <span className="text-navy/60 text-[11px] block">Vendor ID:</span>
            <span className="text-ink font-semibold truncate block">{vendorId}</span>
          </div>

          <div>
            <span className="text-navy/60 text-[11px] block">Clock / Speed:</span>
            <span className="text-ink font-semibold truncate block">
              {cpuMhz !== '—' ? `${cpuMhz} MHz` : '—'}
            </span>
          </div>

          <div>
            <span className="text-navy/60 text-[11px] block">BogoMIPS:</span>
            <span className="text-ink font-semibold truncate block">{bogoMips}</span>
          </div>

          <div>
            <span className="text-navy/60 text-[11px] block">Op-Mode(s):</span>
            <span className="text-ink font-semibold truncate block">{opModes}</span>
          </div>

          <div>
            <span className="text-navy/60 text-[11px] block">Byte Order:</span>
            <span className="text-ink font-semibold truncate block">{byteOrder}</span>
          </div>

          <div>
            <span className="text-navy/60 text-[11px] block">Virtualization:</span>
            <span className="text-ink font-semibold truncate block">{virtualization}</span>
          </div>
        </div>

        {/* Cache Hierarchy */}
        <div className="border-t border-mist pt-3">
          <span className="text-[10px] font-mono text-navy/70 uppercase tracking-wider block mb-2 font-semibold">
            Cache Hierarchy
          </span>
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded bg-mist/30 border border-mist">
              <span className="text-[10px] text-navy/60 block">L1d</span>
              <span className="text-navy font-bold">{l1d}</span>
            </div>
            <div className="p-2 rounded bg-mist/30 border border-mist">
              <span className="text-[10px] text-navy/60 block">L1i</span>
              <span className="text-navy font-bold">{l1i}</span>
            </div>
            <div className="p-2 rounded bg-mist/30 border border-mist">
              <span className="text-[10px] text-navy/60 block">L2</span>
              <span className="text-navy font-bold">{l2}</span>
            </div>
            <div className="p-2 rounded bg-mist/30 border border-mist">
              <span className="text-[10px] text-navy/60 block">L3</span>
              <span className="text-navy font-bold">{l3}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
