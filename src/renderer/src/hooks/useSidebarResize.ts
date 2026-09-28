import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

const STORAGE_KEY = 'sidebarWidth'
const DEFAULT_WIDTH = 240
const MIN_WIDTH = 200
const MAX_WIDTH = 420

function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? parseInt(raw, 10) : NaN
    if (!Number.isNaN(parsed)) {
      return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed))
    }
  } catch {
    // localStorage unavailable (e.g. private/blocked) — fall through to default
  }
  return DEFAULT_WIDTH
}

interface SidebarResize {
  width: number
  isResizing: boolean
  startResize: (e: ReactMouseEvent) => void
}

/** Drag-to-resize for the sidebar, with the width remembered per device via localStorage. */
export function useSidebarResize(): SidebarResize {
  const [width, setWidth] = useState(readStoredWidth)
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const startResize = useCallback(
    (e: ReactMouseEvent): void => {
      e.preventDefault()
      startXRef.current = e.clientX
      startWidthRef.current = width
      setIsResizing(true)
    },
    [width]
  )

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent): void => {
      const delta = e.clientX - startXRef.current
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta))
      setWidth(next)
    }

    const handleMouseUp = (): void => setIsResizing(false)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    if (isResizing) return
    try {
      localStorage.setItem(STORAGE_KEY, String(width))
    } catch {
      // non-critical — just means the width won't be remembered next launch
    }
  }, [width, isResizing])

  return { width, isResizing, startResize }
}
