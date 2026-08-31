import { ipcMain } from 'electron'
import { z } from 'zod'
import { existsSync, statSync, writeFileSync } from 'fs'
import { join, basename } from 'path'
import type { SettingsRepository } from '../database/repositories/SettingsRepository'
import type { CommandRepository } from '../database/repositories/CommandRepository'
import type { SaveScriptResult } from '../../shared/types'
import { validatePowerShellScript } from '../scripts/scriptValidator'
import { deleteScript } from '../files/scriptStorage'

const SCRIPT_EXTENSIONS = ['ps1', 'bat', 'cmd'] as const

const SaveScriptSchema = z.object({
  fileName: z.string().max(255),
  extension: z.enum(SCRIPT_EXTENSIONS),
  content: z.string(),
  description: z.string().nullable().optional(),
  commandId: z.number().int().nullable().optional()
})

export type SaveScriptParsedInput = z.infer<typeof SaveScriptSchema>

// Windows reserves these characters in file names.
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/

/**
 * Validates, writes the script file, and creates or updates the command
 * that runs it — extracted from the IPC glue so it's directly testable.
 */
export async function saveScriptAndLinkCommand(
  settingsRepo: SettingsRepository,
  commandRepo: CommandRepository,
  input: SaveScriptParsedInput
): Promise<SaveScriptResult> {
  const { fileName, extension, content, description, commandId } = input

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

  // Syntax validation only applies to PowerShell — there's no safe, non-executing
  // way to check .bat/.cmd syntax, so those just require non-empty content.
  if (extension === 'ps1') {
    const validation = await validatePowerShellScript(content)
    if (!validation.valid) {
      return {
        ok: false,
        errors: validation.errors.length ? validation.errors : ['Script has syntax errors']
      }
    }
  }

  const finalFileName = `${safeBaseName}.${extension}`
  const targetPath = join(scriptsDirectory, finalFileName)

  const existingCommand = commandId != null ? commandRepo.getById(commandId) : null
  const previousPath =
    existingCommand && existingCommand.commandType === 'script' ? existingCommand.command : null

  try {
    writeFileSync(targetPath, content, 'utf8')
  } catch (err) {
    return { ok: false, errors: [`Failed to save script: ${String(err)}`] }
  }

  const commandInput = {
    name: safeBaseName,
    commandType: 'script' as const,
    command: targetPath,
    scriptFileName: finalFileName,
    description: description?.trim() || null
  }

  let savedCommandId: number
  try {
    const savedCommand = existingCommand
      ? commandRepo.update(existingCommand.id, commandInput)
      : commandRepo.create(commandInput)
    savedCommandId = savedCommand.id
  } catch (err) {
    // The script file itself is saved fine — only the command linkage failed.
    return {
      ok: false,
      errors: [`Script saved, but failed to create/update its command: ${String(err)}`]
    }
  }

  // Renamed (name and/or extension changed) — clean up the now-stale file
  // only after the command row is confirmed pointing at the new one.
  if (previousPath && previousPath !== targetPath) {
    deleteScript(previousPath)
  }

  return { ok: true, path: targetPath, commandId: savedCommandId }
}

export function registerScriptHandlers(
  settingsRepo: SettingsRepository,
  commandRepo: CommandRepository
): void {
  ipcMain.handle('scripts:save', async (_event, payload: unknown) => {
    const parsed = SaveScriptSchema.parse(payload)
    return saveScriptAndLinkCommand(settingsRepo, commandRepo, parsed)
  })
}
