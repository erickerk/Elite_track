import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Shield, CheckCircle, AlertCircle, Car, User, Mail, Phone, 
  Lock, Eye, EyeOff, ArrowRight, Clock, XCircle
} from 'lucide-react'
import { useInvite } from '../contexts/InviteContext'
import { useAuth } from '../contexts/AuthContext'
import { useProjects } from '../contexts/ProjectContext'
import type { RegistrationInvite } from '../types'

export function Register() {
  const { token: paramToken } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const queryToken = searchParams.get('token')
  const projectId = searchParams.get('project')
  const token = paramToken || queryToken
  const navigate = useNavigate()
  const { getProjectById } = useProjects()
  const { validateToken, useInvite: consumeInvite } = useInvite()
  const { login } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<RegistrationInvite | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'validating' | 'form' | 'success' | 'error'>('validating')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) {
      setError('Token de convite não fornecido')
      setStep('error')
      setLoading(false)
      return
    }

    // Simula validação do token
    const timer = setTimeout(() => {
      // Verificar se é um token dinâmico (INV-...) gerado pelo ExecutorDashboard
      if (token.startsWith('INV-')) {
        // Validar token dinâmico
        const tokenParts = token.split('-')
        if (tokenParts.length >= 2) {
          const tokenTimestamp = parseInt(tokenParts[1])
          const expirationTime = tokenTimestamp + (7 * 24 * 60 * 60 * 1000) // 7 dias
          const now = Date.now()
          
          if (now > expirationTime) {
            setError('Este convite expirou. Solicite um novo convite ao executor.')
            setStep('error')
            setLoading(false)
            return
          }
          
          // Buscar informações do projeto se disponível
          let projectInfo = null
          if (projectId) {
            projectInfo = getProjectById(projectId)
          }
          
          // Criar invite virtual para tokens dinâmicos
          const dynamicInvite: RegistrationInvite = {
            id: token,
            token: token,
            projectId: projectId || 'PRJ-UNKNOWN',
            vehicleInfo: projectInfo ? `${projectInfo.vehicle.brand} ${projectInfo.vehicle.model}` : 'Veículo em processo de blindagem',
            vehiclePlate: projectInfo?.vehicle.plate || 'N/A',
            ownerName: projectInfo?.user.name || '',
            ownerEmail: projectInfo?.user.email || '',
            ownerPhone: projectInfo?.user.phone || '',
            createdAt: new Date(tokenTimestamp).toISOString(),
            expiresAt: new Date(expirationTime).toISOString(),
            status: 'pending',
            createdBy: 'executor',
          }
          
          setInvite(dynamicInvite)
          setFormData(prev => ({
            ...prev,
            name: dynamicInvite.ownerName || '',
            email: dynamicInvite.ownerEmail || '',
            phone: dynamicInvite.ownerPhone || '',
          }))
          setStep('form')
          setLoading(false)
          return
        }
      }
      
      // Validação padrão para tokens do InviteContext
      const validation = validateToken(token)
      
      if (validation.valid && validation.invite) {
        setInvite(validation.invite)
        setFormData(prev => ({
          ...prev,
          name: validation.invite!.ownerName || '',
          email: validation.invite!.ownerEmail || '',
          phone: validation.invite!.ownerPhone || '',
        }))
        setStep('form')
      } else {
        setError(validation.error || 'Token inválido')
        setInvite(validation.invite || null)
        setStep('error')
      }
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [token, validateToken, projectId, getProjectById])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido'
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório'
    }

    if (!formData.password) {
      errors.password = 'Senha é obrigatória'
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter no mínimo 6 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não conferem'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !token || !invite) return

    setIsSubmitting(true)

    try {
      // Simula criação de conta
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Consome o convite
      const userId = `user-${Date.now()}`
      const success = consumeInvite(token, userId)

      if (success) {
        setStep('success')
        
        // Auto-login após 3 segundos
        setTimeout(async () => {
          try {
            await login(formData.email, formData.password)
            navigate('/dashboard')
          } catch {
            navigate('/login')
          }
        }, 3000)
      } else {
        setError('Erro ao processar cadastro. Tente novamente.')
        setStep('error')
      }
    } catch {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tela de carregamento
  if (loading || step === 'validating') {
    return (
      <div className="min-h-screen bg-carbon-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-gold animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Validando Convite</h1>
          <p className="text-gray-400">Verificando seu token de acesso...</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gold"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // Tela de erro
  if (step === 'error') {
    const getErrorIcon = () => {
      if (invite?.status === 'used') return <CheckCircle className="w-10 h-10 text-status-warning" />
      if (invite?.status === 'expired') return <Clock className="w-10 h-10 text-status-warning" />
      if (invite?.status === 'revoked') return <XCircle className="w-10 h-10 text-status-error" />
      return <AlertCircle className="w-10 h-10 text-status-error" />
    }

    const getErrorColor = () => {
      if (invite?.status === 'used' || invite?.status === 'expired') return 'bg-status-warning/20'
      return 'bg-status-error/20'
    }

    return (
      <div className="min-h-screen bg-carbon-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${getErrorColor()} flex items-center justify-center`}>
            {getErrorIcon()}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {invite?.status === 'used' ? 'Convite Já Utilizado' : 
             invite?.status === 'expired' ? 'Convite Expirado' :
             invite?.status === 'revoked' ? 'Convite Revogado' : 'Convite Inválido'}
          </h1>
          <p className="text-gray-400 mb-6">{error}</p>

          {invite && (
            <div className="bg-carbon-800 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-400 mb-2">Informações do convite:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gold" />
                  <span className="text-sm text-white">{invite.vehicleInfo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gold" />
                  <span className="text-sm text-white">{invite.ownerName}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {invite?.status === 'used' && (
              <Link
                to="/login"
                className="block w-full bg-gold text-carbon-900 font-semibold py-3 rounded-xl hover:bg-gold/90 transition-colors"
              >
                Fazer Login
              </Link>
            )}
            <Link
              to="/"
              className="block w-full border border-carbon-600 text-white py-3 rounded-xl hover:bg-carbon-800 transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Se você acredita que isso é um erro, entre em contato com a Elite Blindagens.
          </p>
        </motion.div>
      </div>
    )
  }

  // Tela de sucesso
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-carbon-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div 
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-status-success/20 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <CheckCircle className="w-12 h-12 text-status-success" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Cadastro Realizado!</h1>
          <p className="text-gray-400 mb-6">
            Sua conta foi criada com sucesso. Você será redirecionado automaticamente...
          </p>

          {invite && (
            <div className="bg-carbon-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Car className="w-6 h-6 text-gold" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">{invite.vehicleInfo}</p>
                  <p className="text-sm text-gray-400">Placa: {invite.vehiclePlate}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gold"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // Formulário de cadastro
  return (
    <div className="min-h-screen bg-carbon-900 text-white">
      <div className="max-w-md mx-auto p-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center">
            <span className="text-carbon-900 font-bold text-2xl">E</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Crie sua Conta</h1>
          <p className="text-gray-400">Complete seu cadastro para acompanhar seu veículo</p>
        </motion.div>

        {/* Vehicle Info Card */}
        {invite && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-carbon-800 rounded-2xl p-4 mb-6 border border-gold/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Car className="w-7 h-7 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-white">{invite.vehicleInfo}</p>
                <p className="text-sm text-gray-400">Placa: {invite.vehiclePlate}</p>
                <p className="text-xs text-gold mt-1">Projeto: {invite.projectId}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Registration Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium mb-2">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full bg-carbon-800 border ${formErrors.name ? 'border-status-error' : 'border-carbon-600'} rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors`}
                placeholder="Seu nome completo"
              />
            </div>
            {formErrors.name && <p className="text-status-error text-xs mt-1">{formErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-carbon-800 border ${formErrors.email ? 'border-status-error' : 'border-carbon-600'} rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors`}
                placeholder="seu@email.com"
              />
            </div>
            {formErrors.email && <p className="text-status-error text-xs mt-1">{formErrors.email}</p>}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium mb-2">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full bg-carbon-800 border ${formErrors.phone ? 'border-status-error' : 'border-carbon-600'} rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors`}
                placeholder="(11) 99999-9999"
              />
            </div>
            {formErrors.phone && <p className="text-status-error text-xs mt-1">{formErrors.phone}</p>}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full bg-carbon-800 border ${formErrors.password ? 'border-status-error' : 'border-carbon-600'} rounded-xl pl-11 pr-11 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors`}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formErrors.password && <p className="text-status-error text-xs mt-1">{formErrors.password}</p>}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full bg-carbon-800 border ${formErrors.confirmPassword ? 'border-status-error' : 'border-carbon-600'} rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none transition-colors`}
                placeholder="Repita sua senha"
              />
            </div>
            {formErrors.confirmPassword && <p className="text-status-error text-xs mt-1">{formErrors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-gold to-gold/80 text-carbon-900 font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-carbon-900/30 border-t-carbon-900 rounded-full animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                Criar Minha Conta
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Already have account */}
          <p className="text-center text-sm text-gray-400">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-gold hover:text-gold/80 transition-colors">
              Fazer login
            </Link>
          </p>
        </motion.form>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gold" />
            <span className="text-xs text-gray-400">Conexão Segura</span>
          </div>
          <p className="text-xs text-gray-500">
            Seus dados são protegidos com criptografia de nível bancário
          </p>
        </motion.div>
      </div>
    </div>
  )
}
