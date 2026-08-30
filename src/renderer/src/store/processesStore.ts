import { create } from 'zustand'
import type { ProcessState, ProcessStatus } from '@shared/types'

interface ProcessesState {
  processes: Map<string, ProcessState>
  load: () => Promise<void>
  upsert: (process: ProcessState) => void
  updateStatus: (
    processId: string,
    status: ProcessStatus,
    extras?: Partial<Pick<ProcessState, 'exitCode' | 'endedAt'>>
  ) => void
  getByCommandId: (commandId: number) => ProcessState | undefined
  getAll: () => ProcessState[]
  getRunningCount: () => number
}

export const useProcessesStore = create<ProcessesState>((set, get) => ({
  processes: new Map(),

  load: async () => {
    const list = await window.api.processes.getAll()
    const map = new Map<string, ProcessState>()
    for (const p of list) map.set(p.processId, p)
    set({ processes: map })
  },

  upsert: process => {
    set(state => {
      const next = new Map(state.processes)
      next.set(process.processId, process)
      return { processes: next }
    })
  },

  updateStatus: (processId, status, extras) => {
    set(state => {
      const existing = state.processes.get(processId)
      if (!existing) return state
      const next = new Map(state.processes)
      next.set(processId, { ...existing, status, ...extras })
      return { processes: next }
    })
  },

  getByCommandId: commandId => {
    for (const p of get().processes.values()) {
      if (p.commandId === commandId) return p
    }
    return undefined
  },

  getAll: () => [...get().processes.values()],

  getRunningCount: () => {
    let count = 0
    for (const p of get().processes.values()) {
      if (p.status === 'running' || p.status === 'starting') count++
    }
    return count
  }
}))
