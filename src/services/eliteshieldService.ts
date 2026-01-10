import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Cast para any para tabelas ainda não tipadas
const db = supabase as any

// =====================================================
// TIPOS DO LAUDO ELITESHIELD™
// =====================================================

export interface BlindingLine {
  id: string
  name: string
  display_name: string
  description?: string
  protection_level: string
  usage_type?: string
  seal_name?: string
  is_active: boolean
}

export interface GlassSpec {
  id: string
  manufacturer: string
  model?: string
  thickness_mm: number
  warranty_years: number
  certification?: string
  lot_number?: string
}

export interface OpaqueMaterial {
  id: string
  name: string
  type: string
  manufacturer?: string
  layers_min?: number
  layers_max?: number
  certification?: string
}

export interface WarrantyType {
  id: string
  name: string
  component: string
  duration_months: number
  description?: string
}

export interface TechnicalResponsible {
  id: string
  name: string
  position: string
  registration?: string
  signature_url?: string
}

export interface EliteShieldPhoto {
  id: string
  report_id: string
  stage: 'desmontagem' | 'vidros' | 'opacos' | 'fechamento' | 'final'
  stage_name: string
  photo_url: string
  thumbnail_url?: string
  technician_name?: string
  capture_date: string
  notes?: string
  sort_order: number
  is_required: boolean
}

export interface EliteShieldExecutionStep {
  id: string
  report_id: string
  step_number: number
  step_name: string
  status: 'pending' | 'in_progress' | 'completed'
  completed_at?: string
  completed_by?: string
  notes?: string
}

export interface EliteShieldReport {
  id: string
  project_id: string
  user_id: string
  status: 'draft' | 'in_progress' | 'review' | 'finalized'
  version: number
  
  // Capa
  cover_photo_url?: string
  completion_date?: string
  
  // Veículo
  vehicle_brand?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_color?: string
  vehicle_plate?: string
  vehicle_chassis?: string
  vehicle_km_checkin?: number
  vehicle_type?: string
  
  // Cliente
  client_name?: string
  client_document?: string
  client_phone?: string
  client_email?: string
  client_city?: string
  client_state?: string
  
  // Blindagem
  blinding_line_id?: string
  protection_level?: string
  usage_type?: string
  
  // Especificações
  glass_spec_id?: string
  glass_thickness_mm?: number
  glass_warranty_years?: number
  glass_lot_number?: string
  opaque_material_id?: string
  aramid_layers?: number
  complement_material?: string
  
  // Mapa
  protected_areas?: string[]
  
  // Testes
  tests_checklist?: Record<string, boolean>
  tests_approved?: boolean
  tests_date?: string
  tests_technician?: string
  
  // Responsáveis
  technical_responsible_id?: string
  supervisor_id?: string
  technical_signature_url?: string
  supervisor_signature_url?: string
  
  // Garantias
  warranties?: Array<{
    component: string
    duration_months: number
    description?: string
  }>
  
  // QR Code
  qr_code_url?: string
  trace_token?: string
  
  // Observações
  technical_observations?: string
  recommendations?: string
  
  // Declaração
  final_declaration?: string
  declaration_accepted?: boolean
  declaration_date?: string
  
  // Status
  issue_date?: string
  document_version?: string
  
  // Metadados
  created_by?: string
  finalized_by?: string
  finalized_at?: string
  created_at?: string
  updated_at?: string
  
  // Relacionamentos (quando carregados)
  blinding_line?: BlindingLine
  glass_spec?: GlassSpec
  opaque_material?: OpaqueMaterial
  technical_responsible?: TechnicalResponsible
  supervisor?: TechnicalResponsible
  photos?: EliteShieldPhoto[]
  execution_steps?: EliteShieldExecutionStep[]
}

// =====================================================
// SERVIÇO DO LAUDO ELITESHIELD™
// =====================================================

