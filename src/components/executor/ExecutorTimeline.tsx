import { useState } from 'react'
import { 
  CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
  Camera, Upload, Play, Pause, Save, X, Edit3, Plus, Car, Lock, Shield, Calendar
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Project, TimelineStep } from '../../types'

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
      "rounded-2xl p-4 mb-4 border-2",
      atrasado && !isLocked
        ? "bg-red-500/10 border-red-500/50"
        : isLocked 
          ? "bg-green-500/10 border-green-500/50" 
          : "bg-primary/10 border-primary/50"
    )}>
      <div className="flex items-center gap-4">
        {/* Foto do Veículo */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
          {project.vehicle.images?.[0] ? (
            <img 
              src={project.vehicle.images[0]} 
              alt={project.vehicle.model} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>
        
        {/* Info do Veículo */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isLocked && <Lock className="w-4 h-4 text-green-400" />}
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              isLocked ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"
            )}>
              {isLocked ? 'PROJETO CONCLUÍDO' : 'VEÍCULO SELECIONADO'}
            </span>
            {atrasado && !isLocked && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                ⚠️ ATRASADO {diasAtraso} DIAS
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-white">
            {project.vehicle.brand} {project.vehicle.model}
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1 flex-wrap">
            <span className="font-mono font-bold text-white bg-primary/20 px-2 py-0.5 rounded">
              {project.vehicle.plate}
            </span>
            <span>{project.vehicle.year}</span>
            <span>{project.vehicle.color}</span>
          </div>
        </div>

        {/* Status e Tempo */}
        <div className="text-right">
          <div className={cn(
            "text-3xl font-bold",
            isLocked ? "text-green-400" : atrasado ? "text-red-400" : "text-primary"
          )}>
            {project.progress}%
          </div>
          <div className="text-xs text-gray-400">
            {project.user.name}
          </div>
          <div className="mt-2 text-xs">
            <span className="bg-white/10 px-2 py-1 rounded-full">
              📅 {diasNaEmpresa} dias na empresa
            </span>
          </div>
        </div>
      </div>

      {/* Informações de Tempo para o Executor */}
      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Data de Recebimento - Editável */}
        <div className="bg-white/5 rounded-lg p-2 group relative">
          <span className="text-gray-400 block flex items-center gap-1">
            Recebido em
            {!isLocked && onUpdateDates && (
              <button 
                onClick={() => {
                  setEditingDate('received')
                  setTempDate(project.vehicleReceivedDate?.split('T')[0] || project.startDate.split('T')[0])
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Editar data de recebimento"
                aria-label="Editar data de recebimento"
              >
                <Edit3 className="w-3 h-3 text-primary" />
              </button>
            )}
          </span>
          {editingDate === 'received' ? (
            <div className="flex items-center gap-1 mt-1">
              <input 
                type="date" 
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="bg-white/10 rounded px-1 py-0.5 text-xs w-full"
                title="Data de recebimento"
                aria-label="Data de recebimento"
                placeholder="dd/mm/aaaa"
              />
              <button 
                onClick={() => handleSaveDate('received')} 
                className="text-green-400"
                title="Salvar data"
                aria-label="Salvar data de recebimento"
              >
                <Save className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setEditingDate(null)} 
                className="text-red-400"
                title="Cancelar edição"
                aria-label="Cancelar edição de data"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="font-bold">
              {project.vehicleReceivedDate 
                ? new Date(project.vehicleReceivedDate).toLocaleDateString('pt-BR')
                : new Date(project.startDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        
        <div className="bg-white/5 rounded-lg p-2">
          <span className="text-gray-400 block">Dias na empresa</span>
          <span className="font-bold text-primary">{diasNaEmpresa} dias</span>
        </div>
        
        {/* Previsão de Entrega - Editável */}
        <div className="bg-white/5 rounded-lg p-2 group relative">
          <span className="text-gray-400 block flex items-center gap-1">
            Previsão entrega
            {!isLocked && onUpdateDates && (
              <button 
                onClick={() => {
                  setEditingDate('delivery')
                  setTempDate(project.estimatedDelivery?.split('T')[0] || '')
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Editar previsão de entrega"
                aria-label="Editar previsão de entrega"
              >
                <Edit3 className="w-3 h-3 text-primary" />
              </button>
            )}
          </span>
          {editingDate === 'delivery' ? (
            <div className="flex items-center gap-1 mt-1">
              <input 
                type="date" 
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="bg-white/10 rounded px-1 py-0.5 text-xs w-full"
                title="Previsão de entrega"
                aria-label="Previsão de entrega"
                placeholder="dd/mm/aaaa"
              />
              <button 
                onClick={() => handleSaveDate('delivery')} 
                className="text-green-400"
                title="Salvar data"
                aria-label="Salvar previsão de entrega"
              >
                <Save className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setEditingDate(null)} 
                className="text-red-400"
                title="Cancelar edição"
                aria-label="Cancelar edição de data"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className={cn("font-bold", atrasado && !isLocked ? "text-red-400" : "text-green-400")}>
              {project.estimatedDelivery 
                ? new Date(project.estimatedDelivery).toLocaleDateString('pt-BR')
                : 'Não definida'}
            </span>
          )}
        </div>
        
        <div className={cn(
          "rounded-lg p-2",
          atrasado && !isLocked ? "bg-red-500/20" : "bg-green-500/20"
        )}>
          <span className="text-gray-400 block">Status</span>
          <span className={cn("font-bold", atrasado && !isLocked ? "text-red-400" : "text-green-400")}>
            {isLocked ? '✓ Concluído' : atrasado ? `⚠️ ${diasAtraso}d atrasado` : `✓ ${diasAtraso}d restantes`}
          </span>
        </div>
      </div>

      {isLocked && (
        <div className="mt-3 pt-3 border-t border-green-500/30 flex items-center gap-2 text-sm text-green-400">
          <Shield className="w-4 h-4" />
          <span>Este projeto está concluído. Edições bloqueadas para auditoria.</span>
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
  const [expandedStep, setExpandedStep] = useState<string | null>(
    project.timeline.find(s => s.status === 'in_progress')?.id || null
  )
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [editingDescription, setEditingDescription] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [showPhotoModal, setShowPhotoModal] = useState<string | null>(null)
  const [selectedPhotoType, setSelectedPhotoType] = useState<string>('during')
  
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
    
    if (selectedDate < today) {
      setDateError('A data de previsão não pode ser no passado!')
      return
    }

    // Atualizar a etapa atual como concluída
    onUpdateStep(pendingCompletionStep.id, { 
      status: 'completed',
      date: new Date().toISOString()
    })

    // Atualizar a data de previsão da próxima etapa
    const nextStep = getNextStep(pendingCompletionStep.id)
    if (nextStep) {
      onUpdateStep(nextStep.id, { 
        estimatedDate: new Date(nextStepDate).toISOString()
      })
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

  const handleAddPhoto = (stepId: string) => {
    onAddPhoto(stepId, selectedPhotoType)
    setShowPhotoModal(null)
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
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {step.photos.map((photo, idx) => (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group">
                            <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                                Foto {idx + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                        {!isProjectLocked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowPhotoModal(step.id); }}
                            className="aspect-video rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-primary/50 transition-colors"
                            title="Adicionar foto"
                            aria-label="Adicionar foto"
                          >
                            <Camera className="w-6 h-6 text-gray-500" />
                          </button>
                        )}
                      </div>
                    ) : !isProjectLocked ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowPhotoModal(step.id); }}
                        className="w-full p-6 rounded-xl border-2 border-dashed border-white/20 text-center hover:border-primary/50 transition-colors"
                      >
                        <Camera className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Adicionar fotos desta etapa</p>
                      </button>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Nenhuma foto registrada</p>
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

                    <button
                      onClick={() => handleAddPhoto(step.id)}
                      className="w-full bg-primary text-black py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Selecionar Foto</span>
                    </button>
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
