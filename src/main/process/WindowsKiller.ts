import { spawn } from 'child_process'

const KILL_TIMEOUT_MS = 5000

/**
 * Terminates an entire Windows process tree using taskkill.
 * This is necessary because child.kill() on Windows only kills the immediate
 * process, leaving child processes (e.g. node sub-processes) as orphans.
 *
 * /F = Force terminate
 * /T = Kill entire process tree
 * /PID = Target by PID
 */
export function killProcessTree(pid: number): Promise<void> {
  return new Promise<void>(resolve => {
    let resolved = false

    const done = (): void => {
      if (!resolved) {
        resolved = true
        resolve()
      }
    }

    // Safety timeout in case taskkill hangs
    const timeout = setTimeout(done, KILL_TIMEOUT_MS)

    try {
      const killer = spawn('taskkill', ['/F', '/T', '/PID', String(pid)], {
        windowsHide: true,
        stdio: 'ignore'
      })

      killer.on('close', () => {
        clearTimeout(timeout)
        done()
      })

      killer.on('error', () => {
        clearTimeout(timeout)
        done()
      })
    } catch {
      clearTimeout(timeout)
      done()
    }
  })
}
