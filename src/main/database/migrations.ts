import type Database from 'better-sqlite3'

interface Migration {
  version: number
  up: (db: Database.Database) => void
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS groups (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          name        TEXT    NOT NULL,
          color       TEXT,
          icon        TEXT,
          position    INTEGER NOT NULL DEFAULT 0,
          created_at  INTEGER NOT NULL,
          updated_at  INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS commands (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id          INTEGER REFERENCES groups(id) ON DELETE SET NULL,
          name              TEXT    NOT NULL,
          command           TEXT    NOT NULL,
          description       TEXT,
          working_directory TEXT,
          env_vars          TEXT,
          is_favorite       INTEGER NOT NULL DEFAULT 0,
          is_enabled        INTEGER NOT NULL DEFAULT 1,
          auto_start        INTEGER NOT NULL DEFAULT 0,
          position          INTEGER NOT NULL DEFAULT 0,
          created_at        INTEGER NOT NULL,
          updated_at        INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS executions (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          command_id  INTEGER NOT NULL REFERENCES commands(id) ON DELETE CASCADE,
          started_at  INTEGER NOT NULL,
          ended_at    INTEGER,
          exit_code   INTEGER,
          status      TEXT    NOT NULL DEFAULT 'running'
        );

        CREATE TABLE IF NOT EXISTS settings (
          key         TEXT PRIMARY KEY,
          value       TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_commands_group_id    ON commands(group_id);
        CREATE INDEX IF NOT EXISTS idx_commands_is_favorite ON commands(is_favorite) WHERE is_favorite = 1;
        CREATE INDEX IF NOT EXISTS idx_commands_auto_start  ON commands(auto_start)  WHERE auto_start  = 1;
        CREATE INDEX IF NOT EXISTS idx_commands_position    ON commands(group_id, position);
        CREATE INDEX IF NOT EXISTS idx_executions_cmd       ON executions(command_id);
        CREATE INDEX IF NOT EXISTS idx_executions_started   ON executions(started_at DESC);
      `)
    }
  }
]

export function runMigrations(db: Database.Database): void {
  // Ensure settings table exists for version tracking (bootstrap problem)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  const getCurrentVersion = db.prepare<[], { value: string }>(
    `SELECT value FROM settings WHERE key = 'schema_version'`
  )

  const setVersion = db.prepare(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('schema_version', ?)`
  )

  const row = getCurrentVersion.get()
  const currentVersion = row ? parseInt(row.value, 10) : 0

  const pending = migrations.filter(m => m.version > currentVersion)

  for (const migration of pending) {
    const runMigration = db.transaction(() => {
      migration.up(db)
      setVersion.run(String(migration.version))
    })
    runMigration()
  }
}
