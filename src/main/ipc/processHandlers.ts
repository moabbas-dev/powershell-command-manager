import { ipcMain } from 'electron'
import { z } from 'zod'
import type { ProcessManager } from '../process/ProcessManager'

export function registerProcessHandlers(manager: ProcessManager): void {
  ipcMain.handle('processes:start', async (_event, payload: unknown) => {
    const { commandId } = z.object({ commandId: z.number().int() }).parse(payload)
    try {
      return await manager.start(commandId)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.startsWith('ALREADY_RUNNING:')) {
        const processId = message.replace('ALREADY_RUNNING:', '')
        return { error: 'already_running', processId }
      }
      if (message.startsWith('INVALID_CWD:')) {
        return { error: 'invalid_cwd', message: message.replace('INVALID_CWD:', '') }
      }
      if (message.startsWith('INVALID_SCRIPT:')) {
        return { error: 'invalid_script', message: message.replace('INVALID_SCRIPT:', '') }
      }
      if (message.startsWith('UNSUPPORTED_SCRIPT:')) {
        return { error: 'unsupported_script', message: message.replace('UNSUPPORTED_SCRIPT:', '') }
      }
      return { error: 'spawn_failed', message }
    }
  })

  ipcMain.handle('processes:stop', async (_event, payload: unknown) => {
    const { processId } = z.object({ processId: z.string() }).parse(payload)
    await manager.stop(processId)
  })

  ipcMain.handle('processes:restart', async (_event, payload: unknown) => {
    const { processId } = z.object({ processId: z.string() }).parse(payload)
    try {
      return await manager.restart(processId)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { error: 'restart_failed', message }
    }
  })

  ipcMain.handle('processes:stop-all', async () => {
    await manager.stopAll()
  })

  ipcMain.handle('processes:get-all', () => {
    return manager.getAll()
  })
}
