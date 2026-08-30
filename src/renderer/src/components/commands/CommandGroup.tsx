import React, { useState } from 'react'
import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import type { Group, Command } from '@shared/types'
import { CommandItem } from './CommandItem'
import { useUIStore } from '../../store/uiStore'
import { useGroupsStore } from '../../store/groupsStore'
import { getGroupIcon } from '../../lib/groupIcons'

interface CommandGroupProps {
  group: Group
  commands: Command[]
  defaultExpanded?: boolean
}

export function CommandGroup({
  group,
  commands,
  defaultExpanded = true
}: CommandGroupProps): React.ReactElement {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [menuOpen, setMenuOpen] = useState(false)
  const openGroupForm = useUIStore(s => s.openGroupForm)
  const openConfirm = useUIStore(s => s.openConfirm)
  const removeGroup = useGroupsStore(s => s.remove)

  return (
    <div>
      {/* Group header */}
      <div
        className="group flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:bg-app-surface rounded-md transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <ChevronRight
          size={12}
          className={[
            'text-app-muted transition-transform duration-150 flex-shrink-0',
            expanded ? 'rotate-90' : ''
          ].join(' ')}
        />
        {group.icon && (() => {
          const GroupIcon = getGroupIcon(group.icon)
          return GroupIcon
            ? <GroupIcon size={11} className="flex-shrink-0" style={group.color ? { color: group.color } : { color: '#7d8590' }} />
            : null
        })()}
        <span
          className="text-[11px] font-semibold uppercase tracking-wider text-app-muted flex-1 truncate"
          style={group.color ? { color: group.color } : undefined}
        >
          {group.name}
        </span>
        <span className="text-[10px] text-app-muted/60">{commands.length}</span>

        {/* Group actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="p-0.5 rounded text-app-muted hover:text-app-text hover:bg-app-surface"
            >
              <Pencil size={10} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 w-36 bg-[#2d333b] border border-app-border rounded-lg shadow-xl py-1 text-xs">
                  <button
                    onClick={() => { setMenuOpen(false); openGroupForm(group.id) }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-app-text hover:bg-app-surface"
                  >
                    <Pencil size={11} /> Edit group
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      openConfirm(
                        `Delete group "${group.name}"? Commands will become ungrouped.`,
                        () => removeGroup(group.id)
                      )
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-app-surface"
                  >
                    <Trash2 size={11} /> Delete group
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Commands */}
      {expanded && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {commands.map(cmd => (
            <CommandItem key={cmd.id} command={cmd} />
          ))}
        </div>
      )}
    </div>
  )
}
