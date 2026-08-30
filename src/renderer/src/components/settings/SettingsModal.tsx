import React from 'react'
import { Dialog } from '../ui/Dialog'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import type { AppSettings } from '@shared/types'

export function SettingsModal(): React.ReactElement {
  const openModal = useUIStore(s => s.openModal)
  const closeModal = useUIStore(s => s.closeModal)
  const settings = useSettingsStore(s => s.settings)
  const updateSettings = useSettingsStore(s => s.update)

  const isOpen = openModal === 'settings'

  const set = (key: keyof AppSettings, value: unknown): void => {
    updateSettings({ [key]: value })
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
