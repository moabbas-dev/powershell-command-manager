import { useEffect } from 'react'
import { useProcessesStore } from '../store/processesStore'
import { writeOutput } from '../lib/terminalManager'

/**
 * Subscribes to IPC events from the main process.
 * - process:output → writes to the correct xterm.js terminal
 * - process:status-changed → updates processesStore
 *
 * Must be called once at the App root level.
 */
export function useIPCEvents(): void {
  useEffect(() => {
    const unsubOutput = window.api.on.processOutput(event => {
      writeOutput(event.processId, event.data)
    })

    const unsubStatus = window.api.on.processStatusChanged(event => {
      const store = useProcessesStore.getState()
      const existing = store.processes.get(event.processId)

      if (existing) {
        store.updateStatus(event.processId, event.status, {
          exitCode: event.exitCode ?? null,
          endedAt: event.endedAt ?? null
        })
      } else {
        // Process appeared for the first time (e.g. auto-start)
        store.upsert({
          processId: event.processId,
          commandId: event.commandId,
          commandName: '',
          status: event.status,
          pid: null,
          startedAt: event.startedAt ?? null,
          endedAt: event.endedAt ?? null,
          exitCode: event.exitCode ?? null
        })
      }
    })

    return () => {
      unsubOutput()
      unsubStatus()
    }
  }, []) // Empty deps — subscribe once on mount
}
