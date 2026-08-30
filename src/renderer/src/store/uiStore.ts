import { create } from 'zustand'

export type ModalType = 'command-form' | 'group-form' | 'confirm-stop-all' | 'settings' | null

interface UIState {
  searchQuery: string
  activeProcessTabId: string | null
  selectedCommandId: number | null
  openModal: ModalType
  editingCommandId: number | null
  editingGroupId: number | null
  confirmAction: (() => void) | null
  confirmMessage: string
  sidebarCollapsed: boolean

  setSearchQuery: (q: string) => void
  setActiveProcessTab: (id: string | null) => void
  setSelectedCommand: (id: number | null) => void
  openCommandForm: (commandId?: number) => void
  openGroupForm: (groupId?: number) => void
  openConfirm: (message: string, action: () => void) => void
  openSettings: () => void
  closeModal: () => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>(set => ({
  searchQuery: '',
  activeProcessTabId: null,
  selectedCommandId: null,
  openModal: null,
  editingCommandId: null,
  editingGroupId: null,
  confirmAction: null,
  confirmMessage: '',
  sidebarCollapsed: false,

  setSearchQuery: q => set({ searchQuery: q }),
  setActiveProcessTab: id => set({ activeProcessTabId: id }),
  setSelectedCommand: id => set({ selectedCommandId: id }),

  openCommandForm: commandId =>
    set({ openModal: 'command-form', editingCommandId: commandId ?? null }),
  openGroupForm: groupId =>
    set({ openModal: 'group-form', editingGroupId: groupId ?? null }),
  openConfirm: (message, action) =>
    set({ openModal: 'confirm-stop-all', confirmMessage: message, confirmAction: action }),
  openSettings: () => set({ openModal: 'settings' }),

  closeModal: () =>
    set({
      openModal: null,
      editingCommandId: null,
      editingGroupId: null,
      confirmAction: null,
      confirmMessage: ''
    }),

  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }))
}))
