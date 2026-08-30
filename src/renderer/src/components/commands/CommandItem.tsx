import React, { useState } from 'react'
import { Play, Square, RotateCcw, Star, MoreHorizontal, Pencil, Trash2, Copy } from 'lucide-react'
import type { Command } from '@shared/types'
import { useProcessesStore } from '../../store/processesStore'
import { useUIStore } from '../../store/uiStore'
import { useCommandsStore } from '../../store/commandsStore'
import { StatusDot } from '../ui/StatusDot'
import { Tooltip } from '../ui/Tooltip'

interface CommandItemProps {
  command: Command
  compact?: boolean
}

export function CommandItem({ command, compact = false }: CommandItemProps): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const processState = useProcessesStore(s => s.getByCommandId(command.id))
  const setActiveTab = useUIStore(s => s.setActiveProcessTab)
  const openCommandForm = useUIStore(s => s.openCommandForm)
  const openConfirm = useUIStore(s => s.openConfirm)
  const toggleFavorite = useCommandsStore(s => s.toggleFavorite)
  const removeCommand = useCommandsStore(s => s.remove)

  const status = processState?.status ?? 'idle'
  const isRunning = status === 'running' || status === 'starting'
  const isStopping = status === 'stopping'
  const processId = processState?.processId

  const handleRun = async (): Promise<void> => {
    setStartError(null)
    if (isRunning && processId) {
      // Switch to its tab
      setActiveTab(processId)
      return
    }
    try {
      const result = await window.api.processes.start(command.id)
      // result might be a ProcessState or an error object
      if ('error' in result) {
        if (result.error === 'already_running') {
          setActiveTab((result as { processId: string }).processId)
        } else {
          setStartError((result as { message?: string }).message ?? 'Failed to start')
        }
        return
      }
      const ps = result as import('@shared/types').ProcessState
      useProcessesStore.getState().upsert(ps)
      setActiveTab(ps.processId)
    } catch (err) {
      setStartError(String(err))
    }
  }

  const handleStop = async (): Promise<void> => {
    if (!processId) return
    await window.api.processes.stop(processId)
  }

  const handleRestart = async (): Promise<void> => {
    if (!processId) return
    const result = await window.api.processes.restart(processId)
    if (result && !('error' in result)) {
      const ps = result as import('@shared/types').ProcessState
      useProcessesStore.getState().upsert(ps)
      setActiveTab(ps.processId)
    }
  }

  const handleDelete = (): void => {
    openConfirm(
      `Delete "${command.name}"? This cannot be undone.`,
      () => removeCommand(command.id)
    )
  }

  return (
    <div
      className={[
        'group relative flex items-center gap-2 px-3 rounded-md cursor-pointer',
        'hover:bg-app-surface transition-colors duration-100',
        compact ? 'py-1' : 'py-1.5',
        isRunning ? 'bg-app-surface/50' : ''
      ].join(' ')}
      onClick={() => {
        if (processId) setActiveTab(processId)
      }}
    >
      {/* Status dot */}
      <StatusDot status={status} size="sm" className="flex-shrink-0" />

      {/* Name + command */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-app-text truncate">{command.name}</p>
        {!compact && (
          <p className="text-[10px] text-app-muted truncate font-mono">{command.command}</p>
        )}
        {startError && (
          <p className="text-[10px] text-red-400 truncate">{startError}</p>
        )}
      </div>

      {/* Quick actions — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {isRunning ? (
          <>
            <Tooltip content="Stop">
              <button
                onClick={e => { e.stopPropagation(); handleStop() }}
                disabled={isStopping}
                className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-900/30"
              >
                <Square size={12} />
              </button>
            </Tooltip>
            <Tooltip content="Restart">
              <button
                onClick={e => { e.stopPropagation(); handleRestart() }}
                className="p-1 rounded text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30"
              >
                <RotateCcw size={12} />
              </button>
            </Tooltip>
          </>
        ) : (
          <Tooltip content={isRunning ? 'View output' : 'Run'}>
            <button
              onClick={e => { e.stopPropagation(); handleRun() }}
              className="p-1 rounded text-green-400 hover:text-green-300 hover:bg-green-900/30"
            >
              <Play size={12} />
            </button>
          </Tooltip>
        )}

        {/* More menu */}
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            className="p-1 rounded text-app-muted hover:text-app-text hover:bg-app-surface"
          >
            <MoreHorizontal size={12} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-40 w-40 bg-[#2d333b] border border-app-border rounded-lg shadow-xl py-1 text-xs">
                <ContextItem icon={<Pencil size={12} />} label="Edit" onClick={() => { setMenuOpen(false); openCommandForm(command.id) }} />
                <ContextItem icon={<Star size={12} />} label={command.isFavorite ? 'Unfavorite' : 'Favorite'} onClick={() => { setMenuOpen(false); toggleFavorite(command.id) }} />
                <ContextItem icon={<Copy size={12} />} label="Duplicate" onClick={() => { setMenuOpen(false); /* TODO */ }} />
                <div className="border-t border-app-border my-1" />
                <ContextItem icon={<Trash2 size={12} />} label="Delete" onClick={() => { setMenuOpen(false); handleDelete() }} danger />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ContextItem({
  icon,
  label,
  onClick,
  danger = false
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-3 py-1.5 text-left',
        'hover:bg-app-surface transition-colors',
        danger ? 'text-red-400 hover:text-red-300' : 'text-app-text'
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}
