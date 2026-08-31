import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'
import {
  mountTerminal,
  fitTerminal,
  findInTerminal,
  clearTerminalSearch
} from '../../lib/terminalManager'

interface ProcessOutputProps {
  processId: string
  isActive: boolean
}

export function ProcessOutput({ processId, isActive }: ProcessOutputProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!containerRef.current) return
    mountTerminal(processId, containerRef.current)

    const observer = new ResizeObserver(() => {
      fitTerminal(processId)
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [processId])

  const closeSearch = useCallback((): void => {
    setSearchOpen(false)
    setQuery('')
    clearTerminalSearch(processId)
  }, [processId])

  // Ctrl+F opens search and Escape closes it, but only for the visible tab
  useEffect(() => {
    if (!isActive) return

    const handler = (e: KeyboardEvent): void => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === 'Escape' && searchOpen) {
        e.preventDefault()
        closeSearch()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActive, searchOpen, closeSearch])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  const runSearch = (direction: 'next' | 'previous'): void => {
    findInTerminal(processId, query, direction)
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {searchOpen && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-app-surface border border-app-border rounded-md shadow-lg px-1.5 py-1 no-drag">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={e => {
              const value = e.target.value
              setQuery(value)
              findInTerminal(processId, value, 'next', true)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                runSearch(e.shiftKey ? 'previous' : 'next')
              } else if (e.key === 'Escape') {
                e.preventDefault()
                closeSearch()
              }
            }}
            placeholder="Find in output"
            className="h-6 px-2 text-xs bg-app-bg border border-app-border rounded text-app-text w-40 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => runSearch('previous')}
            title="Previous (Shift+Enter)"
            className="p-1 text-app-muted hover:text-app-text rounded hover:bg-app-bg"
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            onClick={() => runSearch('next')}
            title="Next (Enter)"
            className="p-1 text-app-muted hover:text-app-text rounded hover:bg-app-bg"
          >
            <ChevronDown size={12} />
          </button>
          <button
            type="button"
            onClick={closeSearch}
            title="Close (Esc)"
            className="p-1 text-app-muted hover:text-app-text rounded hover:bg-app-bg"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="xterm-container flex-1 selectable"
        style={{ minHeight: 0 }}
      />
    </div>
  )
}
