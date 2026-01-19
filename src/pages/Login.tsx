import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isRateLimited, recordLoginAttempt, clearRateLimit, getRateLimitInfo } from '../utils/rateLimiter'
import '../styles/Login.css'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')
  const { login, requestPasswordReset } = useAuth()
  
  // Carregar credenciais salvas do localStorage
  const [email, setEmail] = useState(() => {
    const saved = localStorage.getItem('elite_remembered_email')
    return saved || ''
  })
  const [password, setPassword] = useState(() => {
    const saved = localStorage.getItem('elite_remembered_password')
    return saved || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('elite_remember_me') === 'true'
  })
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showFirstAccessInfo, setShowFirstAccessInfo] = useState(!!projectId)
  
  // Estados para modal "Esqueci a senha"
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isSendingReset, setIsSendingReset] = useState(false)
  
  // Estados para modal "Solicitar Acesso"
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false)
  const [accessRequestData, setAccessRequestData] = useState({ name: '', email: '', phone: '', message: '' })
  const [isSendingRequest, setIsSendingRequest] = useState(false)
  
  // Estado para rate limiting
  const [rateLimitInfo, setRateLimitInfo] = useState(() => getRateLimitInfo(email || 'default'))
  
  // Atualizar rate limit info quando email mudar
  useEffect(() => {
    setRateLimitInfo(getRateLimitInfo(email || 'default'))
  }, [email])

  useEffect(() => {
    // Fade in animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      showNotification('Por favor, preencha todos os campos obrigatórios.', 'error')
      return
    }

    if (!isValidEmail(email)) {
      showNotification('Por favor, insira um email válido.', 'error')
      return
    }

    // Verificar rate limiting antes de tentar login
    const limitCheck = isRateLimited(email)
    if (limitCheck.limited) {
      showNotification(`Conta bloqueada por ${limitCheck.remainingTime} minutos devido a múltiplas tentativas falhas.`, 'error')
      setRateLimitInfo(getRateLimitInfo(email))
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      
      // Limpar rate limit após sucesso
      clearRateLimit(email)
      
      // Salvar credenciais se "Lembrar-me" estiver marcado
      if (rememberMe) {
        localStorage.setItem('elite_remembered_email', email)
        localStorage.setItem('elite_remembered_password', password)
        localStorage.setItem('elite_remember_me', 'true')
      } else {
        localStorage.removeItem('elite_remembered_email')
        localStorage.removeItem('elite_remembered_password')
        localStorage.setItem('elite_remember_me', 'false')
      }
      
      showNotification('Login realizado com sucesso! Redirecionando...', 'success')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch {
      // Registrar tentativa falha
      const result = recordLoginAttempt(email)
      setRateLimitInfo(getRateLimitInfo(email))
      
      if (!result.success) {
        showNotification(`Conta bloqueada por 30 minutos devido a múltiplas tentativas falhas.`, 'error')
      } else if (result.attemptsRemaining <= 2) {
        showNotification(`Credenciais inválidas. ${result.attemptsRemaining} tentativas restantes.`, 'error')
      } else {
        showNotification('Credenciais inválidas. Tente novamente.', 'error')
      }
      setIsLoading(false)
    }
  }
  
  // Handler para "Esqueci a senha"
  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      showNotification('Por favor, informe seu email.', 'error')
      return
    }
    
    if (!isValidEmail(forgotEmail)) {
      showNotification('Por favor, insira um email válido.', 'error')
      return
    }
    
    setIsSendingReset(true)
    
    try {
      if (requestPasswordReset) {
        await requestPasswordReset(forgotEmail)
      }
      showNotification('Instruções de recuperação enviadas para seu email!', 'success')
      setShowForgotPasswordModal(false)
      setForgotEmail('')
    } catch {
      showNotification('Erro ao enviar email. Verifique se o email está correto.', 'error')
    } finally {
      setIsSendingReset(false)
    }
  }
  
  // Handler para "Solicitar Acesso"
  const handleRequestAccess = async () => {
    if (!accessRequestData.name || !accessRequestData.email || !accessRequestData.phone) {
      showNotification('Por favor, preencha todos os campos obrigatórios.', 'error')
      return
    }
    
    if (!isValidEmail(accessRequestData.email)) {
      showNotification('Por favor, insira um email válido.', 'error')
      return
    }
    
    setIsSendingRequest(true)
    
    try {
      // Simular envio - em produção, seria uma chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500))
      showNotification('Solicitação enviada com sucesso! Entraremos em contato em breve.', 'success')
      setShowRequestAccessModal(false)
      setAccessRequestData({ name: '', email: '', phone: '', message: '' })
    } catch {
      showNotification('Erro ao enviar solicitação. Tente novamente.', 'error')
    } finally {
      setIsSendingRequest(false)
    }
  }

  return (
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden">

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg text-white max-w-sm transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          <div className="flex items-center space-x-3">
            <i className={notification.type === 'success' ? 'ri-check-circle-line' : 'ri-error-warning-line'}></i>
            <span className="text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Login Section */}
      <section className="login-bg flex items-center justify-center px-6 py-8">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full floating-animation opacity-60 luxury-glow"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-primary rounded-full floating-animation opacity-40 luxury-glow floating-particle-delay-2s"></div>
          <div className="absolute top-1/2 left-3/4 w-2.5 h-2.5 bg-primary rounded-full floating-animation opacity-50 luxury-glow floating-particle-delay-4s"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-primary rounded-full floating-animation opacity-30 luxury-glow floating-particle-delay-3s"></div>
          <div className="absolute bottom-1/3 left-[16.67%] w-2 h-2 bg-primary rounded-full floating-animation opacity-45 luxury-glow floating-particle-delay-5s"></div>
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 fade-in visible">
            <img src="/logo-elite.png" alt="Elite Blindagens" className="h-20 w-auto mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Acesso ao Sistema de Transparência</p>
          </div>

          {/* Login Form */}
          <div className="login-card rounded-3xl p-8 fade-in visible">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2 text-center">
                {showFirstAccessInfo ? 'Primeiro Acesso' : 'Bem-vindo de volta'}
              </h1>
              <p className="text-gray-400 text-center text-sm">
                {showFirstAccessInfo 
                  ? 'Use o email e senha temporária enviados para você' 
                  : 'Entre na sua conta para continuar'}
              </p>
            </div>

            {showFirstAccessInfo && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <i className="ri-information-line text-primary text-lg mt-0.5"></i>
                  <div className="text-sm">
                    <p className="text-white font-medium mb-1">Instruções de Primeiro Acesso:</p>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Digite o <strong>email</strong> cadastrado</li>
                      <li>• Use a <strong>senha temporária</strong> de 4 dígitos</li>
                      <li>• Você criará uma nova senha após o login</li>
                    </ul>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowFirstAccessInfo(false)}
                  className="mt-3 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Ocultar instruções
                </button>
              </div>
            )}

            {/* Aviso de Rate Limiting */}
            {rateLimitInfo.isLocked && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <i className="ri-error-warning-line text-red-500 text-lg mt-0.5"></i>
                  <div className="text-sm">
                    <p className="text-red-400 font-medium">Conta temporariamente bloqueada</p>
                    <p className="text-gray-400">Aguarde {rateLimitInfo.lockoutMinutes} minutos antes de tentar novamente.</p>
                  </div>
                </div>
              </div>
            )}

            {rateLimitInfo.attemptsUsed > 0 && !rateLimitInfo.isLocked && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <i className="ri-alert-line text-yellow-500"></i>
                  <span className="text-yellow-400">{rateLimitInfo.attemptsRemaining} tentativas restantes</span>
                </div>
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="email">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-user-line text-gray-400 text-sm"></i>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 input-focus text-sm outline-none"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="password">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-gray-400 text-sm"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-500 input-focus text-sm outline-none"
                    placeholder="Sua senha"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <i 
                      className={`${showPassword ? 'ri-eye-line' : 'ri-eye-off-line'} text-gray-400 text-sm cursor-pointer hover:text-primary transition-colors`}
                      onClick={() => setShowPassword(!showPassword)}
                    ></i>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input type="checkbox" id="remember" name="remember" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                  <label htmlFor="remember" className="flex items-center cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center mr-2 transition-colors ${rememberMe ? 'border-primary bg-primary/10' : 'border-white/30 hover:border-primary'}`}>
                      <i className={`ri-check-line text-xs text-primary transition-opacity ${rememberMe ? 'opacity-100' : 'opacity-0'}`}></i>
                    </div>
                    <span className="text-gray-300">Lembrar-me</span>
                  </label>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowForgotPasswordModal(true)} 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full gradient-gold text-black font-semibold py-3 rounded-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 whitespace-nowrap transform hover:scale-105 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Entrando...' : 'Entrar na Plataforma'}
              </button>

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-gray-400 text-sm">Ainda não tem uma conta? <button type="button" onClick={() => setShowRequestAccessModal(true)} className="text-primary hover:text-primary/80 transition-colors font-medium">Solicite acesso</button></p>
              </div>
            </form>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center fade-in visible">
            <div className="glass-effect cinematic-blur p-4 rounded-2xl">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <i className="ri-shield-check-line text-primary text-sm"></i>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Conexão Segura</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Seus dados são protegidos com criptografia de nível bancário e conformidade total com a LGPD
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Modal Esqueci a Senha */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-carbon-900 rounded-3xl p-6 max-w-md w-full border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Recuperar Senha</h3>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20"
                aria-label="Fechar modal"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-6">
              Digite seu email cadastrado e enviaremos as instruções para redefinir sua senha.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-primary"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleForgotPassword()}
                disabled={isSendingReset}
                className="flex-1 gradient-gold text-black py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {isSendingReset ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Solicitar Acesso */}
      {showRequestAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-carbon-900 rounded-3xl p-6 max-w-md w-full border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Solicitar Acesso</h3>
              <button
                onClick={() => setShowRequestAccessModal(false)}
                className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20"
                aria-label="Fechar modal"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-6">
              Preencha os dados abaixo e entraremos em contato para liberar seu acesso.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nome completo *</label>
                <input
                  type="text"
                  value={accessRequestData.name}
                  onChange={(e) => setAccessRequestData({ ...accessRequestData, name: e.target.value })}
                  placeholder="Seu nome"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={accessRequestData.email}
                  onChange={(e) => setAccessRequestData({ ...accessRequestData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Telefone/WhatsApp *</label>
                <input
                  type="tel"
                  value={accessRequestData.phone}
                  onChange={(e) => setAccessRequestData({ ...accessRequestData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Mensagem (opcional)</label>
                <textarea
                  value={accessRequestData.message}
                  onChange={(e) => setAccessRequestData({ ...accessRequestData, message: e.target.value })}
                  placeholder="Conte-nos sobre seu veículo ou como podemos ajudar..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestAccessModal(false)}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleRequestAccess()}
                disabled={isSendingRequest}
                className="flex-1 gradient-gold text-black py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {isSendingRequest ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
