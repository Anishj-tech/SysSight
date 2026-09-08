import React from 'react';

export function ProgressBar({
  value = 0,
  max = 100,
  variant = 'auto', // 'auto' | 'amber' | 'navy'
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = false,
  className = '',
}) {
  const numericVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const percentage = Math.min(100, Math.max(0, (numericVal / max) * 100));

  let barColor = 'bg-navy';

  if (variant === 'auto') {
    if (percentage >= 75) {
      barColor = 'bg-amber';
    } else {
      barColor = 'bg-navy';
    }
  } else if (variant === 'amber') {
    barColor = 'bg-amber';
  } else if (variant === 'navy') {
    barColor = 'bg-navy';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-mono text-navy mb-1">
          <span>{percentage.toFixed(1)}%</span>
        </div>
      )}
      <div
        className={`w-full bg-mist rounded-full overflow-hidden ${heightClasses[size] || heightClasses.md}`}
      >
        <div
          className={`${heightClasses[size] || heightClasses.md} ${barColor} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
