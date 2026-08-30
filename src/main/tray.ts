import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'
import type { ProcessManager } from './process/ProcessManager'
import { getMainWindow } from './window'

let tray: Tray | null = null

export function createTray(processManager: ProcessManager): Tray {
  // Use a default icon — in production this would be build/icon.ico
  const iconPath = join(__dirname, '../../build/icon.png')
  let icon: Electron.NativeImage
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty()
    }
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('PowerShell Command Manager')
  updateTrayMenu(processManager)

  tray.on('double-click', () => {
    showWindow()
  })

  return tray
}

export function updateTrayMenu(processManager: ProcessManager): void {
  if (!tray) return

  const runningCount = processManager.getAll().filter(p => p.status === 'running').length

  const menu = Menu.buildFromTemplate([
    {
      label: 'PowerShell Command Manager',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Open',
      click: () => showWindow()
    },
    {
      label: runningCount > 0 ? `Stop All (${runningCount} running)` : 'Stop All',
      enabled: runningCount > 0,
      click: async () => {
        await processManager.stopAll()
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(menu)
}

export function showWindow(): void {
  const win = getMainWindow()
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
