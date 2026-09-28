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

export type CommandType = 'inline' | 'script'

export interface Command {
  id: number
  groupId: number | null
  name: string
  /** Inline: the PowerShell command text. Script: internal path to the stored script file. */
  command: string
  commandType: CommandType
  /** Original uploaded file name, for display — only set when commandType is 'script'. */
  scriptFileName: string | null
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
  /** Folder new scripts are saved into via the "New Script" editor. */
  scriptsDirectory: string | null
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
  commandType?: CommandType
  /** Required when commandType is 'inline'. */
  command?: string
  /** Absolute path to a script file on disk, picked via the native file dialog. Required when commandType is 'script'. */
  scriptSourcePath?: string | null
  scriptFileName?: string | null
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
  commandType?: CommandType
  command?: string
  /** Absolute path to a newly picked script file — only sent when replacing the uploaded script. */
  scriptSourcePath?: string | null
  scriptFileName?: string | null
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

export type ScriptExtension = 'ps1' | 'bat' | 'cmd'

export interface SaveScriptInput {
  fileName: string
  extension: ScriptExtension
  content: string
  description?: string | null
  /** The linked command's id, once created — omit/null on the first save of a session. */
  commandId?: number | null
}

export interface SaveScriptResult {
  ok: boolean
  path?: string
  errors?: string[]
  /** The created-or-updated command's id, so the caller can keep saving to the same command. */
  commandId?: number
}

export interface DbActionResult {
  ok: boolean
  path?: string
  error?: string
  canceled?: boolean
  relaunching?: boolean
}

export interface DefenderInfo {
  engineVersion?: string
  signatureVersion?: string
  /** ISO 8601 timestamp, if Defender reported one. */
  signatureLastUpdated?: string
  productVersion?: string
}

export interface SecurityScanResult {
  ok: boolean
  canceled?: boolean
  /** Set when ok is false and canceled is falsy — a real failure (bad path, unreadable file, etc). */
  error?: string
  fileName?: string
  filePath?: string
  fileSizeBytes?: number
  /** Epoch ms. */
  scannedAt?: number
  /** True only if Defender actually completed a scan, regardless of outcome. */
  scanned?: boolean
  clean?: boolean
  threats?: string[]
  rawOutput?: string
  /** Set when scanned is false — why no verdict could be produced. */
  scanError?: string
  defender?: DefenderInfo
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
  'dialog:pick-script-file': [void, string | null]
  'scripts:save': [SaveScriptInput, SaveScriptResult]
  'db:export': [void, DbActionResult]
  'db:import': [void, DbActionResult]
  'security:pick-and-scan-file': [void, SecurityScanResult]
  'executions:recent': [{ limit?: number }, RecentExecution[]]
  'app:quit': [void, void]
  'app:minimize': [void, void]
}

export interface IpcEventMap {
  'process:output': ProcessOutputEvent
  'process:status-changed': ProcessStatusEvent
}
