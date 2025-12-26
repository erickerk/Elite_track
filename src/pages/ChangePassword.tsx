import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function ChangePassword() {
  const navigate = useNavigate()
  const { user, changePassword, logout } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordRequirements = [
    { label: 'Mínimo 6 caracteres', valid: newPassword.length >= 6 },
    { label: 'Contém número', valid: /\d/.test(newPassword) },
    { label: 'Senhas coincidem', valid: newPassword === confirmPassword && newPassword.length > 0 },
  ]

  const isValidPassword = passwordRequirements.every(r => r.valid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidPassword) {
      setError('Por favor, atenda todos os requisitos de senha.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await changePassword(newPassword)
      setSuccess(true)
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      setError('Erro ao alterar senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-carbon-950 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-carbon-900/50 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Senha Alterada!</h1>
          <p className="text-gray-400 mb-6">
            Sua nova senha foi configurada com sucesso. Você será redirecionado...
          </p>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-carbon-950 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-carbon-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Altere sua Senha</h1>
          <p className="text-gray-400">
            Por segurança, você precisa criar uma senha definitiva para sua conta.
          </p>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400">Conta:</p>
            <p className="font-semibold text-white">{user.email}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nova Senha */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite sua nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Confirme sua nova senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-300 mb-2">Requisitos:</p>
            {passwordRequirements.map((req, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                {req.valid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                )}
                <span className={req.valid ? 'text-green-400 text-sm' : 'text-gray-500 text-sm'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isValidPassword}
            className="w-full bg-primary text-black py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
          >
            Sair e usar outra conta
          </button>
        </form>
      </motion.div>
    </div>
  )
}
