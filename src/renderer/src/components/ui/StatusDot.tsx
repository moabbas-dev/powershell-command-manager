import React from 'react'
import type { ProcessStatus } from '@shared/types'

interface StatusDotProps {
  status: ProcessStatus | 'idle'
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig: Record<
  ProcessStatus | 'idle',
  { color: string; pulse: boolean; title: string }
> = {
  idle: { color: 'bg-app-muted', pulse: false, title: 'Not started' },
  starting: { color: 'bg-status-starting-fg', pulse: true, title: 'Starting' },
  running: { color: 'bg-status-running-fg', pulse: false, title: 'Running' },
  stopping: { color: 'bg-yellow-400', pulse: true, title: 'Stopping' },
  stopped: { color: 'bg-app-muted', pulse: false, title: 'Stopped' },
  completed: { color: 'bg-status-completed-fg', pulse: false, title: 'Completed' },
  failed: { color: 'bg-status-failed-fg', pulse: false, title: 'Failed' },
  killed: { color: 'bg-app-muted', pulse: false, title: 'Killed' }
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5'
}

export function StatusDot({ status, size = 'sm', className = '' }: StatusDotProps): React.ReactElement {
  const config = statusConfig[status] ?? statusConfig.idle
  return (
    <span
      title={config.title}
      className={[
        'inline-block rounded-full flex-shrink-0',
        sizeClasses[size],
        config.color,
        config.pulse ? 'animate-status-pulse' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
