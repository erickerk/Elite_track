import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  wantsSpecialist: boolean
  createdAt: string
  source: 'landing-page' | 'contact-form' | 'quote-request'
}

interface LeadsContextType {
  leads: Lead[]
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void
  removeLead: (id: string) => void
  exportToExcel: () => void
  clearAllLeads: () => void
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined)

const STORAGE_KEY = 'elitetrack_leads'

interface LeadsProviderProps {
  children: ReactNode
}

export function LeadsProvider({ children }: LeadsProviderProps) {
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
  }, [leads])

  const addLead = useCallback((leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }
    setLeads(prev => [...prev, newLead])
    return newLead
  }, [])

  const removeLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id))
  }, [])

  const clearAllLeads = useCallback(() => {
    setLeads([])
  }, [])

  const exportToExcel = useCallback(() => {
    if (leads.length === 0) {
      alert('Não há leads para exportar')
      return
    }

    // Create CSV content
    const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Quer Especialista', 'Data de Cadastro', 'Origem']
    const rows = leads.map(lead => [
      lead.id,
      lead.name,
      lead.email,
      lead.phone,
      lead.wantsSpecialist ? 'Sim' : 'Não',
      new Date(lead.createdAt).toLocaleString('pt-BR'),
      lead.source === 'landing-page' ? 'Página Inicial' : 
        lead.source === 'contact-form' ? 'Formulário de Contato' : 'Solicitação de Orçamento'
    ])

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')

    // Add BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `leads_elitetrack_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [leads])

  return (
    <LeadsContext.Provider
      value={{
        leads,
        addLead,
        removeLead,
        exportToExcel,
        clearAllLeads
      }}
    >
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  const context = useContext(LeadsContext)
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadsProvider')
  }
  return context
}
