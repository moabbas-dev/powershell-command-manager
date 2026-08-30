import React from 'react'
import type { ProcessState } from '@shared/types'
import { StatusBadge } from '../ui/Badge'
import { useProcessTimer } from '../../hooks/useProcessTimer'

interface ProcessHeaderProps {
  process: ProcessState
}

export function ProcessHeader({ process }: ProcessHeaderProps): React.ReactElement {
  const duration = useProcessTimer(process.startedAt, process.endedAt)

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-app-border bg-app-sidebar flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-sm font-semibold text-app-text truncate">{process.commandName}</h2>
        <StatusBadge status={process.status} exitCode={process.exitCode} />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-app-muted flex-shrink-0 ml-4">
        {process.pid !== null && <span>PID {process.pid}</span>}
        {duration && <span>{duration}</span>}
        {process.startedAt && (
          <span>
            Started {new Date(process.startedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>
    </div>
  )
}
