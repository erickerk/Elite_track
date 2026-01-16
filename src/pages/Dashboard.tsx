import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronDown, Share2, Copy, CheckCircle, Plus, QrCode, Link2, MessageCircle, Calendar, Clock, Shield
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
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
          <p className="text-sm text-gray-500 mb-6">Entre em contato com a Elite Blindagens para iniciar seu acompanhamento.</p>
          <a
            href="https://wa.me/5511913123071?text=Ol%C3%A1%20Elite%20Blindagens!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20blindagem."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Falar no WhatsApp
          </a>
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
        <section className="relative overflow-hidden h-[300px] sm:h-[400px] md:h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/90 z-10"></div>
          <img 
            src={selectedProject.vehicle.images[0]} 
            alt={`${selectedProject.vehicle.brand} ${selectedProject.vehicle.model}`}
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 flex items-end sm:items-center z-20 pb-8 sm:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
              <div className="max-w-2xl">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-4 fade-in visible tracking-tight leading-tight">
                  {selectedProject.vehicle.brand} <span className="text-primary">{selectedProject.vehicle.model}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 fade-in visible">
                  <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-primary/20">
                    <div className="w-2 h-2 bg-primary rounded-full luxury-glow animate-pulse"></div>
                    <span className="text-primary text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      {selectedProject.status === 'completed' ? 'Concluído' : 
                       selectedProject.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                    </span>
                  </div>
                  <span className="text-gray-300 text-xs sm:text-sm bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    Iniciado {new Date(selectedProject.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
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
                <div className="glass-effect cinematic-blur p-5 sm:p-8 rounded-2xl sm:rounded-3xl fade-in visible border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold">Progresso</h2>
                      <p className="text-xs sm:text-sm text-gray-400">Status real-time da blindagem</p>
                    </div>
                    <div className="text-primary text-2xl sm:text-4xl font-bold tabular-nums">{selectedProject.progress}%</div>
                  </div>
                  <div className="relative">
                      <div className="w-full bg-white/5 rounded-full h-2 sm:h-4 mb-6 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(212,175,55,0.3)] bg-primary",
                            selectedProject.progress === 0 && "w-0",
                            selectedProject.progress > 0 && selectedProject.progress <= 5 && "w-[5%]",
                            selectedProject.progress > 5 && selectedProject.progress <= 10 && "w-[10%]",
                            selectedProject.progress > 10 && selectedProject.progress <= 20 && "w-[20%]",
                            selectedProject.progress > 20 && selectedProject.progress <= 30 && "w-[30%]",
                            selectedProject.progress > 30 && selectedProject.progress <= 40 && "w-[40%]",
                            selectedProject.progress > 40 && selectedProject.progress <= 50 && "w-[50%]",
                            selectedProject.progress > 50 && selectedProject.progress <= 60 && "w-[60%]",
                            selectedProject.progress > 60 && selectedProject.progress <= 70 && "w-[70%]",
                            selectedProject.progress > 70 && selectedProject.progress <= 80 && "w-[80%]",
                            selectedProject.progress > 80 && selectedProject.progress <= 90 && "w-[90%]",
                            selectedProject.progress > 90 && "w-full"
                          )}
                        />
                      </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-white/5 p-3 sm:p-4 rounded-xl border border-white/5 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-primary mb-0.5">{daysElapsed}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest">Dias Decorridos</div>
                      </div>
                      <div className="bg-white/5 p-3 sm:p-4 rounded-xl border border-white/5 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-white mb-0.5">{daysRemaining}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest">Dias Restantes</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl sm:rounded-2xl p-4 mt-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs text-primary/70 uppercase tracking-widest font-bold">Previsão de Entrega</div>
                        <div className="text-sm sm:text-lg font-bold text-white">
                          {new Date(selectedProject.estimatedDelivery).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="glass-effect cinematic-blur p-5 sm:p-8 rounded-2xl sm:rounded-3xl fade-in visible border border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white">Linha do Tempo</h2>
                      <p className="text-xs sm:text-sm text-gray-400">Rastreamento etapa por etapa</p>
                    </div>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 sm:before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
                    {selectedProject.timeline.map((step) => (
                      <div key={step.id} className={cn(
                        "relative flex items-center justify-between group",
                        step.status === 'pending' && "opacity-40"
                      )}>
                        <div className="flex items-center w-full">
                          {/* Indicator */}
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-500 z-10",
                            step.status === 'completed' ? "bg-primary border-primary luxury-glow" :
                            step.status === 'in_progress' ? "bg-black border-primary luxury-glow animate-pulse" :
                            "bg-black border-white/20"
                          )}>
                            {step.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                            ) : step.status === 'in_progress' ? (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full" />
                            ) : (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/20 rounded-full" />
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 ml-4 sm:ml-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h3 className={cn(
                                "text-sm sm:text-lg font-bold tracking-tight transition-colors",
                                step.status === 'in_progress' ? "text-primary" : "text-white"
                              )}>
                                {step.title}
                              </h3>
                              <time className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded sm:bg-transparent sm:px-0">
                                {step.status === 'in_progress' ? 'Em andamento' : 
                                 step.status === 'pending' ? 'Pendente' : 
                                 step.date ? new Date(step.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                              </time>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latest Photos */}
                <div className="glass-effect cinematic-blur p-5 sm:p-8 rounded-2xl sm:rounded-3xl fade-in visible border border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-white">Registros</h2>
                      <p className="text-xs sm:text-sm text-gray-400">Evidências técnicas da execução</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/gallery')}
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-all text-xs sm:text-sm h-8 px-3"
                    >
                      Ver Tudo
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
                    {selectedProject.vehicle.images.slice(0, 4).map((image, index) => (
                      <div 
                        key={index}
                        className="relative aspect-square group cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl border border-white/5"
                        onClick={() => setPhotoModal({ src: image, alt: `Registro ${index + 1}` })}
                      >
                        <img 
                          src={image} 
                          alt={`Registro ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        <div className="absolute bottom-3 left-3 right-3 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                          <div className="text-[10px] sm:text-xs text-primary font-bold uppercase tracking-widest">Etapa {index + 1}</div>
                          <div className="text-[9px] sm:text-[11px] text-gray-300 font-medium">
                            {new Date(selectedProject.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar / Quick Actions Container */}
              <div className="space-y-6">
                {/* Status Card - Mobile: Horizontal Layout */}
                <div className="glass-effect cinematic-blur p-5 sm:p-6 rounded-2xl sm:rounded-3xl fade-in visible border border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Status do Veículo</h3>
                      <p className="text-[10px] sm:text-xs text-primary font-bold uppercase tracking-widest mt-0.5">
                        {selectedProject.status === 'completed' ? 'Blindagem Concluída' : 
                         selectedProject.status === 'in_progress' ? 'Em Execução' : 'Aguardando Início'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5">
                    <div className="text-center">
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Nível</p>
                      <p className="text-xs font-bold text-white mt-1">{selectedProject.vehicle.blindingLevel}</p>
                    </div>
                    <div className="text-center border-x border-white/5 px-2">
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Placa</p>
                      <p className="text-xs font-bold text-white mt-1">{selectedProject.vehicle.plate}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Etapa</p>
                      <p className="text-xs font-bold text-white mt-1 truncate">{currentStep?.title || 'Fim'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Mobile: Optimized Grid */}
                <div className="glass-effect cinematic-blur p-5 sm:p-6 rounded-2xl sm:rounded-3xl fade-in visible border border-white/5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-white tracking-tight">Ações Rápidas</h3>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <i className="ri-flashlight-line text-primary text-sm"></i>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-col sm:gap-3">
                    <button 
                      onClick={openWhatsApp}
                      className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider">WhatsApp</span>
                    </button>
                    <button 
                      onClick={() => navigate('/chat')}
                      className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all"
                    >
                      <div className="relative">
                        <i className="ri-chat-3-line text-lg"></i>
                        {chatUnreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border border-black">
                            {chatUnreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider">Mensagens</span>
                    </button>
                    <button 
                      onClick={() => navigate('/laudo')}
                      className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all"
                    >
                      <i className="ri-file-shield-line text-lg text-primary"></i>
                      <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider">Laudo</span>
                    </button>
                    <button 
                      onClick={() => navigate('/elite-card')}
                      className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all"
                    >
                      <i className="ri-vip-crown-line text-lg text-primary"></i>
                      <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider">Elite Card</span>
                    </button>
                  </div>
                </div>

                {/* QR Code Card - Mobile: Compact and Centralized */}
                <div className="glass-effect cinematic-blur p-5 rounded-2xl sm:rounded-3xl fade-in visible border border-white/5 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                      <QrCode className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">EliteTrace™ QR</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-4">Acesso público ao histórico</p>
                    
                    <div className="p-3 bg-white rounded-2xl mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrCodeUrl)}&color=D4AF37`}
                        alt="QR Code"
                        className="w-24 h-24 sm:w-32 sm:h-32"
                      />
                    </div>
                    
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="w-full py-3 bg-primary text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                    >
                      Expandir Código
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
