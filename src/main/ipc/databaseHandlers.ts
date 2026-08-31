import { app, dialog, BrowserWindow, ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { getDatabase, getDatabasePath, stageDatabaseImport } from '../database/connection'

const REQUIRED_TABLES = ['commands', 'groups', 'executions', 'settings']

/** Opens the candidate file read-only and checks it has the expected schema. */
function validateBackupFile(path: string): string | null {
  let testDb: Database.Database | null = null
  try {
    testDb = new Database(path, { readonly: true, fileMustExist: true })
    const rows = testDb
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
      .all() as { name: string }[]
    const tables = new Set(rows.map(r => r.name))
    const missing = REQUIRED_TABLES.filter(t => !tables.has(t))
    if (missing.length > 0) {
      return `Not a valid backup file — missing tables: ${missing.join(', ')}`
    }
    return null
  } catch (err) {
    return `Not a valid SQLite database: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    testDb?.close()
  }
}

export function registerDatabaseHandlers(): void {
  ipcMain.handle('db:export', async event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const defaultPath = `powershell-cmd-manager-backup-${new Date().toISOString().slice(0, 10)}.db`
    const result = await dialog.showSaveDialog(win ?? new BrowserWindow(), {
      defaultPath,
      filters: [{ name: 'Database', extensions: ['db'] }]
    })
    if (result.canceled || !result.filePath) return { ok: false, canceled: true }

    try {
      // better-sqlite3's backup() uses SQLite's online backup API — safe to run
      // against a live, in-use database (unlike a raw file copy of the .db file).
      await getDatabase().backup(result.filePath)
      return { ok: true, path: result.filePath }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('db:import', async event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win ?? new BrowserWindow(), {
      properties: ['openFile'],
      filters: [{ name: 'Database', extensions: ['db'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true }

    const sourcePath = result.filePaths[0]
    if (sourcePath === getDatabasePath()) {
      return { ok: false, error: 'That is already the active database' }
    }

    const validationError = validateBackupFile(sourcePath)
    if (validationError) return { ok: false, error: validationError }

    try {
      stageDatabaseImport(sourcePath)
    } catch (err) {
      return {
        ok: false,
        error: `Failed to stage import: ${err instanceof Error ? err.message : String(err)}`
      }
    }

    // Swapping the live file safely requires no connection be open — restart
    // and let initDatabase() apply the staged import before anything reconnects.
    app.relaunch()
    app.quit()
    return { ok: true, relaunching: true }
  })
}
