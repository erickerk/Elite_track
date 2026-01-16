import { useState, useRef, useEffect } from 'react'
import { 
  Camera, Upload, X, Check, Image as ImageIcon, 
  Folder, Tag, Clock, ChevronDown, Car, Lock, Shield
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Project, TimelineStep } from '../../types'
import { uploadToStorage } from '../../services/photoUploadService'
import { saveStepPhoto, getStepPhotos, subscribeToProjectPhotos } from '../../services/realtimeSync'
import { useProjects } from '../../contexts/ProjectContext'

interface ExecutorPhotosProps {
  project: Project
  onUploadPhoto: (stepId: string, photoType: string, description: string) => void
}

// Componente de Cabeçalho do Veículo Selecionado
function VehicleHeader({ project, isLocked }: { project: Project; isLocked: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl p-4 sm:p-6 mb-6 border transition-all duration-500",
      isLocked 
        ? "bg-green-500/5 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]" 
        : "bg-primary/5 border-primary/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
    )}>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Foto do Veículo - Premium Scale */}
        <div className={cn(
          "w-full sm:w-24 h-40 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-carbon-900 border border-white/10 shadow-xl",
          isLocked ? "border-green-500/30" : "border-primary/30"
        )}>
          {project.vehicle.images?.[0] ? (
            <img 
              src={project.vehicle.images[0]} 
              alt={project.vehicle.model} 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-10 h-10 text-gray-600" />
            </div>
          )}
        </div>
        
        {/* Info do Veículo */}
        <div className="flex-1 text-center sm:text-left w-full">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md",
              isLocked ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-primary/10 border-primary/20 text-primary"
            )}>
              {isLocked ? <Lock className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-primary luxury-glow animate-pulse" />}
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {isLocked ? 'CONCLUÍDO' : 'EM EXECUÇÃO'}
              </span>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none mb-2">
            {project.vehicle.brand} <span className="text-primary">{project.vehicle.model}</span>
          </h3>

          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-medium text-gray-400">
            <span className="font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 tracking-tighter">
              {project.vehicle.plate}
            </span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span>{project.user.name}</span>
          </div>
        </div>

        {isLocked && (
          <div className="w-full sm:w-auto p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            <span>Finalizado</span>
          </div>
        )}
      </div>
    </div>
  )
}

const photoCategories = [
  { id: 'vehicle_exterior', label: 'Exterior do Veículo', icon: '🚗' },
  { id: 'vehicle_interior', label: 'Interior do Veículo', icon: '🪑' },
  { id: 'glass_work', label: 'Trabalho em Vidros', icon: '🪟' },
  { id: 'body_armor', label: 'Blindagem da Carroceria', icon: '🛡️' },
  { id: 'materials', label: 'Materiais Utilizados', icon: '📦' },
  { id: 'details', label: 'Detalhes e Acabamento', icon: '🔍' },
  { id: 'documentation', label: 'Documentação', icon: '📄' },
]

