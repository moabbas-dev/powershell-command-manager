import { useMemo } from 'react'
import { useCommandsStore } from '../store/commandsStore'
import { useUIStore } from '../store/uiStore'
import type { Command, Group } from '@shared/types'

export interface GroupedCommands {
  ungrouped: Command[]
  groups: { group: Group; commands: Command[] }[]
  favorites: Command[]
}

/**
 * Returns filtered and grouped commands based on the current search query.
 */
export function useCommandSearch(groups: Group[]): {
  filtered: Command[]
  grouped: GroupedCommands
  isSearching: boolean
} {
  const commands = useCommandsStore(s => s.commands)
  const query = useUIStore(s => s.searchQuery)

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(
      cmd =>
        cmd.name.toLowerCase().includes(q) ||
        (cmd.commandType === 'script'
          ? (cmd.scriptFileName?.toLowerCase().includes(q) ?? false)
          : cmd.command.toLowerCase().includes(q)) ||
        (cmd.description?.toLowerCase().includes(q) ?? false)
    )
  }, [commands, query])

  const grouped = useMemo<GroupedCommands>(() => {
    const enabled = filtered.filter(c => c.isEnabled)
    const favorites = enabled.filter(c => c.isFavorite)

    const groupMap = new Map<number, Command[]>()
    for (const g of groups) groupMap.set(g.id, [])

    const ungrouped: Command[] = []

    for (const cmd of enabled) {
      if (cmd.groupId !== null && groupMap.has(cmd.groupId)) {
        groupMap.get(cmd.groupId)!.push(cmd)
      } else if (cmd.groupId === null) {
        ungrouped.push(cmd)
      }
    }

    const groupedList = groups
      .map(group => ({ group, commands: groupMap.get(group.id) ?? [] }))
      .filter(g => g.commands.length > 0)

    return { ungrouped, groups: groupedList, favorites }
  }, [filtered, groups])

  return { filtered, grouped, isSearching: query.trim().length > 0 }
}