export const eliteShieldService = {
  // ===== DADOS PADRÃO (iguais para todos) =====
  
  async getBlindingLines(): Promise<BlindingLine[]> {
    if (!isSupabaseConfigured() || !db) return []
    
    const { data, error } = await db
      .from('blinding_lines')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('[EliteShield] Erro ao carregar linhas de blindagem:', error)
      return []
    }
    
    return data || []
  },
  
  async getGlassSpecs(): Promise<GlassSpec[]> {
    if (!isSupabaseConfigured() || !db) return []
    
    const { data, error } = await db
      .from('glass_specs')
      .select('*')
      .eq('is_active', true)
      .order('thickness_mm')
    
    if (error) {
      console.error('[EliteShield] Erro ao carregar especificações de vidro:', error)
      return []
    }
    
    return data || []
  },
  
  async getOpaqueMaterials(): Promise<OpaqueMaterial[]> {
    if (!isSupabaseConfigured() || !db) return []
    
    const { data, error } = await db
      .from('opaque_materials')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('[EliteShield] Erro ao carregar materiais opacos:', error)
      return []
    }
    
    return data || []
  },
  
  async getWarrantyTypes(): Promise<WarrantyType[]> {
    if (!isSupabaseConfigured() || !db) return []
    
    const { data, error } = await db
      .from('warranty_types')
      .select('*')
      .eq('is_active', true)
      .order('component')
    
    if (error) {
      console.error('[EliteShield] Erro ao carregar tipos de garantia:', error)
      return []
    }
    
    return data || []
  },
  
  async getTechnicalResponsibles(): Promise<TechnicalResponsible[]> {
    if (!isSupabaseConfigured() || !db) return []
    
    const { data, error } = await db
      .from('technical_responsibles')
      .select('*')
      .eq('is_active', true)
      .order('position')
    
    if (error) {
      console.error('[EliteShield] Erro ao carregar responsáveis técnicos:', error)
      return []
    }
    
    return data || []
  },
  
  // ===== LAUDOS (exclusivos por cliente) =====
  
  async getReportByProjectId(projectId: string): Promise<EliteShieldReport | null> {
    if (!isSupabaseConfigured() || !db) return null
    
    const { data, error } = await db
      .from('eliteshield_reports')
      .select(`
        *,
        blinding_line:blinding_lines(*),
        glass_spec:glass_specs(*),
        opaque_material:opaque_materials(*),
        technical_responsible:technical_responsibles!technical_responsible_id(*),
        supervisor:technical_responsibles!supervisor_id(*)
      `)
      .eq('project_id', projectId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('[EliteShield] Erro ao carregar laudo:', error)
      return null
    }
    
    if (!data) return null
    
    // Carregar fotos e etapas
    const [photosResult, stepsResult] = await Promise.all([
      db.from('eliteshield_photos').select('*').eq('report_id', data.id).order('sort_order'),
      db.from('eliteshield_execution_steps').select('*').eq('report_id', data.id).order('step_number')
    ])
    
    return {
      ...data,
      photos: photosResult.data || [],
      execution_steps: stepsResult.data || []
    }
  },
  
  async getReportsByUserId(userId: string): Promise<EliteShieldReport[]> {
    if (!isSupabaseConfigured() || !db) return []
    
    const { data, error } = await db
      .from('eliteshield_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('[EliteShield] Erro ao carregar laudos do usuário:', error)
      return []
    }
    
    return data || []
  },
  
  async createReport(projectId: string, userId: string, vehicleData?: Partial<EliteShieldReport>): Promise<EliteShieldReport | null> {
    if (!isSupabaseConfigured() || !db) return null
    
    const reportData = {
      project_id: projectId,
      user_id: userId,
      status: 'draft',
      version: 1,
      ...vehicleData
    }
    
    const { data, error } = await db
      .from('eliteshield_reports')
      .insert(reportData)
      .select()
      .single()
    
    if (error) {
      console.error('[EliteShield] Erro ao criar laudo:', error)
      return null
    }
    
    // Criar etapas de execução padrão
    if (data) {
      const defaultSteps = [
        { step_number: 1, step_name: 'Check-in' },
        { step_number: 2, step_name: 'Desmontagem' },
        { step_number: 3, step_name: 'Vidros' },
        { step_number: 4, step_name: 'Opacos' },
        { step_number: 5, step_name: 'Montagem' },
        { step_number: 6, step_name: 'Acabamento' },
        { step_number: 7, step_name: 'Testes' },
        { step_number: 8, step_name: 'Liberação' }
      ]
      
      await db
        .from('eliteshield_execution_steps')
        .insert(defaultSteps.map(step => ({
          report_id: data.id,
          ...step,
          status: 'pending'
        })))
    }
    
    return data
  },
  
  async updateReport(reportId: string, updates: Partial<EliteShieldReport>): Promise<boolean> {
    if (!isSupabaseConfigured() || !db) return false
    
    const { error } = await db
      .from('eliteshield_reports')
      .update(updates)
      .eq('id', reportId)
    
    if (error) {
      console.error('[EliteShield] Erro ao atualizar laudo:', error)
      return false
    }
    
    return true
  },
  
  async finalizeReport(reportId: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !db) return false
    
    const { error } = await db
      .from('eliteshield_reports')
      .update({
        status: 'finalized',
        finalized_by: userId,
        finalized_at: new Date().toISOString(),
        issue_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', reportId)
    
    if (error) {
      console.error('[EliteShield] Erro ao finalizar laudo:', error)
      return false
    }
    
    return true
  },
  
  // ===== FOTOS =====
  
  async addPhoto(reportId: string, photoData: Omit<EliteShieldPhoto, 'id' | 'report_id'>): Promise<EliteShieldPhoto | null> {
    if (!isSupabaseConfigured() || !db) return null
    
    const { data, error } = await db
      .from('eliteshield_photos')
      .insert({
        report_id: reportId,
        ...photoData
      })
      .select()
      .single()
    
    if (error) {
      console.error('[EliteShield] Erro ao adicionar foto:', error)
      return null
    }
    
    return data
  },
  
  async deletePhoto(photoId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !db) return false
    
    const { error } = await db
      .from('eliteshield_photos')
      .delete()
      .eq('id', photoId)
    
    if (error) {
      console.error('[EliteShield] Erro ao excluir foto:', error)
      return false
    }
    
    return true
  },
  
  // ===== ETAPAS DE EXECUÇÃO =====
  
  async updateExecutionStep(stepId: string, updates: Partial<EliteShieldExecutionStep>): Promise<boolean> {
    if (!isSupabaseConfigured() || !db) return false
    
    const { error } = await db
      .from('eliteshield_execution_steps')
      .update(updates)
      .eq('id', stepId)
    
    if (error) {
      console.error('[EliteShield] Erro ao atualizar etapa:', error)
      return false
    }
    
    return true
  },
  
  async completeStep(stepId: string, technicianName: string): Promise<boolean> {
    return this.updateExecutionStep(stepId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: technicianName
    })
  },
  
  // ===== VALIDAÇÃO =====
  
  validateReport(report: EliteShieldReport): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Verificar dados do veículo
    if (!report.vehicle_brand) errors.push('Marca do veículo é obrigatória')
    if (!report.vehicle_model) errors.push('Modelo do veículo é obrigatório')
    if (!report.vehicle_plate) errors.push('Placa do veículo é obrigatória')
    
    // Verificar dados do cliente
    if (!report.client_name) errors.push('Nome do cliente é obrigatório')
    
    // Verificar linha de blindagem
    if (!report.blinding_line_id) errors.push('Linha de blindagem é obrigatória')
    
    // Verificar fotos obrigatórias
    const requiredStages = ['desmontagem', 'vidros', 'opacos', 'fechamento']
    const photoStages = report.photos?.map(p => p.stage) || []
    
    for (const stage of requiredStages) {
      if (!photoStages.includes(stage as EliteShieldPhoto['stage'])) {
        errors.push(`Foto da etapa "${stage}" é obrigatória`)
      }
    }
    
    // Verificar testes aprovados
    if (!report.tests_approved) errors.push('Testes devem ser aprovados')
    
    // Verificar responsável técnico
    if (!report.technical_responsible_id) errors.push('Responsável técnico é obrigatório')
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  // ===== DECLARAÇÃO FINAL PADRÃO =====
  
  getDefaultDeclaration(): string {
    return `Declaramos que as informações contidas neste EliteShield™ – Laudo Técnico de Blindagem Veicular refletem fielmente o processo executado e os materiais aplicados, sendo este documento emitido para fins de registro técnico, transparência, garantia e comprovação do serviço prestado.

Elite Blindagens
Proteção elevada ao estado da arte.`
  },
  
  // ===== TEXTO PADRÃO DAS SEÇÕES =====
  
  getDefaultSections() {
    return {
      technicalExecution: `A Elite Blindagens, pessoa jurídica devidamente constituída, declara para os devidos fins que o veículo identificado neste documento foi submetido a processo completo de blindagem veicular, executado conforme as especificações técnicas contratadas, utilizando materiais balísticos certificados, mão de obra especializada e procedimentos padronizados, respeitando as normas técnicas aplicáveis ao segmento de blindagem automotiva.`,
      
      ballisticProtection: `O processo de blindagem descrito neste laudo atende ao nível de proteção balística NIJ III-A, conforme classificação internacional amplamente adotada no setor, sendo projetado para proteção contra ameaças compatíveis com este nível, dentro dos limites técnicos e operacionais estabelecidos pelas normas vigentes.`,
      
      materialsNote: `Os materiais empregados são originais, novos, não reutilizados, e foram aplicados de acordo com as recomendações técnicas dos respectivos fabricantes.`,
      
      executionProcess: `O veículo passou por processo técnico controlado, incluindo, mas não se limitando a:
• Registro fotográfico inicial
• Desmontagem técnica
• Instalação dos vidros blindados
• Aplicação dos materiais balísticos opacos
• Montagem e acabamento
• Testes funcionais, estruturais e visuais
• Inspeção final e liberação técnica`,
      
      photoRegistry: `Este laudo é acompanhado de registro fotográfico técnico, realizado durante as etapas críticas do processo, com o objetivo de garantir transparência, rastreabilidade e comprovação da correta execução da blindagem, sendo parte integrante e inseparável deste documento.`,
      
      warranty: `A Elite Blindagens concede garantia limitada sobre:
• A integridade dos materiais balísticos aplicados
• A correta instalação dos componentes de blindagem
• O acabamento interno relacionado diretamente ao processo de blindagem`,
      
      limitations: `A blindagem veicular:
• Não torna o veículo indestrutível ou imune a todos os tipos de ameaças
• Possui limitações técnicas inerentes ao nível de proteção contratado
• Está condicionada ao uso adequado do veículo e à realização das revisões recomendadas`,
      
      maintenance: `Recomenda-se a realização de revisões periódicas, conforme orientações da Elite Blindagens, com o objetivo de preservar a integridade dos materiais balísticos, o correto funcionamento dos sistemas do veículo e a validade das garantias concedidas.`,
      
      eliteTrace: `Este laudo está vinculado ao sistema EliteTrace™, acessível por meio de QR Code exclusivo, permitindo a consulta ao histórico técnico completo da blindagem, incluindo atualizações, revisões e eventuais complementos de informações, garantindo autenticidade e integridade dos dados.`
    }
  }
}

export default eliteShieldService
