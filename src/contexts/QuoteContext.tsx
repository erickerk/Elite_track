import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase/client'

// Cast supabase para any para permitir acesso a tabelas ainda não tipadas
const db = supabase as any

export interface QuoteRequest {
  id: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  vehicleType: string
  vehicleBrand: string
  vehicleModel: string
  vehicleYear: string
  vehiclePlate?: string
  blindingLevel: string
  serviceType: 'new-blinding' | 'glass-replacement' | 'door-replacement' | 'maintenance' | 'revision' | 'other'
  serviceDescription?: string
  clientDescription?: string
  status: 'pending' | 'analyzed' | 'sent' | 'approved' | 'rejected' | 'holding' | 'expired'
  createdAt: string
  estimatedPrice?: number // Armazenar como número (centavos ou decimal)
  estimatedPriceFormatted?: string // Formatação para exibição
  estimatedDays?: number
  daysType?: 'business' | 'calendar' // 'business' = dias úteis, 'calendar' = dias corridos
  executorNotes?: string
  executorId?: string
  executorName?: string
  clientResponse?: string
  respondedAt?: string
  approvedAt?: string
  rejectedAt?: string
  lastInteractionAt?: string // Marco para contagem de status automático
}

// Formatar valor como moeda BRL
export function formatCurrency(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return 'Orçamento sob consulta'
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) : value
  if (isNaN(numValue)) return 'Orçamento sob consulta'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue)
}

// Parsear valor de moeda para número
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

interface QuoteContextType {
  quotes: QuoteRequest[]
  addQuote: (quote: Omit<QuoteRequest, 'id' | 'createdAt' | 'status'>) => void
  createQuoteFromExecutor: (quote: Omit<QuoteRequest, 'id' | 'createdAt'>) => void
  updateQuoteStatus: (id: string, status: QuoteRequest['status'], data?: Partial<QuoteRequest>) => void
  sendQuoteToClient: (id: string, price: string, days: number, notes: string, executorId: string, executorName: string) => void
  clientApproveQuote: (id: string, response?: string) => void
  clientRejectQuote: (id: string, response?: string) => void
  getQuotesByClient: (clientEmail: string) => QuoteRequest[]
  getQuotesByStatus: (status: QuoteRequest['status']) => QuoteRequest[]
  getPendingQuotes: () => QuoteRequest[]
  getSentQuotes: () => QuoteRequest[]
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined)

const initialQuotes: QuoteRequest[] = []

