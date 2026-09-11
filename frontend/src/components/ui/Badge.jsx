import React from 'react';

const VARIANTS = {
  default: 'bg-mist text-navy border-mist',
  amber: 'bg-amber/20 text-navy border-amber font-bold',
  navy: 'bg-navy/10 text-navy border-navy/30 font-semibold',
  paper: 'bg-paper text-ink border-mist',
  subtle: 'bg-mist/40 text-navy/70 border-mist/80',
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
      className={`inline-flex items-center gap-1.5 font-mono rounded border ${variantClass} ${sizeClass} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'amber'
              ? 'bg-amber'
              : variant === 'navy'
              ? 'bg-navy'
              : 'bg-ink'
          }`}
        />
      )}
      {children}
    </span>
  );
}
