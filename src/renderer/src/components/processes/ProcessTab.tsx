import React from 'react'
import { X } from 'lucide-react'
import type { ProcessState } from '@shared/types'
import { StatusDot } from '../ui/StatusDot'
import { useUIStore } from '../../store/uiStore'
import { useProcessesStore } from '../../store/processesStore'
import { disposeTerminal } from '../../lib/terminalManager'

interface ProcessTabProps {
  process: ProcessState
  isActive: boolean
}

export function ProcessTab({ process, isActive }: ProcessTabProps): React.ReactElement {
  const setActiveTab = useUIStore(s => s.setActiveProcessTab)

  const handleClose = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()

    if (process.status === 'running' || process.status === 'starting') {
      await window.api.processes.stop(process.processId)
    }

    // Dispose xterm instance to free memory
    disposeTerminal(process.processId)

    // Remove from store — tab disappears
    useProcessesStore.setState(state => {
      const next = new Map(state.processes)
      next.delete(process.processId)
      return { processes: next }
    })

    // If this was the active tab, switch to another
    if (useUIStore.getState().activeProcessTabId === process.processId) {
      const remaining = [...useProcessesStore.getState().processes.values()]
      setActiveTab(remaining[0]?.processId ?? null)
    }
  }

  const truncatedName =
    process.commandName.length > 18
      ? process.commandName.slice(0, 16) + '…'
      : process.commandName

  return (
    <button
      className={[
        'group flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors',
        'whitespace-nowrap flex-shrink-0 focus:outline-none',
        isActive
          ? 'border-blue-500 text-app-text bg-app-bg'
          : 'border-transparent text-app-muted hover:text-app-text hover:bg-app-surface'
      ].join(' ')}
      onClick={() => setActiveTab(process.processId)}
    >
      <StatusDot status={process.status} size="sm" />
      <span>{truncatedName}</span>
      <span
        onClick={handleClose}
        className="ml-0.5 p-0.5 rounded hover:bg-app-border opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={11} />
      </span>
    </button>
  )
}
