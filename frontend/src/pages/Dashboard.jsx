import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RefreshControl } from '../components/RefreshControl';
import { CpuCard } from '../components/CpuCard';
import { MemoryCard } from '../components/MemoryCard';
import { ProcessTable } from '../components/ProcessTable';
import { ProcessRuntimeCard } from '../components/ProcessRuntimeCard';
import { TopProcessesCard } from '../components/TopProcessesCard';
import { SyscallCard } from '../components/SyscallCard';
import { LocalityCard } from '../components/LocalityCard';
import { CommandConsole } from '../components/CommandConsole';
import { useCommand } from '../hooks/useCommand';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
  fetchCpuInfo,
  fetchMemoryInfo,
  fetchProcesses,
  fetchTop,
  runStrace,
  fetchLocality,
} from '../services/api';

const SECTION_IDS = [
  'overview',
  'cpu',
  'memory',
  'processes',
  'top',
  'syscalls',
  'locality',
  'console',
];

export function Dashboard({ activeSection, onSectionVisible }) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [activeConsoleTab, setActiveConsoleTab] = useState('lscpu');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Polling command hooks
  const cpuCmd = useCommand(fetchCpuInfo);
  const memoryCmd = useCommand(fetchMemoryInfo);
  const processesCmd = useCommand(fetchProcesses);
  const topCmd = useCommand(fetchTop);
  const localityCmd = useCommand(fetchLocality);

  // Manual command hook (strace -c ls)
  const straceCmd = useCommand(runStrace, { autoFetch: false });

  // Centralized Refresh Handler
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    try {
      await Promise.allSettled([
        cpuCmd.refresh(),
        memoryCmd.refresh(),
        processesCmd.refresh(),
        topCmd.refresh(),
        localityCmd.refresh(),
      ]);
    } finally {
      setIsRefreshingAll(false);
    }
  }, [cpuCmd, memoryCmd, processesCmd, topCmd, localityCmd]);

  // Hook auto refresh with clean interval
  useAutoRefresh(handleRefreshAll, intervalSeconds * 1000, autoRefresh);

  // Connection status & latest timestamp
  const anySuccess =
    cpuCmd.status === 'success' ||
    memoryCmd.status === 'success' ||
    processesCmd.status === 'success' ||
    topCmd.status === 'success' ||
    localityCmd.status === 'success';

  const allErrored =
    cpuCmd.status === 'error' &&
    memoryCmd.status === 'error' &&
    processesCmd.status === 'error' &&
    topCmd.status === 'error';

  const isBackendConnected = anySuccess || (!allErrored && cpuCmd.status !== 'error');

  const latestTimestamp =
    processesCmd.lastUpdated ||
    cpuCmd.lastUpdated ||
    memoryCmd.lastUpdated ||
    topCmd.lastUpdated ||
    localityCmd.lastUpdated;

  // Jump to command console with specific tab activated
  const handleJumpToConsole = (tabId) => {
    setActiveConsoleTab(tabId);
    const consoleEl = document.getElementById('console');
    if (consoleEl) {
      consoleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Map of raw command outputs for console
  const commandOutputs = {
    lscpu: cpuCmd.data,
    memory: memoryCmd.data,
    processes: processesCmd.data,
    top: topCmd.data,
    strace: straceCmd.data,
    locality: localityCmd.data,
  };

  // IntersectionObserver to sync active section with scroll position
  useEffect(() => {
    if (!onSectionVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find entry with greatest intersection ratio or highest above center
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio or boundingClientRect top
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const topVisible = visibleEntries[0];
          onSectionVisible(topVisible.target.id);
        }
      },
      {
        root: null,
        rootMargin: '-10% 0px -50% 0px',
        threshold: [0.1, 0.3, 0.6],
      }
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [onSectionVisible]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Overview Anchor & Global Refresh Control Bar */}
      <div id="overview" className="scroll-mt-20">
        <RefreshControl
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={setAutoRefresh}
          intervalSeconds={intervalSeconds}
          onChangeInterval={setIntervalSeconds}
          onRefreshNow={handleRefreshAll}
          isRefreshing={isRefreshingAll || cpuCmd.loading}
          lastUpdated={latestTimestamp}
          isBackendConnected={isBackendConnected}
        />
      </div>

      {/* Main Responsive Cards Grid */}
      <div className="space-y-6">
        {/* Row 1: CPU and Memory (2 columns on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="cpu" className="scroll-mt-20">
            <CpuCard
              data={cpuCmd.data}
              loading={cpuCmd.loading}
              error={cpuCmd.error}
              onRetry={cpuCmd.refresh}
              onViewRaw={() => handleJumpToConsole('lscpu')}
            />
          </div>

          <div id="memory" className="scroll-mt-20">
            <MemoryCard
              data={memoryCmd.data}
              loading={memoryCmd.loading}
              error={memoryCmd.error}
              onRetry={memoryCmd.refresh}
              onViewRaw={() => handleJumpToConsole('memory')}
            />
          </div>
        </div>

        {/* Row 1.5: Process Runtime Analysis (Full width) */}
        <div id="runtime" className="scroll-mt-20">
          <ProcessRuntimeCard
            data={processesCmd.data}
            loading={processesCmd.loading}
            error={processesCmd.error}
            onRetry={processesCmd.refresh}
            onViewRaw={() => handleJumpToConsole('processes')}
          />
        </div>

        {/* Row 2: Threads & Processes Table (Full width) */}
        <div id="processes" className="scroll-mt-20">
          <ProcessTable
            data={processesCmd.data}
            loading={processesCmd.loading}
            error={processesCmd.error}
            onRetry={processesCmd.refresh}
            onViewRaw={() => handleJumpToConsole('processes')}
          />
        </div>

        {/* Row 3: Top CPU Consumers & Cache Locality (2 columns on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="top" className="scroll-mt-20">
            <TopProcessesCard
              data={topCmd.data}
              loading={topCmd.loading}
              error={topCmd.error}
              onRetry={topCmd.refresh}
              onViewRaw={() => handleJumpToConsole('top')}
            />
          </div>

          <div id="locality" className="scroll-mt-20">
            <LocalityCard
              data={localityCmd.data}
              loading={localityCmd.loading}
              error={localityCmd.error}
              onRetry={localityCmd.refresh}
              onViewRaw={() => handleJumpToConsole('locality')}
            />
          </div>
        </div>

        {/* Row 4: Syscall Profiler (Manual trigger only, full width) */}
        <div id="syscalls" className="scroll-mt-20">
          <SyscallCard
            data={straceCmd.data}
            loading={straceCmd.loading}
            error={straceCmd.error}
            status={straceCmd.status}
            onRunStrace={straceCmd.refresh}
            onViewRaw={() => handleJumpToConsole('strace')}
          />
        </div>

        {/* Row 5: Live Command Terminal Console (Full width) */}
        <div id="console" className="scroll-mt-20">
          <CommandConsole
            commandOutputs={commandOutputs}
            activeTab={activeConsoleTab}
            onSelectTab={setActiveConsoleTab}
          />
        </div>
      </div>
    </div>
  );
}
