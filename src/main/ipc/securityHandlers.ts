import { ipcMain, dialog, BrowserWindow } from 'electron'
import { existsSync, statSync } from 'fs'
import { basename } from 'path'
import { scanFileForViruses, getDefenderInfo } from '../scripts/virusScanner'
import type { SecurityScanResult } from '../../shared/types'

// Generous — this is a general "check this file" utility, not limited to
// scripts, but a multi-GB scan could hang the UI for a long time.
const MAX_SCAN_SIZE_BYTES = 500 * 1024 * 1024

export function registerSecurityHandlers(): void {
  ipcMain.handle('security:pick-and-scan-file', async (event): Promise<SecurityScanResult> => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win ?? new BrowserWindow(), {
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    return scanPickedFile(result.filePaths[0])
  })
}

/** Extracted from the IPC glue so it's directly testable. */
export async function scanPickedFile(filePath: string): Promise<SecurityScanResult> {
  if (!existsSync(filePath)) {
    return { ok: false, error: 'File not found' }
  }

  const stat = statSync(filePath)
  if (!stat.isFile()) {
    return { ok: false, error: 'Not a file' }
  }
  if (stat.size > MAX_SCAN_SIZE_BYTES) {
    return { ok: false, error: 'File is too large to scan (max 500MB)' }
  }

  const [scan, defender] = await Promise.all([scanFileForViruses(filePath), getDefenderInfo()])

  return {
    ok: true,
    fileName: basename(filePath),
    filePath,
    fileSizeBytes: stat.size,
    scannedAt: Date.now(),
    scanned: scan.scanned,
    clean: scan.clean,
    threats: scan.threats,
    rawOutput: scan.rawOutput,
    scanError: scan.error,
    defender
  }
}
