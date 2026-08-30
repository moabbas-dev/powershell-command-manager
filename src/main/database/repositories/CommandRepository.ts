import type Database from 'better-sqlite3'
import type {
  Command,
  CreateCommandInput,
  UpdateCommandInput,
  ReorderItem
} from '../../../shared/types'

interface CommandRow {
  id: number
  group_id: number | null
  name: string
  command: string
  description: string | null
  working_directory: string | null
  env_vars: string | null
  is_favorite: number
  is_enabled: number
  auto_start: number
  position: number
  created_at: number
  updated_at: number
}

function rowToCommand(row: CommandRow): Command {
  let envVars: Record<string, string> | null = null
  if (row.env_vars) {
    try {
      envVars = JSON.parse(row.env_vars) as Record<string, string>
    } catch {
      envVars = null
    }
  }

  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    command: row.command,
    description: row.description,
    workingDirectory: row.working_directory,
    envVars,
    isFavorite: row.is_favorite === 1,
    isEnabled: row.is_enabled === 1,
    autoStart: row.auto_start === 1,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class CommandRepository {
  constructor(private db: Database.Database) {}

  list(groupId?: number): Command[] {
    let rows: CommandRow[]
    if (groupId !== undefined) {
      rows = this.db
        .prepare<[number], CommandRow>(
          `SELECT * FROM commands WHERE group_id = ? ORDER BY position ASC, name ASC`
        )
        .all(groupId)
    } else {
      rows = this.db
        .prepare<[], CommandRow>(
          `SELECT * FROM commands ORDER BY group_id ASC NULLS LAST, position ASC, name ASC`
        )
        .all()
    }
    return rows.map(rowToCommand)
  }

  listFavorites(): Command[] {
    const rows = this.db
      .prepare<[], CommandRow>(
        `SELECT * FROM commands WHERE is_favorite = 1 AND is_enabled = 1 ORDER BY position ASC, name ASC`
      )
      .all()
    return rows.map(rowToCommand)
  }

  listAutoStart(): Command[] {
    const rows = this.db
      .prepare<[], CommandRow>(
        `SELECT * FROM commands WHERE auto_start = 1 AND is_enabled = 1 ORDER BY position ASC`
      )
      .all()
    return rows.map(rowToCommand)
  }

  search(query: string): Command[] {
    const pattern = `%${query}%`
    const rows = this.db
      .prepare<[string, string, string], CommandRow>(
        `SELECT * FROM commands
         WHERE (name LIKE ? OR command LIKE ? OR description LIKE ?)
         AND is_enabled = 1
         ORDER BY name ASC`
      )
      .all(pattern, pattern, pattern)
    return rows.map(rowToCommand)
  }

  getById(id: number): Command | null {
    const row = this.db
      .prepare<[number], CommandRow>(`SELECT * FROM commands WHERE id = ?`)
      .get(id)
    return row ? rowToCommand(row) : null
  }

  create(input: CreateCommandInput): Command {
    const now = Date.now()
    const maxPos = this.db
      .prepare<[number | null], { pos: number | null }>(
        `SELECT MAX(position) as pos FROM commands WHERE group_id IS ?`
      )
      .get(input.groupId ?? null)
    const position = input.position ?? ((maxPos?.pos ?? -1) + 1)

    const result = this.db
      .prepare(
        `INSERT INTO commands
           (group_id, name, command, description, working_directory, env_vars,
            is_favorite, is_enabled, auto_start, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.groupId ?? null,
        input.name,
        input.command,
        input.description ?? null,
        input.workingDirectory ?? null,
        input.envVars ? JSON.stringify(input.envVars) : null,
        input.isFavorite ? 1 : 0,
        input.isEnabled !== false ? 1 : 0,
        input.autoStart ? 1 : 0,
        position,
        now,
        now
      )

    return this.getById(result.lastInsertRowid as number)!
  }

  update(id: number, input: UpdateCommandInput): Command {
    const current = this.getById(id)
    if (!current) throw new Error(`Command ${id} not found`)

    const now = Date.now()
    this.db
      .prepare(
        `UPDATE commands SET
           group_id = ?, name = ?, command = ?, description = ?,
           working_directory = ?, env_vars = ?,
           is_favorite = ?, is_enabled = ?, auto_start = ?,
           position = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        input.groupId !== undefined ? input.groupId : current.groupId,
        input.name ?? current.name,
        input.command ?? current.command,
        input.description !== undefined ? input.description : current.description,
        input.workingDirectory !== undefined ? input.workingDirectory : current.workingDirectory,
        input.envVars !== undefined
          ? input.envVars
            ? JSON.stringify(input.envVars)
            : null
          : current.envVars
            ? JSON.stringify(current.envVars)
            : null,
        input.isFavorite !== undefined ? (input.isFavorite ? 1 : 0) : current.isFavorite ? 1 : 0,
        input.isEnabled !== undefined ? (input.isEnabled ? 1 : 0) : current.isEnabled ? 1 : 0,
        input.autoStart !== undefined ? (input.autoStart ? 1 : 0) : current.autoStart ? 1 : 0,
        input.position ?? current.position,
        now,
        id
      )

    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare(`DELETE FROM commands WHERE id = ?`).run(id)
  }

  reorder(items: ReorderItem[]): void {
    const update = this.db.prepare(
      `UPDATE commands SET group_id = ?, position = ?, updated_at = ? WHERE id = ?`
    )
    const now = Date.now()
    const run = this.db.transaction(() => {
      for (const item of items) {
        update.run(item.groupId ?? null, item.position, now, item.id)
      }
    })
    run()
  }
}
