import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  bordered?: boolean
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', bordered = false, ...props }, ref) => {
    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-14 h-14 text-base',
      xl: 'w-20 h-20 text-lg',
    }

    const getFallbackText = () => {
      if (fallback) return fallback
      if (alt) return alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      return '?'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-full overflow-hidden bg-carbon-700 flex items-center justify-center',
          sizes[size],
          bordered && 'ring-2 ring-gold ring-offset-2 ring-offset-carbon-900',
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-semibold text-gold">{getFallbackText()}</span>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar }
