import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface QuoteRequest {
  id: string
  clientId: string
  clientName: string
  clientEmail: string
  vehicleType: string
  vehicleBrand: string
  vehicleModel: string
  vehicleYear: string
  blindingLevel: string
  status: 'pending' | 'analyzed' | 'sent' | 'approved' | 'rejected'
  createdAt: string
  estimatedPrice?: string
  estimatedDays?: number
  executorNotes?: string
  clientResponse?: string
  respondedAt?: string
}

interface QuoteContextType {
  quotes: QuoteRequest[]
  addQuote: (quote: Omit<QuoteRequest, 'id' | 'createdAt' | 'status'>) => void
  updateQuoteStatus: (id: string, status: QuoteRequest['status'], data?: Partial<QuoteRequest>) => void
  getQuotesByClient: (clientEmail: string) => QuoteRequest[]
  getQuotesByStatus: (status: QuoteRequest['status']) => QuoteRequest[]
  getPendingQuotes: () => QuoteRequest[]
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined)

const initialQuotes: QuoteRequest[] = [
  {
    id: 'quote-001',
    clientId: '1',
    clientName: 'João Silva',
    clientEmail: 'cliente@elite.com',
    vehicleType: 'suv',
    vehicleBrand: 'BMW',
    vehicleModel: 'X5',
    vehicleYear: '2024',
    blindingLevel: 'III-A',
    status: 'pending',
    createdAt: '2024-12-13T10:00:00',
  },
]

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

  return (
    <QuoteContext.Provider value={{
      quotes,
      addQuote,
      updateQuoteStatus,
      getQuotesByClient,
      getQuotesByStatus,
      getPendingQuotes,
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
