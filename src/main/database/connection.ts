import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, unlinkSync, renameSync, copyFileSync } from 'fs'
import { runMigrations } from './migrations'

let db: Database.Database | null = null

export function getDatabasePath(): string {
  return join(app.getPath('userData'), 'commands.db')
}

function getPendingImportPath(): string {
  return `${getDatabasePath()}.importing`
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(): Database.Database {
  const dbPath = getDatabasePath()

  // If an import was staged before the last relaunch, swap it in now — this is
  // the only point where no connection is open yet, so it's safe to replace the file.
  const pendingImportPath = getPendingImportPath()
  if (existsSync(pendingImportPath)) {
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        unlinkSync(dbPath + suffix)
      } catch {
        // may not exist
      }
    }
    renameSync(pendingImportPath, dbPath)
  }

  db = new Database(dbPath)

  // Performance and safety PRAGMAs
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  db.pragma('temp_store = MEMORY')
  db.pragma('mmap_size = 268435456') // 256MB

  runMigrations(db)

  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/** Stages a database file to replace the live one on next startup (see initDatabase). */
export function stageDatabaseImport(sourcePath: string): void {
  copyFileSync(sourcePath, getPendingImportPath())
}
