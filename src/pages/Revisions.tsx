import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, Clock, CheckCircle, AlertTriangle, Bell,
  Wrench, Shield, Eye, Phone, MapPin, ChevronRight, MessageCircle
} from 'lucide-react'
import { COMPANY_INFO, getWhatsAppLink, getPhoneLink } from '../constants/companyInfo'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'
import { useTheme } from '../contexts/ThemeContext'
import { useProjects } from '../contexts/ProjectContext'

interface Revision {
  id: string
  type: 'annual' | 'preventive' | 'glass' | 'finish'
  title: string
  description: string
  status: 'pending' | 'scheduled' | 'completed' | 'overdue'
  dueDate: string
  completedDate?: string
  notes?: string
}

const mockRevisions: Revision[] = [
  {
    id: 'REV-001',
    type: 'annual',
    title: 'Revisão Anual Completa',
    description: 'Verificação completa de todos os componentes da blindagem',
    status: 'pending',
    dueDate: '2025-01-15',
  },
  {
    id: 'REV-002',
    type: 'glass',
    title: 'Checagem dos Vidros',
    description: 'Verificação de integridade e vedação dos vidros blindados',
    status: 'scheduled',
    dueDate: '2025-12-20',
  },
  {
    id: 'REV-003',
    type: 'finish',
    title: 'Checagem de Acabamento',
    description: 'Verificação de borrachas, guarnições e acabamentos internos',
    status: 'completed',
    dueDate: '2025-06-15',
    completedDate: '2025-06-14',
    notes: 'Todos os itens verificados e aprovados.',
  },
  {
    id: 'REV-004',
    type: 'preventive',
    title: 'Manutenção Preventiva',
    description: 'Lubrificação de dobradiças e verificação de mecanismos',
    status: 'completed',
    dueDate: '2025-03-10',
    completedDate: '2025-03-10',
    notes: 'Dobradiças lubrificadas, vidros regulados.',
  },
]

const typeConfig = {
  annual: { icon: Calendar, color: 'text-gold', bg: 'bg-gold/20', label: 'Anual' },
  preventive: { icon: Wrench, color: 'text-status-info', bg: 'bg-status-info/20', label: 'Preventiva' },
  glass: { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'Vidros' },
  finish: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-400/20', label: 'Acabamento' },
}

const statusConfig = {
  pending: { label: 'Pendente', variant: 'warning' as const },
  scheduled: { label: 'Agendada', variant: 'info' as const },
  completed: { label: 'Concluída', variant: 'success' as const },
  overdue: { label: 'Atrasada', variant: 'error' as const },
}

