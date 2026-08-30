import type Database from 'better-sqlite3'
import type { Group, CreateGroupInput, UpdateGroupInput, ReorderItem } from '../../../shared/types'

interface GroupRow {
  id: number
  name: string
  color: string | null
  icon: string | null
  position: number
  created_at: number
  updated_at: number
}

function rowToGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class GroupRepository {
  constructor(private db: Database.Database) {}

  list(): Group[] {
    const rows = this.db
      .prepare<[], GroupRow>(`SELECT * FROM groups ORDER BY position ASC, name ASC`)
      .all()
    return rows.map(rowToGroup)
  }

  getById(id: number): Group | null {
    const row = this.db
      .prepare<[number], GroupRow>(`SELECT * FROM groups WHERE id = ?`)
      .get(id)
    return row ? rowToGroup(row) : null
  }

  create(input: CreateGroupInput): Group {
    const now = Date.now()
    const maxPos = this.db
      .prepare<[], { pos: number | null }>(`SELECT MAX(position) as pos FROM groups`)
      .get()
    const position = input.position ?? ((maxPos?.pos ?? -1) + 1)

    const result = this.db
      .prepare(
        `INSERT INTO groups (name, color, icon, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(input.name, input.color ?? null, input.icon ?? null, position, now, now)

    return this.getById(result.lastInsertRowid as number)!
  }

  update(id: number, input: UpdateGroupInput): Group {
    const current = this.getById(id)
    if (!current) throw new Error(`Group ${id} not found`)

    const now = Date.now()
    this.db
      .prepare(
        `UPDATE groups SET name = ?, color = ?, icon = ?, position = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        input.name ?? current.name,
        input.color !== undefined ? input.color : current.color,
        input.icon !== undefined ? input.icon : current.icon,
        input.position ?? current.position,
        now,
        id
      )

    return this.getById(id)!
  }

  delete(id: number): void {
    // Commands with this group_id will have group_id set to NULL (ON DELETE SET NULL)
    this.db.prepare(`DELETE FROM groups WHERE id = ?`).run(id)
  }

  reorder(items: ReorderItem[]): void {
    const update = this.db.prepare(`UPDATE groups SET position = ?, updated_at = ? WHERE id = ?`)
    const now = Date.now()
    const run = this.db.transaction(() => {
      for (const item of items) {
        update.run(item.position, now, item.id)
      }
    })
    run()
  }
}
