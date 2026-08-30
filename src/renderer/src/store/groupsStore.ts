import { create } from 'zustand'
import type { Group, CreateGroupInput, UpdateGroupInput } from '@shared/types'

interface GroupsState {
  groups: Group[]
  isLoading: boolean
  load: () => Promise<void>
  add: (input: CreateGroupInput) => Promise<Group>
  update: (id: number, input: UpdateGroupInput) => Promise<Group>
  remove: (id: number) => Promise<void>
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true })
    try {
      const groups = await window.api.groups.list()
      set({ groups, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  add: async input => {
    const group = await window.api.groups.create(input)
    set(state => ({ groups: [...state.groups, group] }))
    return group
  },

  update: async (id, input) => {
    const updated = await window.api.groups.update(id, input)
    set(state => ({ groups: state.groups.map(g => (g.id === id ? updated : g)) }))
    return updated
  },

  remove: async id => {
    await window.api.groups.delete(id)
    set(state => ({ groups: state.groups.filter(g => g.id !== id) }))
  }
}))
