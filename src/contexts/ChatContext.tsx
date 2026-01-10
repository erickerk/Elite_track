import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase/client'
import type { ChatMessage, ChatConversation } from '../types'

// Cast supabase para any para permitir acesso a tabelas ainda não tipadas
const db = supabase as any

interface ChatContextType {
  conversations: ChatConversation[]
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void
  sendMessage: (conversationId: string, content: string, sender: { id: string; name: string; role: 'client' | 'executor' | 'admin' }) => void
  markConversationAsRead: (conversationId: string) => void
  getConversationByProjectId: (projectId: string) => ChatConversation | undefined
  createConversation: (projectId: string, userId: string) => Promise<string | null>
  totalUnreadCount: number
  setUserId: (userId: string | null) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Helper para converter dados do Supabase
function dbConversationToConversation(dbConv: any, messages: ChatMessage[]): ChatConversation {
  return {
    id: dbConv.id,
    projectId: dbConv.project_id,
    participants: [], // Será preenchido conforme necessário
    messages,
    unreadCount: dbConv.unread_count || 0,
  }
}

function dbMessageToMessage(dbMsg: any): ChatMessage {
  return {
    id: dbMsg.id,
    senderId: dbMsg.sender_id,
    senderName: dbMsg.sender_name,
    senderRole: dbMsg.sender_role,
    content: dbMsg.content,
    timestamp: new Date(dbMsg.created_at),
    read: dbMsg.read,
    projectId: dbMsg.conversation_id, // Usaremos conversation_id como referência
  }
}

// PRODUÇÃO: Conversas carregadas exclusivamente do Supabase
const initialConversations: ChatConversation[] = []

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Carregar conversas do Supabase filtradas por usuário
  useEffect(() => {
    const loadConversations = async () => {
      if (!isSupabaseConfigured() || !db || !userId) {
        return
      }

      try {
        // Buscar conversas do usuário
        const { data: convData, error: convError } = await db
          .from('chat_conversations')
          .select('*')
          .eq('user_id', userId)
          .order('last_message_at', { ascending: false })

        if (convError) {
          console.error('Erro ao carregar conversas:', convError)
          return
        }

        if (!convData || convData.length === 0) {
          setConversations(initialConversations)
          return
        }

        // Buscar mensagens de cada conversa
        const conversationsWithMessages = await Promise.all(
          convData.map(async (conv: any) => {
            const { data: messages, error: msgError } = await db
              .from('chat_messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true })

            if (msgError) {
              console.error('Erro ao carregar mensagens:', msgError)
              return dbConversationToConversation(conv, [])
            }

            const chatMessages = (messages || []).map(dbMessageToMessage)
            return dbConversationToConversation(conv, chatMessages)
          })
        )

        setConversations(conversationsWithMessages)
      } catch (error) {
        console.error('Erro ao carregar conversas:', error)
      }
    }

    loadConversations()
  }, [userId])

  const totalUnreadCount = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0)

  const setActiveConversation = useCallback((id: string | null) => {
    setActiveConversationId(id)
  }, [])

  const sendMessage = useCallback(async (
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

    // Atualizar localmente primeiro
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

    // Sincronizar com Supabase
    if (isSupabaseConfigured() && db) {
      try {
        const { data, error } = await db
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: sender.id,
            sender_name: sender.name,
            sender_role: sender.role,
            content,
            read: false,
          })
          .select()
          .single()

        if (error) {
          console.error('Erro ao salvar mensagem:', error)
        } else if (data) {
          // Atualizar com o ID real do Supabase
          setConversations(prev =>
            prev.map(conv => {
              if (conv.id === conversationId) {
                const updatedMessages = conv.messages.map(msg =>
                  msg.id === newMessage.id ? dbMessageToMessage(data) : msg
                )
                return { ...conv, messages: updatedMessages }
              }
              return conv
            })
          )

          // Atualizar timestamp da conversa
          await db
            .from('chat_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId)
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error)
      }
    }
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

  const createConversation = useCallback(async (projectId: string, userId: string): Promise<string | null> => {
    // Verificar se já existe conversa para este projeto
    const existing = conversations.find(c => c.projectId === projectId)
    if (existing) return existing.id

    // Criar nova conversa
    const newConvId = `conv-${Date.now()}`
    const newConversation: ChatConversation = {
      id: newConvId,
      projectId,
      participants: [userId],
      messages: [],
      unreadCount: 0,
    }

    // Adicionar localmente
    setConversations(prev => [newConversation, ...prev])

    // Sincronizar com Supabase
    if (isSupabaseConfigured() && db) {
      try {
        const { data, error } = await db
          .from('chat_conversations')
          .insert({
            project_id: projectId,
            user_id: userId,
            unread_count: 0,
          })
          .select()
          .single()

        if (error) {
          console.error('Erro ao criar conversa:', error)
          return newConvId
        }

        if (data) {
          // Atualizar com ID real do Supabase
          setConversations(prev => prev.map(c => 
            c.id === newConvId ? { ...c, id: data.id } : c
          ))
          return data.id
        }
      } catch (error) {
        console.error('Erro ao criar conversa:', error)
      }
    }

    return newConvId
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
        createConversation,
        totalUnreadCount,
        setUserId,
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
