import React, { Fragment } from 'react'
import { Dialog as HUIDialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg'
}: DialogProps): React.ReactElement {
  return (
    <Transition appear show={open} as={Fragment}>
      <HUIDialog as="div" className="relative z-50 no-drag" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                className={[
                  'w-full rounded-xl bg-app-sidebar border border-app-border shadow-2xl',
                  maxWidth
                ].join(' ')}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-app-border">
                  <DialogTitle className="text-sm font-semibold text-app-text">
                    {title}
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-md text-app-muted hover:text-app-text hover:bg-app-surface transition-colors"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5">{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </HUIDialog>
    </Transition>
  )
}
