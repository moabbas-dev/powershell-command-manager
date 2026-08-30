import React from 'react'
import { useProcessesStore } from '../../store/processesStore'
import { useUIStore } from '../../store/uiStore'
import { ProcessTab } from './ProcessTab'

export function ProcessTabBar(): React.ReactElement | null {
  const processes = useProcessesStore(s => [...s.processes.values()])
  const activeTabId = useUIStore(s => s.activeProcessTabId)

  if (processes.length === 0) return null

  return (
    <div className="flex items-end border-b border-app-border bg-app-sidebar overflow-x-auto flex-shrink-0">
      {processes.map(p => (
        <ProcessTab
          key={p.processId}
          process={p}
          isActive={p.processId === activeTabId}
        />
      ))}
    </div>
  )
}
