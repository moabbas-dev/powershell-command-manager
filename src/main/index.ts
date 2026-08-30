import { app, globalShortcut, BrowserWindow } from 'electron'
import { createWindow, setMainWindow } from './window'
import { initDatabase, closeDatabase } from './database/connection'
import { CommandRepository } from './database/repositories/CommandRepository'
import { GroupRepository } from './database/repositories/GroupRepository'
import { ExecutionRepository } from './database/repositories/ExecutionRepository'
import { SettingsRepository } from './database/repositories/SettingsRepository'
import { ProcessManager } from './process/ProcessManager'
import { registerAllHandlers } from './ipc'
import { createTray, destroyTray, showWindow, updateTrayMenu } from './tray'
import { notifyProcessEnded } from './notifications'
import type { ProcessStatusEvent } from '../shared/types'

// ── Single-instance lock (production only — dev allows multiple instances) ───
const isDev = process.env.NODE_ENV === 'development'
if (!isDev && !app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let processManager: ProcessManager
let settingsRepo: SettingsRepository
let isQuitting = false

app.on('second-instance', () => {
  showWindow()
})

app.whenReady().then(async () => {
  // ── Database ─────────────────────────────────────────────────────────────
  const db = initDatabase()
  const commandRepo = new CommandRepository(db)
  const groupRepo = new GroupRepository(db)
  const executionRepo = new ExecutionRepository(db)
  settingsRepo = new SettingsRepository(db)

  try { executionRepo.pruneToLimit(500) } catch { /* non-fatal */ }

  // ── Process Manager ──────────────────────────────────────────────────────
  processManager = new ProcessManager(commandRepo, executionRepo)

  // Wire process status side-effects (notifications, tray)
  processManager.onStatusChange = (event: ProcessStatusEvent) => {
    const settings = settingsRepo.getAll()
    const endStatuses: ProcessStatusEvent['status'][] = ['completed', 'failed']
    if (settings.notificationsEnabled && endStatuses.includes(event.status)) {
      const ps = processManager.getByProcessId(event.processId)
      notifyProcessEnded(ps?.commandName ?? 'Process', event.status, event.exitCode ?? null)
    }
    updateTrayMenu(processManager)
  }

  // ── IPC ──────────────────────────────────────────────────────────────────
  registerAllHandlers({ commandRepo, groupRepo, executionRepo, settingsRepo, processManager })

  // ── Window ───────────────────────────────────────────────────────────────
  const win = createWindow()
  processManager.setWebContents(win.webContents)

  // ── Tray ─────────────────────────────────────────────────────────────────
  const tray = createTray(processManager)

  // Window close behavior
  win.on('close', event => {
    if (isQuitting) return
    const settings = settingsRepo.getAll()
    if (settings.minimizeToTray) {
      event.preventDefault()
      win.hide()
    }
    // If tray disabled, renderer shows a confirm dialog before calling app:quit
  })

  // ── Global Shortcut ──────────────────────────────────────────────────────
  const settings = settingsRepo.getAll()
  try {
    globalShortcut.register(settings.globalHotkey, () => showWindow())
  } catch { /* non-fatal */ }

  // ── Auto-Start ───────────────────────────────────────────────────────────
  if (settings.autoStartEnabled) {
    const autoStartCommands = commandRepo.listAutoStart()
    if (autoStartCommands.length > 0) {
      setTimeout(async () => {
        await processManager.startAutoStartCommands(autoStartCommands)
      }, 1500)
    }
  }

  void tray // Keep tray reference alive
})

app.on('before-quit', async event => {
  if (isQuitting) return
  isQuitting = true
  event.preventDefault()

  try { await processManager?.cleanup() } catch { /* force quit */ }

  globalShortcut.unregisterAll()
  destroyTray()
  closeDatabase()
  setMainWindow(null)
  app.quit()
})

app.on('window-all-closed', () => {
  // Intentionally keep alive via tray on Windows
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const win = createWindow()
    processManager?.setWebContents(win.webContents)
  } else {
    showWindow()
  }
})