export function ExecutorPhotos({ project, onUploadPhoto }: ExecutorPhotosProps) {
  const { refreshProjects } = useProjects()
  const [selectedStep, setSelectedStep] = useState<TimelineStep | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [photoDescription, setPhotoDescription] = useState('')
  const [photoCategory, setPhotoCategory] = useState('details')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [supabasePhotos, setSupabasePhotos] = useState<Record<string, any[]>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Verificar se o projeto está concluído (bloqueado para edição)
  const isProjectLocked = project.status === 'completed' || project.status === 'delivered'

  // Carregar fotos do Supabase e subscrever a atualizações em tempo real
  useEffect(() => {
    const loadPhotos = async () => {
      const photosMap: Record<string, any[]> = {}
      for (const step of project.timeline) {
        const photos = await getStepPhotos(step.id)
        if (photos.length > 0) {
          photosMap[step.id] = photos
        }
      }
      setSupabasePhotos(photosMap)
    }
    
    loadPhotos()

    // Subscrever a atualizações em tempo real
    const unsubscribe = subscribeToProjectPhotos(
      project.id,
      (newPhoto) => {
        // Atualizar fotos quando uma nova é inserida
        setSupabasePhotos(prev => ({
          ...prev,
          [newPhoto.step_id]: [...(prev[newPhoto.step_id] || []), newPhoto]
        }))
      }
    )

    return () => {
      unsubscribe()
    }
  }, [project.id, project.timeline])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (selectedStep && previewUrl && selectedFile) {
      setIsUploading(true)
      
      try {
        // Upload para Supabase Storage
        const photoUrl = await uploadToStorage(selectedFile, 'step-photos', `step_${selectedStep.id}`)
        
        if (photoUrl) {
          // Salvar referência na tabela step_photos
          await saveStepPhoto(
            selectedStep.id,
            project.id,
            photoUrl,
            photoCategory,
            selectedStep.title,
            photoDescription,
            'executor'
          )
          
          // Forçar atualização imediata dos projetos para exibir a foto sem F5
          await refreshProjects()
          
          // Também chamar o callback original para atualização local
          onUploadPhoto(selectedStep.id, photoCategory, photoDescription)
        }
      } catch (error) {
        console.error('[ExecutorPhotos] Erro no upload:', error)
      } finally {
        setIsUploading(false)
        resetUploadForm()
      }
    }
  }

  const resetUploadForm = () => {
    setShowUploadModal(false)
    setPreviewUrl(null)
    setSelectedFile(null)
    setPhotoDescription('')
    setPhotoCategory('details')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openUploadModal = (step: TimelineStep) => {
    setSelectedStep(step)
    setShowUploadModal(true)
  }

  // Combinar fotos locais com fotos do Supabase
  const allPhotos = project.timeline.flatMap(step => {
    const localPhotos = step.photos.map((photo, idx) => ({
      url: photo,
      stepId: step.id,
      stepTitle: step.title,
      index: idx,
      source: 'local' as const
    }))
    
    const cloudPhotos = (supabasePhotos[step.id] || []).map((photo, idx) => ({
      url: photo.photo_url,
      stepId: step.id,
      stepTitle: step.title,
      index: idx + localPhotos.length,
      source: 'supabase' as const
    }))
    
    return [...localPhotos, ...cloudPhotos]
  })

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Veículo Selecionado */}
      <VehicleHeader project={project} isLocked={isProjectLocked} />

      {/* Summary Header - Premium Mobile Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-all">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{allPhotos.length}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Total de Fotos</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center group hover:border-blue-400/30 transition-all">
          <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-400/20 transition-colors">
            <Folder className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{project.timeline.filter(s => s.photos.length > 0).length}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Etapas Ativas</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center group hover:border-yellow-400/30 transition-all">
          <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-yellow-400/20 transition-colors">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{project.timeline.filter(s => s.status === 'in_progress').length}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Em Andamento</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center group hover:border-green-400/30 transition-all">
          <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-400/20 transition-colors">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{project.timeline.filter(s => s.status === 'completed').length}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Concluídas</div>
        </div>
      </div>

      {/* Photos by Step */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Fotos por Etapa</h3>
        
        {project.timeline.map((step) => {
          const statusColor = step.status === 'completed' ? 'text-green-400' :
                             step.status === 'in_progress' ? 'text-primary' : 'text-gray-400'
          
          return (
            <div key={step.id} className="bg-white/5 rounded-2xl overflow-hidden">
              {/* Step Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    step.status === 'completed' ? "bg-green-500" :
                    step.status === 'in_progress' ? "bg-primary" : "bg-gray-500"
                  )} />
                  <div>
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className={cn("text-xs", statusColor)}>
                      {step.status === 'completed' ? 'Concluída' :
                       step.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                      {' • '}{step.photos.length} foto(s)
                    </p>
                  </div>
                </div>
                {!isProjectLocked && (
                  <button
                    onClick={() => openUploadModal(step)}
                    className="flex items-center space-x-2 bg-primary/20 text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                )}
              </div>

              {/* Photos Grid */}
              <div className="p-4">
                {step.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {step.photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-white/5 bg-carbon-900 shadow-lg">
                        <img 
                          src={photo} 
                          alt={`${step.title} - Foto ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                          <span className="text-[10px] text-primary font-bold uppercase tracking-widest mb-0.5 truncate">Foto {idx + 1}</span>
                          <span className="text-xs text-white font-bold truncate leading-tight">{step.title}</span>
                        </div>
                      </div>
                    ))}
                    {/* Add Photo Button - apenas se não bloqueado */}
                    {!isProjectLocked && (
                      <button
                        onClick={() => openUploadModal(step)}
                        className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/30 bg-white/5 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                        title="Adicionar foto"
                        aria-label="Adicionar foto"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Camera className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-primary">Adicionar</span>
                      </button>
                    )}
                  </div>
                ) : !isProjectLocked ? (
                  <button
                    onClick={() => openUploadModal(step)}
                    className="w-full py-10 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Camera className="w-6 h-6 text-gray-600 group-hover:text-primary" />
                    </div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest group-hover:text-primary transition-colors">Adicionar Evidências</p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Clique para selecionar arquivos</p>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 bg-white/5 rounded-2xl border border-white/5 opacity-50">
                    <Shield className="w-8 h-8 text-gray-600 mb-2" />
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nenhuma foto registrada</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedStep && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => resetUploadForm()}
        >
          <div 
            className="bg-carbon-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Adicionar Foto</h3>
                <p className="text-sm text-gray-400">{selectedStep.title}</p>
              </div>
              <button
                onClick={() => resetUploadForm()}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
              {previewUrl ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-carbon-900">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                    aria-label="Remover foto"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Clique para selecionar uma foto</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG ou HEIC até 10MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}

              {/* Category Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Categoria da Foto
                </label>
                <div className="relative">
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white appearance-none cursor-pointer"
                    aria-label="Categoria da foto"
                  >
                    {photoCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  placeholder="Ex: Instalação da manta balística no painel frontal..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none h-24"
                />
              </div>

              {/* Info Box */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <p className="text-sm text-primary">
                  <strong>Dica:</strong> Fotos bem categorizadas e descritas ajudam o cliente a acompanhar melhor o processo de blindagem.
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => resetUploadForm()}
                  className="flex-1 bg-white/10 text-white py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!previewUrl || isUploading}
                  className="flex-1 bg-primary text-black py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Enviar Foto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
