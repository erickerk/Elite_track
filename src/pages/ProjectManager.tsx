import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Upload, CheckCircle, Clock, AlertCircle, 
  ChevronRight, Plus, X, Image as ImageIcon,
  FileText, CreditCard, Award, Camera,
  Play, Pause, Loader2
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useProjects } from '../contexts/ProjectContext'
import { cn } from '../lib/utils'
import { uploadStepPhoto } from '../services/photoUploadService'
import type { Project, TimelineStep, BlindingSpecs } from '../types'

export function ProjectManager() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const { getProjectById, updateProject } = useProjects()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'timeline' | 'photos' | 'laudo' | 'card'>('timeline')
  const [selectedStep, setSelectedStep] = useState<TimelineStep | null>(null)
  const [showStepModal, setShowStepModal] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showLaudoModal, setShowLaudoModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [stepNotes, setStepNotes] = useState('')
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [nextStepDate, setNextStepDate] = useState('')
  const [newStatus, setNewStatus] = useState<'pending' | 'in_progress' | 'completed' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [laudoData, setLaudoData] = useState<Partial<BlindingSpecs>>({
    level: 'IIIA',
    certification: 'ABNT NBR 15000',
    certificationNumber: '',
    validUntil: '',
    glassType: 'Laminado Multi-camadas',
    glassThickness: '21mm',
    bodyProtection: [],
    additionalFeatures: [],
    warranty: '5 anos',
    technicalResponsible: user?.name || '',
    installationDate: new Date().toISOString().split('T')[0],
    totalWeight: '',
  })

  const [cardData, setCardData] = useState({
    cardNumber: `ELITE-${Date.now().toString().slice(-8)}`,
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5).toISOString().split('T')[0],
    memberSince: new Date().toISOString().split('T')[0],
    benefits: ['Guincho 24h', 'Suporte Premium', 'Revisões Gratuitas', 'Desconto em Manutenção'],
    rescuePhone: '0800-ELITE-SOS',
    supportPhone: '0800-ELITE-HELP',
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = getProjectById(projectId || '')
      setProject(found || null)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [projectId, getProjectById])

  if (!user || (user.role !== 'executor' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400 mb-6">Apenas executores e administradores podem acessar esta página.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-primary text-black px-6 py-3 rounded-xl font-semibold"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Projeto não encontrado</h1>
          <p className="text-gray-400 mb-6">O código QR escaneado não corresponde a nenhum projeto.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-primary text-black px-6 py-3 rounded-xl font-semibold"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleUpdateStep = (step: TimelineStep, status: 'pending' | 'in_progress' | 'completed' | null) => {
    if (!status) return
    // Se está concluindo, precisa da data da próxima etapa
    if (status === 'completed') {
      const currentIndex = project.timeline.findIndex(s => s.id === step.id)
      const hasNextStep = currentIndex < project.timeline.length - 1
      
      if (hasNextStep && !nextStepDate) {
        addNotification({
          type: 'warning',
          title: 'Previsão Obrigatória',
          message: 'Informe a previsão de conclusão da próxima etapa.',
          projectId: project.id,
        })
        return
      }
    }

    addNotification({
      type: 'success',
      title: status === 'completed' ? 'Etapa Concluída' : status === 'in_progress' ? 'Etapa Iniciada' : 'Status Atualizado',
      message: `${step.title} foi atualizado para ${status === 'completed' ? 'concluída' : status === 'in_progress' ? 'em andamento' : 'pendente'}.`,
      projectId: project.id,
      stepId: step.id,
    })
    
    // Update the project timeline locally and globally
    const updatedTimeline = project.timeline.map(s => {
      if (s.id === step.id) {
        return { ...s, status, notes: stepNotes || s.notes, date: status === 'completed' ? new Date().toISOString() : s.date }
      }
      return s
    })
    const completedCount = updatedTimeline.filter(s => s.status === 'completed').length
    const newProgress = Math.round((completedCount / updatedTimeline.length) * 100)
    const newStatus: 'pending' | 'in_progress' | 'completed' = completedCount === updatedTimeline.length ? 'completed' : completedCount > 0 ? 'in_progress' : 'pending'
    
    const updatedProject: Project = { ...project, timeline: updatedTimeline, progress: newProgress, status: newStatus }
    setProject(updatedProject)
    
    // Persistir no contexto global
    void updateProject(project.id, { timeline: updatedTimeline, progress: newProgress, status: newStatus })
    
    setShowStepModal(false)
    setStepNotes('')
    setNextStepDate('')
    setNewStatus('pending')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file)
        setUploadedPhotos(prev => [...prev, url])
        setUploadedFiles(prev => [...prev, file])
      })
    }
  }

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment')
      fileInputRef.current.click()
    }
  }

  const openGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture')
      fileInputRef.current.click()
    }
  }

  const handleUploadPhotos = async () => {
    if (selectedStep && uploadedFiles.length > 0 && project) {
      setIsUploading(true)
      
      try {
        const savedPhotoUrls: string[] = []
        
        // Upload de cada foto para o Supabase Storage e salvar na tabela step_photos
        for (const file of uploadedFiles) {
          const savedPhoto = await uploadStepPhoto(
            file,
            selectedStep.id,
            project.id,
            'during',
            `Foto da etapa ${selectedStep.title}`,
            user?.id
          )
          
          if (savedPhoto) {
            savedPhotoUrls.push(savedPhoto.photo_url)
          }
        }
        
        // Se não conseguiu salvar no Supabase, usar as URLs locais como fallback
        const photosToAdd = savedPhotoUrls.length > 0 ? savedPhotoUrls : uploadedPhotos
        
        // Atualizar fotos da etapa no estado local
        const updatedTimeline = project.timeline.map(s => {
          if (s.id === selectedStep.id) {
            return { ...s, photos: [...s.photos, ...photosToAdd] }
          }
          return s
        })
        
        const updatedProject = { ...project, timeline: updatedTimeline }
        setProject(updatedProject)
        
        // Persistir no contexto global
        void updateProject(project.id, { timeline: updatedTimeline })
        
        addNotification({
          type: 'success',
          title: 'Fotos Adicionadas',
          message: `${uploadedFiles.length} foto(s) adicionada(s) à etapa ${selectedStep.title}.`,
          projectId: project.id,
          stepId: selectedStep.id,
        })
      } catch (error) {
        console.error('[ProjectManager] Erro ao fazer upload das fotos:', error)
        addNotification({
          type: 'error',
          title: 'Erro no Upload',
          message: 'Não foi possível salvar algumas fotos. Tente novamente.',
        })
      } finally {
        setIsUploading(false)
        setShowPhotoUpload(false)
        setUploadedPhotos([])
        setUploadedFiles([])
      }
    }
  }

  const handleSaveLaudo = () => {
    addNotification({
      type: 'success',
      title: 'Laudo Salvo',
      message: 'As especificações técnicas do laudo foram salvas com sucesso.',
      projectId: project.id,
    })
    setShowLaudoModal(false)
  }

  const handleSaveCard = () => {
    addNotification({
      type: 'success',
      title: 'Cartão Elite Criado',
      message: `Cartão Elite ${cardData.cardNumber} foi criado para o cliente.`,
      projectId: project.id,
    })
    setShowCardModal(false)
  }

  const completedSteps = project.timeline.filter(s => s.status === 'completed').length
  const totalSteps = project.timeline.length

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      {/* Header */}
      <header className="glass-effect border-b border-carbon-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                title="Voltar"
              >
                <i className="ri-arrow-left-line text-white"></i>
              </button>
              <img src="/logo-elite.png" alt="Elite Blindagens" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
              <h1 className="text-xl font-bold text-primary">Gerenciar Projeto</h1>
              <p className="text-sm text-gray-400">{project.id}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">{user?.name}</span>
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-primary"></i>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Project Info */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-effect rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden">
                  <img 
                    src={project.vehicle.images[0]} 
                    alt={project.vehicle.model}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{project.vehicle.brand} {project.vehicle.model}</h2>
                  <p className="text-gray-400">{project.vehicle.plate} • {project.vehicle.year}</p>
                  <p className="text-sm text-primary mt-1">Cliente: {project.user.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{project.progress}%</div>
                  <div className="text-xs text-gray-400">Progresso</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{completedSteps}/{totalSteps}</div>
                  <div className="text-xs text-gray-400">Etapas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="pb-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {[
              { id: 'timeline', label: 'Timeline', icon: Clock },
              { id: 'photos', label: 'Fotos', icon: ImageIcon },
              { id: 'laudo', label: 'Laudo', icon: FileText },
              { id: 'card', label: 'Cartão Elite', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-primary text-black" 
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="glass-effect rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-6">Atualizar Etapas</h3>
              <div className="space-y-4">
                {project.timeline.map((step) => (
                  <div 
                    key={step.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer hover:border-primary/50",
                      step.status === 'completed' ? "bg-green-500/10 border-green-500/30" :
                      step.status === 'in_progress' ? "bg-primary/10 border-primary/30" :
                      "bg-white/5 border-white/10"
                    )}
                    onClick={() => { setSelectedStep(step); setShowStepModal(true); }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          step.status === 'completed' ? "bg-green-500" :
                          step.status === 'in_progress' ? "bg-primary" :
                          "bg-white/10"
                        )}>
                          {step.status === 'completed' ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : step.status === 'in_progress' ? (
                            <Clock className="w-6 h-6 text-black" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold break-words">{step.title}</h4>
                          <p className="text-sm text-gray-400 break-words">
                            {step.status === 'completed' ? `Concluído em ${step.date ? new Date(step.date).toLocaleDateString('pt-BR') : ''}` :
                             step.status === 'in_progress' ? 'Em andamento' :
                             `Previsão: ${step.estimatedDate ? new Date(step.estimatedDate).toLocaleDateString('pt-BR') : ''}`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 self-center" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <ImageIcon className="w-6 h-6 text-primary mb-2" />
                  <div className="text-2xl font-bold">{project.timeline.reduce((acc, s) => acc + s.photos.length, 0)}</div>
                  <div className="text-xs text-gray-400">Total de Fotos</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                  <div className="text-2xl font-bold">{project.timeline.filter(s => s.photos.length > 0).length}</div>
                  <div className="text-xs text-gray-400">Etapas com Fotos</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <Clock className="w-6 h-6 text-yellow-400 mb-2" />
                  <div className="text-2xl font-bold">{project.timeline.filter(s => s.status === 'in_progress').length}</div>
                  <div className="text-xs text-gray-400">Em Andamento</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <AlertCircle className="w-6 h-6 text-gray-400 mb-2" />
                  <div className="text-2xl font-bold">{project.timeline.filter(s => s.photos.length === 0 && s.status !== 'pending').length}</div>
                  <div className="text-xs text-gray-400">Sem Fotos</div>
                </div>
              </div>

              {/* Photos by Step */}
              <div className="glass-effect rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Fotos por Etapa</h3>
                    <p className="text-sm text-gray-400">Organize as fotos por categoria para o cliente visualizar</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {project.timeline.map((step) => {
                    const statusColor = step.status === 'completed' ? 'bg-green-500' :
                                       step.status === 'in_progress' ? 'bg-primary' : 'bg-gray-500'
                    return (
                      <div key={step.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("w-3 h-3 rounded-full", statusColor)} />
                            <div className="min-w-0">
                              <h4 className="font-semibold break-words">{step.title}</h4>
                              <p className="text-xs text-gray-400 break-words">
                                {step.status === 'completed' ? 'Concluída' :
                                 step.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                                {' • '}{step.photos.length} foto(s)
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => { setSelectedStep(step); setShowPhotoUpload(true); }}
                            className="flex items-center justify-center space-x-2 bg-primary/20 text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors w-full sm:w-auto"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Adicionar</span>
                          </button>
                        </div>
                        {step.photos.length > 0 && (
                          <div className="p-4 pt-0">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {step.photos.map((photo, idx) => (
                                <div key={idx} className="relative group">
                                  <div className="aspect-square rounded-xl overflow-hidden bg-carbon-900">
                                    <img src={photo} alt={`${step.title} - Foto ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-2">
                                    <div className="text-xs">
                                      <p className="font-semibold">Foto {idx + 1}</p>
                                      <p className="text-gray-400 truncate">{step.title}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => { setSelectedStep(step); setShowPhotoUpload(true); }}
                                className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-white/5 transition-all"
                                title="Adicionar foto"
                                aria-label="Adicionar foto"
                              >
                                <Plus className="w-6 h-6 text-gray-500 mb-1" />
                                <span className="text-xs text-gray-500">Adicionar</span>
                              </button>
                            </div>
                          </div>
                        )}
                        {step.photos.length === 0 && step.status !== 'pending' && (
                          <div className="p-4 pt-0">
                            <button
                              onClick={() => { setSelectedStep(step); setShowPhotoUpload(true); }}
                              className="w-full p-6 rounded-xl border-2 border-dashed border-white/20 text-center hover:border-primary/50 hover:bg-white/5 transition-all"
                            >
                              <Camera className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                              <p className="text-gray-400 text-sm">Adicionar fotos desta etapa</p>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Laudo Tab */}
          {activeTab === 'laudo' && (
            <div className="glass-effect rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Laudo EliteShield™</h3>
                <button 
                  onClick={() => setShowLaudoModal(true)}
                  className="flex items-center space-x-2 bg-primary text-black px-4 py-2 rounded-xl font-semibold"
                >
                  <FileText className="w-5 h-5" />
                  <span>Editar Laudo</span>
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-4">
                  <h4 className="font-semibold text-primary mb-3">Especificações</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Nível de Proteção:</span><span>{laudoData.level || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Certificação:</span><span>{laudoData.certification || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Nº Certificado:</span><span>{laudoData.certificationNumber || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Tipo de Vidro:</span><span>{laudoData.glassType || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Espessura:</span><span>{laudoData.glassThickness || '-'}</span></div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <h4 className="font-semibold text-primary mb-3">Informações Adicionais</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Garantia:</span><span>{laudoData.warranty || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Técnico:</span><span>{laudoData.technicalResponsible || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Data Instalação:</span><span>{laudoData.installationDate || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Peso Total:</span><span>{laudoData.totalWeight || '-'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card Tab */}
          {activeTab === 'card' && (
            <div className="glass-effect rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Cartão Elite do Cliente</h3>
                <button 
                  onClick={() => setShowCardModal(true)}
                  className="flex items-center space-x-2 bg-primary text-black px-4 py-2 rounded-xl font-semibold"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Editar Cartão</span>
                </button>
              </div>
              <div className="max-w-md mx-auto">
                <div className="elite-card rounded-3xl p-6 relative overflow-hidden">
                  <div className="elite-card-shine absolute inset-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="font-['Pacifico'] text-2xl text-primary">Elite</div>
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-400">Número do Cartão</p>
                        <p className="text-lg font-mono font-bold">{cardData.cardNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Cliente</p>
                        <p className="font-semibold">{project.user.name}</p>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Emissão</p>
                          <p className="text-sm">{new Date(cardData.issueDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Validade</p>
                          <p className="text-sm">{new Date(cardData.expiryDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Step Modal */}
      <Modal isOpen={showStepModal} onClose={() => { setShowStepModal(false); setNextStepDate(''); }} title={selectedStep?.title || ''} size="md">
        {selectedStep && (
          <div className="space-y-4">
            {/* Status Atual */}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Status Atual</p>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  selectedStep.status === 'completed' ? "bg-green-500" :
                  selectedStep.status === 'in_progress' ? "bg-primary" : "bg-gray-500"
                )} />
                <p className="font-semibold">
                  {selectedStep.status === 'completed' ? 'Concluído' : 
                   selectedStep.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                </p>
              </div>
            </div>

            {/* Alterar Status */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Alterar Status</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setNewStatus('pending')}
                  className={cn(
                    "p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center space-y-1",
                    newStatus === 'pending' || (newStatus === null && selectedStep.status === 'pending')
                      ? "bg-gray-500 text-white ring-2 ring-gray-400"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  <Pause className="w-5 h-5" />
                  <span>Pendente</span>
                </button>
                <button
                  onClick={() => setNewStatus('in_progress')}
                  className={cn(
                    "p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center space-y-1",
                    newStatus === 'in_progress'
                      ? "bg-primary text-black ring-2 ring-primary"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  <Play className="w-5 h-5" />
                  <span>Em Andamento</span>
                </button>
                <button
                  onClick={() => setNewStatus('completed')}
                  className={cn(
                    "p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center space-y-1",
                    newStatus === 'completed'
                      ? "bg-green-500 text-white ring-2 ring-green-400"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Concluído</span>
                </button>
              </div>
            </div>

            {/* Previsão da Próxima Etapa (obrigatório ao concluir) */}
            {newStatus === 'completed' && project.timeline.findIndex(s => s.id === selectedStep.id) < project.timeline.length - 1 && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Previsão da Próxima Etapa <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={nextStepDate}
                  onChange={(e) => setNextStepDate(e.target.value)}
                  className="w-full bg-carbon-800 border border-white/10 rounded-xl p-3 text-white"
                  min={new Date().toISOString().split('T')[0]}
                  title="Data de previsão da próxima etapa"
                  aria-label="Data de previsão da próxima etapa"
                />
                {!nextStepDate && (
                  <p className="text-xs text-red-400 mt-1">Informe a previsão de conclusão da próxima etapa</p>
                )}
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Observações</label>
              <textarea
                value={stepNotes}
                onChange={(e) => setStepNotes(e.target.value)}
                placeholder="Adicione observações sobre esta etapa..."
                className="w-full bg-carbon-800 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 resize-none h-24"
              />
            </div>

            {/* Ações */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleUpdateStep(selectedStep, newStatus)}
                disabled={newStatus === null || newStatus === selectedStep.status}
                className="flex-1 bg-primary text-black py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar Alterações
              </button>
              <button
                onClick={() => { setShowPhotoUpload(true); setShowStepModal(false); }}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Fotos</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Photo Upload Modal */}
      <Modal isOpen={showPhotoUpload} onClose={() => { setShowPhotoUpload(false); setUploadedPhotos([]); }} title="Adicionar Fotos" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Etapa: <span className="text-white font-semibold">{selectedStep?.title || 'Selecione uma etapa'}</span>
          </p>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Selecionar fotos"
            title="Selecionar fotos do dispositivo"
          />
          
          {/* Upload Options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openCamera}
              className="flex flex-col items-center justify-center p-6 bg-primary/10 border-2 border-primary/30 rounded-2xl hover:bg-primary/20 transition-colors"
            >
              <Camera className="w-10 h-10 text-primary mb-2" />
              <span className="font-semibold text-primary">Tirar Foto</span>
              <span className="text-xs text-gray-400">Usar câmera</span>
            </button>
            <button
              onClick={openGallery}
              className="flex flex-col items-center justify-center p-6 bg-white/5 border-2 border-white/20 rounded-2xl hover:bg-white/10 transition-colors"
            >
              <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
              <span className="font-semibold">Galeria</span>
              <span className="text-xs text-gray-400">Escolher do dispositivo</span>
            </button>
          </div>

          {/* Preview */}
          {uploadedPhotos.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">{uploadedPhotos.length} foto(s) selecionada(s)</p>
              <div className="grid grid-cols-3 gap-3">
                {uploadedPhotos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                      title="Remover foto"
                      aria-label="Remover foto"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={() => void handleUploadPhotos()}
            disabled={uploadedPhotos.length === 0 || isUploading}
            className="w-full bg-primary text-black py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Salvar {uploadedPhotos.length > 0 ? `${uploadedPhotos.length} Foto(s)` : 'Fotos'}</span>
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Laudo Modal */}
      <Modal isOpen={showLaudoModal} onClose={() => setShowLaudoModal(false)} title="Editar Laudo EliteShield" size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nivel-protecao" className="block text-sm text-gray-400 mb-2">Nível de Proteção</label>
              <select
                id="nivel-protecao"
                value={laudoData.level}
                onChange={(e) => setLaudoData({ ...laudoData, level: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                title="Nível de Proteção"
              >
                <option value="II">Nível II</option>
                <option value="IIIA">Nível IIIA</option>
                <option value="III">Nível III</option>
                <option value="IV">Nível IV</option>
              </select>
            </div>
            <div>
              <label htmlFor="certificacao" className="block text-sm text-gray-400 mb-2">Certificação</label>
              <input
                id="certificacao"
                type="text"
                value={laudoData.certification}
                onChange={(e) => setLaudoData({ ...laudoData, certification: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                placeholder="ABNT NBR 15000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nº do Certificado</label>
              <input
                type="text"
                value={laudoData.certificationNumber}
                onChange={(e) => setLaudoData({ ...laudoData, certificationNumber: e.target.value })}
                placeholder="Ex: CERT-2025-001"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label htmlFor="validade-laudo" className="block text-sm text-gray-400 mb-2">Validade</label>
              <input
                id="validade-laudo"
                type="date"
                value={laudoData.validUntil}
                onChange={(e) => setLaudoData({ ...laudoData, validUntil: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                title="Data de validade"
              />
            </div>
            <div>
              <label htmlFor="tipo-vidro" className="block text-sm text-gray-400 mb-2">Tipo de Vidro</label>
              <input
                id="tipo-vidro"
                type="text"
                value={laudoData.glassType}
                onChange={(e) => setLaudoData({ ...laudoData, glassType: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                placeholder="Laminado Multi-camadas"
              />
            </div>
            <div>
              <label htmlFor="espessura-vidro" className="block text-sm text-gray-400 mb-2">Espessura do Vidro</label>
              <input
                id="espessura-vidro"
                type="text"
                value={laudoData.glassThickness}
                onChange={(e) => setLaudoData({ ...laudoData, glassThickness: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                placeholder="21mm"
              />
            </div>
            <div>
              <label htmlFor="garantia" className="block text-sm text-gray-400 mb-2">Garantia</label>
              <input
                id="garantia"
                type="text"
                value={laudoData.warranty}
                onChange={(e) => setLaudoData({ ...laudoData, warranty: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                placeholder="5 anos"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Peso Total Adicionado</label>
              <input
                type="text"
                value={laudoData.totalWeight}
                onChange={(e) => setLaudoData({ ...laudoData, totalWeight: e.target.value })}
                placeholder="Ex: 250kg"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500"
              />
            </div>
            <div>
              <label htmlFor="tecnico" className="block text-sm text-gray-400 mb-2">Técnico Responsável</label>
              <input
                id="tecnico"
                type="text"
                value={laudoData.technicalResponsible}
                onChange={(e) => setLaudoData({ ...laudoData, technicalResponsible: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                placeholder="Nome do técnico"
              />
            </div>
            <div>
              <label htmlFor="data-instalacao" className="block text-sm text-gray-400 mb-2">Data de Instalação</label>
              <input
                id="data-instalacao"
                type="date"
                value={laudoData.installationDate}
                onChange={(e) => setLaudoData({ ...laudoData, installationDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                title="Data de instalação"
              />
            </div>
          </div>
          <button
            onClick={handleSaveLaudo}
            className="w-full bg-primary text-black py-3 rounded-xl font-semibold"
          >
            Salvar Laudo
          </button>
        </div>
      </Modal>

      {/* Card Modal */}
      <Modal isOpen={showCardModal} onClose={() => setShowCardModal(false)} title="Editar Cartão Elite" size="md">
        <div className="space-y-4">
          <div>
            <label htmlFor="numero-cartao" className="block text-sm text-gray-400 mb-2">Número do Cartão</label>
            <input
              id="numero-cartao"
              type="text"
              value={cardData.cardNumber}
              onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono"
              placeholder="ELITE-XXXXXXXX"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="data-emissao" className="block text-sm text-gray-400 mb-2">Data de Emissão</label>
              <input
                id="data-emissao"
                type="date"
                value={cardData.issueDate}
                onChange={(e) => setCardData({ ...cardData, issueDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                title="Data de emissão"
              />
            </div>
            <div>
              <label htmlFor="validade-cartao" className="block text-sm text-gray-400 mb-2">Validade</label>
              <input
                id="validade-cartao"
                type="date"
                value={cardData.expiryDate}
                onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                title="Data de validade"
              />
            </div>
          </div>
          <div>
            <label htmlFor="telefone-rescue" className="block text-sm text-gray-400 mb-2">Telefone Elite Rescue</label>
            <input
              id="telefone-rescue"
              type="text"
              value={cardData.rescuePhone}
              onChange={(e) => setCardData({ ...cardData, rescuePhone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
              placeholder="0800-ELITE-SOS"
            />
          </div>
          <div>
            <label htmlFor="telefone-suporte" className="block text-sm text-gray-400 mb-2">Telefone Suporte</label>
            <input
              id="telefone-suporte"
              type="text"
              value={cardData.supportPhone}
              onChange={(e) => setCardData({ ...cardData, supportPhone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
              placeholder="0800-ELITE-HELP"
            />
          </div>
          <button
            onClick={handleSaveCard}
            className="w-full bg-primary text-black py-3 rounded-xl font-semibold"
          >
            Salvar Cartão
          </button>
        </div>
      </Modal>
    </div>
  )
}
export default ProjectManager
