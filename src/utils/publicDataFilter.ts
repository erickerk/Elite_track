/**
 * Filtro de Dados Públicos - EliteTrack
 * 
 * Este arquivo implementa a whitelist de dados que podem ser expostos
 * publicamente na consulta de verificação (/verify/:id).
 * 
 * REGRA CRÍTICA: Apenas os dados listados aqui podem aparecer na consulta pública.
 * Qualquer dado não incluído explicitamente é considerado SENSÍVEL e NÃO DEVE VAZAR.
 */

import type { Project } from '../types'

export interface PublicProjectData {
  // ID único para autenticidade
  id: string
  eliteTraceId: string
  
  // Dados do veículo (parciais)
  vehicle: {
    brand: string
    model: string
    year: number
    color: string
    platePartial: string // XXX-X*** (mascarado)
    chassiLast4: string // Apenas últimos 4 dígitos
  }
  
  // Status da blindagem
  status: 'authentic' | 'not_found'
  statusLabel: string // "Blindagem Elite - Autêntica"
  
  // Proteção
  protectionLevel: string // NIJ III-A
  blindingLine: string // SafeCore™ ou UltraLite™
  
  // Datas
  executionDate?: string
  completedDate?: string
  
  // Garantias
  warranties: {
    glass: { years: number; description: string }
    materials: { years: number; description: string }
    finishing: { months: number; description: string }
  }
  
  // Manutenção (apenas status e data, sem detalhes)
  maintenance?: {
    hasHistory: boolean
    lastDate?: string
  }
  
  // Autenticidade
  authenticity: {
    isAuthentic: boolean
    documentType: string // "Laudo EliteShield™"
    verificationUrl: string
  }
}

/**
 * Mascara placa de veículo para exibição pública
 * Exemplos:
 * - ABC-1234 → ABC-1***
 * - ABC1D34 → ABC1***
 */
function maskPlate(plate: string): string {
  if (!plate) return '***-****'
  
  // Formato com traço: ABC-1234 → ABC-1***
  if (plate.includes('-')) {
    const parts = plate.split('-')
    if (parts.length === 2 && parts[1].length >= 1) {
      return `${parts[0]}-${parts[1][0]}***`
    }
  }
  
  // Formato Mercosul: ABC1D34 → ABC1***
  if (plate.length >= 5) {
    return plate.substring(0, 4) + '***'
  }
  
  // Fallback: mascarar últimos 3 caracteres
  return plate.substring(0, Math.max(0, plate.length - 3)) + '***'
}

/**
 * Extrai apenas os últimos 4 dígitos do chassi
 * Nota: Chassi não está no modelo atual, usar ID do veículo como fallback
 */
function getChassiLast4(vehicleId?: string): string {
  if (!vehicleId) return '****'
  // Usar últimos 4 caracteres do ID como representação
  if (vehicleId.length < 4) return vehicleId.padStart(4, '*')
  return vehicleId.slice(-4)
}

/**
 * Filtra dados do projeto para exposição pública
 * 
 * IMPORTANTE: Este é o único ponto de entrada para dados públicos.
 * Qualquer dado não retornado por esta função NÃO DEVE aparecer na consulta pública.
 */
export function filterPublicData(project: Project): PublicProjectData {
  return {
    // IDs públicos
    id: project.id,
    eliteTraceId: project.id,
    
    // Veículo (dados parciais e mascarados)
    vehicle: {
      brand: project.vehicle.brand,
      model: project.vehicle.model,
      year: project.vehicle.year,
      color: project.vehicle.color,
      platePartial: maskPlate(project.vehicle.plate),
      chassiLast4: getChassiLast4(project.vehicle.id),
    },
    
    // Status
    status: project.status === 'completed' || project.status === 'delivered' 
      ? 'authentic' 
      : 'authentic',
    statusLabel: '🛡️ Blindagem Elite - Autêntica',
    
    // Proteção
    protectionLevel: project.protectionLevel || 'NIJ III-A',
    blindingLine: project.blindingLine || 'SafeCore™',
    
    // Datas (apenas conclusão)
    executionDate: project.completedDate || project.processStartDate,
    completedDate: project.completedDate,
    
    // Garantias padrão Elite
    warranties: {
      glass: {
        years: 10,
        description: 'Vidros blindados: 10 anos de garantia'
      },
      materials: {
        years: 10,
        description: 'Materiais balísticos: 10 anos de garantia'
      },
      finishing: {
        months: 12,
        description: 'Acabamento: 12 meses de garantia'
      }
    },
    
    // Manutenção (apenas se existe e última data)
    maintenance: project.maintenanceHistory && project.maintenanceHistory.length > 0
      ? {
          hasHistory: true,
          lastDate: project.maintenanceHistory[0]?.date
        }
      : {
          hasHistory: false
        },
    
    // Autenticidade
    authenticity: {
      isAuthentic: true,
      documentType: 'Laudo EliteShield™',
      verificationUrl: `/verify/${project.id}`
    }
  }
}

/**
 * Valida se um objeto contém apenas dados públicos permitidos
 * Usado para testes e debugging
 */
export function validatePublicData(data: any): { valid: boolean; violations: string[] } {
  const violations: string[] = []
  
  // Lista de campos PROIBIDOS (sensíveis)
  const forbiddenFields = [
    'user.name',
    'user.email', 
    'user.phone',
    'user.cpf',
    'user.cnpj',
    'user.address',
    'executorId',
    'executor',
    'timeline',
    'photos',
    'notes',
    'price',
    'cost',
    'quote',
    'internalNotes'
  ]
  
  const dataStr = JSON.stringify(data).toLowerCase()
  
  forbiddenFields.forEach(field => {
    if (dataStr.includes(field.toLowerCase())) {
      violations.push(`Campo proibido encontrado: ${field}`)
    }
  })
  
  return {
    valid: violations.length === 0,
    violations
  }
}

/**
 * Retorna mensagem de erro para projeto não encontrado
 */
export function getNotFoundData(): PublicProjectData {
  return {
    id: '',
    eliteTraceId: '',
    vehicle: {
      brand: '',
      model: '',
      year: 0,
      color: '',
      platePartial: '***-****',
      chassiLast4: '****'
    },
    status: 'not_found',
    statusLabel: '❌ Projeto não encontrado',
    protectionLevel: '',
    blindingLine: '',
    warranties: {
      glass: { years: 0, description: '' },
      materials: { years: 0, description: '' },
      finishing: { months: 0, description: '' }
    },
    authenticity: {
      isAuthentic: false,
      documentType: '',
      verificationUrl: ''
    }
  }
}
