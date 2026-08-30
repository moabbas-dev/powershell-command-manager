import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { existsSync, statSync } from 'fs'
import { randomUUID } from 'crypto'
import type { WebContents } from 'electron'
import type { Command, ProcessState, ProcessStatus, ProcessOutputEvent, ProcessStatusEvent } from '@shared/types'
import type { ProcessInstance } from './ProcessInstance'
import { OutputBatcher } from './OutputBatcher'
import { killProcessTree } from './WindowsKiller'
import type { CommandRepository } from '../database/repositories/CommandRepository'
import type { ExecutionRepository } from '../database/repositories/ExecutionRepository'

const RESTART_DELAY_MS = 200

export class ProcessManager {
  private processes = new Map<string, ProcessInstance>()
  private webContents: WebContents | null = null

  /** Optional hook called on every status change (for notifications, tray updates, etc.) */
  onStatusChange: ((event: ProcessStatusEvent) => void) | null = null

  constructor(
    private commandRepo: CommandRepository,
    private executionRepo: ExecutionRepository
  ) {}

  setWebContents(wc: WebContents): void {
    this.webContents = wc
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async start(commandId: number): Promise<ProcessState> {
    // Prevent running the same command twice
    const existing = this.findByCommandId(commandId)
    if (existing && (existing.status === 'running' || existing.status === 'starting')) {
      throw new Error(`ALREADY_RUNNING:${existing.processId}`)
    }

    const command = this.commandRepo.getById(commandId)
    if (!command) throw new Error(`Command ${commandId} not found`)

    // Validate working directory
    if (command.workingDirectory) {
      if (!existsSync(command.workingDirectory)) {
        throw new Error(`INVALID_CWD:Working directory not found: ${command.workingDirectory}`)
      }
      if (!statSync(command.workingDirectory).isDirectory()) {
        throw new Error(`INVALID_CWD:Working directory is not a directory: ${command.workingDirectory}`)
      }
    }

    return this.spawnProcess(command)
  }

  async stop(processId: string): Promise<void> {
    const instance = this.processes.get(processId)
    if (!instance) return
    if (instance.status === 'stopped' || instance.status === 'completed' || instance.status === 'failed') return

    this.updateStatus(instance, 'stopping')
    await killProcessTree(instance.pid)
    // The 'close' event handler will finalize the status
  }

  async restart(processId: string): Promise<ProcessState> {
    const instance = this.processes.get(processId)
    if (!instance) throw new Error(`Process ${processId} not found`)

    const commandId = instance.commandId

    // Stop if still running
    if (instance.status === 'running' || instance.status === 'starting') {
      await this.stop(processId)
      // Wait for close event to fire
      await this.waitForClose(processId)
    }

    // Brief delay to let OS release resources (ports, file handles)
    await delay(RESTART_DELAY_MS)

    return this.start(commandId)
  }

  async stopAll(): Promise<void> {
    const running = [...this.processes.values()].filter(
      p => p.status === 'running' || p.status === 'starting'
    )
    await Promise.allSettled(running.map(p => this.stop(p.processId)))
  }

  async startAutoStartCommands(commands: Command[]): Promise<void> {
    await Promise.allSettled(commands.map(cmd => this.start(cmd.id)))
  }

  getAll(): ProcessState[] {
    return [...this.processes.values()].map(this.toProcessState)
  }

  getByProcessId(processId: string): ProcessState | null {
    const instance = this.processes.get(processId)
    return instance ? this.toProcessState(instance) : null
  }

  async cleanup(): Promise<void> {
    await this.stopAll()
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private spawnProcess(command: Command): ProcessState {
    const processId = randomUUID()
    const now = Date.now()

    // Build environment — merge process.env with command-specific vars
    const envVars = command.envVars ?? {}
    const env: Record<string, string> = {}
    for (const [k, v] of Object.entries(process.env)) {
      if (v !== undefined) env[k] = v
    }
    for (const [k, v] of Object.entries(envVars)) {
      env[k] = v
    }

    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command.command],
      {
        cwd: command.workingDirectory ?? undefined,
        env,
        windowsHide: true // CRITICAL: prevent console window from flashing
      }
    ) as ChildProcessWithoutNullStreams

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')

    const batcher = new OutputBatcher((data, type) => {
      this.emitOutput({ processId, data, type, timestamp: Date.now() })
    })

    child.stdout.on('data', (chunk: string) => batcher.writeStdout(chunk))
    child.stderr.on('data', (chunk: string) => batcher.writeStderr(chunk))

    // Record execution start in DB
    let executionDbId: number | null = null
    try {
      executionDbId = this.executionRepo.insert(command.id, now)
    } catch {
      // Non-fatal — process still runs even if history recording fails
    }

    const instance: ProcessInstance = {
      processId,
      commandId: command.id,
      command,
      child: child as ProcessInstance['child'],
      pid: child.pid ?? 0,
      status: 'starting',
      startedAt: now,
      endedAt: null,
      exitCode: null,
      executionDbId
    }

    this.processes.set(processId, instance)
    this.emitStatus(instance)

    child.on('spawn', () => {
      instance.pid = child.pid ?? instance.pid
      this.updateStatus(instance, 'running')
    })

    child.on('error', err => {
      console.error(`[ProcessManager] Spawn error for "${command.name}":`, err.message)
      batcher.flush()
      batcher.dispose()
      this.finalizeProcess(instance, null, 'failed')
    })

    child.on('close', (code: number | null) => {
      batcher.flush()
      batcher.dispose()

      // Determine final status
      let finalStatus: ProcessStatus
      if (instance.status === 'stopping') {
        finalStatus = 'stopped'
      } else if (code === 0) {
        finalStatus = 'completed'
      } else {
        finalStatus = 'failed'
      }

      this.finalizeProcess(instance, code, finalStatus)
    })

    return this.toProcessState(instance)
  }

