import { create } from 'zustand'
import type { AppSettings } from '@shared/types'

const DEFAULTS: AppSettings = {
  minimizeToTray: true,
  startMinimized: false,
  confirmStopAll: true,
  maxScrollbackLines: 10000,
  autoStartEnabled: true,
  notificationsEnabled: true,
  globalHotkey: 'CommandOrControl+Alt+C',
  scriptsDirectory: null
}

interface SettingsState {
  settings: AppSettings
  isLoading: boolean
  load: () => Promise<void>
  update: (partial: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>(set => ({
  settings: DEFAULTS,
  isLoading: false,

  load: async () => {
    set({ isLoading: true })
    try {
      const settings = await window.api.settings.getAll()
      set({ settings, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  update: async partial => {
    await window.api.settings.update(partial)
    set(state => ({ settings: { ...state.settings, ...partial } }))
  }
}))
