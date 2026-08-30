import { ipcMain } from 'electron'
import { z } from 'zod'
import type { CommandRepository } from '../database/repositories/CommandRepository'

const CreateCommandSchema = z.object({
  groupId: z.number().int().nullable().optional(),
  name: z.string().min(1).max(200),
  command: z.string().min(1),
  description: z.string().nullable().optional(),
  workingDirectory: z.string().nullable().optional(),
  envVars: z.record(z.string()).nullable().optional(),
  isFavorite: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  autoStart: z.boolean().optional(),
  position: z.number().int().optional()
})

const UpdateCommandSchema = z.object({
  id: z.number().int(),
  groupId: z.number().int().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  command: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  workingDirectory: z.string().nullable().optional(),
  envVars: z.record(z.string()).nullable().optional(),
  isFavorite: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  autoStart: z.boolean().optional(),
  position: z.number().int().optional()
})

const ReorderSchema = z.array(
  z.object({
    id: z.number().int(),
    position: z.number().int(),
    groupId: z.number().int().nullable().optional()
  })
)

export function registerCommandHandlers(repo: CommandRepository): void {
  ipcMain.handle('commands:list', (_event, payload: { groupId?: number } | undefined) => {
    return repo.list(payload?.groupId)
  })

  ipcMain.handle('commands:create', (_event, payload: unknown) => {
    const input = CreateCommandSchema.parse(payload)
    return repo.create(input)
  })

  ipcMain.handle('commands:update', (_event, payload: unknown) => {
    const { id, ...input } = UpdateCommandSchema.parse(payload)
    return repo.update(id, input)
  })

  ipcMain.handle('commands:delete', (_event, payload: unknown) => {
    const { id } = z.object({ id: z.number().int() }).parse(payload)
    repo.delete(id)
  })

  ipcMain.handle('commands:reorder', (_event, payload: unknown) => {
    const items = ReorderSchema.parse(payload)
    repo.reorder(items)
  })
}
