import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Login.css'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showFirstAccessInfo, setShowFirstAccessInfo] = useState(!!projectId)

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

    setIsLoading(true)

    try {
      await login(email, password)
      showNotification('Login realizado com sucesso! Redirecionando...', 'success')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch {
      showNotification('Credenciais inválidas. Tente novamente.', 'error')
      setIsLoading(false)
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

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">Esqueci minha senha</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full gradient-gold text-black font-semibold py-3 rounded-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 whitespace-nowrap transform hover:scale-105 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Entrando...' : 'Entrar na Plataforma'}
              </button>

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-gray-400 text-sm">Ainda não tem uma conta? <a href="#" className="text-primary hover:text-primary/80 transition-colors">Solicite acesso</a></p>
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
    </div>
  )
}
