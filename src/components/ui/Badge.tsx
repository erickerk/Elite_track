import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-carbon-700 text-gray-300',
      success: 'bg-status-success/20 text-status-success border border-status-success/30',
      warning: 'bg-status-warning/20 text-status-warning border border-status-warning/30',
      error: 'bg-status-error/20 text-status-error border border-status-error/30',
      info: 'bg-status-info/20 text-status-info border border-status-info/30',
      gold: 'bg-gold/20 text-gold border border-gold/30',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-micro',
      md: 'px-3 py-1 text-caption',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
