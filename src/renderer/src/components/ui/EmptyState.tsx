import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      {icon && <div className="text-app-muted opacity-50">{icon}</div>}
      <div className="space-y-1">
        <p className="text-sm font-medium text-app-muted">{title}</p>
        {description && <p className="text-xs text-app-muted/70">{description}</p>}
      </div>
      {action}
    </div>
  )
}
