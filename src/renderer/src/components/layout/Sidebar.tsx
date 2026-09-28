import React from 'react'
import { Plus, FolderPlus, FileCode, ShieldCheck } from 'lucide-react'
import { SearchBar } from '../commands/SearchBar'
import { CommandList } from '../commands/CommandList'
import { Button } from '../ui/Button'
import { useUIStore } from '../../store/uiStore'
import { useSidebarResize } from '../../hooks/useSidebarResize'
import { Tooltip } from '../ui/Tooltip'

export function Sidebar(): React.ReactElement {
  const openCommandForm = useUIStore(s => s.openCommandForm)
  const openGroupForm = useUIStore(s => s.openGroupForm)
  const openScriptEditor = useUIStore(s => s.openScriptEditor)
  const openSecurityScan = useUIStore(s => s.openSecurityScan)
  const { width, isResizing, startResize } = useSidebarResize()

  return (
    <>
      <div
        className="flex flex-col flex-shrink-0 border-r border-app-border bg-app-sidebar overflow-hidden"
        style={{ width }}
      >
        {/* Search */}
        <SearchBar />

        {/* Command list — takes remaining space */}
        <CommandList />

        {/* Bottom actions — primary action gets its own row so it always has
            room; secondary icon actions sit below and never compete with it. */}
        <div className="flex flex-col gap-1.5 px-3 py-2 border-t border-app-border">
          <Tooltip content="New command (Ctrl+N)">
            <Button variant="primary" size="sm" className="w-full" onClick={() => openCommandForm()}>
              <Plus size={13} />
              Add Command
            </Button>
          </Tooltip>
          <div className="flex items-center gap-1.5">
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
            <Tooltip content="Security check">
              <Button variant="secondary" size="sm" onClick={() => openSecurityScan()}>
                <ShieldCheck size={13} />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Resize handle — a flex sibling, not an overlay, so it never sits on
          top of the command list's own scrollbar at the sidebar's edge. */}
      <div
        onMouseDown={startResize}
        className={[
          'w-1 flex-shrink-0 cursor-col-resize no-drag',
          isResizing ? 'bg-blue-500/60' : 'bg-transparent hover:bg-blue-500/40'
        ].join(' ')}
      />
    </>
  )
}
