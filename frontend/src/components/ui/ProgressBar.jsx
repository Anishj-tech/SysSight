import React from 'react';

export function ProgressBar({
  value = 0,
  max = 100,
  variant = 'auto', // 'auto' | 'sky' | 'emerald' | 'amber' | 'rose'
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = false,
  className = '',
}) {
  const numericVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const percentage = Math.min(100, Math.max(0, (numericVal / max) * 100));

  let barColor = 'bg-sky-500';

  if (variant === 'auto') {
    if (percentage >= 85) {
      barColor = 'bg-rose-500';
    } else if (percentage >= 65) {
      barColor = 'bg-amber-500';
    } else {
      barColor = 'bg-emerald-500';
    }
  } else if (variant === 'emerald') {
    barColor = 'bg-emerald-500';
  } else if (variant === 'amber') {
    barColor = 'bg-amber-500';
  } else if (variant === 'rose') {
    barColor = 'bg-rose-500';
  } else if (variant === 'sky') {
    barColor = 'bg-sky-500';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
          <span>{percentage.toFixed(1)}%</span>
        </div>
      )}
      <div
        className={`w-full bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden ${heightClasses[size] || heightClasses.md}`}
      >
        <div
          className={`${heightClasses[size] || heightClasses.md} ${barColor} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
