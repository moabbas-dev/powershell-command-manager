import { ipcMain } from 'electron'
import { z } from 'zod'
import type { CommandRepository } from '../database/repositories/CommandRepository'
import { saveScript, deleteScript, formatScriptError } from '../files/scriptStorage'
import type { UpdateCommandInput } from '../../shared/types'

const CommandTypeSchema = z.enum(['inline', 'script'])

const CreateCommandSchema = z
  .object({
    groupId: z.number().int().nullable().optional(),
    name: z.string().min(1).max(200),
    commandType: CommandTypeSchema.optional(),
    command: z.string().optional(),
    scriptSourcePath: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    workingDirectory: z.string().nullable().optional(),
    envVars: z.record(z.string()).nullable().optional(),
    isFavorite: z.boolean().optional(),
    isEnabled: z.boolean().optional(),
    autoStart: z.boolean().optional(),
    position: z.number().int().optional()
  })
  .refine(
    data =>
      data.commandType === 'script'
        ? !!data.scriptSourcePath?.trim()
        : !!data.command?.trim(),
    { message: 'Provide a command for inline commands, or a script file for script commands', path: ['command'] }
  )

const UpdateCommandSchema = z.object({
  id: z.number().int(),
  groupId: z.number().int().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  commandType: CommandTypeSchema.optional(),
  command: z.string().optional(),
  scriptSourcePath: z.string().nullable().optional(),
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

  ipcMain.handle('commands:create', async (_event, payload: unknown) => {
    const input = CreateCommandSchema.parse(payload)
    const commandType = input.commandType ?? 'inline'

    if (commandType === 'script') {
      let storedPath: string, originalName: string
      try {
        ;({ storedPath, originalName } = await saveScript(input.scriptSourcePath!.trim()))
      } catch (err) {
        throw new Error(formatScriptError(err))
      }
      return repo.create({
        ...input,
        commandType,
        command: storedPath,
        scriptFileName: originalName
      })
    }

    return repo.create({
      ...input,
      commandType,
      command: input.command!.trim(),
      scriptFileName: null
    })
  })

  ipcMain.handle('commands:update', async (_event, payload: unknown) => {
    const { id, scriptSourcePath, ...rest } = UpdateCommandSchema.parse(payload)
    const current = repo.getById(id)
    if (!current) throw new Error(`Command ${id} not found`)

    const nextType = rest.commandType ?? current.commandType
    const patch: UpdateCommandInput = { ...rest }

    if (nextType === 'script') {
      patch.commandType = 'script'
      if (scriptSourcePath?.trim()) {
        let storedPath: string, originalName: string
        try {
          ;({ storedPath, originalName } = await saveScript(scriptSourcePath.trim()))
        } catch (err) {
          throw new Error(formatScriptError(err))
        }
        if (current.commandType === 'script' && current.command) deleteScript(current.command)
        patch.command = storedPath
        patch.scriptFileName = originalName
      } else if (current.commandType !== 'script') {
        throw new Error('A script file is required when switching to a script command')
      }
    } else {
      if (current.commandType === 'script' && current.command) deleteScript(current.command)
      patch.commandType = 'inline'
      patch.scriptFileName = null
      if (rest.command !== undefined && !rest.command.trim()) {
        throw new Error('Command text is required for inline commands')
      }
    }

    return repo.update(id, patch)
  })

  ipcMain.handle('commands:delete', (_event, payload: unknown) => {
    const { id } = z.object({ id: z.number().int() }).parse(payload)
    const current = repo.getById(id)
    if (current?.commandType === 'script' && current.command) {
      deleteScript(current.command)
    }
    repo.delete(id)
  })

  ipcMain.handle('commands:reorder', (_event, payload: unknown) => {
    const items = ReorderSchema.parse(payload)
    repo.reorder(items)
  })
}
