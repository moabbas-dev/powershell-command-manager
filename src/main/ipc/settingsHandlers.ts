import { ipcMain } from 'electron'
import { z } from 'zod'
import type { SettingsRepository } from '../database/repositories/SettingsRepository'

const SettingsUpdateSchema = z.object({
  minimizeToTray: z.boolean().optional(),
  startMinimized: z.boolean().optional(),
  confirmStopAll: z.boolean().optional(),
  maxScrollbackLines: z.number().int().min(100).max(100000).optional(),
  autoStartEnabled: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  globalHotkey: z.string().optional(),
  scriptsDirectory: z.string().nullable().optional()
})

export function registerSettingsHandlers(repo: SettingsRepository): void {
  ipcMain.handle('settings:get-all', () => {
    return repo.getAll()
  })

  ipcMain.handle('settings:update', (_event, payload: unknown) => {
    const partial = SettingsUpdateSchema.parse(payload)
    repo.updateAll(partial)
  })
}
