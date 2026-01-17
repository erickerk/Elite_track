import { useState, useRef } from 'react'
import { 
  CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
  Camera, Upload, Play, Pause, Save, X, Edit3, Plus, Car, Lock, Shield, Calendar, Loader2
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Project, TimelineStep } from '../../types'
import { uploadToStorage } from '../../services/photoUploadService'
import { saveStepPhoto } from '../../services/realtimeSync'
import { useProjects } from '../../contexts/ProjectContext'

interface ExecutorTimelineProps {
  project: Project
  onUpdateStep: (stepId: string, updates: Partial<TimelineStep>) => void
  onAddPhoto: (stepId: string, photoType: string) => void
  onUpdateProjectDates?: (updates: { vehicleReceivedDate?: string; estimatedDelivery?: string }) => void
  onUpdateNextStepDate?: (stepId: string, estimatedDate: string) => void
}

// Função para calcular dias
function calcularDias(dataInicio: string | undefined): number {
  if (!dataInicio) return 0
  const inicio = new Date(dataInicio)
  const hoje = new Date()
  const diff = hoje.getTime() - inicio.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// Função para verificar atraso
function verificarAtraso(dataEstimada: string | undefined): { atrasado: boolean; dias: number } {
  if (!dataEstimada) return { atrasado: false, dias: 0 }
  const estimada = new Date(dataEstimada)
  const hoje = new Date()
  const diff = hoje.getTime() - estimada.getTime()
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  return { atrasado: dias > 0, dias: Math.abs(dias) }
}

// Componente de Cabeçalho do Veículo Selecionado
function VehicleHeader({ 
  project, 
  isLocked,
  onUpdateDates 
}: { 
  project: Project; 
  isLocked: boolean;
  onUpdateDates?: (updates: { vehicleReceivedDate?: string; estimatedDelivery?: string }) => void
}) {
  const [editingDate, setEditingDate] = useState<'received' | 'delivery' | null>(null)
  const [tempDate, setTempDate] = useState('')
  
  const diasNaEmpresa = calcularDias(project.vehicleReceivedDate || project.startDate)
  const { atrasado, dias: diasAtraso } = verificarAtraso(project.estimatedDelivery)

  const handleSaveDate = (type: 'received' | 'delivery') => {
    if (!tempDate || !onUpdateDates) return
    
    if (type === 'received') {
      onUpdateDates({ vehicleReceivedDate: new Date(tempDate).toISOString() })
    } else {
      onUpdateDates({ estimatedDelivery: new Date(tempDate).toISOString() })
    }
    setEditingDate(null)
    setTempDate('')
  }
  
  return (
    <div className={cn(
      "rounded-xl p-3 sm:p-4 mb-4 border transition-all",
      atrasado && !isLocked
        ? "bg-red-500/5 border-red-500/20"
        : isLocked 
          ? "bg-green-500/5 border-green-500/20" 
          : "bg-primary/5 border-primary/20"
    )}>
      <div className="flex items-center gap-3">
        {/* Foto do Veículo - Compacta */}
        <div className={cn(
          "w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-carbon-900 border",
          isLocked ? "border-green-500/30" : "border-primary/30"
        )}>
          {project.vehicle.images?.[0] ? (
            <img 
              src={project.vehicle.images[0]} 
              alt={project.vehicle.model} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-6 h-6 text-gray-600" />
            </div>
          )}
        </div>
        
        {/* Info do Veículo - Compacto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
              isLocked ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"
            )}>
              {isLocked ? <Lock className="w-2.5 h-2.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
              <span>{isLocked ? 'OK' : 'ATIVO'}</span>
            </div>
            
            {atrasado && !isLocked && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold">
                <AlertCircle className="w-2.5 h-2.5" />
                <span>-{diasAtraso}d</span>
              </div>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-[150px] sm:max-w-none">
            {project.vehicle.brand} <span className="text-primary">{project.vehicle.model}</span>
          </h3>

          <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
            <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded whitespace-nowrap">
              {project.vehicle.plate}
            </span>
            <span className="truncate max-w-[100px] sm:max-w-none">{project.vehicle.year} • {project.vehicle.color}</span>
          </div>
        </div>

        {/* Progresso - Compacto */}
        <div className="text-right flex-shrink-0">
          <div className={cn(
            "text-2xl sm:text-3xl font-bold tabular-nums",
            isLocked ? "text-green-400" : atrasado ? "text-red-400" : "text-primary"
          )}>
            {project.progress}<span className="text-sm opacity-50">%</span>
          </div>
        </div>
      </div>

      {/* Grid de Informações Técnicas - Otimizado para Mobile */}
      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 group relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Entrada</span>
            {!isLocked && onUpdateDates && (
              <button 
                onClick={() => {
                  setEditingDate('received')
                  setTempDate(project.vehicleReceivedDate?.split('T')[0] || project.startDate.split('T')[0])
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-all"
                title="Editar"
              >
                <Edit3 className="w-3 h-3 text-primary" />
              </button>
            )}
          </div>
          {editingDate === 'received' ? (
            <div className="flex items-center gap-1">
              <input 
                type="date" 
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="bg-black/40 border border-primary/30 rounded px-2 py-1 text-[10px] w-full text-white focus:outline-none focus:border-primary"
                title="Data de entrada"
                placeholder="Data de entrada"
              />
              <div className="flex flex-col gap-1">
                <button onClick={() => handleSaveDate('received')} className="text-green-400 p-1 hover:bg-green-400/10 rounded" title="Salvar" aria-label="Salvar data de entrada"><Save className="w-3 h-3" /></button>
                <button onClick={() => setEditingDate(null)} className="text-red-400 p-1 hover:bg-red-400/10 rounded" title="Cancelar" aria-label="Cancelar edição"><X className="w-3 h-3" /></button>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-bold text-white truncate">
              {project.vehicleReceivedDate 
                ? new Date(project.vehicleReceivedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                : new Date(project.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </p>
          )}
        </div>
        
        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-1 text-center">Tempo</span>
          <p className="text-sm font-bold text-primary text-center">{diasNaEmpresa} dias</p>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 group relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Entrega</span>
            {!isLocked && onUpdateDates && (
              <button 
                onClick={() => {
                  setEditingDate('delivery')
                  setTempDate(project.estimatedDelivery?.split('T')[0] || '')
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-all"
                title="Editar"
                aria-label="Editar data de entrega"
              >
                <Edit3 className="w-3 h-3 text-primary" />
              </button>
            )}
          </div>
          {editingDate === 'delivery' ? (
            <div className="flex items-center gap-1">
              <input 
                type="date" 
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="bg-black/40 border border-primary/30 rounded px-2 py-1 text-[10px] w-full text-white focus:outline-none focus:border-primary"
                title="Data de entrega"
                placeholder="Data de entrega"
              />
              <div className="flex flex-col gap-1">
                <button onClick={() => handleSaveDate('delivery')} className="text-green-400 p-1 hover:bg-green-400/10 rounded" title="Salvar" aria-label="Salvar data de entrega"><Save className="w-3 h-3" /></button>
                <button onClick={() => setEditingDate(null)} className="text-red-400 p-1 hover:bg-red-400/10 rounded" title="Cancelar" aria-label="Cancelar edição"><X className="w-3 h-3" /></button>
              </div>
            </div>
          ) : (
            <p className={cn("text-xs sm:text-sm font-bold truncate", atrasado && !isLocked ? "text-red-400" : "text-green-400")}>
              {project.estimatedDelivery 
                ? new Date(project.estimatedDelivery).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                : 'A definir'}
            </p>
          )}
        </div>
        
        <div className={cn(
          "rounded-2xl p-3 border",
          atrasado && !isLocked ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
        )}>
          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-1 text-center">Status Final</span>
          <p className={cn("text-[10px] font-bold text-center leading-tight", atrasado && !isLocked ? "text-red-400" : "text-green-400")}>
            {isLocked ? 'CONCLUÍDO' : atrasado ? `${diasAtraso}d ATRASO` : `${diasAtraso}d RESTANTES`}
          </p>
        </div>
      </div>

      {isLocked && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-widest">
          <Shield className="w-3 h-3" />
          <span>Auditoria: Projeto finalizado e bloqueado para edições</span>
        </div>
      )}
    </div>
  )
}

const photoTypes = [
  { id: 'before', label: 'Antes', description: 'Foto do estado inicial' },
  { id: 'during', label: 'Durante', description: 'Foto do processo em andamento' },
  { id: 'after', label: 'Depois', description: 'Foto do resultado final' },
  { id: 'detail', label: 'Detalhe', description: 'Foto de detalhe específico' },
  { id: 'material', label: 'Material', description: 'Foto do material utilizado' },
]

export function ExecutorTimeline({ project, onUpdateStep, onAddPhoto, onUpdateProjectDates }: ExecutorTimelineProps) {
  const { refreshProjects } = useProjects()
  const [expandedStep, setExpandedStep] = useState<string | null>(
    project.timeline.find(s => s.status === 'in_progress')?.id || null
  )
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [editingDescription, setEditingDescription] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [showPhotoModal, setShowPhotoModal] = useState<string | null>(null)
  const [selectedPhotoType, setSelectedPhotoType] = useState<string>('during')
  
  // Estados para upload de fotos
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  // Estados para modal de data de previsão obrigatória
  const [showDateModal, setShowDateModal] = useState(false)
  const [pendingCompletionStep, setPendingCompletionStep] = useState<TimelineStep | null>(null)
  const [nextStepDate, setNextStepDate] = useState('')
  const [dateError, setDateError] = useState('')

  // Verificar se o projeto está concluído (bloqueado para edição)
  const isProjectLocked = project.status === 'completed' || project.status === 'delivered'

  // Calcular progresso dinamicamente
  const completedSteps = project.timeline.filter(s => s.status === 'completed').length
  const calculatedProgress = Math.round((completedSteps / project.timeline.length) * 100)

  // Verificar se a etapa anterior está concluída (para controle sequencial)
  const canStartStep = (stepIndex: number): boolean => {
    if (stepIndex === 0) return true // Primeira etapa sempre pode ser iniciada
    const previousStep = project.timeline[stepIndex - 1]
    return previousStep?.status === 'completed'
  }

  // Verificar se existe próxima etapa
  const getNextStep = (currentStepId: string): TimelineStep | null => {
    const currentIndex = project.timeline.findIndex(s => s.id === currentStepId)
    if (currentIndex === -1 || currentIndex >= project.timeline.length - 1) return null
    return project.timeline[currentIndex + 1]
  }

  // Handler para solicitar conclusão de etapa (abre modal se houver próxima etapa)
  const handleRequestCompletion = (step: TimelineStep) => {
    const nextStep = getNextStep(step.id)
    
    if (nextStep) {
      // Há próxima etapa - exigir data de previsão
      setPendingCompletionStep(step)
      setNextStepDate(nextStep.estimatedDate?.split('T')[0] || '')
      setDateError('')
      setShowDateModal(true)
    } else {
      // Última etapa - concluir diretamente
      handleStatusChange(step, 'completed')
    }
  }

  // Confirmar conclusão com data de previsão
  const handleConfirmCompletion = () => {
    if (!pendingCompletionStep) return
    
    if (!nextStepDate) {
      setDateError('A data de previsão é obrigatória!')
      return
    }

    const selectedDate = new Date(nextStepDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // A data de previsão deve ser posterior à data de conclusão da etapa atual
    const completionDate = new Date()
    completionDate.setHours(0, 0, 0, 0)
    
    if (selectedDate < completionDate) {
      setDateError('A data de previsão deve ser posterior à data de hoje!')
      return
    }

    const nextStep = getNextStep(pendingCompletionStep.id)

    // Atualizar a etapa atual como concluída E a próxima com a data de previsão
    // Fazemos em sequência para garantir a atualização correta
    onUpdateStep(pendingCompletionStep.id, { 
      status: 'completed',
      date: new Date().toISOString()
    })

    // Atualizar a data de previsão da próxima etapa
    if (nextStep) {
      // Pequeno delay para garantir que o estado seja atualizado
      setTimeout(() => {
        onUpdateStep(nextStep.id, { 
          estimatedDate: new Date(nextStepDate).toISOString()
        })
        // Expandir automaticamente a próxima etapa
        setExpandedStep(nextStep.id)
      }, 100)
    }

    // Limpar estados
    setShowDateModal(false)
    setPendingCompletionStep(null)
    setNextStepDate('')
    setDateError('')
  }

  const handleStatusChange = (step: TimelineStep, newStatus: 'pending' | 'in_progress' | 'completed') => {
    onUpdateStep(step.id, { 
      status: newStatus,
      date: newStatus === 'completed' ? new Date().toISOString() : step.date
    })
  }

  const handleSaveNotes = (stepId: string) => {
    onUpdateStep(stepId, { notes: notes[stepId] })
    setEditingNotes(null)
  }

  // Handler para abrir galeria
  const handleAddPhoto = (stepId: string) => {
    setUploadingStepId(stepId)
    fileInputRef.current?.click()
  }
  
  // Handler para abrir câmera
  const handleTakePhoto = (stepId: string) => {
    setUploadingStepId(stepId)
    cameraInputRef.current?.click()
  }

  // Handler para processar arquivo selecionado e fazer upload real
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingStepId) return

    const step = project.timeline.find(s => s.id === uploadingStepId)
    if (!step) return

    setIsUploading(true)
    setShowPhotoModal(null)

    try {
      // Upload para Supabase Storage
      const photoUrl = await uploadToStorage(file, 'step-photos', `step_${uploadingStepId}`)

      if (photoUrl) {
        // Salvar referência na tabela step_photos
        await saveStepPhoto(
          uploadingStepId,
          project.id,
          photoUrl,
          selectedPhotoType,
          step.title,
          `Foto ${selectedPhotoType} - ${step.title}`,
          'executor'
        )

        // Chamar callback original para notificação
        onAddPhoto(uploadingStepId, selectedPhotoType)
        console.log('[Timeline] Foto enviada com sucesso:', photoUrl)
        
        // Forçar atualização imediata dos projetos para exibir a foto sem F5
        await refreshProjects()
      }
    } catch (error) {
      console.error('[Timeline] Erro no upload:', error)
    } finally {
      setIsUploading(false)
      setUploadingStepId(null)
      setSelectedPhotoType('during')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = ''
      }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          icon: CheckCircle, 
          bg: 'bg-green-500', 
          text: 'text-green-400',
          border: 'border-green-500/30',
          label: 'Concluído'
        }
      case 'in_progress':
        return { 
          icon: Clock, 
          bg: 'bg-primary', 
          text: 'text-primary',
          border: 'border-primary/30',
          label: 'Em Andamento'
        }
      default:
        return { 
          icon: AlertCircle, 
          bg: 'bg-gray-600', 
          text: 'text-gray-400',
          border: 'border-white/10',
          label: 'Pendente'
        }
    }
  }

  return (
    <div className="space-y-4">
      {/* Input file oculto para upload de fotos da galeria */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Selecionar foto da galeria"
      />
      
      {/* Input file oculto para tirar foto com câmera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        {...({'capture': 'environment'} as any)}
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Tirar foto com câmera"
      />
      
      {/* Indicador de upload em andamento */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 flex items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-white font-medium">Enviando foto...</span>
          </div>
        </div>
      )}
      
      {/* Cabeçalho do Veículo Selecionado */}
      <VehicleHeader project={project} isLocked={isProjectLocked} onUpdateDates={onUpdateProjectDates} />

      {/* Progress Header */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
        <div>
          <h3 className="font-semibold">Progresso do Projeto</h3>
          <p className="text-sm text-gray-400">
            {project.timeline.filter(s => s.status === 'completed').length} de {project.timeline.length} etapas concluídas
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-primary">{calculatedProgress}%</span>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="space-y-3">
        {project.timeline.map((step, index) => {
          const config = getStatusConfig(step.status)
          const Icon = config.icon
          const isExpanded = expandedStep === step.id
          const isEditing = editingNotes === step.id
          const canStart = canStartStep(index)
          const isBlocked = step.status === 'pending' && !canStart

          return (
            <div
              key={step.id}
              className={cn(
                "rounded-2xl border transition-all overflow-hidden",
                config.border,
                step.status === 'in_progress' && "ring-1 ring-primary/30",
                isBlocked && "opacity-60"
              )}
            >
              {/* Step Header */}
              <div
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-white/5 transition-colors",
                  step.status === 'completed' && "bg-green-500/5",
                  step.status === 'in_progress' && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        config.bg
                      )}>
                        <Icon className={cn(
                          "w-6 h-6",
                          step.status === 'in_progress' ? "text-black" : "text-white"
                        )} />
                      </div>
                      {index < project.timeline.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-4 mt-2",
                          step.status === 'completed' ? "bg-green-500" : "bg-white/20"
                        )} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Etapa {index + 1}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          step.status === 'completed' ? "bg-green-500/20 text-green-400" :
                          step.status === 'in_progress' ? "bg-primary/20 text-primary" :
                          "bg-white/10 text-gray-400"
                        )}>
                          {config.label}
                        </span>
                      </div>
                      <h4 className="font-semibold text-lg">{step.title}</h4>
                      <p className="text-sm text-gray-400">
                        {step.photos.length} foto(s) • {step.date 
                          ? `Concluído em ${new Date(step.date).toLocaleDateString('pt-BR')}`
                          : step.estimatedDate 
                            ? `Previsão: ${new Date(step.estimatedDate).toLocaleDateString('pt-BR')}`
                            : 'Aguardando'
                        }
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t border-white/10">
                  {/* Description - Editável */}
                  <div className="bg-white/5 rounded-xl p-4">
                    {editingDescription === step.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={descriptions[step.id] ?? step.description}
                          onChange={(e) => setDescriptions({ ...descriptions, [step.id]: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-sm text-white resize-none"
                          rows={3}
                          placeholder="Descreva o progresso desta etapa..."
                          title="Descrição da etapa"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onUpdateStep(step.id, { description: descriptions[step.id] }); setEditingDescription(null); }}
                            className="flex items-center space-x-1 bg-primary text-black px-3 py-1.5 rounded-lg text-sm font-semibold"
                          >
                            <Save className="w-3 h-3" />
                            <span>Salvar</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingDescription(null); }}
                            className="flex items-center space-x-1 bg-white/10 text-white px-3 py-1.5 rounded-lg text-sm"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-gray-300 flex-1">{step.description}</p>
                        {!isProjectLocked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDescriptions({ ...descriptions, [step.id]: step.description }); setEditingDescription(step.id); }}
                            className="ml-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Editar descrição"
                          >
                            <Edit3 className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Actions - Bloqueado se projeto concluído */}
                  {isProjectLocked ? (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Edições bloqueadas - Projeto concluído</span>
                    </div>
                  ) : isBlocked ? (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>🔒 Conclua a etapa anterior para desbloquear</span>
                    </div>
                  ) : (
                  <div className="flex flex-wrap gap-2">
                    {step.status === 'pending' && canStart && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(step, 'in_progress'); }}
                        className="flex items-center space-x-2 bg-primary text-black px-4 py-2 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        <span>Iniciar Etapa</span>
                      </button>
                    )}
                    {step.status === 'in_progress' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRequestCompletion(step); }}
                          className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Concluir Etapa</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(step, 'pending'); }}
                          className="flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                        >
                          <Pause className="w-4 h-4" />
                          <span>Pausar</span>
                        </button>
                      </>
                    )}
                    {step.status === 'completed' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(step, 'in_progress'); }}
                        className="flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Reabrir Etapa</span>
                      </button>
                    )}
                  </div>
                  )}

                  {/* Photos Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-sm">Fotos da Etapa</h5>
                      {!isProjectLocked && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowPhotoModal(step.id); }}
                          className="flex items-center space-x-1 text-primary text-sm hover:underline"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar Foto</span>
                        </button>
                      )}
                    </div>
                    {step.photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {(step.photoDetails || step.photos.map(url => ({ url, type: 'during', stage: step.title }))).map((photo: any, idx: number) => {
                          const photoUrl = typeof photo === 'string' ? photo : photo.url
                          const photoType = typeof photo === 'string' ? 'durante' : (photo.type === 'before' ? 'Antes' : photo.type === 'during' ? 'Durante' : photo.type === 'after' ? 'Depois' : photo.type === 'detail' || photo.type === 'details' ? 'Detalhe' : photo.type === 'material' ? 'Material' : photo.type)
                          const photoStage = typeof photo === 'string' ? step.title : photo.stage
                          return (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-white/5 bg-carbon-900">
                              <img 
                                src={photoUrl} 
                                alt={`${photoStage} - ${photoType}`} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                                <span className="text-[10px] text-primary font-bold uppercase tracking-widest mb-0.5">{photoType}</span>
                                <span className="text-xs text-white font-bold truncate leading-tight">{photoStage}</span>
                              </div>
                            </div>
                          )
                        })}
                        {!isProjectLocked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowPhotoModal(step.id); }}
                            className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/30 bg-white/5 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Plus className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-primary">Adicionar</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                          <Camera className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Nenhuma evidência registrada</p>
                        {!isProjectLocked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowPhotoModal(step.id); }}
                            className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            Registrar Agora
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-sm">Observações</h5>
                      {!isEditing && !isProjectLocked && (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setNotes({ ...notes, [step.id]: step.notes || '' });
                            setEditingNotes(step.id); 
                          }}
                          className="text-primary text-sm hover:underline"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={notes[step.id] || ''}
                          onChange={(e) => setNotes({ ...notes, [step.id]: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Adicione observações sobre esta etapa..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 resize-none h-24"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveNotes(step.id); }}
                            className="flex items-center space-x-1 bg-primary text-black px-3 py-1.5 rounded-lg text-sm font-semibold"
                          >
                            <Save className="w-4 h-4" />
                            <span>Salvar</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingNotes(null); }}
                            className="flex items-center space-x-1 bg-white/10 text-white px-3 py-1.5 rounded-lg text-sm"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 bg-white/5 rounded-xl p-3">
                        {step.notes || 'Nenhuma observação adicionada'}
                      </p>
                    )}
                  </div>

                  {/* Technician Info */}
                  {step.technician && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>Técnico responsável:</span>
                      <span className="text-white font-medium">{step.technician}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Photo Type Modal */}
              {showPhotoModal === step.id && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                  onClick={() => setShowPhotoModal(null)}
                >
                  <div 
                    className="bg-carbon-800 rounded-3xl p-6 max-w-md w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">Adicionar Foto</h3>
                      <button
                        onClick={() => setShowPhotoModal(null)}
                        className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20"
                        aria-label="Fechar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-400 mb-4">
                      Selecione o tipo de foto para: <span className="text-white font-semibold">{step.title}</span>
                    </p>

                    <div className="space-y-2 mb-6">
                      {photoTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedPhotoType(type.id)}
                          className={cn(
                            "w-full p-4 rounded-xl text-left transition-all",
                            selectedPhotoType === type.id
                              ? "bg-primary/20 border-2 border-primary"
                              : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                          )}
                        >
                          <div className="font-semibold">{type.label}</div>
                          <div className="text-sm text-gray-400">{type.description}</div>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleTakePhoto(step.id)}
                        className="bg-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700"
                      >
                        <Camera className="w-5 h-5" />
                        <span>Tirar Foto</span>
                      </button>
                      <button
                        onClick={() => handleAddPhoto(step.id)}
                        className="bg-primary text-black py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-primary/90"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Galeria</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal de Data de Previsão Obrigatória */}
      {showDateModal && pendingCompletionStep && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowDateModal(false)}
        >
          <div 
            className="bg-carbon-800 rounded-3xl p-6 max-w-md w-full mx-4 border-2 border-primary/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Concluir Etapa</h3>
                  <p className="text-sm text-gray-400">Defina a previsão da próxima</p>
                </div>
              </div>
              <button
                onClick={() => setShowDateModal(false)}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Etapa sendo concluída */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-green-400 font-semibold mb-1">✓ Concluindo:</p>
              <p className="text-white font-bold text-lg">{pendingCompletionStep.title}</p>
            </div>

            {/* Próxima etapa */}
            {getNextStep(pendingCompletionStep.id) && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
                <p className="text-sm text-primary font-semibold mb-1">⏭️ Próxima etapa:</p>
                <p className="text-white font-bold text-lg">{getNextStep(pendingCompletionStep.id)?.title}</p>
              </div>
            )}

            {/* Campo de data obrigatória */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                📅 Data de previsão da próxima etapa <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={nextStepDate}
                onChange={(e) => { setNextStepDate(e.target.value); setDateError(''); }}
                className={cn(
                  "w-full bg-white/10 border-2 rounded-xl px-4 py-3 text-white text-lg font-semibold",
                  dateError ? "border-red-500" : "border-white/20 focus:border-primary"
                )}
                min={new Date().toISOString().split('T')[0]}
                title="Data de previsão"
                aria-label="Data de previsão da próxima etapa"
              />
              {dateError && (
                <p className="text-red-400 text-sm mt-2 font-semibold">⚠️ {dateError}</p>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDateModal(false)}
                className="flex-1 bg-white/10 text-white py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCompletion}
                className="flex-1 bg-green-500 text-white py-4 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Confirmar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
