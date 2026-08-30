import React, { useState, useEffect } from 'react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useGroupsStore } from '../../store/groupsStore'
import { useUIStore } from '../../store/uiStore'
import { GROUP_ICONS } from '../../lib/groupIcons'

// ── Color palette ──────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  // Blues
  '#58a6ff', '#79c0ff', '#1f6feb', '#0969da',
  // Greens
  '#3fb950', '#56d364', '#2ea043', '#1a7f37',
  // Ambers / Oranges
  '#e3b341', '#d29922', '#f0883e', '#bc6e3c',
  // Reds
  '#ff7b72', '#f78166', '#da3633', '#b91c1c',
  // Purples
  '#d2a8ff', '#bc8cff', '#8957e5', '#6e40c9',
  // Cyans
  '#56d4dd', '#39c5cf', '#0ea5e9', '#0284c7',
  // Pinks
  '#f778ba', '#ec4899', '#db2777',
  // Neutrals
  '#b1bac4', '#7d8590', '#6e7681',
]

export function GroupForm(): React.ReactElement {
  const openModal = useUIStore(s => s.openModal)
  const editingId = useUIStore(s => s.editingGroupId)
  const closeModal = useUIStore(s => s.closeModal)
  const groups = useGroupsStore(s => s.groups)
  const addGroup = useGroupsStore(s => s.add)
  const updateGroup = useGroupsStore(s => s.update)

  const [name, setName] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [icon, setIcon] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOpen = openModal === 'group-form'
  const isEditing = editingId !== null

  useEffect(() => {
    if (!isOpen) return
    if (editingId !== null) {
      const g = groups.find(x => x.id === editingId)
      if (g) { setName(g.name); setColor(g.color); setIcon(g.icon) }
    } else {
      setName(''); setColor(null); setIcon(null)
    }
    setError('')
  }, [isOpen, editingId, groups])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setIsSubmitting(true)
    try {
      if (isEditing && editingId !== null) {
        await updateGroup(editingId, { name: name.trim(), color, icon })
      } else {
        await addGroup({ name: name.trim(), color, icon })
      }
      closeModal()
    } catch (err) {
      setError(String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      title={isEditing ? 'Edit Group' : 'New Group'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-app-muted mb-1.5 block">
            Group Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Backend, Frontend, DevOps…"
            autoFocus
            className="w-full h-8 px-3 text-xs bg-app-bg border border-app-border rounded-md text-app-text placeholder:text-app-muted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
          />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        {/* Icon picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-app-muted">Icon</label>
            {icon && (
              <button
                type="button"
                onClick={() => setIcon(null)}
                className="text-[11px] text-app-muted hover:text-app-text transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1 max-h-[168px] overflow-y-auto pr-0.5">
            {GROUP_ICONS.map(({ name: iconName, Icon, label }) => (
              <button
                key={iconName}
                type="button"
                title={label}
                onClick={() => setIcon(iconName === icon ? null : iconName)}
                className={[
                  'flex items-center justify-center w-full aspect-square rounded-md border transition-colors',
                  icon === iconName
                    ? 'border-blue-500 bg-blue-900/40 text-blue-400'
                    : 'border-app-border text-app-muted hover:border-app-text hover:text-app-text hover:bg-app-surface'
                ].join(' ')}
                style={icon === iconName && color ? { borderColor: color, color, backgroundColor: color + '22' } : undefined}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-app-muted">Color</label>
            {color && (
              <button
                type="button"
                onClick={() => setColor(null)}
                className="text-[11px] text-app-muted hover:text-app-text transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setColor(c === color ? null : c)}
                className={[
                  'w-6 h-6 rounded-full transition-all',
                  color === c
                    ? 'ring-2 ring-offset-2 ring-offset-app-sidebar ring-white scale-110'
                    : 'opacity-80 hover:opacity-100 hover:scale-110'
                ].join(' ')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        {(name || icon || color) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-app-surface border border-app-border">
            <span className="text-xs text-app-muted">Preview:</span>
            {icon && (() => {
              const def = GROUP_ICONS.find(g => g.name === icon)
              if (!def) return null
              const { Icon } = def
              return <Icon size={12} style={color ? { color } : undefined} className="text-app-muted" />
            })()}
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={color ? { color } : { color: '#7d8590' }}
            >
              {name || 'Group Name'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1 border-t border-app-border">
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Group'}
          </Button>
        </div>

      </form>
    </Dialog>
  )
}
