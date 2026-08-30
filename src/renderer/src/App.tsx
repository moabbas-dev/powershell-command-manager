import React, { useEffect } from 'react'
import { TitleBar } from './components/layout/TitleBar'
import { Sidebar } from './components/layout/Sidebar'
import { MainPanel } from './components/layout/MainPanel'
import { CommandForm } from './components/commands/CommandForm'
import { GroupForm } from './components/groups/GroupForm'
import { SettingsModal } from './components/settings/SettingsModal'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { useCommandsStore } from './store/commandsStore'
import { useGroupsStore } from './store/groupsStore'
import { useProcessesStore } from './store/processesStore'
import { useSettingsStore } from './store/settingsStore'
import { useUIStore } from './store/uiStore'
import { useIPCEvents } from './hooks/useIPCEvents'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function App(): React.ReactElement {
  // IPC event subscriptions (must be first, before any render)
  useIPCEvents()
  useKeyboardShortcuts()

  // Load initial data
  const loadCommands = useCommandsStore(s => s.load)
  const loadGroups = useGroupsStore(s => s.load)
  const loadProcesses = useProcessesStore(s => s.load)
  const loadSettings = useSettingsStore(s => s.load)

  useEffect(() => {
    // Load all initial data in parallel
    Promise.all([loadCommands(), loadGroups(), loadProcesses(), loadSettings()])
  }, [loadCommands, loadGroups, loadProcesses, loadSettings])

  // Confirm dialog state
  const openModal = useUIStore(s => s.openModal)
  const closeModal = useUIStore(s => s.closeModal)
  const confirmMessage = useUIStore(s => s.confirmMessage)
  const confirmAction = useUIStore(s => s.confirmAction)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-app-bg text-app-text">
      {/* Title bar */}
      <TitleBar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainPanel />
      </div>

      {/* Modals */}
      <CommandForm />
      <GroupForm />
      <SettingsModal />
      <ConfirmDialog
        open={openModal === 'confirm-stop-all'}
        message={confirmMessage}
        onConfirm={confirmAction ?? (() => {})}
        onCancel={closeModal}
        confirmLabel="Stop All"
        variant="danger"
      />
    </div>
  )
}
