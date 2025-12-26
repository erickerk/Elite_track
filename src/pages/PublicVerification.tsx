import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
// import html2canvas from 'html2canvas' // Removido - não utilizado
import jsPDF from 'jspdf'
import { 
  Shield, CheckCircle, Clock, AlertCircle, Calendar, Car,
  Award, ChevronDown, ChevronUp,
  Layers, Box, Wrench, BadgeCheck, Scale, Settings, Download,
  Users, History, Package
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ProgressRing } from '../components/ui/ProgressRing'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { useProjects } from '../contexts/ProjectContext'
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
  const { projects } = useProjects()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const canManageProject = isAuthenticated && (user?.role === 'executor' || user?.role === 'admin')

  const exportToPDF = async () => {
    if (!project) return
    
    setIsExporting(true)
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = 210
      const pageHeight = 297
      const margin = 20
      const contentWidth = pageWidth - (2 * margin)
      let yPos = margin

      // Cores (tipadas como tuple para compatibilidade com jsPDF)
      const goldColor: [number, number, number] = [212, 175, 55]
      const darkColor: [number, number, number] = [26, 26, 26]
      const grayColor: [number, number, number] = [128, 128, 128]

      // Cabeçalho oficial
      pdf.setFillColor(...goldColor)
      pdf.rect(0, 0, pageWidth, 40, 'F')
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('EliteTrack™', margin, 20)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Laudo Técnico de Verificação de Blindagem', margin, 30)

      yPos = 50

      // Informações do documento
      pdf.setFontSize(9)
      pdf.setTextColor(...grayColor)
      pdf.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPos)
      yPos += 10

      // Selo de autenticidade
      pdf.setDrawColor(...goldColor)
      pdf.setLineWidth(1)
      pdf.rect(margin, yPos, contentWidth, 20, 'S')
      pdf.setFontSize(14)
      pdf.setTextColor(...goldColor)
      pdf.setFont('helvetica', 'bold')
      pdf.text('✓ BLINDAGEM AUTÊNTICA CERTIFICADA', pageWidth / 2, yPos + 12, { align: 'center' })
      yPos += 30

      // Dados do veículo
      pdf.setFontSize(16)
      pdf.setTextColor(...darkColor)
      pdf.setFont('helvetica', 'bold')
      pdf.text('DADOS DO VEÍCULO', margin, yPos)
      yPos += 8

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Marca/Modelo: ${project.vehicle.brand} ${project.vehicle.model}`, margin, yPos)
      yPos += 6
      pdf.text(`Ano/Cor: ${project.vehicle.year} • ${project.vehicle.color}`, margin, yPos)
      yPos += 6
      pdf.text(`Placa: ${project.vehicle.plate}`, margin, yPos)
      yPos += 6
      pdf.text(`Nível de Blindagem: ${project.vehicle.blindingLevel}`, margin, yPos)
      yPos += 6
      pdf.text(`Código do Projeto: ${project.id}`, margin, yPos)
      yPos += 12

      // Certificação
      if (project.blindingSpecs) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('CERTIFICAÇÃO', margin, yPos)
        yPos += 8

        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Certificação: ${project.blindingSpecs.certification}`, margin, yPos)
        yPos += 6
        pdf.text(`Nº Certificado: ${project.blindingSpecs.certificationNumber}`, margin, yPos)
        yPos += 6
        pdf.text(`Válido até: ${project.blindingSpecs.validUntil ? new Date(project.blindingSpecs.validUntil).toLocaleDateString('pt-BR') : '-'}`, margin, yPos)
        yPos += 6
        pdf.text(`Peso Adicional: ${project.blindingSpecs.totalWeight}`, margin, yPos)
        yPos += 6
        pdf.text(`Responsável Técnico: ${project.blindingSpecs.technicalResponsible}`, margin, yPos)
        yPos += 12

        // Materiais
        if (yPos > 220) {
          pdf.addPage()
          yPos = margin
        }

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('MATERIAIS UTILIZADOS', margin, yPos)
        yPos += 8

        pdf.setFontSize(10)
        project.blindingSpecs.materials.forEach((material, idx) => {
          if (yPos > 260) {
            pdf.addPage()
            yPos = margin
          }
          pdf.setFont('helvetica', 'bold')
          pdf.text(`${idx + 1}. ${material.name}`, margin + 5, yPos)
          yPos += 5
          pdf.setFont('helvetica', 'normal')
          pdf.text(`   Tipo: ${material.type} | Espessura: ${material.thickness}`, margin + 5, yPos)
          yPos += 5
          if (material.area) {
            pdf.text(`   Área: ${material.area}`, margin + 5, yPos)
            yPos += 5
          }
          if (material.certification) {
            pdf.text(`   Certificação: ${material.certification}`, margin + 5, yPos)
            yPos += 5
          }
          yPos += 2
        })
      }

      // Histórico de Proprietários
      if (project.owners && project.owners.length > 0) {
        if (yPos > 220) {
          pdf.addPage()
          yPos = margin
        }

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('HISTÓRICO DE PROPRIETÁRIOS', margin, yPos)
        yPos += 8

        pdf.setFontSize(10)
        project.owners.forEach((owner, idx) => {
          if (yPos > 260) {
            pdf.addPage()
            yPos = margin
          }
          pdf.setFont('helvetica', 'bold')
          pdf.text(`${idx + 1}. ${owner.name} ${owner.isCurrent ? '(ATUAL)' : ''}`, margin + 5, yPos)
          yPos += 5
          pdf.setFont('helvetica', 'normal')
          pdf.text(`   CPF: ${owner.cpf}`, margin + 5, yPos)
          yPos += 5
          pdf.text(`   Início: ${new Date(owner.ownershipStart).toLocaleDateString('pt-BR')}${owner.ownershipEnd ? ` | Fim: ${new Date(owner.ownershipEnd).toLocaleDateString('pt-BR')}` : ''}`, margin + 5, yPos)
          yPos += 7
        })
      }

      // Histórico de Manutenção
      if (project.maintenanceHistory && project.maintenanceHistory.length > 0) {
        pdf.addPage()
        yPos = margin

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('HISTÓRICO DE MANUTENÇÃO E SERVIÇOS', margin, yPos)
        yPos += 8

        pdf.setFontSize(10)
        project.maintenanceHistory.forEach((service, idx) => {
          if (yPos > 240) {
            pdf.addPage()
            yPos = margin
          }

          const typeLabels = {
            maintenance: 'Manutenção',
            repair: 'Reparo',
            part_replacement: 'Troca de Peças',
            inspection: 'Inspeção'
          }

          pdf.setFont('helvetica', 'bold')
          pdf.text(`${idx + 1}. ${typeLabels[service.type]}${service.warrantyService ? ' [GARANTIA]' : ''}`, margin + 5, yPos)
          yPos += 5
          pdf.setFont('helvetica', 'normal')
          pdf.text(`   Data: ${new Date(service.date).toLocaleDateString('pt-BR')} | Técnico: ${service.technician}`, margin + 5, yPos)
          yPos += 5
          pdf.text(`   ${service.description}`, margin + 5, yPos)
          yPos += 5

          if (service.partsReplaced && service.partsReplaced.length > 0) {
            pdf.setFont('helvetica', 'italic')
            pdf.text(`   Peças substituídas:`, margin + 5, yPos)
            yPos += 5
            service.partsReplaced.forEach(part => {
              pdf.text(`   • ${part.name} (Qtd: ${part.quantity}) - ${part.reason}`, margin + 10, yPos)
              yPos += 5
            })
          }

          if (service.cost !== undefined && service.cost > 0) {
            pdf.setFont('helvetica', 'bold')
            pdf.text(`   Custo: R$ ${service.cost.toFixed(2)}`, margin + 5, yPos)
            yPos += 5
          }

          if (service.notes) {
            pdf.setFont('helvetica', 'italic')
            const noteLines = pdf.splitTextToSize(service.notes, contentWidth - 15)
            pdf.text(noteLines, margin + 5, yPos)
            yPos += (noteLines.length * 5) + 2
          }

          yPos += 3
        })
      }

      // Rodapé em todas as páginas
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(...grayColor)
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        pdf.text('Elite Blindagens - Documento Oficial | www.eliteblindagens.com.br | (11) 3456-7890', pageWidth / 2, pageHeight - 5, { align: 'center' })
      }

      pdf.save(`EliteTrack-Laudo-${project.id}-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      const pid = projectId || ''
      const found = projects.find(p =>
        p.id === pid ||
        p.qrCode === pid ||
        p.id.replace('PRJ-', '') === pid
      )

      if (found) {
        setProject(found)
        setError(false)
      } else {
        setProject(null)
        setError(true)
      }

      setLoading(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [projectId, projects])

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
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-gold text-carbon-900 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Baixar em PDF"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Gerando...' : 'PDF'}
            </button>
            {canManageProject && (
              <button
                onClick={() => navigate(`/manage/${project?.id || projectId}`)}
                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
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

      <main ref={contentRef} className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Cabeçalho para PDF */}
        <div className="hidden print:block print-header">
          <h1 className="text-2xl font-bold">EliteTrack™ - Laudo Técnico de Verificação</h1>
          <p className="text-sm">Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
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

        {/* Histórico de Proprietários */}
        {project.owners && project.owners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" />
                  Histórico de Proprietários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.owners.map((owner, index) => (
                    <div key={owner.id} className="p-4 rounded-xl bg-carbon-700/50 border-l-4 border-gold">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            {owner.name}
                            {owner.isCurrent && (
                              <Badge variant="success" size="sm">Atual</Badge>
                            )}
                          </p>
                          <p className="text-micro text-gray-400">CPF: {owner.cpf}</p>
                        </div>
                        <span className="text-caption text-gray-500">#{index + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <p className="text-micro text-gray-400">Início da Propriedade</p>
                          <p className="text-caption font-medium">{new Date(owner.ownershipStart).toLocaleDateString('pt-BR')}</p>
                        </div>
                        {owner.ownershipEnd && (
                          <div>
                            <p className="text-micro text-gray-400">Fim da Propriedade</p>
                            <p className="text-caption font-medium">{new Date(owner.ownershipEnd).toLocaleDateString('pt-BR')}</p>
                          </div>
                        )}
                      </div>
                      {owner.phone && (
                        <p className="text-micro text-gray-400 mt-2">Contato: {owner.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Histórico de Manutenção e Serviços */}
        {project.maintenanceHistory && project.maintenanceHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
          >
            <Card variant="elevated" className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gold" />
                  Histórico de Manutenção e Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.maintenanceHistory.map((service) => {
                    const typeLabels = {
                      maintenance: 'Manutenção',
                      repair: 'Reparo',
                      part_replacement: 'Troca de Peças',
                      inspection: 'Inspeção'
                    }
                    
                    return (
                      <div key={service.id} className="p-4 rounded-xl bg-carbon-700/50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={service.warrantyService ? 'success' : 'default'} size="sm">
                                {typeLabels[service.type]}
                              </Badge>
                              {service.warrantyService && (
                                <Badge variant="gold" size="sm">Garantia</Badge>
                              )}
                            </div>
                            <p className="font-semibold">{service.description}</p>
                            <p className="text-micro text-gray-400 mt-1">
                              {new Date(service.date).toLocaleDateString('pt-BR')} • Técnico: {service.technician}
                            </p>
                          </div>
                          {service.cost !== undefined && service.cost > 0 && (
                            <div className="text-right">
                              <p className="text-micro text-gray-400">Custo</p>
                              <p className="font-semibold text-gold">R$ {service.cost.toFixed(2)}</p>
                            </div>
                          )}
                        </div>

                        {service.partsReplaced && service.partsReplaced.length > 0 && (
                          <div className="mt-3 p-3 bg-carbon-800 rounded-lg">
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Package className="w-4 h-4 text-gold" />
                              Peças Substituídas
                            </p>
                            <div className="space-y-2">
                              {service.partsReplaced.map((part, idx) => (
                                <div key={idx} className="pl-6 border-l-2 border-gold/30">
                                  <p className="text-caption font-medium">{part.name}</p>
                                  <div className="flex gap-4 text-micro text-gray-400 mt-1">
                                    {part.partNumber && <span>P/N: {part.partNumber}</span>}
                                    <span>Qtd: {part.quantity}</span>
                                  </div>
                                  <p className="text-micro text-gray-400 mt-1">Motivo: {part.reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {service.notes && (
                          <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-caption text-gray-300">{service.notes}</p>
                          </div>
                        )}

                        {service.photos && service.photos.length > 0 && (
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {service.photos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Foto ${idx + 1}`}
                                className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 p-3 bg-gold/10 border border-gold/20 rounded-xl">
                  <p className="text-sm text-gold font-semibold">
                    ✓ Todos os serviços realizados pela Elite Blindagens com peças originais certificadas
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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

        {/* Rodapé para impressão */}
        <div className="hidden print:block print-footer">
          <p>Elite Blindagens - Documento Oficial de Verificação</p>
          <p>www.eliteblindagens.com.br | (11) 3456-7890</p>
        </div>
      </main>
    </div>
  )
}
