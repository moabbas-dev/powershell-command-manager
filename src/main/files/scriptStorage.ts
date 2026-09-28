import { app } from 'electron'
import { existsSync, mkdirSync, copyFileSync, unlinkSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import { randomUUID } from 'crypto'
import { scanFileForViruses } from '../scripts/virusScanner'

/** Windows shell script types this app knows how to run. */
export const ALLOWED_SCRIPT_EXTENSIONS = ['.ps1', '.bat', '.cmd'] as const

const MAX_SCRIPT_SIZE_BYTES = 5 * 1024 * 1024 // 5MB safety cap

function getScriptsDir(): string {
  const dir = join(app.getPath('userData'), 'scripts')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Copies a user-picked script file into app storage so the command keeps
 * working even if the original file is later moved, renamed, or deleted.
 * Scans the source with Windows Defender before copying it in.
 */
export async function saveScript(
  sourcePath: string
): Promise<{ storedPath: string; originalName: string }> {
  if (!existsSync(sourcePath)) {
    throw new Error(`INVALID_SCRIPT:Script file not found: ${sourcePath}`)
  }

  const stat = statSync(sourcePath)
  if (!stat.isFile()) {
    throw new Error(`INVALID_SCRIPT:Not a file: ${sourcePath}`)
  }
  if (stat.size > MAX_SCRIPT_SIZE_BYTES) {
    throw new Error('INVALID_SCRIPT:Script file is too large (max 5MB)')
  }

  const ext = extname(sourcePath).toLowerCase()
  if (!(ALLOWED_SCRIPT_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new Error(
      `INVALID_SCRIPT:Unsupported file type "${ext || '(none)'}". Allowed: ${ALLOWED_SCRIPT_EXTENSIONS.join(', ')}`
    )
  }

  const scan = await scanFileForViruses(sourcePath)
  if (!scan.clean) {
    const threatList = scan.threats.join(', ') || 'unknown threat'
    throw new Error(
      `INFECTED_SCRIPT:Windows Defender flagged this file (${threatList}). It was not imported.`
    )
  }

  const originalName = basename(sourcePath)
  const storedPath = join(getScriptsDir(), `${randomUUID()}${ext}`)
  copyFileSync(sourcePath, storedPath)

  return { storedPath, originalName }
}

/**
 * Strips the `CODE:` prefix used internally to categorize saveScript() errors
 * (matched elsewhere, e.g. processHandlers.ts) so callers that don't need the
 * category can surface a clean message to the user.
 */
export function formatScriptError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  return message.replace(/^(INVALID_SCRIPT|INFECTED_SCRIPT):/, '')
}

/** Removes a previously stored script copy. Safe to call even if already gone. */
export function deleteScript(storedPath: string): void {
  try {
    if (existsSync(storedPath)) unlinkSync(storedPath)
  } catch {
    // non-fatal — orphaned file, not worth failing the caller's operation over
  }
}
