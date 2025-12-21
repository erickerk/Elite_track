import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Upload, FileText, Image, File, Trash2, Download, Eye,
  CheckCircle, Clock, AlertCircle, Plus, X, Shield
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { cn } from '../lib/utils'

interface Document {
  id: string
  name: string
  type: 'image' | 'pdf' | 'document'
  size: string
  uploadedAt: string
  status: 'pending' | 'approved' | 'rejected'
  category: 'vehicle' | 'personal' | 'insurance' | 'other'
  url?: string
}

const mockDocuments: Document[] = [
  { id: '1', name: 'CNH_Frente.jpg', type: 'image', size: '1.2 MB', uploadedAt: '2024-12-10', status: 'approved', category: 'personal' },
  { id: '2', name: 'CNH_Verso.jpg', type: 'image', size: '1.1 MB', uploadedAt: '2024-12-10', status: 'approved', category: 'personal' },
  { id: '3', name: 'CRLV_2024.pdf', type: 'pdf', size: '856 KB', uploadedAt: '2024-12-11', status: 'approved', category: 'vehicle' },
  { id: '4', name: 'Apolice_Seguro.pdf', type: 'pdf', size: '2.3 MB', uploadedAt: '2024-12-12', status: 'pending', category: 'insurance' },
]

const categories = [
  { id: 'vehicle', label: 'Veículo', icon: '🚗' },
  { id: 'personal', label: 'Pessoal', icon: '👤' },
  { id: 'insurance', label: 'Seguro', icon: '🛡️' },
  { id: 'other', label: 'Outros', icon: '📎' },
]

const statusConfig = {
  pending: { label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: Clock },
  approved: { label: 'Aprovado', color: 'text-green-400', bg: 'bg-green-400/20', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'text-red-400', bg: 'bg-red-400/20', icon: AlertCircle },
}

export function ClientDocuments() {
  const navigate = useNavigate()
  useAuth()
  const { addNotification } = useNotifications()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [uploadCategory, setUploadCategory] = useState<string>('other')
  const [dragOver, setDragOver] = useState(false)

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(d => d.category === selectedCategory)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      const newDoc: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'pending',
        category: uploadCategory as Document['category'],
        url: URL.createObjectURL(file),
      }
      setDocuments(prev => [newDoc, ...prev])
    })

    addNotification({
      type: 'success',
      title: 'Upload Concluído',
      message: `${files.length} arquivo(s) enviado(s) com sucesso.`,
    })
    setShowUploadModal(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDelete = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId))
    addNotification({ type: 'info', title: 'Documento Removido', message: 'O documento foi removido com sucesso.' })
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return Image
      case 'pdf': return FileText
      default: return File
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      {/* Header */}
      <header className="bg-carbon-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                title="Voltar"
              >
                <i className="ri-arrow-left-line text-white"></i>
              </button>
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-['Pacifico'] text-xl text-primary">EliteTrack™</span>
              </div>
            </div>
            <h1 className="text-lg font-semibold">Meus Documentos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                selectedCategory === 'all' ? "bg-primary text-black" : "bg-white/10 hover:bg-white/20"
              )}
            >
              Todos ({documents.length})
            </button>
            {categories.map(cat => {
              const count = documents.filter(d => d.category === cat.id).length
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2",
                    selectedCategory === cat.id ? "bg-primary text-black" : "bg-white/10 hover:bg-white/20"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label} ({count})</span>
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 bg-primary text-black px-4 py-2 rounded-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Enviar Documento</span>
          </button>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum documento encontrado</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 text-primary hover:underline"
              >
                Enviar primeiro documento
              </button>
            </div>
          ) : (
            filteredDocuments.map(doc => {
              const FileIcon = getFileIcon(doc.type)
              const status = statusConfig[doc.status]
              const StatusIcon = status.icon
              return (
                <div
                  key={doc.id}
                  className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <FileIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <div className="flex items-center space-x-3 text-sm text-gray-400">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span className={cn("flex items-center space-x-1", status.color)}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{status.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.url && (
                      <button
                        onClick={() => { setSelectedDocument(doc); setShowPreviewModal(true); }}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => addNotification({ type: 'info', title: 'Download', message: 'Download iniciado.' })}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      title="Baixar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-red-500/20 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} size="md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Enviar Documento</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setUploadCategory(cat.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all flex items-center space-x-2",
                    uploadCategory === cat.id ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/30"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
              dragOver ? "border-primary bg-primary/10" : "border-white/20 hover:border-white/40"
            )}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">Arraste arquivos ou clique para selecionar</p>
            <p className="text-sm text-gray-500">PDF, JPG, PNG até 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              title="Selecionar arquivos"
            />
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowUploadModal(false)}
              className="px-6 py-2 bg-white/10 rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} size="lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{selectedDocument?.name}</h2>
            <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-white/10 rounded-lg" title="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>
          {selectedDocument?.url && selectedDocument.type === 'image' && (
            <img src={selectedDocument.url} alt={selectedDocument.name} className="max-w-full rounded-xl" />
          )}
          {selectedDocument?.type === 'pdf' && (
            <div className="bg-white/5 rounded-xl p-8 text-center">
              <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-gray-400">Visualização de PDF</p>
              <button className="mt-4 bg-primary text-black px-4 py-2 rounded-xl font-semibold">
                Abrir PDF
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
