import type Database from 'better-sqlite3'
import type { AppSettings } from '../../../shared/types'

const DEFAULT_SETTINGS: AppSettings = {
  minimizeToTray: true,
  startMinimized: false,
  confirmStopAll: true,
  maxScrollbackLines: 10000,
  autoStartEnabled: true,
  notificationsEnabled: true,
  globalHotkey: 'CommandOrControl+Alt+C',
  scriptsDirectory: null
}

export class SettingsRepository {
  private get: Database.Statement<[string], { value: string }>
  private set: Database.Statement

  constructor(private db: Database.Database) {
    this.get = db.prepare<[string], { value: string }>(
      `SELECT value FROM settings WHERE key = ?`
    )
    this.set = db.prepare(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`
    )
  }

  getValue<T>(key: string, defaultValue: T): T {
    const row = this.get.get(key)
    if (!row) return defaultValue
    try {
      return JSON.parse(row.value) as T
    } catch {
      return defaultValue
    }
  }

  setValue<T>(key: string, value: T): void {
    this.set.run(key, JSON.stringify(value))
  }

  getAll(): AppSettings {
    const settings: AppSettings = { ...DEFAULT_SETTINGS }
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]) {
      const row = this.get.get(key)
      if (row) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(settings as any)[key] = JSON.parse(row.value)
        } catch {
          // Keep default
        }
      }
    }
    return settings
  }

  updateAll(partial: Partial<AppSettings>): void {
    const update = this.db.transaction(() => {
      for (const [key, value] of Object.entries(partial)) {
        this.set.run(key, JSON.stringify(value))
      }
    })
    update()
  }
}
