import React, { useState } from 'react'
import { FolderOpen, Download, Upload } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import type { AppSettings } from '@shared/types'

export function SettingsModal(): React.ReactElement {
  const openModal = useUIStore(s => s.openModal)
  const closeModal = useUIStore(s => s.closeModal)
  const openConfirm = useUIStore(s => s.openConfirm)
  const settings = useSettingsStore(s => s.settings)
  const updateSettings = useSettingsStore(s => s.update)

  const [dbStatus, setDbStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  const isOpen = openModal === 'settings'

  const set = (key: keyof AppSettings, value: unknown): void => {
    updateSettings({ [key]: value })
  }

  const handleExport = async (): Promise<void> => {
    setDbStatus(null)
    const result = await window.api.db.export()
    if (result.canceled) return
    setDbStatus(
      result.ok
        ? { type: 'success', message: `Exported to ${result.path}` }
        : { type: 'error', message: result.error ?? 'Export failed' }
    )
  }

  const runImport = async (): Promise<void> => {
    setDbStatus(null)
    const result = await window.api.db.import()
    if (result.canceled) return
    // On success the app quits and relaunches on its own — nothing left to show.
    if (!result.ok) {
      setDbStatus({ type: 'error', message: result.error ?? 'Import failed' })
    }
  }

  const handleImportClick = (): void => {
    openConfirm(
      'Import a database backup? This replaces all commands, groups, and settings with the ' +
        "backup's contents, and restarts the app.",
      runImport
    )
  }

  return (
    <Dialog open={isOpen} onClose={closeModal} title="Settings" maxWidth="max-w-md">
      <div className="flex flex-col gap-5">
        <SettingRow
          label="Minimize to tray on close"
          description="App stays in system tray instead of quitting"
        >
          <Toggle
            checked={settings.minimizeToTray}
            onChange={v => set('minimizeToTray', v)}
          />
        </SettingRow>

        <SettingRow
          label="Auto-start commands on launch"
          description="Automatically start commands marked 'Auto-start' when app opens"
        >
          <Toggle
            checked={settings.autoStartEnabled}
            onChange={v => set('autoStartEnabled', v)}
          />
        </SettingRow>

        <SettingRow
          label="Confirm before Stop All"
          description="Show confirmation dialog when stopping all running commands"
        >
          <Toggle
            checked={settings.confirmStopAll}
            onChange={v => set('confirmStopAll', v)}
          />
        </SettingRow>

        <SettingRow
          label="Notifications"
          description="Show OS notifications when processes complete or fail"
        >
          <Toggle
            checked={settings.notificationsEnabled}
            onChange={v => set('notificationsEnabled', v)}
          />
        </SettingRow>

        <div className="flex flex-col gap-1.5">
          <div>
            <p className="text-sm font-medium text-app-text">Scripts folder</p>
            <p className="text-xs text-app-muted mt-0.5">
              Where scripts created with the &quot;New Script&quot; editor are saved
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={settings.scriptsDirectory ?? ''}
              placeholder="No folder chosen"
              className="flex-1 h-8 px-3 text-xs bg-app-bg border border-app-border rounded-md text-app-text placeholder:text-app-muted focus:outline-none"
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={async () => {
                const dir = await window.api.dialog.pickDirectory()
                if (dir) set('scriptsDirectory', dir)
              }}
            >
              <FolderOpen size={14} />
            </Button>
          </div>
        </div>

        <SettingRow
          label="Output scrollback lines"
          description="Maximum lines kept in each process output buffer"
        >
          <select
            value={settings.maxScrollbackLines}
            onChange={e => set('maxScrollbackLines', parseInt(e.target.value))}
            className="h-7 px-2 text-xs bg-app-bg border border-app-border rounded text-app-text focus:outline-none focus:border-blue-500"
          >
            {[1000, 5000, 10000, 25000, 50000].map(v => (
              <option key={v} value={v}>{v.toLocaleString()} lines</option>
            ))}
          </select>
        </SettingRow>

        <div className="flex flex-col gap-2 pt-2 border-t border-app-border">
          <div>
            <p className="text-sm font-medium text-app-text">Backup &amp; restore</p>
            <p className="text-xs text-app-muted mt-0.5">
              Export everything (commands, groups, settings, history) to a file, or import a
              previous backup
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
              <Download size={13} /> Export Database...
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleImportClick}>
              <Upload size={13} /> Import Database...
            </Button>
          </div>
          {dbStatus && (
            <p
              className={[
                'text-xs rounded-md px-2.5 py-1.5 border',
                dbStatus.type === 'success'
                  ? 'text-green-400 bg-green-950/30 border-green-900'
                  : 'text-red-400 bg-red-950/30 border-red-900'
              ].join(' ')}
            >
              {dbStatus.message}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-app-border">
          <p className="text-[10px] text-app-muted">
            Global hotkey: <code className="bg-app-surface px-1 rounded">{settings.globalHotkey}</code>
            {' '}— focuses the application from anywhere
          </p>
        </div>
      </div>
    </Dialog>
  )
}

function SettingRow({
  label,
  description,
  children
}: {
  label: string
  description?: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-app-text">{label}</p>
        {description && <p className="text-xs text-app-muted mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}): React.ReactElement {
  return (
    <div
      className={[
        'relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0',
        checked ? 'bg-blue-600' : 'bg-app-border'
      ].join(' ')}
      onClick={() => onChange(!checked)}
    >
      <div
        className={[
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        ].join(' ')}
      />
    </div>
  )
}
