import React, { useState } from 'react';
import { Terminal, Copy, Check, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/Card';

const CONSOLE_TABS = [
  { id: 'lscpu', label: 'lscpu', commandStr: '$ lscpu' },
  { id: 'memory', label: 'free -h', commandStr: '$ free -h' },
  { id: 'processes', label: 'ps -eLf', commandStr: '$ ps -eLf' },
  { id: 'top', label: 'top', commandStr: '$ top -b -n 1' },
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

  // Controlled or uncontrolled tab
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
      // Fallback if clipboard API is restricted
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 light:bg-slate-100 light:text-slate-700 light:hover:bg-slate-200 border border-slate-700 light:border-slate-300 transition-colors"
              title="Copy exact raw terminal output to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Output</span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {/* Tab / Pill Selector */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 light:border-slate-200 pb-2.5">
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
                    ? 'bg-sky-500/20 text-sky-400 light:bg-sky-100 light:text-sky-800 font-semibold border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 light:text-slate-600 light:hover:bg-slate-100 border border-transparent'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasData
                      ? 'bg-emerald-400'
                      : tab.id === 'strace'
                      ? 'bg-amber-400'
                      : 'bg-slate-600'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Terminal Header Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-t-md bg-slate-950 light:bg-slate-900 border border-b-0 border-slate-800 light:border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-sky-400 font-bold">{currentTab.commandStr}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {activeOutput?.timestamp && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{new Date(activeOutput.timestamp).toLocaleTimeString([], { hour12: false })}</span>
              </div>
            )}

            {hasOutput ? (
              <div
                className={`flex items-center gap-1.5 ${
                  isSuccess ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Command executed successfully (exit code {activeOutput?.exit_code ?? 0})</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>Command failed (exit code {activeOutput?.exit_code})</span>
                  </>
                )}
              </div>
            ) : (
              <div className="text-slate-500">Awaiting execution</div>
            )}
          </div>
        </div>

        {/* Monospace Raw Output <pre> Block */}
        <div className="relative rounded-b-md border border-slate-800 bg-slate-950 text-slate-200 overflow-hidden shadow-inner">
          {hasOutput ? (
            <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre overflow-x-auto max-h-[380px] selection:bg-sky-500/40 text-slate-200">
              {activeOutput.raw_output}
            </pre>
          ) : (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs">
              <Terminal className="w-8 h-8 stroke-1 text-slate-600 mb-1" />
              <p>No raw stdout/stderr captured yet for <strong className="text-slate-400">{currentTab.commandStr}</strong>.</p>
              <p className="text-[11px] text-slate-600">
                {currentTab.id === 'strace'
                  ? 'Click "Run strace" in the System Call Profiler card above to execute this command.'
                  : 'Start the FastAPI backend or click "Refresh Now" above to capture live terminal streams.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
