import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronDown, Share2, Copy, CheckCircle, Plus, QrCode, Link2, MessageCircle, Phone
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useChat } from '../contexts/ChatContext'
import { useProjects } from '../contexts/ProjectContext'
import { cn } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'
import { getAppBaseUrl } from '../constants/companyInfo'
import type { Project } from '../types'

export function Dashboard() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const { totalUnreadCount: chatUnreadCount } = useChat()
  const { projects } = useProjects()

  // Filtrar projetos do usuário por ID ou email (fallback robusto)
  const userProjects = projects.filter(p => {
    const matchById = p.user.id === user?.id
    const matchByEmail = p.user.email?.toLowerCase() === user?.email?.toLowerCase()
    return matchById || matchByEmail
  })
  const [selectedProject, setSelectedProject] = useState<Project | null>(userProjects[0] || projects[0] || null)
  const [showVehicleSelector, setShowVehicleSelector] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [newVehicleLink, setNewVehicleLink] = useState('')
  const [linkError, setLinkError] = useState('')
  const [copied, setCopied] = useState(false)
  const [photoModal, setPhotoModal] = useState<{ src: string; alt: string } | null>(null)

  // Validação de dados do projeto
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <p className="text-white text-lg">Nenhum projeto encontrado</p>
          <p className="text-gray-400 text-sm mt-2">Entre em contato com a Elite Blindagens</p>
        </div>
      </div>
    )
  }

  // Informações de contato da empresa
  const companyInfo = {
    whatsapp: '5511913123071',
    phone: '(11) 9.1312-3071',
    whatsappDisplay: '(11) 9.1312-3071',
    name: 'Elite Blindagens'
  }

  useEffect(() => {
    const next = userProjects[0] || projects[0] || null
    if (next && next.id !== selectedProject?.id) {
      setSelectedProject(next)
    }
  }, [projects, userProjects, selectedProject?.id])

  // Fade in animation - deve vir antes do early return para manter ordem dos hooks
  useEffect(() => {
    if (!selectedProject) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [selectedProject])

  // Early return se não há projeto selecionado
  if (!selectedProject) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-carbon-900" : "bg-gray-50")}>
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Nenhum projeto encontrado</h2>
          <p className="text-gray-400 mb-4">Você ainda não tem veículos cadastrados.</p>
          <p className="text-sm text-gray-500">Entre em contato com a Elite Blindagens para iniciar seu acompanhamento.</p>
        </div>
      </div>
    )
  }

  const currentStep = selectedProject.timeline.find(step => step.status === 'in_progress')

  const qrCodeUrl = `${getAppBaseUrl()}/verify/${selectedProject.id}`

  const handleCopyQR = async () => {
    await navigator.clipboard.writeText(qrCodeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Blindagem ${selectedProject.vehicle.brand} ${selectedProject.vehicle.model}`,
        text: `Acompanhe a blindagem do meu veículo na Elite Blindagens`,
        url: qrCodeUrl,
      })
    } else {
      handleCopyQR()
    }
  }

  const handleAddVehicle = () => {
    setLinkError('')
    
    if (!newVehicleLink.trim()) {
      setLinkError('Por favor, insira o link ou código do projeto')
      return
    }

    // Extrair ID do projeto do link
    let projectId = newVehicleLink.trim()
    
    // Se for uma URL, extrair o ID
    if (projectId.includes('/verify/')) {
      const match = projectId.match(/\/verify\/([^/?]+)/)
      if (match) {
        projectId = match[1]
      }
    } else if (projectId.includes('PRJ-')) {
      // Já é um ID de projeto
      projectId = projectId.match(/PRJ-\d{4}-\d{3}/)?.[0] || projectId
    }

    // Verificar se o projeto existe
    const existingProject = projects.find(p => p.id === projectId)
    if (existingProject) {
      // Verificar se já está na lista do usuário
      if (userProjects.find(p => p.id === projectId)) {
        setLinkError('Este veículo já está cadastrado na sua conta')
        return
      }
      
      // Adicionar à lista (em produção, seria uma chamada API)
      setSelectedProject(existingProject)
      setShowAddVehicleModal(false)
      setNewVehicleLink('')
      // Aqui seria feita a associação do projeto ao usuário
    } else {
      setLinkError('Projeto não encontrado. Verifique o link ou código.')
    }
  }

  const openWhatsApp = () => {
    const message = encodeURIComponent(`Olá ${companyInfo.name}! Gostaria de informações sobre minha blindagem.`)
    window.open(`https://wa.me/${companyInfo.whatsapp}?text=${message}`, '_blank')
  }

  // Calculate days
  const startDate = new Date(selectedProject.startDate)
  const estimatedDate = new Date(selectedProject.estimatedDelivery)
  const today = new Date()
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, Math.floor((estimatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden min-h-screen">
      {/* Header */}
      <header className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <img src="/logo-elite.png" alt="Elite Blindagens" className="h-10 w-auto object-contain cursor-pointer" onClick={() => navigate('/dashboard')} />
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="md:hidden w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors"
                title="Perfil e Sair"
              >
                <i className="ri-logout-box-line text-red-400"></i>
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-400">{selectedProject.vehicle.brand} {selectedProject.vehicle.model}</div>
                </div>
                <div 
                  className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <i className="ri-user-line text-black text-sm"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Vehicle Selector for multiple vehicles */}
        {userProjects.length > 1 && (
          <div className="max-w-7xl mx-auto px-6 pt-4">
            <button
              onClick={() => setShowVehicleSelector(!showVehicleSelector)}
              className="w-full flex items-center justify-between p-3 rounded-xl glass-effect"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <img
                    src={selectedProject.vehicle.images[0]}
                    alt={selectedProject.vehicle.model}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">
                    {selectedProject.vehicle.brand} {selectedProject.vehicle.model}
                  </p>
                  <p className="text-xs text-gray-400">{selectedProject.vehicle.plate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedProject.status === 'completed' ? 'success' : 'info'} size="sm">
                  {selectedProject.progress}%
                </Badge>
                <ChevronDown className={cn('w-4 h-4 transition-transform text-primary', showVehicleSelector && 'rotate-180')} />
              </div>
            </button>

            {showVehicleSelector && (
              <div className="mt-2 space-y-2">
                {userProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project)
                      setShowVehicleSelector(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                      project.id === selectedProject.id
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-white/10 bg-white/5'
                    )}
                  >
                    <div className="w-12 h-10 rounded-lg overflow-hidden">
                      <img
                        src={project.vehicle.images[0]}
                        alt={project.vehicle.model}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{project.vehicle.brand} {project.vehicle.model}</p>
                      <p className="text-xs text-gray-400">{project.vehicle.plate} • {project.vehicle.blindingLevel}</p>
                    </div>
                    <Badge variant={project.status === 'completed' ? 'success' : 'info'} size="sm">
                      {project.progress}%
                    </Badge>
                  </button>
                ))}
                
                {/* Botão para adicionar novo veículo */}
                <button
                  onClick={() => {
                    setShowVehicleSelector(false)
                    setShowAddVehicleModal(true)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all"
                >
                  <div className="w-12 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-primary">Cadastrar Novo Veículo</p>
                    <p className="text-xs text-gray-400">Via QR Code ou link recebido</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hero Section with Car Photo */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80"></div>
          <img 
            src={selectedProject.vehicle.images[0]} 
            alt={`${selectedProject.vehicle.brand} ${selectedProject.vehicle.model}`}
            className="w-full h-96 object-cover object-center"
          />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-bold mb-4 fade-in visible">
                  Blindagem {selectedProject.vehicle.brand} {selectedProject.vehicle.model}
                </h1>
                <div className="flex items-center space-x-4 fade-in visible">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary rounded-full luxury-glow"></div>
                    <span className="text-primary font-semibold">
                      {selectedProject.status === 'completed' ? 'Concluído' : 
                       selectedProject.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                    </span>
                  </div>
                  <div className="text-gray-300">•</div>
                  <span className="text-gray-300">Iniciado em {new Date(selectedProject.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Progress Overview */}
                <div className="glass-effect cinematic-blur p-8 rounded-3xl fade-in visible">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Progresso da Blindagem</h2>
                    <div className="text-primary text-3xl font-bold">{selectedProject.progress}%</div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-white/10 rounded-full h-4 mb-6">
                      <div 
                        className="progress-bar-fill h-4 rounded-full transition-all duration-1000"
                        data-progress={Math.round(selectedProject.progress / 5) * 5}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">{daysElapsed}</div>
                        <div className="text-sm text-gray-400">Dias decorridos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">{daysRemaining}</div>
                        <div className="text-sm text-gray-400">Dias restantes</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mt-6">
                    <div className="flex items-center space-x-3">
                      <i className="ri-calendar-line text-primary text-lg"></i>
                      <div>
                        <div className="font-semibold">Previsão de Entrega</div>
                        <div className="text-primary text-lg font-bold">
                          {new Date(selectedProject.estimatedDelivery).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="glass-effect cinematic-blur p-8 rounded-3xl fade-in visible">
                  <h2 className="text-2xl font-bold mb-6">Linha do Tempo</h2>
                  <div className="space-y-6">
                    {selectedProject.timeline.map((step) => (
                      <div key={step.id} className={cn("flex items-start space-x-4", step.status === 'pending' && "opacity-50")}>
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          step.status === 'completed' ? "bg-primary luxury-glow" :
                          step.status === 'in_progress' ? "bg-primary luxury-glow animate-pulse" :
                          "bg-white/20"
                        )}>
                          {step.status === 'completed' ? (
                            <i className="ri-check-line text-black text-sm"></i>
                          ) : step.status === 'in_progress' ? (
                            <i className="ri-settings-line text-black text-sm"></i>
                          ) : (
                            <i className="ri-time-line text-gray-400 text-sm"></i>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={cn("font-semibold", step.status === 'pending' && "text-gray-500")}>{step.title}</h3>
                            <span className={cn(
                              "text-xs",
                              step.status === 'in_progress' ? "text-primary" : 
                              step.status === 'pending' ? "text-gray-500" : "text-gray-400"
                            )}>
                              {step.status === 'in_progress' ? 'Em andamento' : 
                               step.status === 'pending' ? 'Pendente' : 
                               step.date ? new Date(step.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                            </span>
                          </div>
                          <p className={cn("text-sm", step.status === 'pending' ? "text-gray-500" : "text-gray-400")}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latest Photos */}
                <div className="glass-effect cinematic-blur p-8 rounded-3xl fade-in visible">
                  <h2 className="text-2xl font-bold mb-6">Últimas Fotos da Equipe</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProject.vehicle.images.slice(0, 4).map((image, index) => (
                      <div 
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => setPhotoModal({ src: image, alt: `Foto ${index + 1}` })}
                      >
                        <img 
                          src={image} 
                          alt={`Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-2xl transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl"></div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="text-xs text-white font-medium">Etapa {index + 1}</div>
                          <div className="text-xs text-gray-300">
                            {new Date(selectedProject.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => navigate('/gallery')}
                    className="w-full mt-4 border border-primary/30 text-primary hover:bg-primary/10 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Ver Todas as Fotos
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status Card */}
                <div className="glass-effect cinematic-blur p-6 rounded-3xl fade-in visible">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <i className="ri-shield-check-line text-primary text-lg"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold">Status Atual</h3>
                      <p className="text-primary text-sm">
                        {selectedProject.status === 'completed' ? 'Blindagem Concluída' : 
                         selectedProject.status === 'in_progress' ? 'Blindagem em Andamento' : 'Aguardando Início'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Nível</span>
                      <span className="text-white font-medium">{selectedProject.vehicle.blindingLevel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Placa</span>
                      <span className="text-white font-medium">{selectedProject.vehicle.plate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Etapa Atual</span>
                      <span className="text-white font-medium">{currentStep?.title || 'Concluído'}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Card */}
                <div className="glass-effect cinematic-blur p-6 rounded-3xl fade-in visible">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <i className="ri-qr-code-line text-primary text-lg"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold">QR Code EliteTrace™</h3>
                      <p className="text-gray-400 text-sm">Compartilhe o progresso</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeUrl)}&color=D4AF37`}
                      alt="QR Code"
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="w-full gradient-gold text-black font-semibold py-2 rounded-lg transition-all"
                  >
                    Ver QR Code Completo
                  </button>
                </div>

                {/* Notifications */}
                <div className="glass-effect cinematic-blur p-6 rounded-3xl fade-in visible">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Notificações</h3>
                    {unreadCount > 0 && (
                      <div className="bg-primary text-black text-xs px-2 py-1 rounded-full font-semibold">{unreadCount}</div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {notifications.slice(0, 3).map((notification) => (
                      <div 
                        key={notification.id}
                        className="flex items-start space-x-3 cursor-pointer"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          !notification.read ? "bg-primary luxury-glow" :
                          notification.type === 'success' ? "bg-green-400" :
                          notification.type === 'info' ? "bg-blue-400" : "bg-gray-400"
                        )}></div>
                        <div>
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-gray-400">
                            {notification.message.substring(0, 40)}... • {new Date(notification.timestamp).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="w-full mt-4 text-primary hover:bg-primary/10 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    Ver Todas
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="glass-effect cinematic-blur p-6 rounded-3xl fade-in visible">
                  <h3 className="font-semibold mb-4">Ações Rápidas</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={openWhatsApp}
                      className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp {companyInfo.whatsappDisplay}
                    </button>
                    <button 
                      onClick={() => window.open(`tel:${companyInfo.phone.replace(/\D/g, '')}`, '_self')}
                      className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Ligar {companyInfo.phone}
                    </button>
                    <button 
                      onClick={() => navigate('/chat')}
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <i className="ri-chat-3-line mr-2"></i>Chat Interno
                      {chatUnreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{chatUnreadCount}</span>
                      )}
                    </button>
                    <button 
                      onClick={() => navigate('/elite-card')}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <i className="ri-vip-crown-line mr-2 text-primary"></i>Cartão Elite
                    </button>
                    <button 
                      onClick={() => navigate('/laudo')}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <i className="ri-file-shield-line mr-2"></i>Laudo EliteShield
                    </button>
                    <button 
                      onClick={() => navigate('/revisoes')}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <i className="ri-calendar-check-line mr-2"></i>Revisões
                    </button>
                    {selectedProject.status === 'completed' && (
                      <button 
                        onClick={() => navigate('/entrega')}
                        className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                      >
                        <i className="ri-gift-line mr-2"></i>Ver Entrega
                      </button>
                    )}
                    <button 
                      onClick={() => navigate('/timeline')}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <i className="ri-time-line mr-2"></i>Ver Timeline
                    </button>
                    <button 
                      onClick={() => navigate('/achievements')}
                      className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <i className="ri-trophy-line mr-2"></i>Conquistas
                    </button>
                    <button 
                      onClick={() => navigate('/documents')}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <i className="ri-folder-line mr-2"></i>Meus Documentos
                    </button>
                    <button 
                      onClick={() => navigate('/quotes')}
                      className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                    >
                      <i className="ri-calculator-line mr-2"></i>Solicitar Orçamento
                    </button>
                  </div>
                </div>

                {/* Elite Rescue Card */}
                <div className="glass-effect cinematic-blur p-6 rounded-3xl fade-in visible border border-red-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                      <i className="ri-truck-line text-red-500 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold">Elite Rescue</h3>
                      <p className="text-gray-400 text-xs">Guincho 24/7</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Assistência emergencial exclusiva para membros Elite.</p>
                  <button 
                    onClick={() => navigate('/elite-card')}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 py-3 rounded-lg transition-colors text-sm whitespace-nowrap flex items-center justify-center"
                  >
                    <i className="ri-phone-line mr-2"></i>0800-ELITE-SOS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="QR Code EliteTrace™"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="p-4 bg-white rounded-2xl inline-block mx-auto">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}&color=D4AF37`}
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>
          
          <div>
            <p className="font-semibold">{selectedProject.vehicle.brand} {selectedProject.vehicle.model}</p>
            <p className="text-caption text-gray-400">{selectedProject.vehicle.plate}</p>
          </div>

          <div className={cn(
            'p-3 rounded-xl flex items-center gap-2',
            isDark ? 'bg-carbon-700/50' : 'bg-gray-100'
          )}>
            <input
              type="text"
              value={qrCodeUrl}
              readOnly
              className="flex-1 bg-transparent text-sm font-mono truncate outline-none"
              aria-label="URL do QR Code"
              title="URL do QR Code"
            />
            <Button variant="ghost" size="sm" onClick={handleCopyQR}>
              {copied ? <CheckCircle className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            <Button className="flex-1" onClick={() => window.open(qrCodeUrl, '_blank')}>
              Abrir Link
            </Button>
          </div>

          <div className={cn(
            'p-3 rounded-xl border',
            isDark ? 'bg-gold/5 border-gold/20' : 'bg-gold/10 border-gold/30'
          )}>
            <p className="text-micro text-gold font-medium flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              QR Code único e permanente deste veículo
            </p>
          </div>
          <p className="text-micro text-gray-400">
            Este código contém todo o histórico de blindagem e não pode ser alterado
          </p>
        </div>
      </Modal>

      {/* Modal para Adicionar Novo Veículo */}
      <Modal
        isOpen={showAddVehicleModal}
        onClose={() => {
          setShowAddVehicleModal(false)
          setNewVehicleLink('')
          setLinkError('')
        }}
        title="Cadastrar Novo Veículo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Cole o link ou código do projeto que você recebeu via WhatsApp ou e-mail do executor.
          </p>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Link ou Código do Projeto</label>
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-xl border',
              isDark ? 'bg-carbon-700/50 border-white/10' : 'bg-gray-100 border-gray-200'
            )}>
              <Link2 className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={newVehicleLink}
                onChange={(e) => {
                  setNewVehicleLink(e.target.value)
                  setLinkError('')
                }}
                placeholder="Ex: https://elitetrack.com/verify/PRJ-2025-001"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {linkError && (
              <p className="text-sm text-red-400">{linkError}</p>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/30">
            <QrCode className="w-5 h-5 text-primary" />
            <p className="text-sm text-primary">
              Você também pode escanear o QR Code enviado pelo executor
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setShowAddVehicleModal(false)
                setNewVehicleLink('')
                setLinkError('')
              }}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleAddVehicle}>
              Cadastrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Photo Modal */}
      {photoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPhotoModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img src={photoModal.src} alt={photoModal.alt} className="w-full h-full object-contain rounded-2xl" />
            <button 
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={() => setPhotoModal(null)}
              title="Fechar"
              aria-label="Fechar visualização de foto"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
