import { useState, useRef, useEffect } from 'react'
import { Send, Search, User, Clock, CheckCheck, ArrowLeft } from 'lucide-react'
import { useChat } from '../../contexts/ChatContext'
import { useAuth } from '../../contexts/AuthContext'
import { mockProjects } from '../../data/mockData'
import { cn } from '../../lib/utils'

interface ExecutorChatProps {
  onBack?: () => void
}

export function ExecutorChat({ onBack }: ExecutorChatProps) {
  const { user } = useAuth()
  const { conversations, sendMessage, markConversationAsRead } = useChat()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation, conversations])

  const getProjectForConversation = (projectId: string) => {
    return mockProjects.find(p => p.id === projectId)
  }

  const filteredConversations = conversations.filter(conv => {
    const project = getProjectForConversation(conv.projectId)
    if (!project) return false
    const searchLower = searchTerm.toLowerCase()
    return (
      project.user.name.toLowerCase().includes(searchLower) ||
      project.vehicle.model.toLowerCase().includes(searchLower) ||
      project.vehicle.plate.toLowerCase().includes(searchLower)
    )
  })

  const activeConversation = conversations.find(c => c.id === selectedConversation)
  const activeProject = activeConversation ? getProjectForConversation(activeConversation.projectId) : null

  const handleSelectConversation = (convId: string) => {
    setSelectedConversation(convId)
    markConversationAsRead(convId)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !user) return
    
    sendMessage(selectedConversation, newMessage.trim(), {
      id: user.id,
      name: user.name,
      role: 'executor'
    })
    setNewMessage('')
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Hoje'
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="h-[calc(100vh-200px)] flex bg-carbon-900 rounded-3xl overflow-hidden border border-white/10">
      {/* Conversations List */}
      <div className={cn(
        "w-full md:w-80 border-r border-white/10 flex flex-col",
        selectedConversation && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors md:hidden"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold">Mensagens</h2>
            <span className="bg-primary/20 text-primary px-2 py-1 rounded-lg text-xs font-semibold">
              {conversations.reduce((acc, c) => acc + c.unreadCount, 0)} novas
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500"
              aria-label="Buscar conversas"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const project = getProjectForConversation(conv.projectId)
              const lastMessage = conv.messages[conv.messages.length - 1]
              const isSelected = selectedConversation === conv.id
              
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors",
                    isSelected && "bg-primary/10 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <span className="text-black font-bold">
                          {project?.user.name.charAt(0)}
                        </span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{project?.user.name}</h3>
                        <span className="text-xs text-gray-500">
                          {lastMessage && formatDate(lastMessage.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {project?.vehicle.brand} {project?.vehicle.model} • {project?.vehicle.plate}
                      </p>
                      <p className={cn(
                        "text-sm truncate mt-1",
                        conv.unreadCount > 0 ? "text-white font-medium" : "text-gray-500"
                      )}>
                        {lastMessage?.senderRole === 'executor' && 'Você: '}
                        {lastMessage?.content}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedConversation && "hidden md:flex"
      )}>
        {selectedConversation && activeProject ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center space-x-4">
              <button
                onClick={() => setSelectedConversation(null)}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors md:hidden"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                <span className="text-black font-bold">{activeProject.user.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{activeProject.user.name}</h3>
                <p className="text-xs text-gray-400">
                  {activeProject.vehicle.brand} {activeProject.vehicle.model} • {activeProject.vehicle.plate}
                </p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  activeProject.status === 'in_progress' ? "bg-primary/20 text-primary" :
                  activeProject.status === 'completed' ? "bg-green-500/20 text-green-400" :
                  "bg-gray-500/20 text-gray-400"
                )}>
                  {activeProject.progress}% concluído
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeConversation?.messages.map((msg, idx) => {
                const isExecutor = msg.senderRole === 'executor'
                const showDate = idx === 0 || 
                  new Date(msg.timestamp).toDateString() !== 
                  new Date(activeConversation.messages[idx - 1].timestamp).toDateString()

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {formatDate(msg.timestamp)}
                      </div>
                    )}
                    <div className={cn(
                      "flex",
                      isExecutor ? "justify-end" : "justify-start"
                    )}>
                      <div className={cn(
                        "max-w-[70%] rounded-2xl p-4",
                        isExecutor 
                          ? "bg-primary text-black rounded-br-md" 
                          : "bg-white/10 text-white rounded-bl-md"
                      )}>
                        {!isExecutor && (
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <div className={cn(
                          "flex items-center justify-end space-x-1 mt-2 text-xs",
                          isExecutor ? "text-black/60" : "text-gray-500"
                        )}>
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(msg.timestamp)}</span>
                          {isExecutor && msg.read && (
                            <CheckCheck className="w-3 h-3 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                  aria-label="Mensagem"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  aria-label="Enviar mensagem"
                >
                  <Send className="w-5 h-5 text-black" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
              <p className="text-sm">Escolha um cliente para iniciar o atendimento</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
