import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield } from 'lucide-react'

export function SplashScreen() {
  const navigate = useNavigate()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
      setTimeout(() => navigate('/login'), 500)
    }, 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 1.5, bounce: 0.4 }}
            className="relative z-10"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/60 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30">
              <Shield className="w-16 h-16 text-black" />
            </div>
          </motion.div>

          {/* Brand Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-8 font-['Pacifico'] text-5xl text-primary relative z-10"
          >
            EliteTrack™
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-4 text-gray-400 text-lg tracking-wider relative z-10"
          >
            Proteção elevada ao estado da arte.
          </motion.p>

          {/* Loading Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-12 w-48 h-1 bg-white/10 rounded-full overflow-hidden relative z-10"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 1.5, duration: 1.5, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
            />
          </motion.div>

          {/* Elite Blindagens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-12 flex flex-col items-center relative z-10"
          >
            <p className="text-xs text-gray-600 tracking-widest uppercase">Powered by</p>
            <p className="text-sm text-gray-500 font-medium mt-1">Elite Blindagens</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
export default SplashScreen
