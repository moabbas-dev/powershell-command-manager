// ─── Domain Entities ────────────────────────────────────────────────────────

export interface Group {
  id: number
  name: string
  color: string | null
  icon: string | null
  position: number
  createdAt: number
  updatedAt: number
}

export interface Command {
  id: number
  groupId: number | null
  name: string
  command: string
  description: string | null
  workingDirectory: string | null
  envVars: Record<string, string> | null
  isFavorite: boolean
  isEnabled: boolean
  autoStart: boolean
  position: number
  createdAt: number
  updatedAt: number
}

export type ProcessStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'completed'
  | 'failed'
  | 'killed'

export interface ProcessState {
  processId: string
  commandId: number
  commandName: string
  status: ProcessStatus
  pid: number | null
  startedAt: number | null
  endedAt: number | null
  exitCode: number | null
}

export interface RecentExecution {
  id: number
  commandId: number
  commandName: string
  startedAt: number
  endedAt: number | null
  exitCode: number | null
  status: string
}

export interface AppSettings {
  minimizeToTray: boolean
  startMinimized: boolean
  confirmStopAll: boolean
  maxScrollbackLines: number
  autoStartEnabled: boolean
  notificationsEnabled: boolean
  globalHotkey: string
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface CreateGroupInput {
  name: string
  color?: string | null
  icon?: string | null
  position?: number
}

export interface UpdateGroupInput {
  name?: string
  color?: string | null
  icon?: string | null
  position?: number
}

export interface CreateCommandInput {
  groupId?: number | null
  name: string
  command: string
  description?: string | null
  workingDirectory?: string | null
  envVars?: Record<string, string> | null
  isFavorite?: boolean
  isEnabled?: boolean
  autoStart?: boolean
  position?: number
}

export interface UpdateCommandInput {
  groupId?: number | null
  name?: string
  command?: string
  description?: string | null
  workingDirectory?: string | null
  envVars?: Record<string, string> | null
  isFavorite?: boolean
  isEnabled?: boolean
  autoStart?: boolean
  position?: number
}

export interface ReorderItem {
  id: number
  position: number
  groupId?: number | null
}

// ─── IPC Event Payloads ───────────────────────────────────────────────────────

export interface ProcessOutputEvent {
  processId: string
  data: string
  type: 'stdout' | 'stderr'
  timestamp: number
}

export interface ProcessStatusEvent {
  processId: string
  commandId: number
  status: ProcessStatus
  exitCode?: number | null
  startedAt?: number | null
  endedAt?: number | null
}

// ─── IPC Channel Maps ─────────────────────────────────────────────────────────
// These are used to enforce typed IPC in the preload + main handlers.

export interface IpcInvokeMap {
  'commands:list': [{ groupId?: number }, Command[]]
  'commands:create': [CreateCommandInput, Command]
  'commands:update': [{ id: number } & UpdateCommandInput, Command]
  'commands:delete': [{ id: number }, void]
  'commands:reorder': [ReorderItem[], void]
  'groups:list': [void, Group[]]
  'groups:create': [CreateGroupInput, Group]
  'groups:update': [{ id: number } & UpdateGroupInput, Group]
  'groups:delete': [{ id: number }, void]
  'processes:start': [{ commandId: number }, ProcessState]
  'processes:stop': [{ processId: string }, void]
  'processes:restart': [{ processId: string }, ProcessState]
  'processes:stop-all': [void, void]
  'processes:get-all': [void, ProcessState[]]
  'settings:get-all': [void, AppSettings]
  'settings:update': [Partial<AppSettings>, void]
  'dialog:pick-directory': [void, string | null]
  'executions:recent': [{ limit?: number }, RecentExecution[]]
  'app:quit': [void, void]
  'app:minimize': [void, void]
}

export interface IpcEventMap {
  'process:output': ProcessOutputEvent
  'process:status-changed': ProcessStatusEvent
}
