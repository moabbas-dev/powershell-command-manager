import { ipcMain } from 'electron'
import { z } from 'zod'
import { existsSync, statSync, writeFileSync } from 'fs'
import { join, extname, basename } from 'path'
import type { SettingsRepository } from '../database/repositories/SettingsRepository'
import { validatePowerShellScript } from '../scripts/scriptValidator'

const SaveScriptSchema = z.object({
  fileName: z.string().max(255),
  content: z.string()
})

// Windows reserves these characters in file names.
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/

export function registerScriptHandlers(settingsRepo: SettingsRepository): void {
  ipcMain.handle('scripts:save', async (_event, payload: unknown) => {
    const { fileName, content } = SaveScriptSchema.parse(payload)

    const scriptsDirectory = settingsRepo.getAll().scriptsDirectory
    if (!scriptsDirectory) {
      return { ok: false, errors: ['Choose a scripts folder in Settings first'] }
    }
    if (!existsSync(scriptsDirectory) || !statSync(scriptsDirectory).isDirectory()) {
      return { ok: false, errors: [`Scripts folder not found: ${scriptsDirectory}`] }
    }

    const trimmedName = fileName.trim()
    if (!trimmedName) {
      return { ok: false, errors: ['File name is required'] }
    }
    // Strip any directory components a caller might sneak into the name
    // (defense in depth — the renderer never sends one, but the schema alone doesn't stop it).
    const safeBaseName = basename(trimmedName)
    if (!safeBaseName || INVALID_FILENAME_CHARS.test(safeBaseName)) {
      return { ok: false, errors: ['File name contains invalid characters'] }
    }

    if (!content.trim()) {
      return { ok: false, errors: ['Script content is empty'] }
    }

    const validation = await validatePowerShellScript(content)
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors.length ? validation.errors : ['Script has syntax errors']
      }
    }

    const finalName =
      extname(safeBaseName).toLowerCase() === '.ps1' ? safeBaseName : `${safeBaseName}.ps1`
    const targetPath = join(scriptsDirectory, finalName)

    try {
      writeFileSync(targetPath, content, 'utf8')
    } catch (err) {
      return { ok: false, errors: [`Failed to save script: ${String(err)}`] }
    }

    return { ok: true, path: targetPath }
  })
}
