import type { CommandRepository } from '../database/repositories/CommandRepository'
import type { GroupRepository } from '../database/repositories/GroupRepository'
import type { ExecutionRepository } from '../database/repositories/ExecutionRepository'
import type { SettingsRepository } from '../database/repositories/SettingsRepository'
import type { ProcessManager } from '../process/ProcessManager'
import { registerCommandHandlers } from './commandHandlers'
import { registerGroupHandlers } from './groupHandlers'
import { registerProcessHandlers } from './processHandlers'
import { registerSettingsHandlers } from './settingsHandlers'
import { registerUtilityHandlers } from './utilityHandlers'
import { registerScriptHandlers } from './scriptHandlers'

export interface HandlerDeps {
  commandRepo: CommandRepository
  groupRepo: GroupRepository
  executionRepo: ExecutionRepository
  settingsRepo: SettingsRepository
  processManager: ProcessManager
}

export function registerAllHandlers(deps: HandlerDeps): void {
  registerCommandHandlers(deps.commandRepo)
  registerGroupHandlers(deps.groupRepo)
  registerProcessHandlers(deps.processManager)
  registerSettingsHandlers(deps.settingsRepo)
  registerUtilityHandlers(deps.executionRepo)
  registerScriptHandlers(deps.settingsRepo)
}
