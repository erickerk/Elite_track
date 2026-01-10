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
  status: 'pending' | 'analyzed' | 'sent' | 'approved' | 'rejected'
  createdAt: string
  estimatedPrice?: string
  estimatedDays?: number
  executorNotes?: string
  executorId?: string
  executorName?: string
  clientResponse?: string
  respondedAt?: string
  approvedAt?: string
  rejectedAt?: string
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

  const updateQuoteStatus = useCallback((id: string, status: QuoteRequest['status'], data?: Partial<QuoteRequest>) => {
    setQuotes(prev => prev.map(q => 
      q.id === id ? { ...q, status, ...data, respondedAt: new Date().toISOString() } : q
    ))
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

  const createQuoteFromExecutor = useCallback((quote: Omit<QuoteRequest, 'id' | 'createdAt'>) => {
    const newQuote: QuoteRequest = {
      ...quote,
      id: `quote-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setQuotes(prev => [newQuote, ...prev])
  }, [])

  const sendQuoteToClient = useCallback((id: string, price: string, days: number, notes: string, executorId: string, executorName: string) => {
    setQuotes(prev => prev.map(q => 
      q.id === id ? { 
        ...q, 
        status: 'sent' as const,
        estimatedPrice: price,
        estimatedDays: days,
        executorNotes: notes,
        executorId,
        executorName,
        respondedAt: new Date().toISOString()
      } : q
    ))
  }, [])

  const clientApproveQuote = useCallback((id: string, response?: string) => {
    setQuotes(prev => prev.map(q => 
      q.id === id ? { 
        ...q, 
        status: 'approved' as const,
        clientResponse: response,
        approvedAt: new Date().toISOString()
      } : q
    ))
  }, [])

  const clientRejectQuote = useCallback((id: string, response?: string) => {
    setQuotes(prev => prev.map(q => 
      q.id === id ? { 
        ...q, 
        status: 'rejected' as const,
        clientResponse: response,
        rejectedAt: new Date().toISOString()
      } : q
    ))
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
