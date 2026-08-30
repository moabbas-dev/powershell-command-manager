import { ipcMain } from 'electron'
import { z } from 'zod'
import type { GroupRepository } from '../database/repositories/GroupRepository'

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  position: z.number().int().optional()
})

const UpdateGroupSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(100).optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  position: z.number().int().optional()
})

export function registerGroupHandlers(repo: GroupRepository): void {
  ipcMain.handle('groups:list', () => {
    return repo.list()
  })

  ipcMain.handle('groups:create', (_event, payload: unknown) => {
    const input = CreateGroupSchema.parse(payload)
    return repo.create(input)
  })

  ipcMain.handle('groups:update', (_event, payload: unknown) => {
    const { id, ...input } = UpdateGroupSchema.parse(payload)
    return repo.update(id, input)
  })

  ipcMain.handle('groups:delete', (_event, payload: unknown) => {
    const { id } = z.object({ id: z.number().int() }).parse(payload)
    repo.delete(id)
  })
}
