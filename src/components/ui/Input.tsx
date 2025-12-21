import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, ...props }, ref) => {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full rounded-xl px-4 py-3 transition-all duration-200 outline-none',
              'border focus:ring-1 focus:ring-gold/50',
              isDark
                ? 'bg-carbon-800 border-carbon-700 text-white placeholder:text-gray-500 focus:border-gold'
                : 'bg-white border-gray-300 text-carbon-900 placeholder:text-gray-400 focus:border-gold',
              icon && 'pl-12',
              isPassword && 'pr-12',
              error && 'border-status-error focus:border-status-error focus:ring-status-error/50',
              className
            )}
            {...props}
          />

          {label && (
            <motion.label
              initial={false}
              animate={{
                y: isFocused || props.value ? -28 : 0,
                scale: isFocused || props.value ? 0.85 : 1,
                color: isFocused ? '#D4AF37' : isDark ? '#9CA3AF' : '#6B7280',
              }}
              className={cn(
                'absolute left-4 top-3 origin-left pointer-events-none transition-all',
                icon && 'left-12'
              )}
            >
              {label}
            </motion.label>
          )}

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 text-sm text-status-error"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
