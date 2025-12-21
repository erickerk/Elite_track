import { useState } from 'react'
import { 
  CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
  Camera, Upload, Play, Pause, Save, X, Edit3, Plus
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Project, TimelineStep } from '../../types'

interface ExecutorTimelineProps {
  project: Project
  onUpdateStep: (stepId: string, updates: Partial<TimelineStep>) => void
  onAddPhoto: (stepId: string, photoType: string) => void
}

const photoTypes = [
  { id: 'before', label: 'Antes', description: 'Foto do estado inicial' },
  { id: 'during', label: 'Durante', description: 'Foto do processo em andamento' },
  { id: 'after', label: 'Depois', description: 'Foto do resultado final' },
  { id: 'detail', label: 'Detalhe', description: 'Foto de detalhe específico' },
  { id: 'material', label: 'Material', description: 'Foto do material utilizado' },
]

export function ExecutorTimeline({ project, onUpdateStep, onAddPhoto }: ExecutorTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(
    project.timeline.find(s => s.status === 'in_progress')?.id || null
  )
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [editingDescription, setEditingDescription] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [showPhotoModal, setShowPhotoModal] = useState<string | null>(null)
  const [selectedPhotoType, setSelectedPhotoType] = useState<string>('during')

  // Calcular progresso dinamicamente
  const completedSteps = project.timeline.filter(s => s.status === 'completed').length
  const calculatedProgress = Math.round((completedSteps / project.timeline.length) * 100)

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

          return (
            <div
              key={step.id}
              className={cn(
                "rounded-2xl border transition-all overflow-hidden",
                config.border,
                step.status === 'in_progress' && "ring-1 ring-primary/30"
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
                        <button
                          onClick={(e) => { e.stopPropagation(); setDescriptions({ ...descriptions, [step.id]: step.description }); setEditingDescription(step.id); }}
                          className="ml-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          title="Editar descrição"
                        >
                          <Edit3 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex flex-wrap gap-2">
                    {step.status === 'pending' && (
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
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(step, 'completed'); }}
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

                  {/* Photos Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-sm">Fotos da Etapa</h5>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowPhotoModal(step.id); }}
                        className="flex items-center space-x-1 text-primary text-sm hover:underline"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar Foto</span>
                      </button>
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
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowPhotoModal(step.id); }}
                          className="aspect-video rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-primary/50 transition-colors"
                          title="Adicionar foto"
                          aria-label="Adicionar foto"
                        >
                          <Camera className="w-6 h-6 text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowPhotoModal(step.id); }}
                        className="w-full p-6 rounded-xl border-2 border-dashed border-white/20 text-center hover:border-primary/50 transition-colors"
                      >
                        <Camera className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Adicionar fotos desta etapa</p>
                      </button>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-sm">Observações</h5>
                      {!isEditing && (
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
    </div>
  )
}
