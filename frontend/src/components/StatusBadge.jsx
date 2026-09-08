import React from 'react';
import { Badge } from './ui/Badge';

/**
 * Renders a standardized badge for Linux process execution states:
 * R (Running), S (Interruptible Sleep), D (Uninterruptible Sleep), Z (Zombie), T (Stopped), I (Idle)
 */
export function ProcessStateBadge({ state }) {
  if (!state) {
    return <span className="text-slate-500 font-mono">—</span>;
  }

  const cleanState = String(state).trim().toUpperCase();
  const firstChar = cleanState.charAt(0);

  switch (firstChar) {
    case 'R':
      return <Badge variant="success" size="xs">R (Running)</Badge>;
    case 'S':
      return <Badge variant="sky" size="xs">S (Sleep)</Badge>;
    case 'D':
      return <Badge variant="warning" size="xs">D (Disk Wait)</Badge>;
    case 'Z':
      return <Badge variant="error" size="xs">Z (Zombie)</Badge>;
    case 'T':
      return <Badge variant="warning" size="xs">T (Stopped)</Badge>;
    case 'I':
      return <Badge variant="default" size="xs">I (Idle)</Badge>;
    default:
      return <Badge variant="default" size="xs">{cleanState}</Badge>;
  }
}

/**
 * Renders exit code status
 */
export function ExitCodeBadge({ code }) {
  if (code === undefined || code === null) {
    return null;
  }

  const isSuccess = code === 0;

  return (
    <Badge
      variant={isSuccess ? 'success' : 'error'}
      size="xs"
      dot
    >
      {isSuccess ? 'Exit 0 (OK)' : `Exit ${code} (Error)`}
    </Badge>
  );
}
