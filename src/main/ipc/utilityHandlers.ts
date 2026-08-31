import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { z } from 'zod'
import type { ExecutionRepository } from '../database/repositories/ExecutionRepository'
import { ALLOWED_SCRIPT_EXTENSIONS } from '../files/scriptStorage'

export function registerUtilityHandlers(executionRepo: ExecutionRepository): void {
  ipcMain.handle('dialog:pick-directory', async event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win ?? new BrowserWindow(), {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('dialog:pick-script-file', async event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win ?? new BrowserWindow(), {
      properties: ['openFile'],
      filters: [
        {
          name: 'Windows Scripts',
          extensions: ALLOWED_SCRIPT_EXTENSIONS.map(ext => ext.replace('.', ''))
        }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('executions:recent', (_event, payload: unknown) => {
    const { limit } = z.object({ limit: z.number().int().optional() }).parse(payload ?? {})
    return executionRepo.recent(limit ?? 20)
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
  })

  ipcMain.handle('app:minimize', event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })
}
