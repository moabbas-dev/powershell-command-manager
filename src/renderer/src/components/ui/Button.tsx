import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 hover:border-blue-400',
  secondary:
    'bg-app-surface hover:bg-[#2d333b] text-app-text border border-app-border hover:border-[#484f58]',
  ghost: 'bg-transparent hover:bg-app-surface text-app-muted hover:text-app-text border border-transparent',
  danger:
    'bg-red-900/50 hover:bg-red-800/60 text-red-400 hover:text-red-300 border border-red-800 hover:border-red-700',
  icon: 'bg-transparent hover:bg-app-surface text-app-muted hover:text-app-text border border-transparent rounded-md'
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-1 text-xs h-6',
  md: 'px-3 py-1.5 text-sm h-8',
  lg: 'px-4 py-2 text-sm h-9'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          'no-drag inline-flex items-center justify-center gap-1.5 rounded-md font-medium',
          'transition-colors duration-150 focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-blue-500 disabled:opacity-40 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
