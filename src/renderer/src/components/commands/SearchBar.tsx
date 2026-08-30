import React, { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

export function SearchBar(): React.ReactElement {
  const query = useUIStore(s => s.searchQuery)
  const setQuery = useUIStore(s => s.setSearchQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = (): void => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className="px-3 py-2">
      <div className="relative flex items-center">
        <Search size={13} className="absolute left-2.5 text-app-muted pointer-events-none" />
        <input
          ref={inputRef}
          id="command-search"
          type="text"
          placeholder="Search commands..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={[
            'w-full h-7 pl-8 pr-7 text-xs bg-app-bg border border-app-border rounded-md',
            'text-app-text placeholder:text-app-muted',
            'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30',
            'transition-colors duration-150'
          ].join(' ')}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 text-app-muted hover:text-app-text"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {query && (
        <p className="mt-1 text-[10px] text-app-muted px-0.5">
          Press Escape to clear
        </p>
      )}
    </div>
  )
}
