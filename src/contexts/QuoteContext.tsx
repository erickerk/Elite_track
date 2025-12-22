import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

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

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<QuoteRequest[]>(initialQuotes)

  const addQuote = useCallback((quote: Omit<QuoteRequest, 'id' | 'createdAt' | 'status'>) => {
    const newQuote: QuoteRequest = {
      ...quote,
      id: `quote-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setQuotes(prev => [newQuote, ...prev])
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
