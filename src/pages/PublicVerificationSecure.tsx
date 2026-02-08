/**
 * PublicVerificationSecure - Página de Verificação Pública SEGURA
 * 
 * Esta é a versão SEGURA da consulta pública que substitui PublicVerification.tsx
 * para a rota /verify/:id.
 * 
 * SEGURANÇA:
 * - Usa filterPublicData() para garantir whitelist de dados
 * - NUNCA expõe dados sensíveis do cliente ou executor
 * - Valida dados antes de renderizar
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, AlertCircle, Download, ArrowLeft } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useProjects } from '../contexts/ProjectContext'
import type { Project, Vehicle, TimelineStep } from '../types'
import { PublicLaudo } from '../components/laudo/PublicLaudo'
import { filterPublicData, getNotFoundData, type PublicProjectData } from '../utils/publicDataFilter'

export function PublicVerificationSecure() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const [publicData, setPublicData] = useState<PublicProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const requestIdRef = useRef(0)

  // Função para buscar projeto do Supabase
  const fetchProjectFromSupabase = useCallback(async (searchTerm: string): Promise<Project | null> => {
    if (!isSupabaseConfigured() || !supabase) return null

    try {
      console.log('[PublicVerificationSecure] Buscando no Supabase:', searchTerm)
      
      const selectQuery = `
        *,
        vehicles (*),
        users!projects_user_id_fkey (*),
        timeline_steps (*),
        step_photos (*)
      `

      // 1) Buscar por ID (UUID)
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

      // 3) Buscar por placa
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
      console.error('[PublicVerificationSecure] Erro ao buscar:', err)
      return null
    }
  }, [])

  // Converter dados do banco
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

    const stepPhotosMap: Record<string, string[]> = {}
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
      blindingLine: dbProject.blinding_line,
      protectionLevel: dbProject.protection_level,
      executorId: dbProject.executor_id,
      blindingSpecs: dbProject.blinding_specs ? 
        (typeof dbProject.blinding_specs === 'string' ? JSON.parse(dbProject.blinding_specs) : dbProject.blinding_specs) 
        : undefined,
      maintenanceHistory: dbProject.maintenance_services || []
    }
  }

  useEffect(() => {
    const searchProject = async () => {
      const currentRequestId = ++requestIdRef.current
      setLoading(true)
      const pid = (projectId || '').trim()
      const pidUpper = pid.toUpperCase()
      
      console.log('[PublicVerificationSecure] Buscando projeto:', pid)

      // 1. Buscar no contexto local
      const found = projects.find(p =>
        p.id === pid ||
        p.id.toLowerCase() === pid.toLowerCase() ||
        p.qrCode === pid ||
        p.vehicle?.plate?.toUpperCase() === pidUpper ||
        p.vehicle?.plate?.toUpperCase().replace('-', '') === pidUpper.replace('-', '')
      )

      if (found) {
        console.log('[PublicVerificationSecure] ✓ Encontrado no contexto')
        if (currentRequestId === requestIdRef.current) {
          // APLICAR FILTRO DE SEGURANÇA
          const filtered = filterPublicData(found)
          setPublicData(filtered)
          setError(false)
          setLoading(false)
        }
        return
      }

      // 2. Buscar no Supabase
      console.log('[PublicVerificationSecure] Buscando no Supabase...')
      const supabaseProject = await fetchProjectFromSupabase(pid)

      if (currentRequestId !== requestIdRef.current) return

      if (supabaseProject) {
        console.log('[PublicVerificationSecure] ✓ Encontrado no Supabase')
        // APLICAR FILTRO DE SEGURANÇA
        const filtered = filterPublicData(supabaseProject)
        setPublicData(filtered)
        setError(false)
      } else {
        console.log('[PublicVerificationSecure] ✗ Projeto não encontrado')
        setPublicData(getNotFoundData())
        setError(true)
      }

      setLoading(false)
    }

    void searchProject()
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
  if (error || !publicData || publicData.status === 'not_found') {
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
            O código consultado não corresponde a nenhum projeto registrado em nosso sistema.
          </p>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Código consultado:</p>
            <p className="font-mono text-[#D4AF37]">{projectId}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-6 flex items-center gap-2 mx-auto text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </button>
        </motion.div>
      </div>
    )
  }

  // Renderizar Laudo Público Seguro
  return (
    <div className="min-h-screen bg-black">
      {/* Header com ações */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-[#D4AF37]/30 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-white">EliteShield™</h1>
              <p className="text-xs text-gray-400">Verificação Pública</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#D4AF37] text-black px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#F4D03F] transition-colors"
              title="Imprimir"
            >
              <Download className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo do Laudo Público */}
      <main className="max-w-2xl mx-auto">
        <PublicLaudo data={publicData} />
      </main>
    </div>
  )
}

export default PublicVerificationSecure
