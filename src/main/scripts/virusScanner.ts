import { spawn } from 'child_process'
import { existsSync } from 'fs'

// Windows Defender ships with every Windows 10/11 install — no extra tool
// for the user to download or configure, unlike a separate CLI (e.g. vt-cli)
// or a cloud API key.
const DEFENDER_CANDIDATE_PATHS = [
  process.env.ProgramFiles ? `${process.env.ProgramFiles}\\Windows Defender\\MpCmdRun.exe` : null,
  process.env['ProgramFiles(x86)']
    ? `${process.env['ProgramFiles(x86)']}\\Windows Defender\\MpCmdRun.exe`
    : null
].filter((p): p is string => p !== null)

// MpCmdRun's exit code alone can't distinguish "threat found" from "scan
// failed" (both return 2) — verified empirically against the real binary.
// The actual result has to come from parsing its output text instead.
const NO_THREATS_PATTERN = /found no threats/i
const THREAT_COUNT_PATTERN = /found (\d+) threats?/i
const THREAT_NAME_PATTERN = /Threat\s*:\s*(.+)/g

export interface ScanResult {
  /** True only if Defender actually completed a scan, regardless of outcome. */
  scanned: boolean
  clean: boolean
  threats: string[]
  /** Set when scanned is false — why no verdict could be produced. */
  error?: string
}

let cachedDefenderPath: string | null | undefined

function findDefenderPath(): string | null {
  if (cachedDefenderPath !== undefined) return cachedDefenderPath
  cachedDefenderPath = DEFENDER_CANDIDATE_PATHS.find(p => existsSync(p)) ?? null
  return cachedDefenderPath
}

export function isVirusScanAvailable(): boolean {
  return findDefenderPath() !== null
}

/**
 * Scans a file with Windows Defender's on-demand CLI scanner (MpCmdRun.exe).
 * Defense-in-depth only, and fails OPEN (clean: true, scanned: false) when
 * Defender isn't available or a scan can't complete — this is a convenience
 * check layered on top of the user's real-time AV, not its replacement, so
 * an environment without it (disabled, replaced by another AV) shouldn't
 * block every script save.
 */
export function scanFileForViruses(filePath: string): Promise<ScanResult> {
  return new Promise(resolve => {
    const defenderPath = findDefenderPath()
    if (!defenderPath) {
      resolve({
        scanned: false,
        clean: true,
        threats: [],
        error: 'Windows Defender was not found on this system'
      })
      return
    }

    const child = spawn(
      defenderPath,
      ['-Scan', '-ScanType', '3', '-File', filePath, '-DisableRemediation'],
      { windowsHide: true }
    )

    let stdout = ''
    child.stdout.on('data', chunk => (stdout += chunk))

    child.on('error', err => {
      resolve({ scanned: false, clean: true, threats: [], error: err.message })
    })

    child.on('close', () => {
      if (NO_THREATS_PATTERN.test(stdout)) {
        resolve({ scanned: true, clean: true, threats: [] })
        return
      }

      const countMatch = stdout.match(THREAT_COUNT_PATTERN)
      if (countMatch && parseInt(countMatch[1], 10) > 0) {
        const threats = [...stdout.matchAll(THREAT_NAME_PATTERN)].map(m => m[1].trim())
        resolve({ scanned: true, clean: false, threats })
        return
      }

      resolve({
        scanned: false,
        clean: true,
        threats: [],
        error: `Defender scan did not complete: ${stdout.trim() || 'no output'}`
      })
    })
  })
}
