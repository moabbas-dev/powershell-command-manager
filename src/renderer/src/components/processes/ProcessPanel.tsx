import React, { useState, useEffect } from 'react'
import { useProcessesStore } from '../../store/processesStore'
import { useUIStore } from '../../store/uiStore'
import { ProcessHeader } from './ProcessHeader'
import { ProcessOutput } from './ProcessOutput'
import { ProcessActions } from './ProcessActions'
import { EmptyState } from '../ui/EmptyState'
import { Terminal } from 'lucide-react'

export function ProcessPanel(): React.ReactElement {
  const processes = useProcessesStore(s => s.processes)
  const activeTabId = useUIStore(s => s.activeProcessTabId)
  const setActiveTab = useUIStore(s => s.setActiveProcessTab)
  const [autoScrollStates, setAutoScrollStates] = useState<Map<string, boolean>>(new Map())

  const activeProcess = activeTabId ? processes.get(activeTabId) : null

  // Auto-select first tab when processes appear and nothing is selected
  useEffect(() => {
    if (!activeTabId && processes.size > 0) {
      setActiveTab([...processes.keys()][0])
    }
  }, [processes, activeTabId, setActiveTab])

  const getAutoScroll = (processId: string): boolean =>
    autoScrollStates.get(processId) ?? true

  const toggleAutoScroll = (processId: string): void => {
    setAutoScrollStates(prev => {
      const next = new Map(prev)
      next.set(processId, !(next.get(processId) ?? true))
      return next
    })
  }

  if (processes.size === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<Terminal size={48} />}
          title="No running commands"
          description="Select a command from the sidebar and click Run"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {activeProcess ? (
        <>
          <ProcessHeader process={activeProcess} />

          {/* Render ALL terminals but show only the active one using CSS display */}
          <div className="flex-1 relative min-h-0">
            {[...processes.values()].map(p => (
              <div
                key={p.processId}
                className="absolute inset-0 flex flex-col"
                style={{ display: p.processId === activeTabId ? 'flex' : 'none' }}
              >
                <ProcessOutput processId={p.processId} isActive={p.processId === activeTabId} />
              </div>
            ))}
          </div>

          <ProcessActions
            process={activeProcess}
            autoScroll={getAutoScroll(activeProcess.processId)}
            onToggleAutoScroll={() => toggleAutoScroll(activeProcess.processId)}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Terminal size={48} />}
            title="Select a tab to view output"
          />
        </div>
      )}
    </div>
  )
}
