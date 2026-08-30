import React from 'react'
import { Minus, X, Zap, StopCircle } from 'lucide-react'
import { useProcessesStore } from '../../store/processesStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'

export function TitleBar(): React.ReactElement {
  const runningCount = useProcessesStore(s => s.getRunningCount())
  const confirmStopAll = useSettingsStore(s => s.settings.confirmStopAll)
  const openConfirm = useUIStore(s => s.openConfirm)
  const openSettings = useUIStore(s => s.openSettings)

  const handleStopAll = (): void => {
    if (runningCount === 0) return
    if (confirmStopAll) {
      openConfirm(
        `Stop all ${runningCount} running command${runningCount !== 1 ? 's' : ''}?`,
        () => window.api.processes.stopAll()
      )
    } else {
      window.api.processes.stopAll()
    }
  }

  const handleMinimize = (): void => { window.api.app.minimize() }
  const handleClose = (): void => {
    if (runningCount > 0) {
      openConfirm(
        `${runningCount} command${runningCount !== 1 ? 's are' : ' is'} still running. Stop all and exit?`,
        () => window.api.app.quit()
      )
    } else {
      window.api.app.quit()
    }
  }

  return (
    <div className="drag-region flex items-center justify-between h-11 px-4 border-b border-app-border bg-app-sidebar flex-shrink-0">
      {/* Left: App identity */}
      <div className="flex items-center gap-2 no-drag">
        <Zap size={16} className="text-blue-400" />
        <span className="text-sm font-semibold text-app-text">PowerShell Manager</span>
        {runningCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-status-running/30 text-status-running-fg border border-status-running/50">
            {runningCount} running
          </span>
        )}
      </div>

      {/* Right: actions + window controls */}
      <div className="flex items-center gap-1 no-drag">
        {runningCount > 0 && (
          <Tooltip content="Stop all running commands (Ctrl+Shift+X)">
            <Button variant="ghost" size="sm" onClick={handleStopAll} className="text-red-400 hover:text-red-300">
              <StopCircle size={14} />
              Stop All
            </Button>
          </Tooltip>
        )}

        <Button variant="ghost" size="sm" onClick={openSettings} aria-label="Settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Button>

        {/* Window controls */}
        <div className="flex items-center ml-2">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-surface rounded transition-colors"
            aria-label="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
