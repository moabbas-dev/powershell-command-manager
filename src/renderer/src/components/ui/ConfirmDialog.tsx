import React from 'react'
import { Dialog } from './Dialog'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  variant?: 'danger' | 'primary'
}

export function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  variant = 'danger'
}: ConfirmDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onClose={onCancel} title="Confirm Action" maxWidth="max-w-sm">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-app-text">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm()
              onCancel()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
