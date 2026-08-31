// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Command, Group } from '@shared/types'

// ── Mock Zustand stores so we don't need window.api ────────────────────────
const mockCommands: Command[] = []
const mockQuery = { current: '' }

vi.mock('../store/commandsStore', () => ({
  useCommandsStore: (selector: (s: { commands: Command[] }) => unknown) =>
    selector({ commands: mockCommands })
}))

vi.mock('../store/uiStore', () => ({
  useUIStore: (selector: (s: { searchQuery: string }) => unknown) =>
    selector({ searchQuery: mockQuery.current })
}))

import { useCommandSearch } from '../hooks/useCommandSearch'

// ── Test helpers ───────────────────────────────────────────────────────────

function makeCommand(overrides: Partial<Command> = {}): Command {
  return {
    id: Math.floor(Math.random() * 10_000),
    groupId: null,
    name: 'Test Command',
    command: 'echo hello',
    commandType: 'inline',
    scriptFileName: null,
    description: null,
    workingDirectory: null,
    envVars: null,
    isFavorite: false,
    isEnabled: true,
    autoStart: false,
    position: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  }
}

function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: Math.floor(Math.random() * 10_000),
    name: 'Test Group',
    color: null,
    icon: null,
    position: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  }
}

describe('useCommandSearch', () => {
  beforeEach(() => {
    mockCommands.length = 0
    mockQuery.current = ''
  })

  it('returns all commands when query is empty', () => {
    const cmd1 = makeCommand({ name: 'Backend' })
    const cmd2 = makeCommand({ name: 'Frontend' })
    mockCommands.push(cmd1, cmd2)

    const { result } = renderHook(() => useCommandSearch([]))

    expect(result.current.filtered).toHaveLength(2)
    expect(result.current.isSearching).toBe(false)
  })

  it('returns isSearching=true when query is non-empty', () => {
    mockQuery.current = 'back'

    const { result } = renderHook(() => useCommandSearch([]))

    expect(result.current.isSearching).toBe(true)
  })

  it('filters by command name (case-insensitive)', () => {
    const backend = makeCommand({ name: 'Backend Server' })
    const frontend = makeCommand({ name: 'Frontend Dev' })
    mockCommands.push(backend, frontend)
    mockQuery.current = 'backend'

    const { result } = renderHook(() => useCommandSearch([]))

    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe(backend.id)
  })

  it('filters by command body', () => {
    const cmd = makeCommand({ name: 'Run tests', command: 'jest --watch' })
    const other = makeCommand({ name: 'Other', command: 'npm start' })
    mockCommands.push(cmd, other)
    mockQuery.current = 'jest'

    const { result } = renderHook(() => useCommandSearch([]))

    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe(cmd.id)
  })

  it('filters by description', () => {
    const cmd = makeCommand({ description: 'Runs database migrations' })
    const other = makeCommand({ description: null })
    mockCommands.push(cmd, other)
    mockQuery.current = 'migrat'

    const { result } = renderHook(() => useCommandSearch([]))

    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe(cmd.id)
  })

  it('returns empty filtered array when no matches', () => {
    mockCommands.push(makeCommand({ name: 'Backend' }))
    mockQuery.current = 'xyz_not_found'

    const { result } = renderHook(() => useCommandSearch([]))

    expect(result.current.filtered).toHaveLength(0)
  })

  it('groups commands by their group when groups are provided', () => {
    const group = makeGroup({ id: 42 })
    const cmd1 = makeCommand({ groupId: 42, name: 'CMD A' })
    const cmd2 = makeCommand({ groupId: 42, name: 'CMD B' })
    const ungrouped = makeCommand({ groupId: null, name: 'Lone' })
    mockCommands.push(cmd1, cmd2, ungrouped)

    const { result } = renderHook(() => useCommandSearch([group]))

    expect(result.current.grouped.groups).toHaveLength(1)
    expect(result.current.grouped.groups[0].commands).toHaveLength(2)
    expect(result.current.grouped.ungrouped).toHaveLength(1)
    expect(result.current.grouped.ungrouped[0].id).toBe(ungrouped.id)
  })

  it('places favorites in the favorites section', () => {
    const fav = makeCommand({ isFavorite: true, name: 'Favorite' })
    const normal = makeCommand({ isFavorite: false, name: 'Normal' })
    mockCommands.push(fav, normal)

    const { result } = renderHook(() => useCommandSearch([]))

    expect(result.current.grouped.favorites).toHaveLength(1)
    expect(result.current.grouped.favorites[0].id).toBe(fav.id)
  })

  it('excludes disabled commands from grouped output', () => {
    const disabled = makeCommand({ isEnabled: false, name: 'Disabled' })
    const enabled = makeCommand({ isEnabled: true, name: 'Enabled' })
    mockCommands.push(disabled, enabled)

    const { result } = renderHook(() => useCommandSearch([]))

    // filtered includes both (filtering is name/command/desc based, not enabled)
    // grouped only shows enabled
    const allGrouped = [
      ...result.current.grouped.ungrouped,
      ...result.current.grouped.favorites,
      ...result.current.grouped.groups.flatMap(g => g.commands)
    ]
    expect(allGrouped.every(c => c.isEnabled)).toBe(true)
    expect(allGrouped).toHaveLength(1)
  })

  it('groups with no matching commands are excluded from grouped.groups', () => {
    const group = makeGroup({ id: 99 })
    // No commands belong to group 99
    mockCommands.push(makeCommand({ groupId: null }))

    const { result } = renderHook(() => useCommandSearch([group]))

    expect(result.current.grouped.groups).toHaveLength(0)
  })
})
