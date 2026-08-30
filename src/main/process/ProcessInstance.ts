import type { ChildProcessWithoutNullStreams } from 'child_process'
import type { Command, ProcessStatus } from '@shared/types'

export interface ProcessInstance {
  processId: string
  commandId: number
  command: Command
  child: ChildProcessWithoutNullStreams
  pid: number
  status: ProcessStatus
  startedAt: number
  endedAt: number | null
  exitCode: number | null
  executionDbId: number | null
}
