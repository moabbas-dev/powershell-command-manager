import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Loader2,
  FileSearch,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useUIStore } from '../../store/uiStore'
import type { SecurityScanResult } from '@shared/types'

type ScanState = 'idle' | 'scanning' | 'done'

export function SecurityScanModal(): React.ReactElement {
  const openModal = useUIStore(s => s.openModal)
  const closeModal = useUIStore(s => s.closeModal)
  const isOpen = openModal === 'security-scan'

  const [state, setState] = useState<ScanState>('idle')
  const [result, setResult] = useState<SecurityScanResult | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setState('idle')
    setResult(null)
    setShowRaw(false)
  }, [isOpen])

  const handleChooseFile = async (): Promise<void> => {
    setState('scanning')
    setResult(null)
    try {
      const res = await window.api.security.pickAndScanFile()
      if (res.canceled) {
        setState('idle')
        return
      }
      setResult(res)
      setState('done')
    } catch (err) {
      setResult({ ok: false, error: String(err) })
      setState('done')
    }
  }

  const handleReset = (): void => {
    setState('idle')
    setResult(null)
    setShowRaw(false)
  }

  return (
    <Dialog open={isOpen} onClose={closeModal} title="Security Check" maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-app-muted">
          Scans any file with Windows Defender and shows exactly what was checked — nothing is
          uploaded anywhere.
        </p>

        {state === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 border border-dashed border-app-border rounded-lg">
            <FileSearch size={28} className="text-app-muted" />
            <Button type="button" variant="primary" size="md" onClick={handleChooseFile}>
              Choose File to Scan...
            </Button>
          </div>
        )}

        {state === 'scanning' && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 size={28} className="text-blue-400 animate-spin" />
            <p className="text-xs text-app-muted">Scanning with Windows Defender…</p>
          </div>
        )}

        {state === 'done' && result && (
          <ScanResultView
            result={result}
            showRaw={showRaw}
            onToggleRaw={() => setShowRaw(v => !v)}
          />
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-app-border">
          {state === 'done' && (
            <Button type="button" variant="secondary" onClick={handleReset}>
              Scan Another File
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={closeModal}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function ScanResultView({
  result,
  showRaw,
  onToggleRaw
}: {
  result: SecurityScanResult
  showRaw: boolean
  onToggleRaw: () => void
}): React.ReactElement {
  if (!result.ok) {
    return (
      <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2.5">
        <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
        <span>{result.error ?? 'Scan failed'}</span>
      </div>
    )
  }

  const isThreat = result.scanned && !result.clean

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-app-text space-y-1">
        <p className="font-medium truncate" title={result.filePath}>
          {result.fileName}
        </p>
        <p className="text-app-muted">
          {formatBytes(result.fileSizeBytes ?? 0)} · scanned{' '}
          {new Date(result.scannedAt ?? Date.now()).toLocaleString()}
        </p>
      </div>

      {isThreat ? (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2.5">
          <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Threat detected</p>
            <ul className="mt-1 list-disc list-inside">
              {(result.threats ?? []).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : result.scanned ? (
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-950/30 border border-green-900 rounded-md px-3 py-2.5">
          <ShieldCheck size={16} className="flex-shrink-0" />
          <span className="font-medium">No threats found</span>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-950/30 border border-amber-900 rounded-md px-3 py-2.5">
          <ShieldQuestion size={16} className="flex-shrink-0 mt-0.5" />
          <span>Could not complete a scan{result.scanError ? `: ${result.scanError}` : ''}</span>
        </div>
      )}

      {result.defender && (result.defender.engineVersion || result.defender.signatureVersion) && (
        <div className="text-[11px] text-app-muted bg-app-bg border border-app-border rounded-md px-3 py-2 space-y-0.5">
          <p>Scanned with Windows Defender</p>
          {result.defender.engineVersion && <p>Engine: {result.defender.engineVersion}</p>}
          {result.defender.signatureVersion && (
            <p>Signatures: {result.defender.signatureVersion}</p>
          )}
          {result.defender.signatureLastUpdated && (
            <p>
              Signatures updated: {new Date(result.defender.signatureLastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {result.rawOutput && (
        <div>
          <button
            type="button"
            onClick={onToggleRaw}
            className="flex items-center gap-1 text-[11px] text-app-muted hover:text-app-text"
          >
            {showRaw ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Raw scanner output
          </button>
          {showRaw && (
            <pre className="mt-1.5 text-[10px] text-app-muted bg-app-bg border border-app-border rounded-md px-3 py-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {result.rawOutput}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
