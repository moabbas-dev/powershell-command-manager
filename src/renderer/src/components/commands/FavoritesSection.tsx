import React, { useState } from 'react'
import { ChevronRight, Star } from 'lucide-react'
import type { Command } from '@shared/types'
import { CommandItem } from './CommandItem'

interface FavoritesSectionProps {
  commands: Command[]
}

export function FavoritesSection({ commands }: FavoritesSectionProps): React.ReactElement | null {
  const [expanded, setExpanded] = useState(true)

  if (commands.length === 0) return null

  return (
    <div className="mb-1">
      <div
        className="flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:bg-app-surface rounded-md transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <ChevronRight
          size={12}
          className={[
            'text-yellow-400 transition-transform duration-150 flex-shrink-0',
            expanded ? 'rotate-90' : ''
          ].join(' ')}
        />
        <Star size={11} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-yellow-400/80 flex-1">
          Favorites
        </span>
        <span className="text-[10px] text-app-muted/60">{commands.length}</span>
      </div>

      {expanded && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {commands.map(cmd => (
            <CommandItem key={cmd.id} command={cmd} compact />
          ))}
        </div>
      )}
    </div>
  )
}
