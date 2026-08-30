import React from 'react'
import { Terminal, Plus } from 'lucide-react'
import { useGroupsStore } from '../../store/groupsStore'
import { useUIStore } from '../../store/uiStore'
import { useCommandSearch } from '../../hooks/useCommandSearch'
import { CommandGroup } from './CommandGroup'
import { CommandItem } from './CommandItem'
import { FavoritesSection } from './FavoritesSection'
import { EmptyState } from '../ui/EmptyState'
import { Button } from '../ui/Button'

export function CommandList(): React.ReactElement {
  const groups = useGroupsStore(s => s.groups)
  const openCommandForm = useUIStore(s => s.openCommandForm)
  const { grouped, isSearching, filtered } = useCommandSearch(groups)

  if (!isSearching && filtered.length === 0) {
    return (
      <div className="flex-1 overflow-hidden">
        <EmptyState
          icon={<Terminal size={40} />}
          title="No commands yet"
          description="Create your first command to get started"
          action={
            <Button variant="primary" size="sm" onClick={() => openCommandForm()}>
              <Plus size={13} /> Add Command
            </Button>
          }
        />
      </div>
    )
  }

  if (isSearching) {
    return (
      <div className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-app-muted text-center py-8">No commands match your search</p>
        ) : (
          filtered.map(cmd => <CommandItem key={cmd.id} command={cmd} />)
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-1 px-2 space-y-1">
      {/* Favorites */}
      <FavoritesSection commands={grouped.favorites} />

      {/* Groups */}
      {grouped.groups.map(({ group, commands }) => (
        <CommandGroup
          key={group.id}
          group={group}
          commands={commands}
          defaultExpanded
        />
      ))}

      {/* Ungrouped */}
      {grouped.ungrouped.length > 0 && (
        <div className="space-y-0.5">
          {grouped.groups.length > 0 && (
            <div className="px-3 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-app-muted/60">
                Other
              </span>
            </div>
          )}
          {grouped.ungrouped.map(cmd => (
            <CommandItem key={cmd.id} command={cmd} />
          ))}
        </div>
      )}
    </div>
  )
}