// Helper para converter dados do Supabase para QuoteRequest
function dbQuoteToQuote(dbQuote: any): QuoteRequest {
  return {
    id: dbQuote.id,
    clientId: dbQuote.client_id || '',
    clientName: dbQuote.client_name,
    clientEmail: dbQuote.client_email,
    clientPhone: dbQuote.client_phone,
    vehicleType: dbQuote.vehicle_type || '',
    vehicleBrand: dbQuote.vehicle_brand,
    vehicleModel: dbQuote.vehicle_model,
    vehicleYear: dbQuote.vehicle_year || '',
    vehiclePlate: dbQuote.vehicle_plate,
    blindingLevel: dbQuote.blinding_level || '',
    serviceType: dbQuote.service_type,
    serviceDescription: dbQuote.service_description,
    clientDescription: dbQuote.client_description,
    status: dbQuote.status,
    estimatedPrice: dbQuote.estimated_price,
    estimatedDays: dbQuote.estimated_days,
    executorNotes: dbQuote.executor_notes,
    executorId: dbQuote.executor_id,
    executorName: dbQuote.executor_name,
    clientResponse: dbQuote.client_response,
    createdAt: dbQuote.created_at,
    respondedAt: dbQuote.responded_at,
    approvedAt: dbQuote.approved_at,
    rejectedAt: dbQuote.rejected_at,
  }
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<QuoteRequest[]>(initialQuotes)

  // Carregar orçamentos do Supabase ao iniciar
  useEffect(() => {
    const loadQuotes = async () => {
      if (!isSupabaseConfigured() || !db) {
        return
      }

      try {
        const { data, error } = await db
          .from('quotes')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Erro ao carregar orçamentos:', error)
        } else if (data) {
          setQuotes(data.map(dbQuoteToQuote))
        }
      } catch (error) {
        console.error('Erro ao carregar orçamentos:', error)
      }
    }

    loadQuotes()
  }, [])

  const addQuote = useCallback(async (quote: Omit<QuoteRequest, 'id' | 'createdAt' | 'status'>) => {
    const newQuote: QuoteRequest = {
      ...quote,
      id: `quote-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    // Adicionar localmente primeiro para feedback imediato
    setQuotes(prev => [newQuote, ...prev])

    // Sincronizar com Supabase
    if (isSupabaseConfigured() && db) {
      try {
        const { data, error } = await db
          .from('quotes')
          .insert({
            client_id: quote.clientId || null,
            client_name: quote.clientName,
            client_email: quote.clientEmail,
            client_phone: quote.clientPhone,
            vehicle_type: quote.vehicleType,
            vehicle_brand: quote.vehicleBrand,
            vehicle_model: quote.vehicleModel,
            vehicle_year: quote.vehicleYear,
            vehicle_plate: quote.vehiclePlate,
            blinding_level: quote.blindingLevel,
            service_type: quote.serviceType,
            service_description: quote.serviceDescription,
            client_description: quote.clientDescription,
            status: 'pending',
          })
          .select()
          .single()

        if (error) {
          console.error('Erro ao salvar orçamento no Supabase:', error)
        } else if (data) {
          // Atualizar com o ID real do Supabase
          setQuotes(prev => prev.map(q => 
            q.id === newQuote.id ? dbQuoteToQuote(data) : q
          ))
        }
      } catch (error) {
        console.error('Erro ao salvar orçamento:', error)
      }
    }
  }, [])

  const updateQuoteStatus = useCallback(async (id: string, status: QuoteRequest['status'], data?: Partial<QuoteRequest>) => {
    // Atualizar localmente primeiro
    setQuotes(prev => prev.map(q => 
      q.id === id ? { ...q, status, ...data, respondedAt: new Date().toISOString() } : q
    ))
    
    // Sincronizar com Supabase
    if (isSupabaseConfigured() && db) {
      try {
        const updateData: any = { status, updated_at: new Date().toISOString() }
        if (data?.estimatedPrice) updateData.estimated_price = data.estimatedPrice
        if (data?.estimatedDays) updateData.estimated_days = data.estimatedDays
        if (data?.executorNotes) updateData.executor_notes = data.executorNotes
        if (data?.executorId) updateData.executor_id = data.executorId
        if (data?.executorName) updateData.executor_name = data.executorName
        if (data?.clientResponse) updateData.client_response = data.clientResponse
        
        await db.from('quotes').update(updateData).eq('id', id)
        console.log('[QuoteContext] ✓ Status atualizado no Supabase:', id, status)
      } catch (error) {
        console.error('[QuoteContext] Erro ao atualizar status no Supabase:', error)
      }
    }
  }, [])

  const getQuotesByClient = useCallback((clientEmail: string) => {
    return quotes.filter(q => q.clientEmail === clientEmail)
  }, [quotes])

  const getQuotesByStatus = useCallback((status: QuoteRequest['status']) => {
    return quotes.filter(q => q.status === status)
  }, [quotes])

  const getPendingQuotes = useCallback(() => {
    return quotes.filter(q => q.status === 'pending' || q.status === 'analyzed')
  }, [quotes])

  const getSentQuotes = useCallback(() => {
    return quotes.filter(q => q.status === 'sent')
  }, [quotes])

  const createQuoteFromExecutor = useCallback(async (quote: Omit<QuoteRequest, 'id' | 'createdAt'>) => {
    const newQuote: QuoteRequest = {
      ...quote,
      id: `quote-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    
    // Adicionar localmente primeiro
    setQuotes(prev => [newQuote, ...prev])
    
    // Sincronizar com Supabase
    if (isSupabaseConfigured() && db) {
      try {
        const { data, error } = await db
          .from('quotes')
          .insert({
            client_id: quote.clientId || null,
            client_name: quote.clientName,
            client_email: quote.clientEmail,
            client_phone: quote.clientPhone,
            vehicle_type: quote.vehicleType,
            vehicle_brand: quote.vehicleBrand,
            vehicle_model: quote.vehicleModel,
            vehicle_year: quote.vehicleYear,
            vehicle_plate: quote.vehiclePlate,
            blinding_level: quote.blindingLevel,
            service_type: quote.serviceType,
            service_description: quote.serviceDescription,
            client_description: quote.clientDescription,
            status: quote.status || 'pending',
            estimated_price: quote.estimatedPrice,
            estimated_days: quote.estimatedDays,
            executor_notes: quote.executorNotes,
            executor_id: quote.executorId,
            executor_name: quote.executorName,
          })
          .select()
          .single()

        if (error) {
          console.error('[QuoteContext] Erro ao criar orçamento no Supabase:', error)
        } else if (data) {
          // Atualizar com o ID real do Supabase
          setQuotes(prev => prev.map(q => 
            q.id === newQuote.id ? dbQuoteToQuote(data) : q
          ))
          console.log('[QuoteContext] ✓ Orçamento criado pelo executor no Supabase:', data.id)
        }
      } catch (error) {
        console.error('[QuoteContext] Erro ao criar orçamento:', error)
      }
    }
  }, [])

  const sendQuoteToClient = useCallback(async (id: string, price: string, days: number, notes: string, executorId: string, executorName: string, daysType: 'business' | 'calendar' = 'business') => {
    const numericPrice = parseCurrency(price)
    const now = new Date().toISOString()
    
    // Atualizar localmente primeiro
    setQuotes(prev => prev.map(q => 
      q.id === id ? { 
        ...q, 
        status: 'sent' as const,
        estimatedPrice: numericPrice,
        estimatedPriceFormatted: formatCurrency(numericPrice),
        estimatedDays: days,
        daysType,
        executorNotes: notes,
        executorId,
        executorName,
        respondedAt: now,
        lastInteractionAt: now
      } : q
    ))
    
    // Sincronizar com Supabase
    if (isSupabaseConfigured() && db) {
      try {
        await db.from('quotes').update({
          status: 'sent',
          estimated_price: numericPrice,
          estimated_days: days,
          executor_notes: notes,
          executor_id: executorId,
          executor_name: executorName,
          responded_at: now,
          updated_at: now
        }).eq('id', id)
        console.log('[QuoteContext] ✓ Orçamento enviado ao cliente no Supabase:', id)
      } catch (error) {
        console.error('[QuoteContext] Erro ao enviar orçamento no Supabase:', error)
      }
    }
  }, [])

  const clientApproveQuote = useCallback(async (id: string, response?: string) => {
    const now = new Date().toISOString()
    
    // Atualizar localmente primeiro
    setQuotes(prev => prev.map(q => 
      q.id === id ? { 
        ...q, 
        status: 'approved' as const,
        clientResponse: response,
        approvedAt: now
      } : q
    ))
    
    // Sincronizar com Supabase
    if (isSupabaseConfigured() && db) {
      try {
        await db.from('quotes').update({
          status: 'approved',
          client_response: response,
          approved_at: now,
          updated_at: now
        }).eq('id', id)
        console.log('[QuoteContext] ✓ Orçamento aprovado no Supabase:', id)
      } catch (error) {
        console.error('[QuoteContext] Erro ao aprovar orçamento no Supabase:', error)
      }
    }
  }, [])

  const clientRejectQuote = useCallback(async (id: string, response?: string) => {
    const now = new Date().toISOString()
    
    // Atualizar localmente primeiro
    setQuotes(prev => prev.map(q => 
      q.id === id ? { 
        ...q, 
        status: 'rejected' as const,
        clientResponse: response,
        rejectedAt: now
      } : q
    ))
    
    // Sincronizar com Supabase
    if (isSupabaseConfigured() && db) {
      try {
        await db.from('quotes').update({
          status: 'rejected',
          client_response: response,
          rejected_at: now,
          updated_at: now
        }).eq('id', id)
        console.log('[QuoteContext] ✓ Orçamento rejeitado no Supabase:', id)
      } catch (error) {
        console.error('[QuoteContext] Erro ao rejeitar orçamento no Supabase:', error)
      }
    }
  }, [])

  return (
    <QuoteContext.Provider value={{
      quotes,
      addQuote,
      createQuoteFromExecutor,
      updateQuoteStatus,
      sendQuoteToClient,
      clientApproveQuote,
      clientRejectQuote,
      getQuotesByClient,
      getQuotesByStatus,
      getPendingQuotes,
      getSentQuotes,
    }}>
      {children}
    </QuoteContext.Provider>
  )
}

export function useQuotes() {
  const context = useContext(QuoteContext)
  if (!context) {
    throw new Error('useQuotes must be used within a QuoteProvider')
  }
  return context
}