  private finalizeProcess(
    instance: ProcessInstance,
    exitCode: number | null,
    status: ProcessStatus
  ): void {
    const now = Date.now()
    instance.exitCode = exitCode
    instance.endedAt = now
    instance.status = status

    // Update DB execution record
    if (instance.executionDbId !== null) {
      try {
        this.executionRepo.updateEnd(instance.executionDbId, now, exitCode, status)
      } catch {
        // Non-fatal
      }
    }

    this.emitStatus(instance)
  }

  private updateStatus(instance: ProcessInstance, status: ProcessStatus): void {
    instance.status = status
    this.emitStatus(instance)
  }

  private findByCommandId(commandId: number): ProcessInstance | undefined {
    for (const instance of this.processes.values()) {
      if (instance.commandId === commandId) return instance
    }
    return undefined
  }

  private waitForClose(processId: string): Promise<void> {
    return new Promise<void>(resolve => {
      const instance = this.processes.get(processId)
      if (!instance) return resolve()

      const check = setInterval(() => {
        const inst = this.processes.get(processId)
        if (!inst) {
          clearInterval(check)
          resolve()
          return
        }
        const done =
          inst.status === 'stopped' ||
          inst.status === 'completed' ||
          inst.status === 'failed' ||
          inst.status === 'killed'
        if (done) {
          clearInterval(check)
          resolve()
        }
      }, 50)

      // Safety timeout
      setTimeout(() => {
        clearInterval(check)
        resolve()
      }, 10000)
    })
  }

  private toProcessState = (instance: ProcessInstance): ProcessState => ({
    processId: instance.processId,
    commandId: instance.commandId,
    commandName: instance.command.name,
    status: instance.status,
    pid: instance.pid,
    startedAt: instance.startedAt,
    endedAt: instance.endedAt,
    exitCode: instance.exitCode
  })

  private emitOutput(event: ProcessOutputEvent): void {
    if (this.webContents && !this.webContents.isDestroyed()) {
      this.webContents.send('process:output', event)
    }
  }

  private emitStatus(instance: ProcessInstance): void {
    const event: ProcessStatusEvent = {
      processId: instance.processId,
      commandId: instance.commandId,
      status: instance.status,
      exitCode: instance.exitCode,
      startedAt: instance.startedAt,
      endedAt: instance.endedAt
    }

    if (this.webContents && !this.webContents.isDestroyed()) {
      this.webContents.send('process:status-changed', event)
    }

    // Fire side-effect hook (notifications, tray) — non-throwing
    try { this.onStatusChange?.(event) } catch { /* non-fatal */ }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
