import { contextBridge, ipcRenderer } from 'electron'
import type {
  Command,
  Group,
  ProcessState,
  RecentExecution,
  AppSettings,
  CreateCommandInput,
  UpdateCommandInput,
  CreateGroupInput,
  UpdateGroupInput,
  ReorderItem,
  ProcessOutputEvent,
  ProcessStatusEvent,
  SaveScriptResult,
  DbActionResult
} from '../shared/types'

// ─── Allowed IPC Channels (security whitelist) ───────────────────────────────

const ALLOWED_INVOKE_CHANNELS = [
  'commands:list',
  'commands:create',
  'commands:update',
  'commands:delete',
  'commands:reorder',
  'groups:list',
  'groups:create',
  'groups:update',
  'groups:delete',
  'processes:start',
  'processes:stop',
  'processes:restart',
  'processes:stop-all',
  'processes:get-all',
  'settings:get-all',
  'settings:update',
  'dialog:pick-directory',
  'dialog:pick-script-file',
  'scripts:save',
  'db:export',
  'db:import',
  'executions:recent',
  'app:quit',
  'app:minimize'
] as const

const ALLOWED_EVENT_CHANNELS = ['process:output', 'process:status-changed'] as const

type AllowedInvokeChannel = (typeof ALLOWED_INVOKE_CHANNELS)[number]
type AllowedEventChannel = (typeof ALLOWED_EVENT_CHANNELS)[number]

function safeInvoke(channel: AllowedInvokeChannel, payload?: unknown): Promise<unknown> {
  if (!(ALLOWED_INVOKE_CHANNELS as readonly string[]).includes(channel)) {
    return Promise.reject(new Error(`IPC channel '${channel}' is not allowed`))
  }
  return ipcRenderer.invoke(channel, payload)
}

function safeOn(
  channel: AllowedEventChannel,
  handler: (payload: unknown) => void
): () => void {
  if (!(ALLOWED_EVENT_CHANNELS as readonly string[]).includes(channel)) {
    throw new Error(`IPC event channel '${channel}' is not allowed`)
  }
  const listener = (_event: Electron.IpcRendererEvent, payload: unknown): void => handler(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

// ─── Typed API exposed to renderer ──────────────────────────────────────────

const api = {
  commands: {
    list: (groupId?: number) =>
      safeInvoke('commands:list', { groupId }) as Promise<Command[]>,
    create: (input: CreateCommandInput) =>
      safeInvoke('commands:create', input) as Promise<Command>,
    update: (id: number, input: UpdateCommandInput) =>
      safeInvoke('commands:update', { id, ...input }) as Promise<Command>,
    delete: (id: number) =>
      safeInvoke('commands:delete', { id }) as Promise<void>,
    reorder: (items: ReorderItem[]) =>
      safeInvoke('commands:reorder', items) as Promise<void>
  },

  groups: {
    list: () => safeInvoke('groups:list') as Promise<Group[]>,
    create: (input: CreateGroupInput) =>
      safeInvoke('groups:create', input) as Promise<Group>,
    update: (id: number, input: UpdateGroupInput) =>
      safeInvoke('groups:update', { id, ...input }) as Promise<Group>,
    delete: (id: number) =>
      safeInvoke('groups:delete', { id }) as Promise<void>
  },

  processes: {
    start: (commandId: number) =>
      safeInvoke('processes:start', { commandId }) as Promise<ProcessState>,
    stop: (processId: string) =>
      safeInvoke('processes:stop', { processId }) as Promise<void>,
    restart: (processId: string) =>
      safeInvoke('processes:restart', { processId }) as Promise<ProcessState>,
    stopAll: () => safeInvoke('processes:stop-all') as Promise<void>,
    getAll: () => safeInvoke('processes:get-all') as Promise<ProcessState[]>
  },

  settings: {
    getAll: () => safeInvoke('settings:get-all') as Promise<AppSettings>,
    update: (settings: Partial<AppSettings>) =>
      safeInvoke('settings:update', settings) as Promise<void>
  },

  dialog: {
    pickDirectory: () => safeInvoke('dialog:pick-directory') as Promise<string | null>,
    pickScriptFile: () => safeInvoke('dialog:pick-script-file') as Promise<string | null>
  },

  scripts: {
    save: (fileName: string, content: string) =>
      safeInvoke('scripts:save', { fileName, content }) as Promise<SaveScriptResult>
  },

  db: {
    export: () => safeInvoke('db:export') as Promise<DbActionResult>,
    import: () => safeInvoke('db:import') as Promise<DbActionResult>
  },

  executions: {
    recent: (limit?: number) =>
      safeInvoke('executions:recent', { limit }) as Promise<RecentExecution[]>
  },

  app: {
    quit: () => safeInvoke('app:quit') as Promise<void>,
    minimize: () => safeInvoke('app:minimize') as Promise<void>
  },

  on: {
    processOutput: (handler: (event: ProcessOutputEvent) => void) =>
      safeOn('process:output', payload => handler(payload as ProcessOutputEvent)),
    processStatusChanged: (handler: (event: ProcessStatusEvent) => void) =>
      safeOn('process:status-changed', payload => handler(payload as ProcessStatusEvent))
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
