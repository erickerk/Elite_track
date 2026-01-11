import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useProjects } from '../contexts/ProjectContext'
import { COMPANY_INFO, getWhatsAppLink, getPhoneLink } from '../constants/companyInfo'

interface ChatMessage {
  id: string
  type: 'support' | 'client'
  author?: string
  role?: string
  message: string
  time: string
  avatar?: string
  attachment?: 'timeline' | 'images'
}

interface Conversation {
  id: string
  title: string
  preview: string
  messageCount: number
  time: string
  priority: 'high' | 'medium' | 'low'
  messages: ChatMessage[]
}

export function Chat() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setUserId } = useChat()
  const { unreadCount, addNotification } = useNotifications()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { projects: allProjects } = useProjects()

  const userProjects = allProjects.filter(p => p.user.id === user?.id || p.user.email === user?.email)
  const project = userProjects[0] || allProjects[0]

  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeConversation, setActiveConversation] = useState('today')
  const [showFAQ, setShowFAQ] = useState(false)
  const [showImageModal, setShowImageModal] = useState<{ src: string; caption: string } | null>(null)

  // Definir userId no ChatContext quando o usuário estiver disponível
  // Após aplicar a migração SQL, as conversas serão carregadas automaticamente do Supabase
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id)
    }
  }, [user?.id, setUserId])

  const [conversations, setConversations] = useState<{ [key: string]: Conversation }>({
    'today': {
      id: 'today',
      title: 'Hoje',
      preview: 'Dúvida sobre o cronograma de entrega do veículo...',
      messageCount: 3,
      time: '14:30',
      priority: 'high',
      messages: [
        {
          id: '1',
          type: 'support',
          author: 'Mariana Santos',
          role: 'Especialista Elite',
          message: `Olá ${user?.name?.split(' ')[0] || 'Cliente'}! Sou a Mariana da equipe Elite Suporte. Como posso ajudá-lo hoje com seu ${project.vehicle.brand} ${project.vehicle.model}?`,
          time: '14:25',
          avatar: 'ri-customer-service-2-line'
        },
        {
          id: '2',
          type: 'client',
          message: 'Oi Mariana! Gostaria de saber sobre o cronograma. Quando posso esperar que o processo seja finalizado?',
          time: '14:27'
        },
        {
          id: '3',
          type: 'support',
          author: 'Mariana Santos',
          role: 'Especialista Elite',
          message: `Perfeita pergunta! Baseado no progresso atual, temos uma previsão de conclusão para <strong>${new Date(project.estimatedDelivery).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</strong>. Seu ${project.vehicle.brand} está atualmente na fase de instalação da manta balística (${project.progress}% concluído).`,
          time: '14:28',
          avatar: 'ri-customer-service-2-line',
          attachment: 'timeline'
        }
      ]
    },
    'yesterday': {
      id: 'yesterday',
      title: 'Ontem',
      preview: 'Pergunta sobre o processo de instalação da manta...',
      messageCount: 7,
      time: '16:45',
      priority: 'medium',
      messages: [
        {
          id: '1',
          type: 'support',
          author: 'Carlos Mendes',
          role: 'Técnico Especialista',
          message: `Boa tarde ${user?.name?.split(' ')[0] || 'Cliente'}! Aqui é o Carlos, responsável pela instalação da manta balística do seu ${project.vehicle.brand}.`,
          time: '16:40',
          avatar: 'ri-user-settings-line'
        },
        {
          id: '2',
          type: 'client',
          message: 'Oi Carlos! Como está o progresso da instalação?',
          time: '16:42'
        },
        {
          id: '3',
          type: 'support',
          author: 'Carlos Mendes',
          role: 'Técnico Especialista',
          message: 'Estamos com excelente progresso! Concluímos a instalação nas portas frontais e começamos nas traseiras hoje. Tudo dentro do cronograma.',
          time: '16:45',
          avatar: 'ri-user-settings-line'
        }
      ]
    },
    'dec10': {
      id: 'dec10',
      title: '10 Dez',
      preview: 'Solicitação de fotos adicionais do processo...',
      messageCount: 12,
      time: '10:20',
      priority: 'low',
      messages: [
        {
          id: '1',
          type: 'client',
          message: 'Olá! Seria possível enviar mais fotos do processo?',
          time: '10:15'
        },
        {
          id: '2',
          type: 'support',
          author: 'Mariana Santos',
          role: 'Especialista Elite',
          message: 'Claro! Vou solicitar à equipe técnica que adicione mais fotos na galeria. Você será notificado assim que estiverem disponíveis.',
          time: '10:20',
          avatar: 'ri-customer-service-2-line'
        }
      ]
    }
  })

  const currentMessages = conversations[activeConversation]?.messages || []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentMessages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'client',
      message: inputValue,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    setConversations(prev => ({
      ...prev,
      [activeConversation]: {
        ...prev[activeConversation],
        messages: [...prev[activeConversation].messages, newMessage],
        messageCount: prev[activeConversation].messageCount + 1
      }
    }))

    setInputValue('')
    setIsTyping(true)

    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
    
    setIsTyping(false)

    const replies = [
      "Obrigada pela sua mensagem! Nossa equipe está verificando e responderá em breve.",
      "Entendido! Vou verificar com a equipe técnica e te retorno com as informações.",
      "Perfeito! Vou buscar essas informações para você agora mesmo.",
      `Ótima pergunta! Deixa eu consultar o status atual do seu ${project.vehicle.brand} e te respondo.`
    ]

    const replyMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'support',
      author: 'Mariana Santos',
      role: 'Especialista Elite',
      message: replies[Math.floor(Math.random() * replies.length)],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      avatar: 'ri-customer-service-2-line'
    }

    setConversations(prev => ({
      ...prev,
      [activeConversation]: {
        ...prev[activeConversation],
        messages: [...prev[activeConversation].messages, replyMessage],
        messageCount: prev[activeConversation].messageCount + 1
      }
    }))

    addNotification({
      type: 'info',
      title: 'Nova mensagem',
      message: 'A equipe Elite respondeu sua mensagem.',
      projectId: project.id,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden min-h-screen">
      <style>{`
        .message-bubble { border-radius: 1.5rem; max-width: 70%; position: relative; }
        .message-bubble.client { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); color: #000; margin-left: auto; }
        .message-bubble.support { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; }
        .chat-container { height: calc(100vh - 480px); min-height: 300px; }
      `}</style>

      {/* Header */}
      <header className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                title="Voltar"
              >
                <i className="ri-arrow-left-line text-white"></i>
              </button>
              <img src="/logo-elite.png" alt="Elite Blindagens" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="md:hidden w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors"
                title="Perfil e Sair"
              >
                <i className="ri-logout-box-line text-red-400"></i>
              </button>
              <button className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <i className="ri-notification-3-line text-primary text-sm"></i>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-primary text-black text-xs px-2 py-1 rounded-full font-semibold">{unreadCount}</span>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-400">{project.vehicle.brand} {project.vehicle.model}</div>
                </div>
                <div 
                  className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <i className="ri-user-line text-black text-sm"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Navigation Tabs */}
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="glass-effect cinematic-blur rounded-full p-1 inline-flex">
                <button onClick={() => navigate('/timeline')} className="px-6 py-3 rounded-full text-white/60 hover:text-white transition-colors whitespace-nowrap">Timeline</button>
                <button onClick={() => navigate('/gallery')} className="px-6 py-3 rounded-full text-white/60 hover:text-white transition-colors whitespace-nowrap">Galeria de Mídia</button>
                <button onClick={() => navigate('/laudo')} className="px-6 py-3 rounded-full text-white/60 hover:text-white transition-colors whitespace-nowrap">Documentos</button>
                <button className="px-6 py-3 rounded-full bg-primary text-black font-semibold whitespace-nowrap">Suporte</button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-semibold text-sm">Online</span>
                </div>
                <a 
                  href={getPhoneLink()} 
                  className="flex items-center space-x-2 hover:text-primary transition-colors"
                  title="Ligar para Elite Blindagens"
                >
                  <i className="ri-phone-line text-primary text-sm"></i>
                  <span className="text-white text-sm hover:text-primary">{COMPANY_INFO.phoneFormatted}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Support Header */}
        <section className="py-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="glass-effect cinematic-blur rounded-3xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <i className="ri-customer-service-2-line text-2xl text-primary"></i>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Suporte Elite</h1>
                    <p className="text-gray-400">Canal direto de comunicação para seu {project.vehicle.brand} {project.vehicle.model}</p>
                    <div className="flex items-center space-x-4 mt-2 flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <i className="ri-time-line text-primary text-sm"></i>
                        <span className="text-primary text-sm">Resposta em até 15 min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <i className="ri-shield-check-line text-green-400 text-sm"></i>
                        <span className="text-green-400 text-sm">Suporte Especializado</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <a 
                    href={getWhatsAppLink(`Olá! Sou cliente Elite Blindagens e gostaria de suporte para meu ${project.vehicle.brand} ${project.vehicle.model}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-xl flex items-center space-x-2 text-green-400 transition-colors whitespace-nowrap"
                    title="Abrir WhatsApp"
                  >
                    <i className="ri-whatsapp-line text-sm"></i>
                    <span className="text-sm">WhatsApp</span>
                  </a>
                  <a 
                    href={getPhoneLink()}
                    className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-xl flex items-center space-x-2 text-primary transition-colors whitespace-nowrap"
                    title="Ligar agora"
                  >
                    <i className="ri-phone-line text-sm"></i>
                    <span className="text-sm">Ligar Agora</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chat Interface */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat History Sidebar */}
            <div className="lg:col-span-1">
              <div className="glass-effect cinematic-blur rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Histórico</h3>
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <i className="ri-history-line text-primary text-sm"></i>
                  </div>
                </div>

                {/* Conversations List */}
                <div className="space-y-3">
                  {Object.values(conversations).map((conv) => (
                    <div 
                      key={conv.id}
                      onClick={() => setActiveConversation(conv.id)}
                      className={cn(
                        "p-3 rounded-xl cursor-pointer transition-colors",
                        activeConversation === conv.id 
                          ? "bg-primary/20 border border-primary/30" 
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("font-semibold text-sm", activeConversation === conv.id ? "text-primary" : "text-white")}>{conv.title}</span>
                        <div className={cn("w-2 h-2 rounded-full", getPriorityColor(conv.priority))}></div>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-2">{conv.preview}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-400 text-xs">{conv.messageCount} mensagens</span>
                        <span className="text-gray-400 text-xs">{conv.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-semibold mb-4">Ações Rápidas</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setShowFAQ(true)}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-3 text-left transition-colors"
                    >
                      <i className="ri-question-line text-primary"></i>
                      <span className="text-sm">FAQ</span>
                    </button>
                    <button 
                      onClick={() => {
                        setInputValue('Gostaria de falar com um técnico especializado sobre meu veículo.')
                        addNotification({ type: 'info', title: 'Técnico', message: 'Solicitação enviada. Um técnico entrará em contato em breve.' })
                      }}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-3 text-left transition-colors"
                    >
                      <i className="ri-user-settings-line text-primary"></i>
                      <span className="text-sm">Falar com Técnico</span>
                    </button>
                    <button 
                      onClick={() => {
                        addNotification({ type: 'success', title: 'Visita Agendada', message: 'Solicitação de visita enviada. Entraremos em contato para confirmar data e horário.' })
                        navigate('/revisoes')
                      }}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-3 text-left transition-colors"
                    >
                      <i className="ri-calendar-line text-primary"></i>
                      <span className="text-sm">Agendar Visita</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3">
              <div className="glass-effect cinematic-blur rounded-3xl p-6 h-full flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <i className="ri-customer-service-2-line text-primary text-lg"></i>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold">Equipe Elite Suporte</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm">Online agora</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors" title="Notificações">
                      <i className="ri-notification-line text-white"></i>
                    </button>
                    <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors" title="Configurações">
                      <i className="ri-settings-line text-white"></i>
                    </button>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto space-y-4 chat-container">
                  {currentMessages.map((msg) => (
                    <div key={msg.id}>
                      {msg.type === 'support' ? (
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className={cn(msg.avatar || "ri-customer-service-2-line", "text-primary")}></i>
                          </div>
                          <div className="message-bubble support p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-sm">{msg.author}</span>
                              <span className="text-xs text-gray-400">{msg.role}</span>
                            </div>
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.message }}></p>
                            {msg.attachment === 'timeline' && (
                              <div className="mt-3 bg-white/10 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-primary">Cronograma Detalhado</span>
                                  <span className="text-xs text-gray-400">Atualizado recentemente</span>
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span>Manta Balística</span>
                                    <span className="text-primary">{project.progress}% ✓</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Vidros Blindados</span>
                                    <span className="text-yellow-400">Próximo</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Montagem Final</span>
                                    <span className="text-gray-400">Pendente</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            {msg.attachment === 'images' && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {project.timeline.filter(s => s.photos.length > 0).slice(0, 2).map((step, idx) => (
                                  <div 
                                    key={idx}
                                    onClick={() => setShowImageModal({ src: step.photos[0], caption: step.title })}
                                    className="relative cursor-pointer group"
                                  >
                                    <img 
                                      src={step.photos[0]} 
                                      alt={step.title}
                                      className="w-full h-20 object-cover rounded-lg group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                      <i className="ri-zoom-in-line text-white text-lg"></i>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <span className="text-xs text-gray-400 mt-2 block">Hoje às {msg.time}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end space-x-3 justify-end">
                          <div className="message-bubble client p-4">
                            <p className="text-sm font-medium">{msg.message}</p>
                            <span className="text-xs text-black/60 mt-2 block">{msg.time}</span>
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center flex-shrink-0">
                            {user?.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <i className="ri-user-line text-black"></i>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-customer-service-2-line text-primary"></i>
                      </div>
                      <div className="message-bubble support p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-sm">Mariana Santos</span>
                          <span className="text-xs text-gray-400">digitando...</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-end space-x-4">
                    <div className="flex-1 relative">
                      <textarea 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua mensagem..." 
                        className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all text-sm"
                        rows={1}
                      />
                      <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                        <button className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors" title="Anexar arquivo">
                          <i className="ri-attachment-line text-gray-400 text-sm"></i>
                        </button>
                        <button className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors" title="Emoji">
                          <i className="ri-emotion-line text-gray-400 text-sm"></i>
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className={cn(
                        "px-6 py-3 font-semibold rounded-2xl transition-colors whitespace-nowrap",
                        inputValue.trim() ? "bg-primary hover:bg-primary/90 text-black" : "bg-white/10 text-gray-500"
                      )}
                      title="Enviar mensagem"
                    >
                      <i className="ri-send-plane-line"></i>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>Pressione Enter para enviar</span>
                    <span className="flex items-center space-x-2">
                      <i className="ri-shield-check-line text-green-400"></i>
                      <span>Conexão segura</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-6">
            <div className="glass-effect cinematic-blur p-8 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Perguntas Frequentes</h2>
                <button 
                  onClick={() => setShowFAQ(false)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                  title="Fechar"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2">Quanto tempo demora o processo de blindagem?</h3>
                  <p className="text-gray-400 text-sm">O processo completo de blindagem demora entre 12 a 15 dias úteis, dependendo das especificações escolhidas.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2">Posso visitar a oficina durante o processo?</h3>
                  <p className="text-gray-400 text-sm">Sim! Você pode agendar visitas através do suporte. Recomendamos agendar com antecedência para garantir a disponibilidade da equipe.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2">Como funciona a garantia?</h3>
                  <p className="text-gray-400 text-sm">Oferecemos garantia de 5 anos para todos os componentes da blindagem, incluindo vidros e manta balística.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="font-semibold mb-2">Como posso acompanhar o progresso?</h3>
                  <p className="text-gray-400 text-sm">Você pode acompanhar em tempo real através do app EliteTrack™, na aba Timeline, ou solicitar atualizações via chat.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-6">
            <div className="relative max-w-4xl max-h-[90vh]">
              <img 
                src={showImageModal.src} 
                alt={showImageModal.caption}
                className="w-full h-full object-contain rounded-2xl"
              />
              <button 
                onClick={() => setShowImageModal(null)}
                className="absolute top-4 right-4 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                title="Fechar imagem"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4">
                  <p className="text-white font-semibold">{showImageModal.caption}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
