/**
 * PublicVerification - Página de Verificação Pública do Laudo EliteShield
 * 
 * Esta página exibe o laudo técnico completo de blindagem veicular.
 * Usa o componente EliteShieldLaudo para renderização padronizada.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, AlertCircle, Settings, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProjects } from '../contexts/ProjectContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Project, Vehicle, TimelineStep } from '../types'
import { EliteShieldLaudo } from '../components/laudo/EliteShieldLaudo'
import { generateEliteShieldPDF } from '../utils/pdfGenerator'

export function PublicVerification() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { projects } = useProjects()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const requestIdRef = useRef(0)
  const [isExporting, setIsExporting] = useState(false)
  
  const canManageProject = isAuthenticated && (user?.role === 'executor' || user?.role === 'admin')

  // Função para exportar PDF usando o gerador padrão com logo e QR code permanente
  const exportToPDF = async () => {
    if (!project) return
    
    setIsExporting(true)
    try {
      // Usar gerador padrão que inclui logo Elite real e QR code permanente
      const pdfBlob = await generateEliteShieldPDF(project)
      
      // Download do PDF
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laudo_EliteShield_${project.vehicle.plate}_${new Date().getTime()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
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
      
      const selectQuery = `
          *,
          vehicles (*),
          users!projects_user_id_fkey (*),
          timeline_steps (*),
          step_photos (*)
        `

      // 1) Buscar por ID (UUID) diretamente
      const { data: byId } = await (supabase as any)
        .from('projects')
        .select(selectQuery)
        .eq('id', searchTerm)
        .maybeSingle()

      if (byId) return convertDbProjectToProject(byId)

      // 2) Buscar por qr_code
      const { data: byQr } = await (supabase as any)
        .from('projects')
        .select(selectQuery)
        .eq('qr_code', searchTerm)
        .maybeSingle()

      if (byQr) return convertDbProjectToProject(byQr)

      // 3) Buscar por placa em vehicles e depois pelo vehicle_id
      const plateNormalized = searchTerm.toUpperCase().replace(/[^A-Z0-9]/g, '')
      const { data: vehicleData } = await (supabase as any)
        .from('vehicles')
        .select('id')
        .or(`plate.ilike.%${searchTerm}%,plate.ilike.%${plateNormalized}%`)
        .limit(1)

      if (vehicleData && vehicleData.length > 0) {
        const { data: projectByVehicle } = await (supabase as any)
          .from('projects')
          .select(selectQuery)
          .eq('vehicle_id', vehicleData[0].id)
          .maybeSingle()

        if (projectByVehicle) return convertDbProjectToProject(projectByVehicle)
      }

      return null
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
      const currentRequestId = ++requestIdRef.current
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
        if (currentRequestId === requestIdRef.current) {
          setProject(found)
          setError(false)
          setLoading(false)
        }
        return
      }

      // 2. Se não encontrou no contexto, buscar diretamente no Supabase
      console.log('[PublicVerification] Buscando no Supabase...')
      const supabaseProject = await fetchProjectFromSupabase(pid)

      if (currentRequestId !== requestIdRef.current) return

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
