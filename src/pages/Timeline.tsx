import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useProjects } from '../contexts/ProjectContext'
import { cn } from '../lib/utils'
import type { TimelineStep } from '../types'

// Icon mapping for timeline steps
const stepIcons: Record<string, string> = {
  'Recebimento do Veículo': 'ri-clipboard-line',
  'Liberação do Exército': 'ri-file-shield-line',
  'Desmontagem': 'ri-tools-line',
  'Instalação de Blindagem': 'ri-shield-line',
  'Instalação dos Vidros Blindados': 'ri-window-line',
  'Vidros Blindados': 'ri-window-line',
  'Instalação da Manta Opaca': 'ri-shield-line',
  'Montagem Final': 'ri-settings-3-line',
  'Remontagem': 'ri-settings-3-line',
  'Acabamento': 'ri-brush-line',
  'Testes e Qualidade': 'ri-test-tube-line',
  'Vistoria': 'ri-search-eye-line',
  'Laudo EliteShield': 'ri-file-shield-line',
  'Testes': 'ri-test-tube-line',
  'Higienização': 'ri-bubble-chart-line',
  'Entrega': 'ri-car-line',
  'Pronto para Entrega': 'ri-car-line',
}

export function Timeline() {
  const { user } = useAuth()
  const { projects: allProjects } = useProjects()
  
  const userProjects = allProjects.filter(p => p.user.id === user?.id || p.user.email === user?.email)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const project = selectedProjectId 
    ? userProjects.find(p => p.id === selectedProjectId) || userProjects[0] || allProjects[0]
    : userProjects[0] || allProjects[0]
  
  const [selectedStep, setSelectedStep] = useState<TimelineStep | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const completedSteps = project.timeline.filter(s => s.status === 'completed').length
  const totalSteps = project.timeline.length

  // Calculate days remaining
  const estimatedDate = new Date(project.estimatedDelivery)
  const today = new Date()
  const daysRemaining = Math.max(0, Math.floor((estimatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  // Fade in animation
  useEffect(() => {
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

  const getStepIcon = (title: string) => {
    return stepIcons[title] || 'ri-checkbox-circle-line'
  }

  const openStepModal = (step: TimelineStep) => {
    setSelectedStep(step)
  }

  const closeStepModal = () => {
    setSelectedStep(null)
  }

  const openPhotoModal = (photos: string[], index: number = 0) => {
    setSelectedPhotos(photos)
    setCurrentPhotoIndex(index)
  }

  const closePhotoModal = () => {
    setSelectedPhotos(null)
    setCurrentPhotoIndex(0)
  }

  const nextPhoto = () => {
    if (selectedPhotos) {
      setCurrentPhotoIndex((prev) => (prev + 1) % selectedPhotos.length)
    }
  }

  const prevPhoto = () => {
    if (selectedPhotos) {
      setCurrentPhotoIndex((prev) => (prev - 1 + selectedPhotos.length) % selectedPhotos.length)
    }
  }

  return (
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden min-h-screen">
      <style>{`
        .timeline-step:hover .step-preview { opacity: 1; visibility: visible; }
        .step-preview { opacity: 0; visibility: hidden; transition: all 0.3s ease; }
      `}</style>

      {/* Main Content — Header fornecido pelo MobileLayout via Layout wrapper */}
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Hero Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 fade-in visible">
              <h1 className="text-4xl font-bold mb-4">Timeline Completa da Blindagem</h1>
              
              {/* Seletor de Veículos - Visível quando há múltiplos carros */}
              {userProjects.length > 1 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3">Você possui {userProjects.length} veículos em processo. Selecione para ver a timeline:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {userProjects.map((proj) => (
                      <button
                        key={proj.id}
                        onClick={() => setSelectedProjectId(proj.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                          project.id === proj.id
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-white/20 bg-white/5 text-white hover:border-primary/50"
                        )}
                      >
                        <img 
                          src={proj.vehicle.images[0]} 
                          alt={proj.vehicle.model}
                          className="w-12 h-8 object-cover rounded-lg"
                        />
                        <div className="text-left">
                          <p className="font-semibold text-sm">{proj.vehicle.brand} {proj.vehicle.model}</p>
                          <p className="text-xs text-gray-400">{proj.vehicle.plate} • {proj.progress}%</p>
                        </div>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          proj.status === 'completed' ? "bg-green-500" :
                          proj.status === 'in_progress' ? "bg-primary animate-pulse" : "bg-gray-500"
                        )} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-gray-400 text-lg">
                {project.vehicle.brand} {project.vehicle.model} • {project.vehicle.blindingLevel} • Iniciado em {new Date(project.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <div className="flex items-center justify-center space-x-4 mt-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full luxury-glow"></div>
                  <span className="text-primary font-semibold">
                    {project.status === 'completed' ? 'Concluído' : 'Em Andamento'}
                  </span>
                </div>
                <div className="text-gray-300">•</div>
                <span className="text-white">{project.progress}% Concluído</span>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Vehicle Section */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="glass-effect cinematic-blur rounded-3xl p-8 fade-in visible">
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2">
                  <img 
                    src={project.vehicle.images[0]} 
                    alt={`${project.vehicle.brand} ${project.vehicle.model} em processo de blindagem`}
                    className="w-full h-80 object-cover rounded-3xl"
                  />
                </div>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <div className="text-4xl font-bold text-primary">{project.progress}%</div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Progresso Geral</h3>
                    <p className="text-gray-400">{completedSteps} de {totalSteps} etapas concluídas</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <i className="ri-calendar-line text-primary"></i>
                      <span className="text-primary font-semibold">Previsão de Entrega</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {new Date(project.estimatedDelivery).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-400">{daysRemaining} dias restantes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Production Line */}
        <section className="pb-12">
          <div className="max-w-[95%] xl:max-w-[1600px] mx-auto px-4 md:px-8">
            <div className="relative glass-effect cinematic-blur p-6 md:p-10 rounded-3xl fade-in visible border border-primary/20 shadow-2xl shadow-primary/5 overflow-hidden">
              {/* Background decorations */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
              
              <div className="relative z-10 text-center mb-12">
                <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-full px-6 py-3 mb-6 backdrop-blur-sm">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <i className="ri-shield-star-line text-primary text-lg"></i>
                  <span className="text-primary text-sm font-bold tracking-wider">PRODUÇÃO PREMIUM</span>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent drop-shadow-lg">
                  Linha de Produção EliteTrack™
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Acompanhe cada etapa do processo de blindagem do seu veículo em tempo real
                </p>
                <div className="flex items-center justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50"></div>
                    <span className="text-sm text-gray-400">Concluído</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50"></div>
                    <span className="text-sm text-gray-400">Em andamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                    <span className="text-sm text-gray-400">Pendente</span>
                  </div>
                </div>
              </div>

              {/* Timeline Container - Estilo LandingPage */}
              <div className="relative">
                {/* Lista Vertical de Etapas */}
                <div className="space-y-4 max-w-3xl mx-auto">
                  {project.timeline.map((step) => (
                    <div 
                      key={step.id}
                      onClick={() => openStepModal(step)}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]",
                        step.status === 'pending' ? "opacity-50" : "",
                        step.status === 'in_progress' ? "bg-primary/10 border border-primary/30" : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      {/* Ícone do Status */}
                      <div className={cn(
                        "w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all",
                        step.status === 'completed' 
                          ? "bg-green-500" 
                          : step.status === 'in_progress' 
                            ? "bg-primary animate-pulse" 
                            : "border-2 border-gray-600"
                      )}>
                        {step.status === 'completed' ? (
                          <i className="ri-check-line text-white text-lg"></i>
                        ) : step.status === 'in_progress' ? (
                          <i className={cn(getStepIcon(step.title), "text-black text-lg")}></i>
                        ) : (
                          <i className={cn(getStepIcon(step.title), "text-gray-600 text-lg")}></i>
                        )}
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-semibold text-base break-words",
                          step.status === 'in_progress' ? "text-primary" : 
                          step.status === 'pending' ? "text-gray-400" : "text-white"
                        )}>
                          {step.title}
                        </h4>
                        <p className="text-sm text-gray-400 break-words leading-relaxed">{step.description}</p>
                        {step.status === 'in_progress' && (
                          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all duration-1000" />
                          </div>
                        )}
                      </div>
                      
                      {/* Data/Status */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-medium",
                            step.status === 'completed' ? "text-green-400" :
                            step.status === 'in_progress' ? "text-primary" :
                            "text-gray-500"
                          )}>
                            {step.status === 'completed' ? 'Concluído' :
                             step.status === 'in_progress' ? 'Em andamento' : 'Aguardando'}
                          </span>
                          <i className="ri-arrow-right-s-line text-gray-400 text-xl sm:hidden"></i>
                        </div>
                        <p className="text-xs text-gray-500">
                          {step.date ? new Date(step.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 
                           step.estimatedDate ? new Date(step.estimatedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                        </p>
                      </div>
                      
                      {/* Seta para detalhes */}
                      <div className="hidden sm:flex flex-shrink-0">
                        <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fotos da Etapa Atual (se houver) */}
                {project.timeline.find(s => s.status === 'in_progress')?.photos && 
                 project.timeline.find(s => s.status === 'in_progress')!.photos.length > 0 && (
                  <div className="mt-8 max-w-3xl mx-auto">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <i className="ri-camera-line text-primary"></i>
                      Fotos da Etapa Atual
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {project.timeline.find(s => s.status === 'in_progress')!.photos.slice(0, 4).map((photo, idx) => (
                        <div 
                          key={idx}
                          className="relative group cursor-pointer rounded-xl overflow-hidden aspect-square"
                          onClick={() => openPhotoModal(project.timeline.find(s => s.status === 'in_progress')!.photos, idx)}
                        >
                          <img 
                            src={photo} 
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <i className="ri-zoom-in-line text-white text-2xl"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Stats - Premium Cards */}
              <div className="relative z-10 mt-12 grid grid-cols-3 gap-4 md:gap-6">
                <div className="group text-center bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-primary/30 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <i className="ri-checkbox-circle-line text-2xl text-primary"></i>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white">{completedSteps}<span className="text-gray-500">/{totalSteps}</span></div>
                  <div className="text-sm text-gray-400 mt-1">Etapas Concluídas</div>
                </div>
                <div className="group text-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                  <div className="w-12 h-12 mx-auto mb-3 bg-primary/20 rounded-xl flex items-center justify-center">
                    <i className="ri-pie-chart-line text-2xl text-primary"></i>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">{project.progress}%</div>
                  <div className="text-sm text-gray-400 mt-1">Progresso Total</div>
                </div>
                <div className="group text-center bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-primary/30 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <i className="ri-calendar-check-line text-2xl text-primary"></i>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white">{daysRemaining} <span className="text-lg text-gray-500">dias</span></div>
                  <div className="text-sm text-gray-400 mt-1">Para Conclusão</div>
                </div>
              </div>

              {/* Click hint */}
              <div className="text-center mt-6">
                <p className="text-xs text-gray-500 inline-flex items-center gap-2">
                  <i className="ri-cursor-line"></i>
                  Clique em uma etapa para ver detalhes e fotos
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Step Detail Modal */}
      <Modal
        isOpen={!!selectedStep}
        onClose={closeStepModal}
        title={selectedStep?.title || ''}
        size="lg"
      >
        {selectedStep && (
          <div>
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  selectedStep.status === 'completed' ? "bg-primary luxury-glow" :
                  selectedStep.status === 'in_progress' ? "bg-primary animate-pulse" :
                  "bg-gray-400"
                )}></div>
                <span className={cn(
                  "font-semibold",
                  selectedStep.status === 'pending' ? "text-gray-400" : "text-primary"
                )}>
                  {selectedStep.status === 'completed' ? `Concluído em ${selectedStep.date ? new Date(selectedStep.date).toLocaleDateString('pt-BR') : ''}` :
                   selectedStep.status === 'in_progress' ? 'Em Andamento' : 'Aguardando Início'}
                </span>
              </div>
              <p className="text-gray-400">{selectedStep.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Photos */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Fotos da Etapa</h3>
                {selectedStep.photos.length > 0 ? (
                  <div className="space-y-4">
                    {selectedStep.photos.map((photo, index) => (
                      <div 
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => openPhotoModal(selectedStep.photos, index)}
                      >
                        <img 
                          src={photo} 
                          alt={`${selectedStep.title} - Foto ${index + 1}`}
                          className="w-full h-48 object-cover rounded-2xl transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl"></div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="text-sm text-white font-medium">{selectedStep.title}</div>
                          <div className="text-xs text-gray-300">
                            {selectedStep.date ? new Date(selectedStep.date).toLocaleDateString('pt-BR') : 'Em andamento'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/5 rounded-2xl">
                    <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <i className="ri-time-line text-3xl text-gray-400"></i>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-400 mb-2">Sem fotos disponíveis</h4>
                    <p className="text-gray-500 text-sm">Fotos serão adicionadas quando a etapa for iniciada.</p>
                  </div>
                )}
              </div>

              {/* Observations */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Observações Técnicas</h3>
                {selectedStep.notes || selectedStep.technician ? (
                  <div className="space-y-3">
                    {selectedStep.technician && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <p className="text-gray-300">Técnico responsável: {selectedStep.technician}</p>
                      </div>
                    )}
                    {selectedStep.notes && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <p className="text-gray-300">{selectedStep.notes}</p>
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <p className="text-gray-300">
                        Status: {selectedStep.status === 'completed' ? 'Etapa concluída com sucesso' :
                                selectedStep.status === 'in_progress' ? 'Trabalho em andamento' : 'Aguardando etapas anteriores'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/5 rounded-2xl">
                    <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <i className="ri-file-text-line text-3xl text-gray-400"></i>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-400 mb-2">Sem observações ainda</h4>
                    <p className="text-gray-500 text-sm">Observações serão adicionadas durante o processo.</p>
                  </div>
                )}

                {selectedStep.status === 'pending' && (
                  <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <i className="ri-calendar-line text-primary"></i>
                      <span className="text-primary font-semibold">Previsão de Início</span>
                    </div>
                    <div className="text-2xl font-bold mt-2 text-center">
                      {selectedStep.estimatedDate ? new Date(selectedStep.estimatedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'A definir'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Photo Gallery Modal */}
      {selectedPhotos && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closePhotoModal}
        >
          <div className="relative max-w-5xl max-h-[90vh] p-4" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedPhotos[currentPhotoIndex]} 
              alt={`Foto ${currentPhotoIndex + 1}`}
              className="w-full h-full object-contain rounded-2xl max-h-[80vh]"
            />
            
            {selectedPhotos.length > 1 && (
              <>
                <button 
                  onClick={prevPhoto}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                  title="Foto anterior"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextPhoto}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                  title="Próxima foto"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <button 
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={closePhotoModal}
              title="Fechar"
              aria-label="Fechar visualização"
            >
              <i className="ri-close-line text-lg"></i>
            </button>

            <div className="absolute bottom-6 left-6 right-6 text-center">
              <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4 inline-block">
                <p className="text-white font-semibold">Foto {currentPhotoIndex + 1} de {selectedPhotos.length}</p>
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {selectedPhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentPhotoIndex ? "bg-primary w-6" : "bg-gray-500"
                  )}
                  title={`Ir para foto ${index + 1}`}
                  aria-label={`Ir para foto ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default Timeline
