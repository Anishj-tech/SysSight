import React from 'react';
import { Badge } from './ui/Badge';

/**
 * Standardized badge for Linux process execution states:
 * R (Running), S (Interruptible Sleep), D (Disk Wait), Z (Zombie), T (Stopped), I (Idle)
 */
export function ProcessStateBadge({ state }) {
  if (!state) {
    return <span className="text-navy/40 font-mono">—</span>;
  }

  const cleanState = String(state).trim().toUpperCase();
  const firstChar = cleanState.charAt(0);

  switch (firstChar) {
    case 'R':
      return <Badge variant="amber" size="xs">R (Running)</Badge>;
    case 'S':
      return <Badge variant="navy" size="xs">S (Sleep)</Badge>;
    case 'D':
      return <Badge variant="amber" size="xs">D (Disk Wait)</Badge>;
    case 'Z':
      return <Badge variant="amber" size="xs">Z (Zombie)</Badge>;
    case 'T':
      return <Badge variant="subtle" size="xs">T (Stopped)</Badge>;
    case 'I':
      return <Badge variant="subtle" size="xs">I (Idle)</Badge>;
    default:
      return <Badge variant="subtle" size="xs">{cleanState}</Badge>;
  }
}

/**
 * Standardized badge for exit code status
 */
export function ExitCodeBadge({ code }) {
  if (code === undefined || code === null) {
    return null;
  }

  const isSuccess = code === 0;

  return (
    <Badge
      variant={isSuccess ? 'navy' : 'amber'}
      size="xs"
      dot
    >
      {isSuccess ? 'Exit 0 (OK)' : `Exit ${code} (Error)`}
    </Badge>
  );
}
