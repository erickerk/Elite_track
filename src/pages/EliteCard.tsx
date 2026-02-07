import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useProjects } from '../contexts/ProjectContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import jsPDF from 'jspdf'

// Logo Elite da pasta public (caminho absoluto para o navegador)
const LOGO_ELITE_URL = '/logo-elite.png'

// Função para carregar imagem como Data URL
async function loadImageAsDataURL(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve('')
    img.src = src
  })
}

export function EliteCard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const { projects: allProjects } = useProjects()

  const userProjects = allProjects.filter(p => p.user.id === user?.id || p.user.email === user?.email)
  const completedProjects = userProjects.filter(p => p.status === 'completed' && p.eliteCard)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    
  const project = selectedProjectId 
    ? (userProjects.find(p => p.id === selectedProjectId) || completedProjects[0] || userProjects[0] || allProjects[0])
    : (completedProjects[0] || userProjects[0] || allProjects[0])
  const eliteCard = project?.eliteCard

  const [showRescueModal, setShowRescueModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [rescueType, setRescueType] = useState<'mechanical' | 'accident' | 'flat' | 'battery' | 'locked'>('mechanical')
  const [rescueLocation, setRescueLocation] = useState('')
  const [rescueNotes, setRescueNotes] = useState('')
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketDescription, setTicketDescription] = useState('')
  const [ticketCategory, setTicketCategory] = useState<'general' | 'technical' | 'warranty'>('general')
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const handleRescueRequest = async () => {
    if (!rescueLocation) {
      addNotification({ type: 'error', title: 'Erro', message: 'Informe sua localização para solicitar o guincho.' })
      return
    }
    
    // Salvar no Supabase se configurado
    if (isSupabaseConfigured() && supabase) {
      try {
        const rescueData = {
          project_id: project?.id,
          client_name: user?.name,
          client_email: user?.email,
          client_phone: user?.phone,
          vehicle: project ? `${project.vehicle.brand} ${project.vehicle.model}` : '',
          vehicle_plate: project?.vehicle.plate,
          rescue_type: rescueType,
          location: rescueLocation,
          notes: rescueNotes,
          status: 'pending',
          priority: 'high',
          created_at: new Date().toISOString(),
        }
        
        const { error } = await (supabase as any)
          .from('rescue_requests')
          .insert(rescueData)
        
        if (error) {
          console.error('[EliteRescue] Erro ao salvar:', error)
        } else {
          console.log('[EliteRescue] Solicitação salva no Supabase')
        }
      } catch (err) {
        console.error('[EliteRescue] Erro:', err)
      }
    }
    
    addNotification({ type: 'success', title: 'Elite Rescue Acionado!', message: `Guincho a caminho! Previsão de chegada: 30-45 minutos. Localização: ${rescueLocation}` })
    setShowRescueModal(false)
    setRescueLocation('')
    setRescueNotes('')
  }

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          void (async () => {
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
              const data = await response.json()
              if (data?.address) {
                const addr = data.address
                const street = addr.road || addr.street || ''
                const number = addr.house_number || ''
                const neighborhood = addr.suburb || addr.neighbourhood || addr.district || ''
                const city = addr.city || addr.town || addr.municipality || ''
                const state = addr.state || ''
                const fullAddress = [street, number, neighborhood, city, state].filter(Boolean).join(', ')
                setRescueLocation(fullAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
              } else {
                setRescueLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
              }
            } catch {
              setRescueLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
            }
            setIsGettingLocation(false)
            addNotification({ type: 'success', title: 'Localização Obtida', message: 'Sua localização foi capturada com sucesso.' })
          })()
        },
        () => {
          setIsGettingLocation(false)
          addNotification({ type: 'error', title: 'Erro', message: 'Não foi possível obter sua localização.' })
        }
      )
    } else {
      setIsGettingLocation(false)
      addNotification({ type: 'error', title: 'Erro', message: 'Geolocalização não suportada.' })
    }
  }

  const generatePDF = async () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 53.98]
    })
    
    // Carregar logo Elite da pasta public
    const logoDataUrl = await loadImageAsDataURL(LOGO_ELITE_URL)
    
    doc.setFillColor(26, 26, 26)
    doc.rect(0, 0, 85.6, 53.98, 'F')
    
    doc.setFillColor(212, 175, 55)
    doc.rect(0, 0, 85.6, 2, 'F')
    
    // Logo Elite Blindagens - usar imagem real
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 4, 5, 14, 14)
    } else {
      // Fallback: retângulo com E
      doc.setFillColor(212, 175, 55)
      doc.roundedRect(4, 6, 12, 12, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(26, 26, 26)
      doc.text('E', 8, 14.5)
    }
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(212, 175, 55)
    doc.text('ELITE BLINDAGENS', 20, 11)
    
    doc.setFontSize(6)
    doc.setTextColor(150, 150, 150)
    doc.text('MEMBER CARD', 20, 15)
    
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(eliteCard?.cardNumber || 'ELITE-XXXX-XXXX', 5, 28)
    
    // Nome do titular - ajustar tamanho para caber dentro da área útil
    const name = user?.name || ''
    const maxTextWidth = 85.6 - 10 /* margens esquerda/direita de 5mm */
    let fontSize = 9
    doc.setFontSize(fontSize)
    while (doc.getTextWidth(name) > maxTextWidth && fontSize > 6) {
      fontSize -= 0.5
      doc.setFontSize(fontSize)
    }
    doc.text(name, 5, 34)
    
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('VÁLIDO ATÉ', 5, 42)
    doc.setTextColor(255, 255, 255)
    doc.text(eliteCard ? new Date(eliteCard.expiryDate).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : '01/2029', 5, 46)
    
    doc.setTextColor(150, 150, 150)
    doc.text('VEÍCULO', 35, 42)
    doc.setTextColor(255, 255, 255)
    doc.text(`${project.vehicle.brand} ${project.vehicle.model}`, 35, 46)
    
    doc.setFillColor(212, 175, 55)
    doc.circle(75, 10, 5, 'F')
    doc.setFontSize(8)
    doc.setTextColor(26, 26, 26)
    doc.text('E', 73.5, 12)
    
    return doc.output('blob')
  }

  const handleDownloadCard = async () => {
    addNotification({ type: 'info', title: 'Download Iniciado', message: 'Seu cartão Elite está sendo gerado em PDF...' })
    try {
      const pdfBlob = await generatePDF()
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cartao-elite-${user?.name?.replace(/\s+/g, '-').toLowerCase() || 'membro'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addNotification({ type: 'success', title: 'Download Concluído', message: 'Cartão Elite salvo com sucesso!' })
    } catch {
      addNotification({ type: 'error', title: 'Erro', message: 'Não foi possível gerar o PDF.' })
    }
  }

  const handleShareWhatsApp = async () => {
    addNotification({ type: 'info', title: 'Preparando...', message: 'Gerando PDF do cartão para compartilhamento...' })
    try {
      const pdfBlob = await generatePDF()
      const file = new File([pdfBlob], `cartao-elite-${user?.name?.replace(/\s+/g, '-').toLowerCase() || 'membro'}.pdf`, { type: 'application/pdf' })
      
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Cartão Elite Blindagens',
          text: `🛡️ Cartão Elite Blindagens - ${user?.name}`
        })
        addNotification({ type: 'success', title: 'Sucesso', message: 'Cartão compartilhado!' })
      } else {
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cartao-elite-${user?.name?.replace(/\s+/g, '-').toLowerCase() || 'membro'}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        const cardInfo = `🛡️ *Cartão Elite Blindagens*\n\n📛 Titular: ${user?.name}\n🚗 Veículo: ${project.vehicle.brand} ${project.vehicle.model}\n🔢 Cartão: ${eliteCard?.cardNumber || 'ELITE-XXXX'}\n📅 Válido até: ${eliteCard ? new Date(eliteCard.expiryDate).toLocaleDateString('pt-BR') : '01/2029'}\n\n✅ Membro Elite Blindagens\n\n📎 PDF baixado - anexe ao enviar!`
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(cardInfo)}`
        window.open(whatsappUrl, '_blank')
        addNotification({ type: 'info', title: 'PDF Baixado', message: 'Anexe o PDF baixado na conversa do WhatsApp.' })
      }
    } catch {
      addNotification({ type: 'error', title: 'Erro', message: 'Não foi possível compartilhar o cartão.' })
    }
  }

  const handleEmergencyRescue = () => {
    setShowRescueModal(true)
    handleGetCurrentLocation()
  }

  const handleTicketSubmit = () => {
    if (!ticketTitle || !ticketDescription) {
      addNotification({ type: 'error', title: 'Erro', message: 'Preencha todos os campos obrigatórios.' })
      return
    }
    addNotification({ type: 'success', title: 'Ticket Aberto!', message: `Ticket #TKT-${Date.now().toString().slice(-6)} criado. Nossa equipe responderá em até 24h.` })
    setShowTicketModal(false)
    setTicketTitle('')
    setTicketDescription('')
  }

  const rescueTypes = [
    { id: 'mechanical', label: 'Pane Mecânica', icon: 'ri-tools-line' },
    { id: 'accident', label: 'Acidente', icon: 'ri-car-crash-line' },
    { id: 'flat', label: 'Pneu Furado', icon: 'ri-donut-chart-line' },
    { id: 'battery', label: 'Bateria', icon: 'ri-battery-low-line' },
    { id: 'locked', label: 'Chave Trancada', icon: 'ri-key-line' },
  ]

  return (
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden min-h-screen">
      {/* Header fornecido pelo MobileLayout via Layout wrapper */}
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8">
        <div className="max-w-4xl mx-auto px-6">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Cartão Digital Elite</h1>
            <p className="text-gray-400">Seu acesso exclusivo aos benefícios Elite Blindagens</p>
          </div>

          {/* Seletor de Cartões e Scanner QR */}
          {(completedProjects.length > 1 || userProjects.length > 1) && (
            <div className="mb-6 p-4 glass-effect rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-400">Selecione um cartão:</p>
                <button 
                  onClick={() => navigate('/scan?mode=card')}
                  className="flex items-center gap-2 text-primary text-sm hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <i className="ri-qr-scan-2-line"></i>
                  Escanear QR
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {userProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm",
                      project.id === proj.id
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-white/20 bg-white/5 text-white hover:border-primary/50"
                    )}
                  >
                    <i className="ri-bank-card-line"></i>
                    {proj.vehicle.brand} {proj.vehicle.model}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opção de Escanear QR para acompanhar outro veículo */}
          <div className="mb-6 text-center">
            <button 
              onClick={() => navigate('/scan?mode=card')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-primary text-sm transition-colors"
            >
              <i className="ri-qr-code-line"></i>
              Escanear QR Code para acompanhar outro veículo
            </button>
          </div>

          {/* Elite Card */}
          <div className="mb-8">
            <div className="elite-card rounded-3xl p-8 relative overflow-hidden">
              <div className="elite-card-shine absolute inset-0"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <img src="/logo-elite.png" alt="Elite Blindagens" className="h-10 w-auto mb-1" />
                    <div className="text-sm text-gray-400">MEMBER CARD</div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-10 bg-gradient-to-r from-primary/80 to-primary rounded-md flex items-center justify-center">
                      <i className="ri-shield-star-line text-black text-2xl"></i>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-2xl font-mono tracking-widest mb-2">{eliteCard?.cardNumber || 'ELITE-XXXX-XXXX'}</div>
                  <div className="text-lg font-semibold">{user?.name}</div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">VÁLIDO ATÉ</div>
                    <div className="font-semibold">{eliteCard ? new Date(eliteCard.expiryDate).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : '01/2029'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1">VEÍCULO</div>
                    <div className="font-semibold">{project.vehicle.brand} {project.vehicle.model}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                    <div className="w-8 h-8 bg-yellow-500 rounded-full -ml-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Actions - Download e Compartilhar */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => void handleDownloadCard()}
              className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
              title="Baixar cartão em PDF"
            >
              <i className="ri-download-line text-xl"></i>
              <span>Baixar PDF</span>
            </button>
            <button
              onClick={() => void handleShareWhatsApp()}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
              title="Compartilhar no WhatsApp"
            >
              <i className="ri-whatsapp-line text-xl"></i>
              <span>Compartilhar</span>
            </button>
          </div>

          {/* Botão de Emergência */}
          <button
            onClick={handleEmergencyRescue}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 mb-8 transition-colors shadow-lg shadow-red-500/30"
            title="Solicitar guincho de emergência"
          >
            <i className="ri-alarm-warning-line text-2xl animate-pulse"></i>
            <span>GUINCHO DE EMERGÊNCIA</span>
          </button>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Elite Rescue */}
            <button
              onClick={() => setShowRescueModal(true)}
              className="glass-effect cinematic-blur rounded-2xl p-6 text-left hover:border-red-500/50 transition-all group"
              title="Solicitar Elite Rescue"
            >
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4 rescue-pulse">
                <i className="ri-truck-line text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-red-400 transition-colors">Elite Rescue</h3>
              <p className="text-gray-400 text-sm">Guincho 24/7</p>
              <p className="text-red-400 text-xs mt-2 font-semibold">{eliteCard?.rescuePhone || '(11) 9.1312-3071'}</p>
            </button>

            {/* Abrir Ticket */}
            <button
              onClick={() => setShowTicketModal(true)}
              className="glass-effect cinematic-blur rounded-2xl p-6 text-left hover:border-primary/50 transition-all group"
            >
              <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
                <i className="ri-ticket-line text-primary text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">Abrir Ticket</h3>
              <p className="text-gray-400 text-sm">Suporte técnico</p>
              <p className="text-primary text-xs mt-2 font-semibold">Resposta em 24h</p>
            </button>

            {/* Histórico de Revisões */}
            <button
              onClick={() => navigate('/revisoes')}
              className="glass-effect cinematic-blur rounded-2xl p-6 text-left hover:border-blue-500/50 transition-all group"
            >
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                <i className="ri-calendar-check-line text-blue-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">Revisões</h3>
              <p className="text-gray-400 text-sm">Histórico e agendamentos</p>
              <p className="text-blue-400 text-xs mt-2 font-semibold">Próxima: Jan 2025</p>
            </button>

            {/* Suporte */}
            <button
              onClick={() => navigate('/chat')}
              className="glass-effect cinematic-blur rounded-2xl p-6 text-left hover:border-green-500/50 transition-all group"
            >
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4">
                <i className="ri-customer-service-2-line text-green-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-1 group-hover:text-green-400 transition-colors">Suporte</h3>
              <p className="text-gray-400 text-sm">Chat com especialistas</p>
              <p className="text-green-400 text-xs mt-2 font-semibold">{eliteCard?.supportPhone || '(11) 3456-7890'}</p>
            </button>
          </div>

          
          {/* Tickets History */}
          {project.tickets && project.tickets.length > 0 && (
            <div className="glass-effect cinematic-blur rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <i className="ri-file-list-3-line text-primary text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Meus Tickets</h2>
                    <p className="text-gray-400 text-sm">Histórico de solicitações</p>
                  </div>
                </div>
                <button onClick={() => setShowTicketModal(true)} className="px-4 py-2 bg-primary text-black font-semibold rounded-xl text-sm">
                  Novo Ticket
                </button>
              </div>
              <div className="space-y-3">
                {project.tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold",
                          ticket.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          ticket.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                          ticket.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                        )}>
                          {ticket.status === 'resolved' ? 'Resolvido' : ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em Andamento' : 'Fechado'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <h4 className="font-semibold mb-1">{ticket.title}</h4>
                    <p className="text-sm text-gray-400">{ticket.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Elite Rescue Modal */}
      {showRescueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-effect cinematic-blur rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                  <i className="ri-truck-line text-red-500 text-xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Elite Rescue</h2>
                  <p className="text-gray-400 text-sm">Solicitar guincho 24/7</p>
                </div>
              </div>
              <button onClick={() => setShowRescueModal(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center" title="Fechar modal">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Ocorrência</label>
                <div className="grid grid-cols-2 gap-2">
                  {rescueTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setRescueType(type.id as typeof rescueType)}
                      className={cn(
                        "p-3 rounded-xl border transition-all flex items-center space-x-2",
                        rescueType === type.id ? "border-red-500 bg-red-500/20" : "border-white/10 bg-white/5 hover:border-white/30"
                      )}
                    >
                      <i className={`${type.icon} text-lg ${rescueType === type.id ? 'text-red-400' : 'text-gray-400'}`}></i>
                      <span className={cn("text-sm", rescueType === type.id ? 'text-white' : 'text-gray-400')}>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Localização *</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={rescueLocation}
                    onChange={(e) => setRescueLocation(e.target.value)}
                    placeholder="Ex: Av. Paulista, 1000 - São Paulo"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                    title="Localização"
                  />
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl flex items-center space-x-2 transition-colors disabled:opacity-50"
                    title="Usar minha localização atual"
                  >
                    <i className={`ri-map-pin-line ${isGettingLocation ? 'animate-pulse' : ''}`}></i>
                    <span className="text-sm">GPS</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Observações</label>
                <textarea
                  value={rescueNotes}
                  onChange={(e) => setRescueNotes(e.target.value)}
                  placeholder="Descreva a situação..."
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
                  title="Observações adicionais"
                />
              </div>

              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-center space-x-3">
                  <i className="ri-phone-line text-red-400 text-xl"></i>
                  <div>
                    <p className="font-semibold text-red-400">Emergência?</p>
                    <p className="text-sm text-gray-400">WhatsApp: <a href="https://wa.me/5511913123071" target="_blank" rel="noopener noreferrer" className="text-red-400 font-bold hover:underline">{eliteCard?.rescuePhone || '(11) 9.1312-3071'}</a></p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button onClick={() => setShowRescueModal(false)} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
                  Cancelar
                </button>
                <button onClick={() => void handleRescueRequest()} className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors">
                  <i className="ri-truck-line mr-2"></i>Solicitar Guincho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-effect cinematic-blur rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <i className="ri-ticket-line text-primary text-xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Abrir Ticket</h2>
                  <p className="text-gray-400 text-sm">Solicitação de suporte</p>
                </div>
              </div>
              <button onClick={() => setShowTicketModal(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center" title="Fechar modal">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Título *</label>
                <input
                  type="text"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="Resumo da sua solicitação"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                  title="Título do ticket"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Categoria</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as typeof ticketCategory)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                  title="Categoria do ticket"
                >
                  <option value="general" className="bg-gray-900">Dúvida Geral</option>
                  <option value="technical" className="bg-gray-900">Suporte Técnico</option>
                  <option value="warranty" className="bg-gray-900">Garantia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Prioridade</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTicketPriority('low')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl border transition-all text-sm font-medium",
                      ticketPriority === 'low'
                        ? "border-green-500 bg-green-500/20 text-green-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30"
                    )}
                    title="Prioridade baixa"
                  >
                    Baixa
                  </button>
                  <button
                    onClick={() => setTicketPriority('medium')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl border transition-all text-sm font-medium",
                      ticketPriority === 'medium'
                        ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30"
                    )}
                    title="Prioridade média"
                  >
                    Média
                  </button>
                  <button
                    onClick={() => setTicketPriority('high')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl border transition-all text-sm font-medium",
                      ticketPriority === 'high'
                        ? "border-red-500 bg-red-500/20 text-red-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30"
                    )}
                    title="Prioridade alta"
                  >
                    Alta
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Descrição *</label>
                <textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Descreva detalhadamente sua solicitação..."
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button onClick={() => setShowTicketModal(false)} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
                  Cancelar
                </button>
                <button onClick={handleTicketSubmit} className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-colors">
                  Enviar Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
  )
}
export default EliteCard
