import type Database from 'better-sqlite3'
import type { RecentExecution } from '../../../shared/types'

interface ExecutionRow {
  id: number
  command_id: number
  command_name: string
  started_at: number
  ended_at: number | null
  exit_code: number | null
  status: string
}

export class ExecutionRepository {
  constructor(private db: Database.Database) {}

  insert(commandId: number, startedAt: number): number {
    const result = this.db
      .prepare(
        `INSERT INTO executions (command_id, started_at, status) VALUES (?, ?, 'running')`
      )
      .run(commandId, startedAt)
    return result.lastInsertRowid as number
  }

  updateEnd(
    id: number,
    endedAt: number,
    exitCode: number | null,
    status: string
  ): void {
    this.db
      .prepare(
        `UPDATE executions SET ended_at = ?, exit_code = ?, status = ? WHERE id = ?`
      )
      .run(endedAt, exitCode, status, id)
  }

  recent(limit = 20): RecentExecution[] {
    const rows = this.db
      .prepare<[number], ExecutionRow>(
        `SELECT e.id, e.command_id, c.name as command_name,
                e.started_at, e.ended_at, e.exit_code, e.status
         FROM executions e
         JOIN commands c ON c.id = e.command_id
         ORDER BY e.started_at DESC
         LIMIT ?`
      )
      .all(limit)

    return rows.map(row => ({
      id: row.id,
      commandId: row.command_id,
      commandName: row.command_name,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      exitCode: row.exit_code,
      status: row.status
    }))
  }

  pruneToLimit(limit: number): void {
    this.db
      .prepare(
        `DELETE FROM executions
         WHERE id NOT IN (
           SELECT id FROM executions ORDER BY started_at DESC LIMIT ?
         )`
      )
      .run(limit)
  }
}
