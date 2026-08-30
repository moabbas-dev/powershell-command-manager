type FlushCallback = (data: string, type: 'stdout' | 'stderr') => void

/**
 * Batches rapid output into 16ms windows to avoid flooding IPC with
 * thousands of tiny events per second.
 */
export class OutputBatcher {
  private stdoutBuffer = ''
  private stderrBuffer = ''
  private stdoutTimer: ReturnType<typeof setTimeout> | null = null
  private stderrTimer: ReturnType<typeof setTimeout> | null = null
  private readonly FLUSH_INTERVAL_MS = 16

  constructor(private onFlush: FlushCallback) {}

  writeStdout(chunk: string): void {
    this.stdoutBuffer += chunk
    if (!this.stdoutTimer) {
      this.stdoutTimer = setTimeout(() => {
        this.flushStdout()
      }, this.FLUSH_INTERVAL_MS)
    }
  }

  writeStderr(chunk: string): void {
    this.stderrBuffer += chunk
    if (!this.stderrTimer) {
      this.stderrTimer = setTimeout(() => {
        this.flushStderr()
      }, this.FLUSH_INTERVAL_MS)
    }
  }

  private flushStdout(): void {
    if (this.stdoutBuffer) {
      this.onFlush(this.stdoutBuffer, 'stdout')
      this.stdoutBuffer = ''
    }
    this.stdoutTimer = null
  }

  private flushStderr(): void {
    if (this.stderrBuffer) {
      this.onFlush(this.stderrBuffer, 'stderr')
      this.stderrBuffer = ''
    }
    this.stderrTimer = null
  }

  flush(): void {
    if (this.stdoutTimer) {
      clearTimeout(this.stdoutTimer)
      this.stdoutTimer = null
      this.flushStdout()
    }
    if (this.stderrTimer) {
      clearTimeout(this.stderrTimer)
      this.stderrTimer = null
      this.flushStderr()
    }
  }

  dispose(): void {
    if (this.stdoutTimer) clearTimeout(this.stdoutTimer)
    if (this.stderrTimer) clearTimeout(this.stderrTimer)
    this.stdoutBuffer = ''
    this.stderrBuffer = ''
    this.stdoutTimer = null
    this.stderrTimer = null
  }
}
