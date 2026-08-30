import React, { useState } from 'react'
import { Square, RotateCcw, Trash2, Copy, ChevronsDown } from 'lucide-react'
import type { ProcessState } from '@shared/types'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'
import { clearTerminal, getTerminalText } from '../../lib/terminalManager'
import { useProcessesStore } from '../../store/processesStore'

interface ProcessActionsProps {
  process: ProcessState
  autoScroll: boolean
  onToggleAutoScroll: () => void
}

export function ProcessActions({
  process,
  autoScroll,
  onToggleAutoScroll
}: ProcessActionsProps): React.ReactElement {
  const [restarting, setRestarting] = useState(false)
  const upsert = useProcessesStore(s => s.upsert)

  const isRunning = process.status === 'running' || process.status === 'starting'
  const isStopping = process.status === 'stopping'

  const handleStop = async (): Promise<void> => {
    await window.api.processes.stop(process.processId)
  }

  const handleRestart = async (): Promise<void> => {
    setRestarting(true)
    try {
      const result = await window.api.processes.restart(process.processId)
      if (result && !('error' in result)) {
        upsert(result as ProcessState)
      }
    } finally {
      setRestarting(false)
    }
  }

  const handleClear = (): void => {
    clearTerminal(process.processId)
  }

  const handleCopy = async (): Promise<void> => {
    const text = getTerminalText(process.processId)
    if (text) {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-app-border bg-app-sidebar flex-shrink-0">
      {/* Process controls */}
      <div className="flex items-center gap-1.5">
        <Tooltip content="Stop (Ctrl+Shift+S)">
          <Button
            variant="danger"
            size="sm"
            onClick={handleStop}
            disabled={!isRunning || isStopping}
          >
            <Square size={12} />
            Stop
          </Button>
        </Tooltip>

        <Tooltip content="Restart (Ctrl+Shift+R)">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRestart}
            disabled={restarting}
          >
            <RotateCcw size={12} className={restarting ? 'animate-spin' : ''} />
            Restart
          </Button>
        </Tooltip>
      </div>

      <div className="w-px h-5 bg-app-border mx-1" />

      {/* Output controls */}
      <div className="flex items-center gap-1.5">
        <Tooltip content="Clear output">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 size={12} />
            Clear
          </Button>
        </Tooltip>

        <Tooltip content="Copy all output to clipboard">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy size={12} />
            Copy
          </Button>
        </Tooltip>
      </div>

      <div className="flex-1" />

      {/* Auto-scroll toggle */}
      <Tooltip content={autoScroll ? 'Auto-scroll on (click to disable)' : 'Auto-scroll off (click to enable)'}>
        <button
          onClick={onToggleAutoScroll}
          className={[
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
            autoScroll
              ? 'text-blue-400 bg-blue-900/20 border border-blue-800'
              : 'text-app-muted bg-transparent border border-transparent hover:border-app-border'
          ].join(' ')}
        >
          <ChevronsDown size={12} />
          Auto-scroll
        </button>
      </Tooltip>
    </div>
  )
}
