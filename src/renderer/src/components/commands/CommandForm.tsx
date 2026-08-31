import React, { useState, useEffect } from 'react'
import { FolderOpen, FileCode, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useCommandsStore } from '../../store/commandsStore'
import { useGroupsStore } from '../../store/groupsStore'
import { useUIStore } from '../../store/uiStore'
import type { CommandType, CreateCommandInput, UpdateCommandInput } from '@shared/types'

interface FormState {
  name: string
  commandType: CommandType
  command: string
  /** Absolute path to a newly picked script file (not yet saved). */
  scriptSourcePath: string
  /** Display name — either the newly picked file's name, or the existing stored one. */
  scriptFileName: string
  description: string
  workingDirectory: string
  groupId: string
  isFavorite: boolean
  isEnabled: boolean
  autoStart: boolean
  envVars: { key: string; value: string }[]
}

const DEFAULT_FORM: FormState = {
  name: '',
  commandType: 'inline',
  command: '',
  scriptSourcePath: '',
  scriptFileName: '',
  description: '',
  workingDirectory: '',
  groupId: '',
  isFavorite: false,
  isEnabled: true,
  autoStart: false,
  envVars: []
}

function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

export function CommandForm(): React.ReactElement {
  const openModal = useUIStore(s => s.openModal)
  const editingId = useUIStore(s => s.editingCommandId)
  const closeModal = useUIStore(s => s.closeModal)
  const commands = useCommandsStore(s => s.commands)
  const addCommand = useCommandsStore(s => s.add)
  const updateCommand = useCommandsStore(s => s.update)
  const groups = useGroupsStore(s => s.groups)

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const isOpen = openModal === 'command-form'
  const isEditing = editingId !== null

  // Populate form when editing
  useEffect(() => {
    if (!isOpen) return
    if (editingId !== null) {
      const cmd = commands.find(c => c.id === editingId)
      if (cmd) {
        setForm({
          name: cmd.name,
          commandType: cmd.commandType,
          command: cmd.commandType === 'inline' ? cmd.command : '',
          scriptSourcePath: '',
          scriptFileName: cmd.commandType === 'script' ? (cmd.scriptFileName ?? '') : '',
          description: cmd.description ?? '',
          workingDirectory: cmd.workingDirectory ?? '',
          groupId: cmd.groupId !== null ? String(cmd.groupId) : '',
          isFavorite: cmd.isFavorite,
          isEnabled: cmd.isEnabled,
          autoStart: cmd.autoStart,
          envVars: cmd.envVars
            ? Object.entries(cmd.envVars).map(([key, value]) => ({ key, value }))
            : []
        })
        setAdvancedOpen(cmd.envVars !== null && Object.keys(cmd.envVars).length > 0)
      }
    } else {
      setForm(DEFAULT_FORM)
      setAdvancedOpen(false)
    }
    setErrors({})
    setFormError(null)
  }, [isOpen, editingId, commands])

  const set = (field: keyof FormState, value: unknown): void =>
    setForm(prev => ({ ...prev, [field]: value }))

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (form.commandType === 'inline') {
      if (!form.command.trim()) errs.command = 'Command is required'
    } else {
      const hasExistingScript = isEditing && form.scriptFileName && !form.scriptSourcePath
      if (!form.scriptSourcePath && !hasExistingScript) {
        errs.command = 'Please select a script file'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePickDirectory = async (): Promise<void> => {
    const dir = await window.api.dialog.pickDirectory()
    if (dir) set('workingDirectory', dir)
  }

  const handlePickScript = async (): Promise<void> => {
    const path = await window.api.dialog.pickScriptFile()
    if (path) {
      set('scriptSourcePath', path)
      set('scriptFileName', fileNameFromPath(path))
    }
  }

  const handleAddEnvVar = (): void => {
    set('envVars', [...form.envVars, { key: '', value: '' }])
  }

  const handleEnvVarChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ): void => {
    const updated = form.envVars.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev))
    set('envVars', updated)
  }

  const handleRemoveEnvVar = (index: number): void => {
    set('envVars', form.envVars.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setIsSubmitting(true)

    // Build env vars object from array, filtering empty keys
    const envVars =
      form.envVars.length > 0
        ? Object.fromEntries(
            form.envVars
              .filter(ev => ev.key.trim())
              .map(ev => [ev.key.trim(), ev.value])
          )
        : null

    const payload: CreateCommandInput | UpdateCommandInput = {
      name: form.name.trim(),
      commandType: form.commandType,
      description: form.description.trim() || null,
      workingDirectory: form.workingDirectory.trim() || null,
      groupId: form.groupId ? parseInt(form.groupId) : null,
      isFavorite: form.isFavorite,
      isEnabled: form.isEnabled,
      autoStart: form.autoStart,
      envVars: envVars && Object.keys(envVars).length > 0 ? envVars : null
    }

    if (form.commandType === 'inline') {
      payload.command = form.command.trim()
    } else if (form.scriptSourcePath) {
      // Only send the source path when a new file was picked — the backend
      // copies it and keeps the previously stored script otherwise.
      payload.scriptSourcePath = form.scriptSourcePath
    }

    try {
      if (isEditing && editingId !== null) {
        await updateCommand(editingId, payload)
      } else {
        await addCommand(payload as CreateCommandInput)
      }
      closeModal()
    } catch (err) {
      setFormError(String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      title={isEditing ? 'Edit Command' : 'New Command'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <p className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2">
            {formError}
          </p>
        )}

        {/* Name */}
        <Field label="Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Backend"
            className={inputCls(!!errors.name)}
            autoFocus
          />
        </Field>

        {/* Command source: inline text vs. uploaded script file */}
        <div className="flex gap-1 p-0.5 bg-app-bg border border-app-border rounded-md w-fit">
          <TypeTab
            label="Inline Command"
            active={form.commandType === 'inline'}
            onClick={() => set('commandType', 'inline')}
          />
          <TypeTab
            label="Script File"
            active={form.commandType === 'script'}
            onClick={() => set('commandType', 'script')}
          />
        </div>

        {form.commandType === 'inline' ? (
          <Field label="Command" required error={errors.command}>
            <textarea
              value={form.command}
              onChange={e => set('command', e.target.value)}
              placeholder="e.g. mvn spring-boot:run"
              rows={3}
              className={[inputCls(!!errors.command), 'resize-y font-mono text-xs'].join(' ')}
            />
          </Field>
        ) : (
          <Field label="Script File" required error={errors.command}>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="md" onClick={handlePickScript}>
                <FileCode size={14} /> Choose File
              </Button>
              <span className="text-xs text-app-text truncate">
                {form.scriptFileName || 'No file selected'}
              </span>
            </div>
            <p className="text-[11px] text-app-muted mt-1">
              Windows only — .ps1, .bat, .cmd
            </p>
          </Field>
        )}

        {/* Working Directory */}
        <Field label="Working Directory">
          <div className="flex gap-2">
            <input
              type="text"
              value={form.workingDirectory}
              onChange={e => set('workingDirectory', e.target.value)}
              placeholder="e.g. C:\Work\backend (optional)"
              className={[inputCls(false), 'flex-1'].join(' ')}
            />
            <Button type="button" variant="secondary" size="md" onClick={handlePickDirectory}>
              <FolderOpen size={14} />
            </Button>
          </div>
        </Field>

        {/* Group */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Group">
            <select
              value={form.groupId}
              onChange={e => set('groupId', e.target.value)}
              className={selectCls}
            >
              <option value="">No group</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <input
              type="text"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional"
              className={inputCls(false)}
            />
          </Field>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6">
          <Toggle
            label="Favorite"
            checked={form.isFavorite}
            onChange={v => set('isFavorite', v)}
          />
          <Toggle
            label="Enabled"
            checked={form.isEnabled}
            onChange={v => set('isEnabled', v)}
          />
          <Toggle
            label="Auto-start on launch"
            checked={form.autoStart}
            onChange={v => set('autoStart', v)}
          />
        </div>

        {/* Advanced section */}
        <div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-app-muted hover:text-app-text transition-colors mb-2"
            onClick={() => setAdvancedOpen(v => !v)}
          >
            {advancedOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            Advanced
          </button>

          {advancedOpen && (
            <div className="border border-app-border rounded-lg p-3 space-y-2">
              <p className="text-xs text-app-muted mb-2">Environment Variables</p>
              {form.envVars.map((ev, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ev.key}
                    onChange={e => handleEnvVarChange(i, 'key', e.target.value)}
                    placeholder="KEY"
                    className={[inputCls(false), 'flex-1 font-mono text-xs'].join(' ')}
                  />
                  <span className="text-app-muted text-xs">=</span>
                  <input
                    type="text"
                    value={ev.value}
                    onChange={e => handleEnvVarChange(i, 'value', e.target.value)}
                    placeholder="value"
                    className={[inputCls(false), 'flex-1 font-mono text-xs'].join(' ')}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEnvVar(i)}
                    className="p-1 text-app-muted hover:text-red-400 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddEnvVar}
              >
                <Plus size={13} /> Add variable
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-app-border">
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Command'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-app-muted">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function TypeTab({
  label,
  active,
  onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 h-7 text-xs rounded transition-colors duration-150',
        active ? 'bg-app-surface text-app-text' : 'text-app-muted hover:text-app-text'
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}): React.ReactElement {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className={[
          'relative w-8 h-4 rounded-full transition-colors duration-200',
          checked ? 'bg-blue-600' : 'bg-app-border'
        ].join(' ')}
        onClick={() => onChange(!checked)}
      >
        <div
          className={[
            'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          ].join(' ')}
        />
      </div>
      <span className="text-xs text-app-text">{label}</span>
    </label>
  )
}

const inputCls = (hasError: boolean): string =>
  [
    'w-full h-8 px-3 text-xs bg-app-bg border rounded-md text-app-text placeholder:text-app-muted',
    'focus:outline-none focus:ring-1 transition-colors duration-150',
    hasError
      ? 'border-red-600 focus:border-red-500 focus:ring-red-500/30'
      : 'border-app-border focus:border-blue-500 focus:ring-blue-500/30'
  ].join(' ')

const selectCls = [
  'w-full h-8 px-3 text-xs bg-app-bg border border-app-border rounded-md text-app-text',
  'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30',
  'transition-colors duration-150'
].join(' ')
