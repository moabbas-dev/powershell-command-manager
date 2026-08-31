import { spawn } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

export interface ScriptValidationResult {
  valid: boolean
  errors: string[]
}

// Parses the target script (never executes it) and reports syntax errors as JSON.
// Takes the path as a -File param instead of interpolating content into a -Command
// string, so no manual quote-escaping of arbitrary script content is needed.
const RUNNER_SCRIPT = `param(
  [Parameter(Mandatory=$true)][string]$ScriptPath
)
$tokens = $null
$parseErrors = $null
[System.Management.Automation.Language.Parser]::ParseFile($ScriptPath, [ref]$tokens, [ref]$parseErrors) | Out-Null
$result = [ordered]@{
  valid = ($parseErrors.Count -eq 0)
  errors = @($parseErrors | ForEach-Object { "$($_.Message) (line $($_.Extent.StartLineNumber))" })
}
$result | ConvertTo-Json -Compress
`

/**
 * Validates that `content` is syntactically valid PowerShell — nothing more.
 * Uses the PowerShell language parser (Parser.ParseFile) to check syntax only;
 * the script is never executed.
 */
export function validatePowerShellScript(content: string): Promise<ScriptValidationResult> {
  return new Promise(resolve => {
    const contentPath = join(tmpdir(), `pscm-validate-${randomUUID()}.ps1`)
    const runnerPath = join(tmpdir(), `pscm-validate-runner-${randomUUID()}.ps1`)

    try {
      writeFileSync(contentPath, content, 'utf8')
      writeFileSync(runnerPath, RUNNER_SCRIPT, 'utf8')
    } catch (err) {
      resolve({ valid: false, errors: [`Unable to prepare script for validation: ${String(err)}`] })
      return
    }

    const cleanup = (): void => {
      try {
        unlinkSync(contentPath)
      } catch {
        // non-fatal
      }
      try {
        unlinkSync(runnerPath)
      } catch {
        // non-fatal
      }
    }

    const child = spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        runnerPath,
        '-ScriptPath',
        contentPath
      ],
      { windowsHide: true }
    )

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => (stdout += chunk))
    child.stderr.on('data', chunk => (stderr += chunk))

    child.on('close', () => {
      cleanup()
      try {
        const parsed = JSON.parse(stdout.trim()) as { valid: boolean; errors: string[] | string }
        const errors = Array.isArray(parsed.errors)
          ? parsed.errors
          : parsed.errors
            ? [parsed.errors]
            : []
        resolve({ valid: !!parsed.valid, errors })
      } catch {
        resolve({ valid: false, errors: [stderr.trim() || 'Failed to validate script syntax'] })
      }
    })

    child.on('error', err => {
      cleanup()
      resolve({ valid: false, errors: [err.message] })
    })
  })
}
