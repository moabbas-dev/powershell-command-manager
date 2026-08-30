import React, { useState } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps): React.ReactElement {
  const [visible, setVisible] = useState(false)

  const sideClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5'
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={[
            'absolute z-50 px-2 py-1 text-xs text-app-text bg-[#2d333b] border border-app-border',
            'rounded shadow-lg whitespace-nowrap pointer-events-none',
            sideClasses[side]
          ].join(' ')}
        >
          {content}
        </span>
      )}
    </span>
  )
}
