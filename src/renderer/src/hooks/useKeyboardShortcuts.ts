import { useEffect } from 'react'
import { useUIStore } from '../store/uiStore'
import { useProcessesStore } from '../store/processesStore'
import { useSettingsStore } from '../store/settingsStore'

/**
 * Registers global keyboard shortcuts for the application.
 * Must be called once at the App root.
 */
export function useKeyboardShortcuts(): void {
  const setSearchQuery = useUIStore(s => s.setSearchQuery)
  const openCommandForm = useUIStore(s => s.openCommandForm)
  const openSettings = useUIStore(s => s.openSettings)
  const openConfirm = useUIStore(s => s.openConfirm)
  const closeModal = useUIStore(s => s.closeModal)
  const openModal = useUIStore(s => s.openModal)
  const confirmStopAll = useSettingsStore(s => s.settings.confirmStopAll)

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey

      // Don't intercept when typing in inputs (except specific shortcuts)
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement

      // Escape — close modal or clear search
      if (e.key === 'Escape') {
        if (openModal) {
          closeModal()
          e.preventDefault()
        }
        return
      }

      if (isInput) return

      // Ctrl+K — focus search
      if (ctrl && e.key === 'k') {
        e.preventDefault()
        setSearchQuery('')
        document.getElementById('command-search')?.focus()
        return
      }

      // Ctrl+N — new command
      if (ctrl && !shift && e.key === 'n') {
        e.preventDefault()
        openCommandForm()
        return
      }

      // Ctrl+, — settings
      if (ctrl && e.key === ',') {
        e.preventDefault()
        openSettings()
        return
      }

      // Ctrl+Shift+X — stop all
      if (ctrl && shift && e.key === 'X') {
        e.preventDefault()
        const runningCount = useProcessesStore.getState().getRunningCount()
        if (runningCount === 0) return

        if (confirmStopAll) {
          openConfirm(
            `Stop all ${runningCount} running command${runningCount > 1 ? 's' : ''}?`,
            async () => {
              await window.api.processes.stopAll()
            }
          )
        } else {
          window.api.processes.stopAll()
        }
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openModal, confirmStopAll, setSearchQuery, openCommandForm, openSettings, openConfirm, closeModal])
}
