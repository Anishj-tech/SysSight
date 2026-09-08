import React from 'react';

const VARIANTS = {
  default: 'bg-slate-800 text-slate-300 border-slate-700 light:bg-slate-100 light:text-slate-700 light:border-slate-200',
  success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-200',
  warning: 'bg-amber-950/60 text-amber-400 border-amber-800/60 light:bg-amber-50 light:text-amber-700 light:border-amber-200',
  error: 'bg-rose-950/60 text-rose-400 border-rose-800/60 light:bg-rose-50 light:text-rose-700 light:border-rose-200',
  sky: 'bg-sky-950/60 text-sky-400 border-sky-800/60 light:bg-sky-50 light:text-sky-700 light:border-sky-200',
  teal: 'bg-teal-950/60 text-teal-400 border-teal-800/60 light:bg-teal-50 light:text-teal-700 light:border-teal-200',
};

const SIZES = {
  xs: 'text-[10px] px-1.5 py-0.5 leading-none',
  sm: 'text-xs px-2 py-0.5 leading-normal',
  md: 'text-xs px-2.5 py-1 leading-normal',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.default;
  const sizeClass = SIZES[size] || SIZES.sm;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${variantClass} ${sizeClass} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success'
              ? 'bg-emerald-400'
              : variant === 'warning'
              ? 'bg-amber-400'
              : variant === 'error'
              ? 'bg-rose-400'
              : variant === 'sky'
              ? 'bg-sky-400'
              : 'bg-slate-400'
          }`}
        />
      )}
      {children}
    </span>
  );
}
