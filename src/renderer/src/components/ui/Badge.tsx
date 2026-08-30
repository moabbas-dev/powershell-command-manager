import React from 'react'
import type { ProcessStatus } from '@shared/types'

interface StatusBadgeProps {
  status: ProcessStatus | 'idle'
  exitCode?: number | null
}

const statusConfig: Record<
  ProcessStatus | 'idle',
  { label: string; classes: string }
> = {
  idle: { label: 'Not started', classes: 'bg-app-surface text-app-muted border-app-border' },
  starting: {
    label: 'Starting...',
    classes: 'bg-yellow-900/30 text-yellow-400 border-yellow-800 animate-status-pulse'
  },
  running: { label: 'Running', classes: 'bg-green-900/30 text-status-running-fg border-green-800' },
  stopping: {
    label: 'Stopping...',
    classes: 'bg-yellow-900/30 text-yellow-400 border-yellow-800 animate-status-pulse'
  },
  stopped: { label: 'Stopped', classes: 'bg-app-surface text-app-muted border-app-border' },
  completed: {
    label: 'Completed',
    classes: 'bg-blue-900/30 text-status-completed-fg border-blue-800'
  },
  failed: { label: 'Failed', classes: 'bg-red-900/30 text-status-failed-fg border-red-900' },
  killed: { label: 'Killed', classes: 'bg-app-surface text-app-muted border-app-border' }
}

export function StatusBadge({ status, exitCode }: StatusBadgeProps): React.ReactElement {
  const config = statusConfig[status] ?? statusConfig.idle
  const exitLabel =
    exitCode !== null && exitCode !== undefined
      ? ` — Exit ${exitCode}`
      : ''

  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        config.classes
      ].join(' ')}
    >
      {config.label}
      {exitLabel}
    </span>
  )
}
