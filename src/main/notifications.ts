import { Notification } from 'electron'
import type { ProcessStatus } from '../shared/types'

export function notifyProcessEnded(
  commandName: string,
  status: ProcessStatus,
  exitCode: number | null
): void {
  if (!Notification.isSupported()) return

  const isSuccess = status === 'completed' && exitCode === 0
  const isFailed = status === 'failed' || (exitCode !== null && exitCode !== 0)

  if (!isSuccess && !isFailed) return // Don't notify for manually-stopped processes

  const notification = new Notification({
    title: isSuccess ? `✓ ${commandName}` : `✗ ${commandName}`,
    body: isSuccess
      ? 'Completed successfully'
      : `Failed — exit code ${exitCode ?? 'unknown'}`,
    silent: isSuccess // Only make a sound for failures
  })

  notification.show()
}
