import React, { useState } from 'react';
import { Terminal, Copy, Check, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/Card';

const CONSOLE_TABS = [
  { id: 'lscpu', label: 'lscpu', commandStr: '$ lscpu' },
  { id: 'memory', label: 'free -h', commandStr: '$ free -h' },
  { id: 'processes', label: 'ps -eLf', commandStr: '$ ps -eLf' },
  { id: 'top', label: 'top', commandStr: '$ top -b -n 1' },
  { id: 'network', label: 'ss -tulnp', commandStr: '$ ss -tulnp' },
  { id: 'disk', label: 'iostat -xz 1 3', commandStr: '$ iostat -xz 1 3' },
  { id: 'strace', label: 'strace', commandStr: '$ strace -c ls' },
  { id: 'locality', label: 'locality.c', commandStr: '$ ./locality' },
];

export function CommandConsole({
  commandOutputs = {},
  activeTab = 'lscpu',
  onSelectTab,
}) {
  const [internalTab, setInternalTab] = useState('lscpu');
  const [copied, setCopied] = useState(false);

  const currentTabId = activeTab || internalTab;
  const currentTab = CONSOLE_TABS.find((t) => t.id === currentTabId) || CONSOLE_TABS[0];
  const activeOutput = commandOutputs[currentTabId] || null;

  const handleTabChange = (tabId) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    } else {
      setInternalTab(tabId);
    }
  };

  const handleCopy = async () => {
    const textToCopy = activeOutput?.raw_output || '';
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isSuccess = activeOutput?.exit_code === 0 || (activeOutput?.raw_output && activeOutput?.exit_code === undefined);
  const hasOutput = Boolean(activeOutput?.raw_output);

  return (
    <Card
      title="Live Command Terminal Console"
      subtitle="Raw stdout/stderr capture preserved directly from Linux kernel execution"
      icon={Terminal}
      className="col-span-full"
      headerAction={
        <div className="flex items-center gap-2">
          {hasOutput && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium text-navy bg-mist/60 hover:bg-mist transition-colors border border-mist"
              title="Copy exact raw terminal output to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-navy" />
                  <span className="font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-navy" />
                  <span>Copy Output</span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Tab / Pill Selector */}
        <div className="flex flex-wrap items-center gap-2 border-b border-mist pb-3">
          {CONSOLE_TABS.map((tab) => {
            const isTabActive = tab.id === currentTabId;
            const tabOutput = commandOutputs[tab.id];
            const hasData = Boolean(tabOutput?.raw_output);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                  isTabActive
                    ? 'bg-amber text-navy font-bold shadow-sm border border-amber'
                    : 'bg-paper text-navy border border-mist hover:bg-mist/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isTabActive
                      ? 'bg-navy'
                      : hasData
                      ? 'bg-amber'
                      : 'bg-mist'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Terminal Window Chrome */}
        <div className="rounded-lg overflow-hidden border border-navy shadow-md">
          {/* Terminal Title Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-navy text-paper text-xs font-mono border-b border-navy/90">
            <div className="flex items-center gap-2">
              <span className="text-amber font-bold">{currentTab.commandStr}</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              {activeOutput?.timestamp && (
                <div className="flex items-center gap-1.5 text-mist/70">
                  <Clock className="w-3 h-3 text-amber" />
                  <span>{new Date(activeOutput.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                </div>
              )}

              {hasOutput ? (
                <div
                  className={`flex items-center gap-1.5 ${
                    isSuccess ? 'text-amber' : 'text-mist'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-amber" />
                      <span>Executed (exit {activeOutput?.exit_code ?? 0})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-mist" />
                      <span>Failed (exit {activeOutput?.exit_code})</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-mist/50">Awaiting execution</div>
              )}
            </div>
          </div>

          {/* Monospace Raw Output <pre> Block */}
          <div className="relative bg-navy text-paper overflow-hidden">
            {hasOutput ? (
              <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre overflow-x-auto max-h-[380px] selection:bg-amber selection:text-navy text-mist">
                {activeOutput.raw_output}
              </pre>
            ) : (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-2 text-mist/50 font-mono text-xs">
                <Terminal className="w-8 h-8 stroke-1 text-mist/30 mb-1" />
                <p>No raw stdout/stderr captured yet for <strong className="text-amber">{currentTab.commandStr}</strong>.</p>
                <p className="text-[11px] text-mist/40 font-sans">
                  {currentTab.id === 'strace'
                    ? 'Click "Run strace" in the System Call Profiler card above to execute this command.'
                    : 'Start the FastAPI backend or click "Refresh Now" above to capture live terminal streams.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
