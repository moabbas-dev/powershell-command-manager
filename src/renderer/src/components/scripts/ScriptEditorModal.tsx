import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useCommandsStore } from '../../store/commandsStore'
import type { ScriptExtension } from '@shared/types'

const AUTOSAVE_DELAY_MS = 1500
const EXTENSIONS: ScriptExtension[] = ['ps1', 'bat', 'cmd']

const CONTENT_PLACEHOLDER: Record<ScriptExtension, string> = {
  ps1: 'Write-Host "Hello, world!"',
  bat: '@echo off\necho Hello, world!',
  cmd: '@echo off\necho Hello, world!'
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function ScriptEditorModal(): React.ReactElement {
  const openModal = useUIStore(s => s.openModal)
  const closeModal = useUIStore(s => s.closeModal)
  const openSettings = useUIStore(s => s.openSettings)
  const scriptsDirectory = useSettingsStore(s => s.settings.scriptsDirectory)
  const loadCommands = useCommandsStore(s => s.load)

  const isOpen = openModal === 'script-editor'

  const [fileName, setFileName] = useState('')
  const [extension, setExtension] = useState<ScriptExtension>('ps1')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errors, setErrors] = useState<string[]>([])
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [commandId, setCommandId] = useState<number | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  // Reset editor state each time the modal is opened
  useEffect(() => {
    if (!isOpen) return
    setFileName('')
    setExtension('ps1')
    setDescription('')
    setContent('')
    setStatus('idle')
    setErrors([])
    setSavedPath(null)
    setCommandId(null)
  }, [isOpen])

  // Debounced validate-and-save — also creates or updates a runnable command
  // for this script, so it shows up in the sidebar immediately.
  useEffect(() => {
    if (!isOpen) return
    if (timerRef.current) clearTimeout(timerRef.current)

    const isEmpty = !fileName.trim() && !content.trim()
    if (isEmpty) {
      setStatus('idle')
      setErrors([])
      return
    }

    if (!scriptsDirectory) {
      setStatus('error')
      setErrors(['Choose a scripts folder in Settings first'])
      return
    }

    timerRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current
      setStatus('saving')

      window.api.scripts
        .save({ fileName, extension, content, description, commandId })
        .then(result => {
          if (requestId !== requestIdRef.current) return // superseded by newer input
          if (result.ok) {
            setStatus('saved')
            setSavedPath(result.path ?? null)
            setErrors([])
            if (result.commandId !== undefined) setCommandId(result.commandId)
            void loadCommands()
          } else {
            setStatus('error')
            setErrors(result.errors ?? ['Save failed'])
          }
        })
        .catch(err => {
          if (requestId !== requestIdRef.current) return
          setStatus('error')
          setErrors([String(err)])
        })
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fileName, extension, description, content, isOpen, scriptsDirectory, commandId, loadCommands])

  return (
    <Dialog open={isOpen} onClose={closeModal} title="New Script" maxWidth="max-w-2xl">
      <div className="flex flex-col gap-4">
        {!scriptsDirectory && (
          <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-900 rounded-md px-3 py-2">
            No scripts folder configured.{' '}
            <button
              type="button"
              className="underline hover:text-amber-300"
              onClick={() => {
                closeModal()
                openSettings()
              }}
            >
              Open Settings
            </button>{' '}
            to choose one.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-app-muted">File Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="myscript"
              disabled={!scriptsDirectory}
              className="w-full h-8 px-3 text-xs bg-app-bg border border-app-border rounded-md text-app-text placeholder:text-app-muted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
            />
            <span className="text-xs text-app-muted flex-shrink-0">.</span>
            <select
              value={extension}
              onChange={e => setExtension(e.target.value as ScriptExtension)}
              disabled={!scriptsDirectory}
              className="h-8 px-2 text-xs bg-app-bg border border-app-border rounded-md text-app-text focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              {EXTENSIONS.map(ext => (
                <option key={ext} value={ext}>
                  {ext}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-app-muted">
            Also used as the command name — this script becomes runnable from the sidebar.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-app-muted">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional"
            disabled={!scriptsDirectory}
            className="w-full h-8 px-3 text-xs bg-app-bg border border-app-border rounded-md text-app-text placeholder:text-app-muted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-app-muted">Script Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={CONTENT_PLACEHOLDER[extension]}
            rows={14}
            disabled={!scriptsDirectory}
            className="w-full px-3 py-2 text-xs font-mono bg-app-bg border border-app-border rounded-md text-app-text resize-y focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
          />
        </div>

        {/* Small status div — autosave feedback / validation errors */}
        <StatusBar status={status} errors={errors} savedPath={savedPath} />

        <div className="flex justify-end pt-2 border-t border-app-border">
          <Button type="button" variant="ghost" onClick={closeModal}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function StatusBar({
  status,
  errors,
  savedPath
}: {
  status: SaveStatus
  errors: string[]
  savedPath: string | null
}): React.ReactElement | null {
  if (status === 'idle') return null

  if (status === 'saving') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-app-muted">
        <Loader2 size={12} className="animate-spin" />
        Validating & saving…
      </div>
    )
  }

  if (status === 'saved') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-400 truncate">
        <CheckCircle2 size={12} className="flex-shrink-0" />
        <span className="truncate">Saved to {savedPath} — ready to run from the sidebar</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md px-2.5 py-1.5">
      <XCircle size={12} className="flex-shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        {errors.map((err, i) => (
          <p key={i}>{err}</p>
        ))}
      </div>
    </div>
  )
}
