import { useState } from 'react'
import { X, Users, Car, FileText, Mail, Shield, Download, Eye, MessageCircle, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { Modal } from '../ui/Modal'
import type { Project } from '../../types'
import { cn } from '../../lib/utils'
import { getAppBaseUrl } from '../../constants/companyInfo'

interface ClientDetailModalProps {
  isOpen: boolean
  onClose: () => void
  client: Project | null
  allClientProjects: Project[]
  onSelectProject: (project: Project) => void
  onNotification: (notification: { type: 'info' | 'success' | 'warning' | 'error'; title: string; message: string }) => void
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-gray-500', textColor: 'text-gray-400' },
  in_progress: { label: 'Em Andamento', color: 'bg-primary', textColor: 'text-primary' },
  completed: { label: 'Concluído', color: 'bg-green-500', textColor: 'text-green-400' },
  delivered: { label: 'Entregue', color: 'bg-blue-500', textColor: 'text-blue-400' },
}

export function ClientDetailModal({ 
  isOpen, 
  onClose, 
  client, 
  allClientProjects,
  onSelectProject,
  onNotification 
}: ClientDetailModalProps) {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  if (!client) return null

  const handleWhatsApp = () => {
    const phone = client.user.phone?.replace(/\D/g, '')
    const msg = `Olá ${client.user.name}! Aqui é da Elite Blindagens.`
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleEmail = () => {
    window.open(`mailto:${client.user.email}?subject=Elite Blindagens - ${client.vehicle.brand} ${client.vehicle.model}`, '_blank')
  }

  const handleResendQR = async () => {
    setIsGeneratingQR(true)
    try {
      const verifyUrl = `${getAppBaseUrl()}/verify/${client.id}`
      const loginUrl = `${getAppBaseUrl()}/login?project=${client.id}`
      
      // Gerar QR Code como data URL
      await QRCode.toDataURL(verifyUrl, {
        width: 400,
        margin: 3,
        color: { dark: '#D4AF37', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      })

      // Enviar via WhatsApp com links
      const phone = client.user.phone?.replace(/\D/g, '')
      const msg = [
        `Olá ${client.user.name}! 🚗✨`,
        ``,
        `Aqui é a *Elite Blindagens*. Segue os links do seu projeto:`,
        ``,
        `🔐 *Acesso ao Painel:*`,
        loginUrl,
        ``,
        `✅ *Verificar Autenticidade:*`,
        verifyUrl,
        ``,
        `📋 *Veículo:* ${client.vehicle.brand} ${client.vehicle.model}`,
        `📌 *Placa:* ${client.vehicle.plate}`,
        ``,
        `Qualquer dúvida, estamos à disposição!`,
        `*Elite Blindagens* - Proteção com Excelência`,
      ].join('\n')
      
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
      
      onNotification({
        type: 'success',
        title: 'QR Code Reenviado',
        message: `Links de acesso enviados para ${client.user.name} via WhatsApp.`,
      })
    } catch (err) {
      console.error('[ClientDetail] Erro ao gerar QR:', err)
      onNotification({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível gerar o QR Code. Tente novamente.',
      })
    } finally {
      setIsGeneratingQR(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">{client.user.name}</h2>
              <p className="text-sm text-gray-400 truncate">{client.user.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 p-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">WhatsApp</span>
          </button>
          <button
            onClick={handleEmail}
            className="flex items-center justify-center gap-2 p-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors"
          >
            <Mail className="w-5 h-5" />
            <span className="font-medium">Email</span>
          </button>
          <button
            onClick={() => void handleResendQR()}
            disabled={isGeneratingQR}
            className="flex items-center justify-center gap-2 p-3 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            <QrCode className="w-5 h-5" />
            <span className="font-medium">{isGeneratingQR ? 'Gerando...' : 'Reenviar QR'}</span>
          </button>
        </div>

        {/* Informações do Cliente */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-primary flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              Dados Pessoais
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-400 whitespace-nowrap">Nome:</span>
                <span className="font-medium text-right truncate">{client.user.name}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-400 whitespace-nowrap">E-mail:</span>
                <span className="font-medium text-sm text-right truncate">{client.user.email}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-400 whitespace-nowrap">Telefone:</span>
                <span className="font-medium text-right">{client.user.phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-5">
            <h3 className="font-semibold text-primary flex items-center gap-2 mb-4">
              <Car className="w-5 h-5" />
              Veículo Selecionado
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-400 whitespace-nowrap">Veículo:</span>
                <span className="font-medium text-right truncate">{client.vehicle.brand} {client.vehicle.model}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-400 whitespace-nowrap">Ano:</span>
                <span className="font-medium text-right">{client.vehicle.year}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-400 whitespace-nowrap">Placa:</span>
                <span className="font-mono font-medium text-right">{client.vehicle.plate}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-400 whitespace-nowrap">Nível:</span>
                <span className="font-medium text-primary text-right">{client.vehicle.blindingLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Veículos do Cliente (se tiver múltiplos) */}
        {allClientProjects.length > 1 && (
          <div className="mb-6">
            <h3 className="font-semibold text-primary flex items-center gap-2 mb-4">
              <Car className="w-5 h-5" />
              Todos os Veículos ({allClientProjects.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allClientProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className={cn(
                    "p-4 rounded-xl text-left transition-all",
                    project.id === client.id
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{project.vehicle.brand} {project.vehicle.model}</p>
                      <p className="text-sm text-gray-400 truncate">{project.vehicle.plate} • {project.vehicle.year}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      statusConfig[project.status]?.color || 'bg-gray-500',
                      "text-white"
                    )}>
                      {statusConfig[project.status]?.label || project.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status do Projeto */}
        <div className="bg-white/5 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-primary flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" />
            Status do Projeto
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <p className="text-2xl font-bold text-primary">{client.progress || 0}%</p>
              <p className="text-xs text-gray-400">Progresso</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <p className="text-sm sm:text-base font-bold truncate">{statusConfig[client.status]?.label}</p>
              <p className="text-xs text-gray-400">Status</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <p className="text-sm sm:text-base font-bold">{new Date(client.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
              <p className="text-xs text-gray-400">Início</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <p className="text-sm sm:text-base font-bold">{new Date(client.estimatedDelivery).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
              <p className="text-xs text-gray-400">Previsão</p>
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white/5 rounded-2xl p-5">
          <h3 className="font-semibold text-primary flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            Documentos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNotification({ type: 'info', title: 'CNH', message: 'Visualizando CNH do cliente' })}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <i className="ri-id-card-line text-primary"></i>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium truncate">CNH</p>
                <p className="text-xs text-gray-400 truncate">Carteira de Habilitação</p>
              </div>
              <Eye className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
            <button
              onClick={() => onNotification({ type: 'info', title: 'CRLV', message: 'Visualizando CRLV do veículo' })}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-car-line text-blue-400"></i>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium truncate">CRLV</p>
                <p className="text-xs text-gray-400 truncate">Documento do Veículo</p>
              </div>
              <Eye className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
            <button
              onClick={() => onNotification({ type: 'info', title: 'Laudo', message: 'Visualizando laudo técnico' })}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-file-shield-2-line text-green-400"></i>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium truncate">Laudo Técnico</p>
                <p className="text-xs text-gray-400 truncate">EliteShield™</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
            <button
              onClick={() => onNotification({ type: 'info', title: 'Contrato', message: 'Visualizando contrato' })}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <i className="ri-file-text-line text-yellow-400"></i>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium truncate">Contrato</p>
                <p className="text-xs text-gray-400 truncate">Prestação de Serviço</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
