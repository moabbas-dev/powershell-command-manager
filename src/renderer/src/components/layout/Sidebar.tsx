import React from 'react'
import { Plus, FolderPlus, FileCode } from 'lucide-react'
import { SearchBar } from '../commands/SearchBar'
import { CommandList } from '../commands/CommandList'
import { Button } from '../ui/Button'
import { useUIStore } from '../../store/uiStore'
import { Tooltip } from '../ui/Tooltip'

export function Sidebar(): React.ReactElement {
  const openCommandForm = useUIStore(s => s.openCommandForm)
  const openGroupForm = useUIStore(s => s.openGroupForm)
  const openScriptEditor = useUIStore(s => s.openScriptEditor)

  return (
    <div className="flex flex-col w-60 flex-shrink-0 border-r border-app-border bg-app-sidebar overflow-hidden">
      {/* Search */}
      <SearchBar />

      {/* Command list — takes remaining space */}
      <CommandList />

      {/* Bottom actions */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-app-border">
        <Tooltip content="New command (Ctrl+N)">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => openCommandForm()}
          >
            <Plus size={13} />
            Add Command
          </Button>
        </Tooltip>
        <Tooltip content="New group">
          <Button variant="secondary" size="sm" onClick={() => openGroupForm()}>
            <FolderPlus size={13} />
          </Button>
        </Tooltip>
        <Tooltip content="New script">
          <Button variant="secondary" size="sm" onClick={() => openScriptEditor()}>
            <FileCode size={13} />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
