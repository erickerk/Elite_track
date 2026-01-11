/**
 * PublicVerification - Página de Verificação Pública do Laudo EliteShield
 * 
 * Esta página exibe o laudo técnico completo de blindagem veicular.
 * Usa o componente EliteShieldLaudo para renderização padronizada.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import { Shield, AlertCircle, Settings, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProjects } from '../contexts/ProjectContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Project, Vehicle, TimelineStep } from '../types'
import { EliteShieldLaudo } from '../components/laudo/EliteShieldLaudo'
import { 
  LAUDO_TEXTOS, 
  GARANTIAS_PADRAO,
  gerarDadosLaudo 
} from '../config/eliteshield-laudo-template'

export function PublicVerification() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { projects } = useProjects()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  const canManageProject = isAuthenticated && (user?.role === 'executor' || user?.role === 'admin')

  // Função para exportar PDF com o novo modelo EliteShield
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
      const margin = 15
      const contentWidth = pageWidth - (2 * margin)
      let yPos = margin

      // Cores EliteShield
      const goldColor: [number, number, number] = [212, 175, 55]
      const blackColor: [number, number, number] = [0, 0, 0]
      const grayColor: [number, number, number] = [128, 128, 128]
      const whiteColor: [number, number, number] = [255, 255, 255]

      const dados = gerarDadosLaudo(project)

      // ========== PÁGINA 1 - CAPA ==========
      pdf.setFillColor(...blackColor)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')

      // Logo área
      pdf.setFillColor(...goldColor)
      pdf.roundedRect(pageWidth/2 - 20, 30, 40, 40, 5, 5, 'F')
      pdf.setTextColor(...blackColor)
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('E', pageWidth/2, 55, { align: 'center' })

      // Título
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(28)
      pdf.text(LAUDO_TEXTOS.titulo, pageWidth/2, 90, { align: 'center' })
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Laudo Técnico Digital', pageWidth/2, 100, { align: 'center' })

      // Linha decorativa
      pdf.setDrawColor(...goldColor)
      pdf.setLineWidth(0.5)
      pdf.line(margin + 30, 110, pageWidth - margin - 30, 110)

      // Dados do veículo
      pdf.setTextColor(...whiteColor)
      pdf.setFontSize(14)
      yPos = 130
      pdf.text(`Cliente: ${dados.cliente.nome}`, pageWidth/2, yPos, { align: 'center' })
      yPos += 10
      pdf.text(`Veículo: ${dados.veiculo.marca} ${dados.veiculo.modelo} / ${dados.veiculo.anoModelo}`, pageWidth/2, yPos, { align: 'center' })
      yPos += 10
      pdf.text(`Placa: ${dados.veiculo.placa}`, pageWidth/2, yPos, { align: 'center' })

      // Status
      yPos += 20
      const isFinished = project.status === 'completed' || project.status === 'delivered'
      pdf.setFillColor(isFinished ? 34 : 234, isFinished ? 197 : 179, isFinished ? 94 : 8)
      pdf.roundedRect(pageWidth/2 - 40, yPos - 5, 80, 15, 3, 3, 'F')
      pdf.setTextColor(...(isFinished ? blackColor : whiteColor))
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text(isFinished ? '✓ FINALIZADO' : '⏳ EM ANDAMENTO', pageWidth/2, yPos + 5, { align: 'center' })

      // Data
      pdf.setTextColor(...grayColor)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth/2, pageHeight - 30, { align: 'center' })

      // Rodapé
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(11)
      pdf.text(LAUDO_TEXTOS.rodape.empresa, pageWidth/2, pageHeight - 20, { align: 'center' })
      pdf.setTextColor(...grayColor)
      pdf.setFontSize(9)
      pdf.text(LAUDO_TEXTOS.rodape.slogan, pageWidth/2, pageHeight - 15, { align: 'center' })

      // ========== PÁGINA 2 - DECLARAÇÃO ==========
      pdf.addPage()
      pdf.setFillColor(...blackColor)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      yPos = margin

      // Cabeçalho
      pdf.setFillColor(...goldColor)
      pdf.rect(0, 0, pageWidth, 25, 'F')
      pdf.setTextColor(...blackColor)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(LAUDO_TEXTOS.titulo, margin, 16)

      yPos = 40

      // Seção 1 - Declaração
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(LAUDO_TEXTOS.secao1.titulo, margin, yPos)
      yPos += 8
      pdf.setTextColor(...whiteColor)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const lines1 = pdf.splitTextToSize(LAUDO_TEXTOS.secao1.texto, contentWidth)
      pdf.text(lines1, margin, yPos)
      yPos += lines1.length * 4 + 10

      // Seção 2 - Proteção Balística
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(LAUDO_TEXTOS.secao2.titulo, margin, yPos)
      yPos += 8
      pdf.setTextColor(...whiteColor)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const lines2 = pdf.splitTextToSize(LAUDO_TEXTOS.secao2.texto, contentWidth)
      pdf.text(lines2, margin, yPos)
      yPos += lines2.length * 4 + 10

      // Seção 3 - Materiais
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(LAUDO_TEXTOS.secao3.titulo, margin, yPos)
      yPos += 8
      pdf.setTextColor(...whiteColor)
      pdf.setFontSize(9)
      const lines3 = pdf.splitTextToSize(LAUDO_TEXTOS.secao3.texto, contentWidth)
      pdf.text(lines3, margin, yPos)
      yPos += lines3.length * 4 + 5
      LAUDO_TEXTOS.secao3.itens.forEach(item => {
        pdf.text(`• ${item}`, margin + 5, yPos)
        yPos += 5
      })
      yPos += 3
      const lines3c = pdf.splitTextToSize(LAUDO_TEXTOS.secao3.complemento, contentWidth)
      pdf.text(lines3c, margin, yPos)
      yPos += lines3c.length * 4 + 10

      // Seção 4 - Processo
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text(LAUDO_TEXTOS.secao4.titulo, margin, yPos)
      yPos += 8
      pdf.setTextColor(...whiteColor)
      pdf.setFontSize(9)
      const lines4 = pdf.splitTextToSize(LAUDO_TEXTOS.secao4.texto, contentWidth)
      pdf.text(lines4, margin, yPos)
      yPos += lines4.length * 4 + 5
      LAUDO_TEXTOS.secao4.etapas.forEach(etapa => {
        pdf.text(`• ${etapa}`, margin + 5, yPos)
        yPos += 5
      })

      // ========== PÁGINA 3 - DADOS DO VEÍCULO E CLIENTE ==========
      pdf.addPage()
      pdf.setFillColor(...blackColor)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      
      // Cabeçalho
      pdf.setFillColor(...goldColor)
      pdf.rect(0, 0, pageWidth, 25, 'F')
      pdf.setTextColor(...blackColor)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('IDENTIFICAÇÃO DO VEÍCULO', margin, 16)

      yPos = 40

      // Box do Veículo
      pdf.setDrawColor(...goldColor)
      pdf.setLineWidth(0.5)
      pdf.roundedRect(margin, yPos, contentWidth, 60, 3, 3, 'S')
      
      const vehicleData = [
        ['Marca', dados.veiculo.marca],
        ['Modelo', dados.veiculo.modelo],
        ['Ano/Modelo', dados.veiculo.anoModelo],
        ['Cor', dados.veiculo.cor],
        ['Placa', dados.veiculo.placa],
        ['Chassi', dados.veiculo.chassi],
        ['KM Check-in', dados.veiculo.kmCheckin],
        ['Tipo', dados.veiculo.tipo]
      ]

      let row = 0
      let col = 0
      vehicleData.forEach(([label, value]) => {
        const x = margin + 5 + (col * 90)
        const y = yPos + 10 + (row * 14)
        pdf.setTextColor(...grayColor)
        pdf.setFontSize(8)
        pdf.text(label, x, y)
        pdf.setTextColor(...whiteColor)
        pdf.setFontSize(10)
        pdf.text(value || '-', x, y + 5)
        col++
        if (col >= 2) {
          col = 0
          row++
        }
      })

      yPos += 75

      // Dados do Cliente
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('DADOS DO CLIENTE', margin, yPos)
      yPos += 10

      pdf.setDrawColor(...goldColor)
      pdf.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'S')

      const clientData = [
        ['Nome / Razão Social', dados.cliente.nome],
        ['CPF/CNPJ', dados.cliente.cpfCnpj || '***.***.***-**'],
        ['Telefone', dados.cliente.telefone],
        ['E-mail', dados.cliente.email]
      ]

      row = 0
      col = 0
      clientData.forEach(([label, value]) => {
        const x = margin + 5 + (col * 90)
        const y = yPos + 10 + (row * 14)
        pdf.setTextColor(...grayColor)
        pdf.setFontSize(8)
        pdf.text(label, x, y)
        pdf.setTextColor(...whiteColor)
        pdf.setFontSize(10)
        pdf.text(value || '-', x, y + 5)
        col++
        if (col >= 2) {
          col = 0
          row++
        }
      })

      yPos += 55

      // Linha de Blindagem
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('LINHA DE BLINDAGEM', margin, yPos)
      yPos += 10

      pdf.setFillColor(212, 175, 55, 0.1)
      pdf.setDrawColor(...goldColor)
      pdf.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'S')

      pdf.setTextColor(...goldColor)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      const linhaLabel = dados.blindagem.linha === 'ultralite' ? 'UltraLite Armor™' : 'SafeCore™'
      pdf.text(linhaLabel, margin + 5, yPos + 12)
      pdf.setTextColor(...whiteColor)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Nível: ${dados.blindagem.nivel} • Uso: ${dados.blindagem.uso}`, margin + 5, yPos + 22)

      // ========== PÁGINA 4 - GARANTIAS E QR CODE ==========
      pdf.addPage()
      pdf.setFillColor(...blackColor)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')

      // Cabeçalho
      pdf.setFillColor(...goldColor)
      pdf.rect(0, 0, pageWidth, 25, 'F')
      pdf.setTextColor(...blackColor)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('GARANTIAS E RASTREABILIDADE', margin, 16)

      yPos = 40

      // Garantias
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('GARANTIAS ATIVAS', margin, yPos)
      yPos += 10

      Object.values(GARANTIAS_PADRAO).forEach((garantia) => {
        pdf.setDrawColor(...goldColor)
        pdf.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'S')
        pdf.setTextColor(...whiteColor)
        pdf.setFontSize(10)
        pdf.text(`✓ ${garantia.nome}`, margin + 5, yPos + 10)
        pdf.setTextColor(...goldColor)
        pdf.text(garantia.prazo, pageWidth - margin - 30, yPos + 10)
        yPos += 20
      })

      yPos += 20

      // EliteTrace QR Code
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('ELITETRACE™', pageWidth/2, yPos, { align: 'center' })
      yPos += 10

      // Placeholder para QR Code
      pdf.setFillColor(...whiteColor)
      pdf.roundedRect(pageWidth/2 - 30, yPos, 60, 60, 3, 3, 'F')
      pdf.setTextColor(...blackColor)
      pdf.setFontSize(8)
      pdf.text('QR CODE', pageWidth/2, yPos + 35, { align: 'center' })

      yPos += 70

      pdf.setTextColor(...grayColor)
      pdf.setFontSize(9)
      pdf.text('Escaneie para acessar o histórico completo da blindagem.', pageWidth/2, yPos, { align: 'center' })

      // Declaração Final
      yPos += 30
      pdf.setTextColor(...goldColor)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text('DECLARAÇÃO FINAL', margin, yPos)
      yPos += 8
      pdf.setTextColor(...grayColor)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      const linesFinal = pdf.splitTextToSize(LAUDO_TEXTOS.secao12.texto, contentWidth)
      pdf.text(linesFinal, margin, yPos)

      // Rodapé em todas as páginas
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(...grayColor)
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
      }

      pdf.save(`EliteShield-Laudo-${project.id}-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  // Função para buscar projeto diretamente do Supabase
  const fetchProjectFromSupabase = useCallback(async (searchTerm: string): Promise<Project | null> => {
    if (!isSupabaseConfigured() || !supabase) return null

    try {
      console.log('[PublicVerification] Buscando no Supabase:', searchTerm)
      
      const { data: projectData } = await (supabase as any)
        .from('projects')
        .select(`
          *,
          vehicles (*),
          users (*),
          timeline_steps (*),
          step_photos (*)
        `)
        .or(`id.eq.${searchTerm},vehicles.plate.ilike.${searchTerm}`)
        .limit(1)

      if (!projectData || projectData.length === 0) {
        const { data: vehicleData } = await (supabase as any)
          .from('vehicles')
          .select('id')
          .ilike('plate', searchTerm)
          .limit(1)

        if (vehicleData && vehicleData.length > 0) {
          const { data: projectByVehicle } = await (supabase as any)
            .from('projects')
            .select(`
              *,
              vehicles (*),
              users (*),
              timeline_steps (*),
              step_photos (*)
            `)
            .eq('vehicle_id', vehicleData[0].id)
            .limit(1)

          if (projectByVehicle && projectByVehicle.length > 0) {
            return convertDbProjectToProject(projectByVehicle[0])
          }
        }
        return null
      }

      return convertDbProjectToProject(projectData[0])
    } catch (err) {
      console.error('[PublicVerification] Erro ao buscar no Supabase:', err)
      return null
    }
  }, [])

  // Converter dados do banco para o formato Project
  const convertDbProjectToProject = (dbProject: any): Project => {
    const vehicle: Vehicle = {
      id: dbProject.vehicles?.id || '',
      brand: dbProject.vehicles?.brand || '',
      model: dbProject.vehicles?.model || '',
      year: dbProject.vehicles?.year || 0,
      color: dbProject.vehicles?.color || '',
      plate: dbProject.vehicles?.plate || '',
      blindingLevel: dbProject.vehicles?.blinding_level || 'IIIA',
      images: [],
    }

    // Mapear fotos das etapas
    const stepPhotosMap: { [key: string]: string[] } = {}
    if (dbProject.step_photos) {
      dbProject.step_photos.forEach((photo: any) => {
        if (!stepPhotosMap[photo.step_id]) {
          stepPhotosMap[photo.step_id] = []
        }
        stepPhotosMap[photo.step_id].push(photo.photo_url)
      })
    }

    const timeline: TimelineStep[] = (dbProject.timeline_steps || [])
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((step: any) => ({
        id: step.id,
        title: step.title,
        description: step.description || '',
        status: step.status,
        date: step.date,
        estimatedDate: step.estimated_date,
        technician: step.technician,
        notes: step.notes,
        photos: stepPhotosMap[step.id] || [],
      }))

    return {
      id: dbProject.id,
      vehicle,
      user: {
        id: dbProject.users?.id || '',
        name: dbProject.users?.name || 'Cliente',
        email: dbProject.users?.email || '',
        phone: dbProject.users?.phone || '',
        role: 'client',
      },
      status: dbProject.status,
      progress: dbProject.progress || 0,
      timeline,
      startDate: dbProject.start_date,
      estimatedDelivery: dbProject.estimated_delivery,
      actualDelivery: dbProject.actual_delivery,
      qrCode: dbProject.qr_code || '',
      vehicleReceivedDate: dbProject.vehicle_received_date,
      processStartDate: dbProject.process_start_date,
      completedDate: dbProject.completed_date,
    }
  }

  useEffect(() => {
    const searchProject = async () => {
      setLoading(true)
      const pid = (projectId || '').trim()
      const pidUpper = pid.toUpperCase()
      
      console.log('[PublicVerification] Buscando projeto:', pid)

      // 1. Primeiro, buscar no contexto local
      const found = projects.find(p =>
        p.id === pid ||
        p.id.toLowerCase() === pid.toLowerCase() ||
        p.qrCode === pid ||
        p.id.replace('PRJ-', '') === pid ||
        p.vehicle?.plate?.toUpperCase() === pidUpper ||
        p.vehicle?.plate?.toUpperCase().replace('-', '') === pidUpper.replace('-', '')
      )

      if (found) {
        console.log('[PublicVerification] ✓ Encontrado no contexto:', found.id)
        setProject(found)
        setError(false)
        setLoading(false)
        return
      }

      // 2. Se não encontrou no contexto, buscar diretamente no Supabase
      console.log('[PublicVerification] Buscando no Supabase...')
      const supabaseProject = await fetchProjectFromSupabase(pid)

      if (supabaseProject) {
        console.log('[PublicVerification] ✓ Encontrado no Supabase:', supabaseProject.id)
        setProject(supabaseProject)
        setError(false)
      } else {
        console.log('[PublicVerification] ✗ Projeto não encontrado')
        setProject(null)
        setError(true)
      }

      setLoading(false)
    }

    searchProject()
  }, [projectId, projects, fetchProjectFromSupabase])

  // Estado de Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-[#D4AF37] animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verificando Autenticidade</h1>
          <p className="text-gray-400">Consultando dados do veículo...</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#D4AF37]"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // Estado de Erro
  if (error || !project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Projeto Não Encontrado</h1>
          <p className="text-gray-400 mb-6">
            O código QR escaneado não corresponde a nenhum projeto registrado em nosso sistema.
          </p>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Código consultado:</p>
            <p className="font-mono text-[#D4AF37]">{projectId}</p>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            Se você acredita que isso é um erro, entre em contato com a Elite Blindagens.
          </p>
        </motion.div>
      </div>
    )
  }

  // Renderizar Laudo EliteShield
  return (
    <div className="min-h-screen bg-black">
      {/* Header com ações */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-[#D4AF37]/30 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-white">EliteShield™</h1>
              <p className="text-xs text-gray-400">Laudo Técnico</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-[#D4AF37] text-black px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#F4D03F] transition-colors disabled:opacity-50"
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
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo do Laudo */}
      <main className="max-w-2xl mx-auto">
        <EliteShieldLaudo 
          project={project}
          onExportPDF={exportToPDF}
          showExportButton={false}
          compact={false}
        />
      </main>
    </div>
  )
}
