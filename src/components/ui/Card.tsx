import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: 'default' | 'elevated' | 'bordered'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    const variants = {
      default: isDark
        ? 'bg-carbon-800 border-carbon-700/50'
        : 'bg-white border-gray-200/50',
      elevated: isDark
        ? 'bg-carbon-800 shadow-card-dark border-carbon-700/30'
        : 'bg-white shadow-card border-gray-100',
      bordered: isDark
        ? 'bg-transparent border-2 border-gold/30'
        : 'bg-white/50 border-2 border-gold/30',
    }

    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
        transition={{ duration: 0.2 }}
        className={cn(
          'rounded-2xl p-6 border backdrop-blur-sm',
          variants[variant],
          hover && 'cursor-pointer transition-shadow hover:shadow-gold/20',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-h3 font-semibold', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent }
