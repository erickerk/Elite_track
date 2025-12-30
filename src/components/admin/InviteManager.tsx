import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserPlus, Copy, CheckCircle, Clock, XCircle, 
  AlertCircle, Trash2, RefreshCw, Car, Mail, Phone, User,
  Link as LinkIcon, Share2, X, Download, Filter
} from 'lucide-react'
import { useInvite } from '../../contexts/InviteContext'
import { mockProjects } from '../../data/mockData'
import type { RegistrationInvite } from '../../types'

const exportInvitesToExcel = (invites: RegistrationInvite[], filename: string) => {
  const data = invites.map(inv => ({
    'Proprietário': inv.ownerName,
    'Veículo': inv.vehicleInfo,
    'Placa': inv.vehiclePlate,
    'Status': inv.status === 'pending' ? 'Pendente' : inv.status === 'used' ? 'Utilizado' : inv.status === 'expired' ? 'Expirado' : 'Revogado',
    'Token': inv.token,
    'Criado em': new Date(inv.createdAt).toLocaleDateString('pt-BR'),
    'Expira em': new Date(inv.expiresAt).toLocaleDateString('pt-BR'),
  }))
  
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(';'),
    ...data.map(row => headers.map(h => String((row as Record<string, string>)[h] ?? '')).join(';'))
  ].join('\n')
  
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

interface InviteManagerProps {
  projectId?: string
  onClose?: () => void
}

export function InviteManager({ projectId, onClose }: InviteManagerProps) {
  const { invites, createInvite, revokeInvite, getInvitesByProject } = useInvite()
  const [selectedProject, setSelectedProject] = useState(projectId || '')
  const [ownerData, setOwnerData] = useState({ name: '', email: '', phone: '' })
  const [isCreating, setIsCreating] = useState(false)
  const [newInvite, setNewInvite] = useState<RegistrationInvite | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'used' | 'expired' | 'revoked'>('all')

  const displayedInvites = useMemo(() => {
    const baseInvites = projectId ? getInvitesByProject(projectId) : invites
    return baseInvites.filter(i => filter === 'all' || i.status === filter)
  }, [projectId, invites, filter, getInvitesByProject])

  const inviteStats = useMemo(() => ({
    total: invites.length,
    pending: invites.filter(i => i.status === 'pending').length,
    used: invites.filter(i => i.status === 'used').length,
    expired: invites.filter(i => i.status === 'expired').length,
    revoked: invites.filter(i => i.status === 'revoked').length,
  }), [invites])

  const handleExportInvites = () => {
    exportInvitesToExcel(displayedInvites, 'convites')
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-status-warning', bg: 'bg-status-warning/20', label: 'Pendente' }
      case 'used':
        return { icon: CheckCircle, color: 'text-status-success', bg: 'bg-status-success/20', label: 'Utilizado' }
      case 'expired':
        return { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Expirado' }
      case 'revoked':
        return { icon: XCircle, color: 'text-status-error', bg: 'bg-status-error/20', label: 'Revogado' }
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20', label: status }
    }
  }

  const handleCreateInvite = async () => {
    if (!selectedProject || !ownerData.name) return

    setIsCreating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const invite = createInvite(selectedProject, ownerData)
      setNewInvite(invite)
      setOwnerData({ name: '', email: '', phone: '' })
    } catch (error) {
      console.error('Erro ao criar convite:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (text: string, token: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  const getInviteLink = (token: string) => {
    return `${window.location.origin}/register/${token}`
  }

  const shareInvite = async (invite: RegistrationInvite) => {
    const link = getInviteLink(invite.token)
    const text = `Olá ${invite.ownerName}!\n\nSeu veículo (${invite.vehicleInfo}) está em processo de blindagem na Elite Blindagens.\n\nUse o link abaixo para criar sua conta e acompanhar todo o processo:\n\n${link}\n\nEste link é válido até ${new Date(invite.expiresAt).toLocaleDateString('pt-BR')}.`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'EliteTrack - Convite de Cadastro', text, url: link })
      } catch {
        copyToClipboard(text, invite.token)
      }
    } else {
      copyToClipboard(text, invite.token)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-gold" />
            Gerenciar Convites de Cadastro
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Crie e gerencie convites para clientes se cadastrarem na plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportInvites}
            disabled={displayedInvites.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-carbon-700 text-gray-400 hover:text-white hover:bg-carbon-600 transition-colors"
              title="Fechar"
              aria-label="Fechar gerenciador de convites"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Estatísticas de Convites */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-carbon-800 rounded-xl p-3 border border-carbon-700 text-center">
          <div className="text-2xl font-bold text-white">{inviteStats.total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20 text-center">
          <div className="text-2xl font-bold text-yellow-400">{inviteStats.pending}</div>
          <div className="text-xs text-gray-400">Pendentes</div>
        </div>
        <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20 text-center">
          <div className="text-2xl font-bold text-green-400">{inviteStats.used}</div>
          <div className="text-xs text-gray-400">Utilizados</div>
        </div>
        <div className="bg-gray-500/10 rounded-xl p-3 border border-gray-500/20 text-center">
          <div className="text-2xl font-bold text-gray-400">{inviteStats.expired}</div>
          <div className="text-xs text-gray-400">Expirados</div>
        </div>
        <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
          <div className="text-2xl font-bold text-red-400">{inviteStats.revoked}</div>
          <div className="text-xs text-gray-400">Revogados</div>
        </div>
      </div>

      {/* Create New Invite */}
      <div className="bg-carbon-800 rounded-2xl p-6 border border-carbon-700">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-gold" />
          Criar Novo Convite
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Projeto */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Projeto/Veículo</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-carbon-700 border border-carbon-600 rounded-xl px-4 py-3 text-white focus:border-gold focus:outline-none"
              disabled={!!projectId}
              title="Selecione um projeto"
              aria-label="Selecione um projeto para gerar convite"
            >
              <option value="">Selecione um projeto...</option>
              {mockProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.vehicle.brand} {p.vehicle.model} - {p.vehicle.plate}
                </option>
              ))}
            </select>
          </div>

          {/* Nome do proprietário */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nome do Proprietário *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={ownerData.name}
                onChange={(e) => setOwnerData({ ...ownerData, name: e.target.value })}
                className="w-full bg-carbon-700 border border-carbon-600 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none"
                placeholder="Nome completo"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email (opcional)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={ownerData.email}
                onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                className="w-full bg-carbon-700 border border-carbon-600 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Telefone (opcional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                value={ownerData.phone}
                onChange={(e) => setOwnerData({ ...ownerData, phone: e.target.value })}
                className="w-full bg-carbon-700 border border-carbon-600 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateInvite}
          disabled={!selectedProject || !ownerData.name || isCreating}
          className="mt-4 bg-gold text-carbon-900 font-semibold px-6 py-3 rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isCreating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Gerando convite...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Gerar Convite
            </>
          )}
        </button>
      </div>

      {/* New Invite Modal */}
      <AnimatePresence>
        {newInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setNewInvite(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-carbon-800 rounded-3xl p-6 max-w-md w-full border border-gold/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-status-success" />
                </div>
                <h3 className="text-xl font-bold text-white">Convite Criado!</h3>
                <p className="text-sm text-gray-400 mt-1">Envie o link abaixo para o cliente</p>
              </div>

              {/* Vehicle Info */}
              <div className="bg-carbon-700 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Car className="w-8 h-8 text-gold" />
                  <div>
                    <p className="font-medium text-white">{newInvite.vehicleInfo}</p>
                    <p className="text-sm text-gray-400">Placa: {newInvite.vehiclePlate}</p>
                  </div>
                </div>
              </div>

              {/* Token */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">Token do Convite</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-carbon-900 rounded-lg px-4 py-3 font-mono text-gold text-center text-lg tracking-wider">
                    {newInvite.token}
                  </div>
                  <button
                    onClick={() => copyToClipboard(newInvite.token, newInvite.token)}
                    className="p-3 bg-carbon-700 rounded-lg hover:bg-carbon-600 transition-colors"
                  >
                    {copiedToken === newInvite.token ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Link */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">Link de Cadastro</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-carbon-900 rounded-lg px-4 py-3 text-sm text-gray-300 truncate">
                    {getInviteLink(newInvite.token)}
                  </div>
                  <button
                    onClick={() => copyToClipboard(getInviteLink(newInvite.token), `link-${newInvite.token}`)}
                    className="p-3 bg-carbon-700 rounded-lg hover:bg-carbon-600 transition-colors"
                  >
                    {copiedToken === `link-${newInvite.token}` ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <LinkIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expiration */}
              <div className="text-center text-sm text-gray-400 mb-6">
                <Clock className="w-4 h-4 inline mr-1" />
                Válido até {new Date(newInvite.expiresAt).toLocaleDateString('pt-BR')} às {new Date(newInvite.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => shareInvite(newInvite)}
                  className="flex-1 bg-gold text-carbon-900 font-semibold py-3 rounded-xl hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Compartilhar
                </button>
                <button
                  onClick={() => setNewInvite(null)}
                  className="flex-1 border border-carbon-600 text-white py-3 rounded-xl hover:bg-carbon-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      {!projectId && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filtrar:</span>
          {(['all', 'pending', 'used', 'expired', 'revoked'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-gold text-carbon-900' 
                  : 'bg-carbon-800 text-gray-400 hover:text-white'
              }`}
            >
              {f === 'all' ? `Todos (${inviteStats.total})` : 
               f === 'pending' ? `Pendentes (${inviteStats.pending})` : 
               f === 'used' ? `Utilizados (${inviteStats.used})` : 
               f === 'expired' ? `Expirados (${inviteStats.expired})` :
               `Revogados (${inviteStats.revoked})`}
            </button>
          ))}
        </div>
      )}

      {/* Invites List */}
      <div className="space-y-3">
        {displayedInvites.length === 0 ? (
          <div className="text-center py-12 bg-carbon-800 rounded-2xl">
            <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum convite encontrado</p>
          </div>
        ) : (
          displayedInvites.map(invite => {
            const status = getStatusConfig(invite.status)
            const StatusIcon = status.icon

            return (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-carbon-800 rounded-xl p-4 border border-carbon-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-500">{invite.id}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-white font-medium">{invite.ownerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400">{invite.vehicleInfo}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Criado: {new Date(invite.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span>Expira: {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {invite.status === 'pending' && (
                      <>
                        <button
                          onClick={() => copyToClipboard(getInviteLink(invite.token), invite.token)}
                          className="p-2 rounded-lg bg-carbon-700 text-gray-400 hover:text-white hover:bg-carbon-600 transition-colors"
                          title="Copiar link"
                        >
                          {copiedToken === invite.token ? (
                            <CheckCircle className="w-5 h-5 text-status-success" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => shareInvite(invite)}
                          className="p-2 rounded-lg bg-carbon-700 text-gray-400 hover:text-white hover:bg-carbon-600 transition-colors"
                          title="Compartilhar"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => revokeInvite(invite.id)}
                          className="p-2 rounded-lg bg-carbon-700 text-gray-400 hover:text-status-error hover:bg-status-error/10 transition-colors"
                          title="Revogar convite"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {invite.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-carbon-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Token:</span>
                      <code className="text-xs font-mono text-gold bg-carbon-900 px-2 py-1 rounded">
                        {invite.token}
                      </code>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
