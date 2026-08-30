import { create } from 'zustand'
import type { Command, CreateCommandInput, UpdateCommandInput, ReorderItem } from '@shared/types'

interface CommandsState {
  commands: Command[]
  isLoading: boolean
  error: string | null
  load: () => Promise<void>
  add: (input: CreateCommandInput) => Promise<Command>
  update: (id: number, input: UpdateCommandInput) => Promise<Command>
  remove: (id: number) => Promise<void>
  reorder: (items: ReorderItem[]) => Promise<void>
  toggleFavorite: (id: number) => Promise<void>
}

export const useCommandsStore = create<CommandsState>((set, get) => ({
  commands: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null })
    try {
      const commands = await window.api.commands.list()
      set({ commands, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  add: async input => {
    const command = await window.api.commands.create(input)
    set(state => ({ commands: [...state.commands, command] }))
    return command
  },

  update: async (id, input) => {
    const updated = await window.api.commands.update(id, input)
    set(state => ({
      commands: state.commands.map(c => (c.id === id ? updated : c))
    }))
    return updated
  },

  remove: async id => {
    await window.api.commands.delete(id)
    set(state => ({ commands: state.commands.filter(c => c.id !== id) }))
  },

  reorder: async items => {
    await window.api.commands.reorder(items)
    // Reload to get accurate positions from DB
    await get().load()
  },

  toggleFavorite: async id => {
    const cmd = get().commands.find(c => c.id === id)
    if (!cmd) return
    await get().update(id, { isFavorite: !cmd.isFavorite })
  }
}))