export function Revisions() {
  const { theme } = useTheme()
  const { projects } = useProjects()
  const project = projects[0]
  const isDark = theme === 'dark'
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const pendingRevisions = mockRevisions.filter(r => r.status === 'pending' || r.status === 'scheduled')
  const completedRevisions = mockRevisions.filter(r => r.status === 'completed')
  const nextRevision = pendingRevisions[0]

  
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-h2 font-bold mb-1">Revisões e Agenda</h1>
        <p className="text-caption text-gray-400">
          Mantenha sua blindagem sempre em dia
        </p>
      </motion.div>

      {nextRevision && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" className="border-2 border-gold/30 bg-gradient-to-br from-gold/10 to-transparent">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center">
                <Bell className="w-7 h-7 text-gold" />
              </div>
              <div className="flex-1">
                <Badge variant="warning" size="sm" className="mb-2">Próxima Revisão</Badge>
                <h3 className="font-semibold text-lg">{nextRevision.title}</h3>
                <p className="text-caption text-gray-400 mb-3">{nextRevision.description}</p>
                <div className="flex items-center gap-4 text-caption">
                  <span className="flex items-center gap-1 text-gold">
                    <Calendar className="w-4 h-4" />
                    {new Date(nextRevision.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                  <Badge variant={statusConfig[nextRevision.status].variant} size="sm">
                    {statusConfig[nextRevision.status].label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gold/20">
              <Button className="w-full" onClick={() => setShowScheduleModal(true)}>
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Revisão
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-h3 font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold" />
          Revisões Pendentes
        </h2>
        
        <div className="space-y-3">
          {pendingRevisions.map((revision) => {
            const config = typeConfig[revision.type]
            const TypeIcon = config.icon
            return (
              <Card 
                key={revision.id} 
                variant="default" 
                hover
                className="cursor-pointer"
                onClick={() => setSelectedRevision(revision)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bg)}>
                      <TypeIcon className={cn('w-5 h-5', config.color)} />
                    </div>
                    <div>
                      <p className="font-medium">{revision.title}</p>
                      <p className="text-caption text-gray-400">
                        Prevista: {new Date(revision.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[revision.status].variant} size="sm">
                      {statusConfig[revision.status].label}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-h3 font-semibold mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-status-success" />
          Histórico de Revisões
        </h2>
        
        <div className="space-y-3">
          {completedRevisions.map((revision) => {
            const config = typeConfig[revision.type]
            const TypeIcon = config.icon
            return (
              <Card 
                key={revision.id} 
                variant="bordered"
                className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                onClick={() => setSelectedRevision(revision)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bg)}>
                      <TypeIcon className={cn('w-5 h-5', config.color)} />
                    </div>
                    <div>
                      <p className="font-medium">{revision.title}</p>
                      <p className="text-caption text-gray-400">
                        Realizada: {revision.completedDate ? new Date(revision.completedDate).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    OK
                  </Badge>
                </div>
              </Card>
            )
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="default" className={cn(
          'border-l-4 border-l-status-info',
          isDark ? 'bg-status-info/5' : 'bg-status-info/10'
        )}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-status-info mb-1">Lembrete Importante</p>
              <p className="text-caption text-gray-400">
                A revisão anual é essencial para manter a garantia da sua blindagem 
                e garantir o funcionamento adequado de todos os componentes.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={!!selectedRevision}
        onClose={() => setSelectedRevision(null)}
        title={selectedRevision?.title || 'Detalhes da Revisão'}
        size="md"
      >
        {selectedRevision && (
          <div className="space-y-4">
            <div className={cn(
              'p-4 rounded-xl',
              isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
            )}>
              <p className="text-caption text-gray-400 mb-2">Descrição</p>
              <p>{selectedRevision.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                'p-3 rounded-xl',
                isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
              )}>
                <p className="text-micro text-gray-400">Tipo</p>
                <p className="font-semibold">{typeConfig[selectedRevision.type].label}</p>
              </div>
              <div className={cn(
                'p-3 rounded-xl',
                isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
              )}>
                <p className="text-micro text-gray-400">Status</p>
                <Badge variant={statusConfig[selectedRevision.status].variant}>
                  {statusConfig[selectedRevision.status].label}
                </Badge>
              </div>
              <div className={cn(
                'p-3 rounded-xl',
                isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
              )}>
                <p className="text-micro text-gray-400">Data Prevista</p>
                <p className="font-semibold">{new Date(selectedRevision.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
              {selectedRevision.completedDate && (
                <div className={cn(
                  'p-3 rounded-xl',
                  isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
                )}>
                  <p className="text-micro text-gray-400">Data Realizada</p>
                  <p className="font-semibold">{new Date(selectedRevision.completedDate).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>

            {selectedRevision.notes && (
              <div className={cn(
                'p-4 rounded-xl border-l-4 border-l-status-success',
                isDark ? 'bg-status-success/5' : 'bg-status-success/10'
              )}>
                <p className="text-micro text-gray-400 mb-1">Observações</p>
                <p className="text-caption">{selectedRevision.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedRevision(null)}>
                Fechar
              </Button>
              {selectedRevision.status !== 'completed' && (
                <Button className="flex-1" onClick={() => {
                  setSelectedRevision(null)
                  setShowScheduleModal(true)
                }}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Agendar Revisão"
        size="md"
      >
        <div className="space-y-4">
          <div className={cn(
            'p-4 rounded-xl',
            isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
          )}>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={project.vehicle.images[0]}
                alt={project.vehicle.model}
                className="w-16 h-12 rounded-lg object-cover"
              />
              <div>
                <p className="font-semibold">{project.vehicle.brand} {project.vehicle.model}</p>
                <p className="text-caption text-gray-400">{project.vehicle.plate}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-caption font-medium mb-2">Data Preferencial</label>
            <input
              type="date"
              className={cn(
                'w-full rounded-xl px-4 py-3 border outline-none',
                isDark ? 'bg-carbon-800 border-carbon-700 text-white' : 'bg-white border-gray-300'
              )}
              min={new Date().toISOString().split('T')[0]}
              title="Selecione a data preferencial"
              aria-label="Data preferencial para revisão"
            />
          </div>

          <div>
            <label className="block text-caption font-medium mb-2">Horário</label>
            <select 
              className={cn(
                'w-full rounded-xl px-4 py-3 border outline-none',
                isDark ? 'bg-carbon-800 border-carbon-700 text-white' : 'bg-white border-gray-300'
              )}
              title="Selecione o horário"
              aria-label="Horário preferencial para revisão"
            >
              <option>08:00 - 09:00</option>
              <option>09:00 - 10:00</option>
              <option>10:00 - 11:00</option>
              <option>14:00 - 15:00</option>
              <option>15:00 - 16:00</option>
              <option>16:00 - 17:00</option>
            </select>
          </div>

          <div className={cn(
            'p-4 rounded-xl border border-gold/30 bg-gold/5',
          )}>
            <p className="font-semibold text-gold mb-3 text-center">Entre em contato para agendar</p>
            
            <a 
              href={`https://maps.google.com/?q=${encodeURIComponent(COMPANY_INFO.address.full)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'p-3 rounded-xl flex items-center gap-3 mb-2 transition-colors hover:bg-gold/10',
                isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
              )}
            >
              <MapPin className="w-5 h-5 text-gold" />
              <div>
                <p className="font-medium text-sm">{COMPANY_INFO.name}</p>
                <p className="text-micro text-gray-400">{COMPANY_INFO.address.full}</p>
              </div>
            </a>

            <a 
              href={getPhoneLink()}
              className={cn(
                'p-3 rounded-xl flex items-center gap-3 mb-2 transition-colors hover:bg-gold/10',
                isDark ? 'bg-carbon-700/50' : 'bg-gray-50'
              )}
            >
              <Phone className="w-5 h-5 text-gold" />
              <div>
                <p className="font-medium text-sm">Telefone</p>
                <p className="text-micro text-gold font-semibold">{COMPANY_INFO.phoneFormatted}</p>
              </div>
            </a>

            <a 
              href={getWhatsAppLink(`Olá! Gostaria de agendar uma revisão para meu veículo ${project.vehicle.brand} ${project.vehicle.model} - Placa ${project.vehicle.plate}`)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-green-500/20',
                'bg-green-500/10 border border-green-500/30'
              )}
            >
              <MessageCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-medium text-sm text-green-400">WhatsApp</p>
                <p className="text-micro text-gray-400">Clique para enviar mensagem</p>
              </div>
            </a>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowScheduleModal(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
