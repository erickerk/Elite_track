import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Shield, CheckCircle, Clock, AlertCircle, Calendar, Car,
  Award, ChevronDown, ChevronUp,
  Layers, Box, Wrench, BadgeCheck, Scale, Settings
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ProgressRing } from '../components/ui/ProgressRing'
import { cn } from '../lib/utils'
import { mockProjects } from '../data/mockData'
import { useAuth } from '../contexts/AuthContext'
import type { Project } from '../types'

const statusConfig = {
  pending: { label: 'Aguardando Início', variant: 'warning' as const, icon: AlertCircle, color: 'text-status-warning' },
  in_progress: { label: 'Em Andamento', variant: 'info' as const, icon: Clock, color: 'text-status-info' },
  completed: { label: 'Concluído', variant: 'success' as const, icon: CheckCircle, color: 'text-status-success' },
  delivered: { label: 'Entregue', variant: 'success' as const, icon: CheckCircle, color: 'text-status-success' },
}

export function PublicVerification() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  
  const canManageProject = isAuthenticated && (user?.role === 'executor' || user?.role === 'admin')

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = mockProjects.find(p => 
        p.id === projectId || 
        p.qrCode === projectId ||
        p.id.replace('PRJ-', '') === projectId
      )
      
      if (found) {
        setProject(found)
      } else {
        setError(true)
      }
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [projectId])

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-gold animate-pulse" />
          </div>
          <h1 className="text-h2 font-bold text-white mb-2">Verificando Autenticidade</h1>
          <p className="text-gray-400">Consultando dados do veículo...</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gold"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-carbon-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-status-error/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-status-error" />
          </div>
          <h1 className="text-h2 font-bold text-white mb-2">Projeto Não Encontrado</h1>
          <p className="text-gray-400 mb-6">
            O código QR escaneado não corresponde a nenhum projeto registrado em nosso sistema.
          </p>
          <Card variant="bordered" className="text-left">
            <p className="text-caption text-gray-400 mb-2">Código consultado:</p>
            <p className="font-mono text-gold">{projectId}</p>
          </Card>
          <p className="text-micro text-gray-500 mt-6">
            Se você acredita que isso é um erro, entre em contato com a Elite Blindagens.
          </p>
        </motion.div>
      </div>
    )
  }

  const config = statusConfig[project.status]
  const StatusIcon = config.icon

  return (
    <div className="min-h-screen bg-carbon-900 text-white">
      <header className="bg-carbon-800 border-b border-carbon-700 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <span className="text-carbon-900 font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">EliteTrack™</h1>
              <p className="text-micro text-gray-400">Verificação de Autenticidade</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canManageProject && (
              <button
                onClick={() => navigate(`/manage/${project?.id || projectId}`)}
                className="flex items-center gap-2 bg-gold text-carbon-900 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-gold/90 transition-colors"
                title="Gerenciar Projeto"
              >
                <Settings className="w-4 h-4" />
                Gerenciar
              </button>
            )}
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verificado
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-status-success/20 flex items-center justify-center">
            <Shield className="w-12 h-12 text-status-success" />
          </div>
          <h2 className="text-h2 font-bold mb-2">Blindagem Autêntica</h2>
          <p className="text-gray-400">
            Este veículo possui blindagem certificada pela Elite Blindagens
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated">
            <div className="flex items-start gap-4">
              <div className="w-24 h-20 rounded-xl overflow-hidden bg-carbon-700 flex-shrink-0">
                <img
                  src={project.vehicle.images[0]}
                  alt={project.vehicle.model}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-h3 font-bold">
                  {project.vehicle.brand} {project.vehicle.model}
                </h3>
                <p className="text-caption text-gray-400">
                  {project.vehicle.year} • {project.vehicle.color}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="gold">{project.vehicle.blindingLevel}</Badge>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <Card variant="bordered" className="text-center p-4">
            <ProgressRing progress={project.progress} size={80} />
            <p className="text-caption text-gray-400 mt-2">Progresso</p>
          </Card>
          
          <Card variant="bordered" className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-caption">
                <Calendar className="w-4 h-4 text-gold" />
                <span className="text-gray-400">Início:</span>
                <span>{new Date(project.startDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 text-caption">
                <Calendar className="w-4 h-4 text-gold" />
                <span className="text-gray-400">Previsão:</span>
                <span>{new Date(project.estimatedDelivery).toLocaleDateString('pt-BR')}</span>
              </div>
              {project.actualDelivery && (
                <div className="flex items-center gap-2 text-caption">
                  <CheckCircle className="w-4 h-4 text-status-success" />
                  <span className="text-gray-400">Entregue:</span>
                  <span>{new Date(project.actualDelivery).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-gold" />
                Certificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-carbon-700">
                <span className="text-gray-400">Nível de Proteção</span>
                <span className="font-semibold">{project.vehicle.blindingLevel}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-carbon-700">
                <span className="text-gray-400">Código do Projeto</span>
                <span className="font-mono text-gold">{project.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-carbon-700">
                <span className="text-gray-400">Placa do Veículo</span>
                <span className="font-semibold">{project.vehicle.plate}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Status</span>
                <Badge variant={config.variant} className="flex items-center gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {project.blindingSpecs && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card variant="elevated" className="border-2 border-gold/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gold" />
                  Especificações Técnicas da Blindagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-carbon-700/50">
                    <p className="text-micro text-gray-400 mb-1">Certificação</p>
                    <p className="font-semibold text-gold">{project.blindingSpecs.certification}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-carbon-700/50">
                    <p className="text-micro text-gray-400 mb-1">Nº Certificado</p>
                    <p className="font-mono text-sm">{project.blindingSpecs.certificationNumber}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-carbon-700/50">
                    <p className="text-micro text-gray-400 mb-1">Válido até</p>
                    <p className="font-semibold">{project.blindingSpecs.validUntil ? new Date(project.blindingSpecs.validUntil).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-carbon-700/50">
                    <p className="text-micro text-gray-400 mb-1">Peso Adicional</p>
                    <p className="font-semibold">{project.blindingSpecs.totalWeight}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Box className="w-4 h-4 text-gold" />
                    Materiais Utilizados
                  </h4>
                  <div className="space-y-2">
                    {project.blindingSpecs.materials.map((material, index) => (
                      <div key={index} className="p-3 rounded-xl bg-carbon-700/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-micro text-gray-400">{material.type}</p>
                          </div>
                          <Badge variant="gold" size="sm">{material.thickness}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-micro text-gray-400">Área: {material.area}</span>
                          {material.certification && (
                            <span className="text-micro text-gold">• {material.certification}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" />
                    Proteção de Vidros
                  </h4>
                  <div className="p-3 rounded-xl bg-carbon-700/50">
                    <p className="font-medium">{project.blindingSpecs.glassType}</p>
                    <p className="text-caption text-gray-400 mt-1">Espessura: {project.blindingSpecs.glassThickness}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4 text-gold" />
                    Áreas Protegidas
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {project.blindingSpecs.bodyProtection.map((area, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-carbon-700/30">
                        <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />
                        <span className="text-caption">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {project.blindingSpecs.additionalFeatures && project.blindingSpecs.additionalFeatures.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-gold" />
                      Recursos Adicionais
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {project.blindingSpecs.additionalFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gold/10 border border-gold/20">
                          <BadgeCheck className="w-4 h-4 text-gold flex-shrink-0" />
                          <span className="text-caption">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-carbon-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-gold" />
                    <span className="font-semibold">Garantia</span>
                  </div>
                  <p className="text-caption text-gray-300">{project.blindingSpecs.warranty}</p>
                  {project.blindingSpecs.technicalResponsible && (
                    <p className="text-micro text-gray-400 mt-2">
                      Responsável Técnico: {project.blindingSpecs.technicalResponsible}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold" />
                Histórico do Processo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.timeline.map((step) => {
                  const stepConfig = statusConfig[step.status]
                  const StepIcon = stepConfig.icon
                  const isExpanded = expandedStep === step.id
                  
                  return (
                    <div key={step.id}>
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-xl transition-colors',
                          'bg-carbon-700/50 hover:bg-carbon-700'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            step.status === 'completed' ? 'bg-status-success/20' :
                            step.status === 'in_progress' ? 'bg-status-warning/20' : 'bg-gray-500/20'
                          )}>
                            <StepIcon className={cn('w-4 h-4', stepConfig.color)} />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{step.title}</p>
                            <p className="text-micro text-gray-400">
                              {step.date 
                                ? new Date(step.date).toLocaleDateString('pt-BR')
                                : step.estimatedDate 
                                ? `Previsão: ${new Date(step.estimatedDate).toLocaleDateString('pt-BR')}`
                                : 'Aguardando'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={stepConfig.variant} size="sm">
                            {stepConfig.label}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 ml-11 p-3 bg-carbon-800 rounded-xl"
                        >
                          <p className="text-caption text-gray-300 mb-2">{step.description}</p>
                          {step.technician && (
                            <p className="text-micro text-gray-400">
                              Técnico: {step.technician}
                            </p>
                          )}
                          {step.photos.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto">
                              {step.photos.map((photo, i) => (
                                <img
                                  key={i}
                                  src={photo}
                                  alt={`Foto ${i + 1}`}
                                  className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                                />
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-gold" />
            <span className="font-semibold">Elite Blindagens</span>
          </div>
          <p className="text-micro text-gray-500">
            Excelência em blindagem automotiva desde 2010
          </p>
          <p className="text-micro text-gray-600 mt-4">
            Documento verificado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
