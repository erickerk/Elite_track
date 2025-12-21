import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { ChatMessage, ChatConversation } from '../types'

interface ChatContextType {
  conversations: ChatConversation[]
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void
  sendMessage: (conversationId: string, content: string, sender: { id: string; name: string; role: 'client' | 'executor' | 'admin' }) => void
  markConversationAsRead: (conversationId: string) => void
  getConversationByProjectId: (projectId: string) => ChatConversation | undefined
  totalUnreadCount: number
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const initialConversations: ChatConversation[] = [
  {
    id: 'conv-1',
    projectId: 'PRJ-2024-001',
    participants: ['1', '2', '3'],
    messages: [
      {
        id: 'msg-1',
        senderId: '1',
        senderName: 'Ricardo Mendes',
        senderRole: 'client',
        content: 'Olá! Gostaria de saber como está o andamento da blindagem do meu veículo.',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        read: true,
        projectId: 'PRJ-2024-001',
      },
      {
        id: 'msg-2',
        senderId: '2',
        senderName: 'Carlos Silva',
        senderRole: 'executor',
        content: 'Olá Ricardo! Seu veículo está na etapa de instalação da manta opaca. Tudo correndo conforme planejado!',
        timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000),
        read: true,
        projectId: 'PRJ-2024-001',
      },
      {
        id: 'msg-3',
        senderId: '1',
        senderName: 'Ricardo Mendes',
        senderRole: 'client',
        content: 'Excelente! Vocês conseguem me enviar algumas fotos do processo?',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        projectId: 'PRJ-2024-001',
      },
      {
        id: 'msg-4',
        senderId: '2',
        senderName: 'Carlos Silva',
        senderRole: 'executor',
        content: 'Claro! Acabamos de adicionar novas fotos na galeria do seu projeto. Você pode acessar pelo app a qualquer momento.',
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
        read: true,
        projectId: 'PRJ-2024-001',
      },
      {
        id: 'msg-5',
        senderId: '1',
        senderName: 'Ricardo Mendes',
        senderRole: 'client',
        content: 'Perfeito! Vocês podem me dar uma previsão mais exata de quando ficará pronto?',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        projectId: 'PRJ-2024-001',
      },
    ],
    unreadCount: 1,
  },
  {
    id: 'conv-2',
    projectId: 'PRJ-2024-002',
    participants: ['4', '2', '3'],
    messages: [
      {
        id: 'msg-6',
        senderId: '4',
        senderName: 'Fernanda Costa',
        senderRole: 'client',
        content: 'Bom dia! Preciso de informações sobre o nível de proteção do meu veículo.',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        read: true,
        projectId: 'PRJ-2024-002',
      },
      {
        id: 'msg-7',
        senderId: '4',
        senderName: 'Fernanda Costa',
        senderRole: 'client',
        content: 'Também queria saber se vocês já iniciaram a instalação dos vidros blindados.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        projectId: 'PRJ-2024-002',
      },
    ],
    unreadCount: 1,
  },
  {
    id: 'conv-3',
    projectId: 'PRJ-2024-003',
    participants: ['5', '2', '3'],
    messages: [
      {
        id: 'msg-8',
        senderId: '5',
        senderName: 'Pedro Santos',
        senderRole: 'client',
        content: 'Boa tarde! Meu carro já está na fase final?',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: true,
        projectId: 'PRJ-2024-003',
      },
      {
        id: 'msg-9',
        senderId: '2',
        senderName: 'Carlos Silva',
        senderRole: 'executor',
        content: 'Olá Pedro! Sim, estamos finalizando os ajustes. Em breve entraremos em contato para agendar a entrega.',
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        read: true,
        projectId: 'PRJ-2024-003',
      },
      {
        id: 'msg-10',
        senderId: '5',
        senderName: 'Pedro Santos',
        senderRole: 'client',
        content: 'Ótimo! Aguardo o contato. Já estou ansioso para ver o resultado!',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        read: false,
        projectId: 'PRJ-2024-003',
      },
    ],
    unreadCount: 1,
  },
]

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const totalUnreadCount = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0)

  const setActiveConversation = useCallback((id: string | null) => {
    setActiveConversationId(id)
  }, [])

  const sendMessage = useCallback((
    conversationId: string,
    content: string,
    sender: { id: string; name: string; role: 'client' | 'executor' | 'admin' }
  ) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      content,
      timestamp: new Date(),
      read: false,
    }

    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: newMessage,
          }
        }
        return conv
      })
    )
  }, [])

  const markConversationAsRead = useCallback((conversationId: string) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conv.messages.map(msg => ({ ...msg, read: true })),
            unreadCount: 0,
          }
        }
        return conv
      })
    )
  }, [])

  const getConversationByProjectId = useCallback((projectId: string) => {
    return conversations.find(conv => conv.projectId === projectId)
  }, [conversations])

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversation,
        sendMessage,
        markConversationAsRead,
        getConversationByProjectId,
        totalUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
