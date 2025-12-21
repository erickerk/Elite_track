import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { mockProjects } from '../data/mockData'

export function Delivery() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadCount, addNotification } = useNotifications()

  const userProjects = mockProjects.filter(p => p.user.id === user?.id || p.user.email === user?.email)
  const completedProject = userProjects.find(p => p.status === 'completed') || mockProjects.find(p => p.status === 'completed')
  const project = completedProject || userProjects[0] || mockProjects[0]

  const [activeTab, setActiveTab] = useState<'video' | 'photos' | 'checklist' | 'schedule'>('video')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  const deliveryMedia = project.deliveryMedia
  const deliveryChecklist = project.deliveryChecklist || []
  const deliverySchedule = project.deliverySchedule

  const checklistCategories = [
    { id: 'documents', label: 'Documentos', icon: 'ri-file-text-line' },
    { id: 'vehicle', label: 'Veículo', icon: 'ri-car-line' },
    { id: 'accessories', label: 'Acessórios', icon: 'ri-tools-line' },
    { id: 'final', label: 'Finalização', icon: 'ri-checkbox-circle-line' },
  ]

  const handleScheduleDelivery = () => {
    if (!scheduleDate || !scheduleTime) {
      addNotification({ type: 'error', title: 'Erro', message: 'Selecione data e horário para agendar.' })
      return
    }
    addNotification({ type: 'success', title: 'Entrega Agendada!', message: `Sua entrega foi agendada para ${new Date(scheduleDate).toLocaleDateString('pt-BR')} às ${scheduleTime}.` })
    setShowScheduleModal(false)
  }

  const handleDownload = (type: 'certificate' | 'manual' | 'video') => {
    addNotification({ type: 'info', title: 'Download Iniciado', message: `O download do ${type === 'certificate' ? 'certificado' : type === 'manual' ? 'manual' : 'vídeo'} foi iniciado.` })
  }

  const isCompleted = project.status === 'completed'

  return (
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden min-h-screen">

      {/* Header */}
      <header className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                title="Voltar"
              >
                <i className="ri-arrow-left-line text-white"></i>
              </button>
              <div className="font-['Pacifico'] text-2xl text-primary luxury-glow cursor-pointer" onClick={() => navigate('/dashboard')}>EliteTrack™</div>
              <nav className="hidden md:flex items-center space-x-6">
                <span onClick={() => navigate('/dashboard')} className="text-white/60 hover:text-white transition-colors text-sm font-medium cursor-pointer">Dashboard</span>
                <span onClick={() => navigate('/timeline')} className="text-white/60 hover:text-white transition-colors text-sm font-medium cursor-pointer">Timeline</span>
                <span onClick={() => navigate('/gallery')} className="text-white/60 hover:text-white transition-colors text-sm font-medium cursor-pointer">Galeria</span>
                <span className="text-primary font-semibold text-sm">Entrega</span>
              </nav>
            </div>
            <div className="flex items-center space-x-6">
              <button className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <i className="ri-notification-3-line text-primary text-sm"></i>
                </div>
                {unreadCount > 0 && <span className="bg-primary text-black text-xs px-2 py-1 rounded-full font-semibold">{unreadCount}</span>}
              </button>
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/profile')}>
                <div className="text-right">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-400">{project.vehicle.brand} {project.vehicle.model}</div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                  {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" /> : <i className="ri-user-line text-black text-sm"></i>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8">
        <div className="max-w-6xl mx-auto px-6">
          {/* Page Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
              <i className="ri-gift-line text-primary text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold mb-2">Entrega do Veículo</h1>
            <p className="text-gray-400">
              {isCompleted 
                ? `${project.vehicle.brand} ${project.vehicle.model} - Blindagem Concluída`
                : 'Aguardando conclusão da blindagem'}
            </p>
            {isCompleted && deliverySchedule?.confirmed && (
              <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full">
                <i className="ri-check-line"></i>
                <span className="text-sm font-semibold">Entrega realizada em {new Date(deliverySchedule.date).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>

          {!isCompleted ? (
            <div className="glass-effect cinematic-blur rounded-3xl p-8 text-center">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-time-line text-primary text-4xl"></i>
              </div>
              <h2 className="text-2xl font-bold mb-4">Blindagem em Andamento</h2>
              <p className="text-gray-400 mb-6">O conteúdo de entrega estará disponível assim que a blindagem for concluída.</p>
              <div className="flex justify-center space-x-4">
                <button onClick={() => navigate('/timeline')} className="px-6 py-3 bg-primary text-black font-semibold rounded-xl">
                  Ver Timeline
                </button>
                <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">
                  Voltar ao Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex justify-center mb-8">
                <div className="glass-effect cinematic-blur rounded-2xl p-2 inline-flex space-x-2">
                  {[
                    { id: 'video', label: 'Vídeo Final', icon: 'ri-video-line' },
                    { id: 'photos', label: 'Fotos', icon: 'ri-image-line' },
                    { id: 'checklist', label: 'Checklist', icon: 'ri-checkbox-circle-line' },
                    { id: 'schedule', label: 'Agendamento', icon: 'ri-calendar-line' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={cn(
                        "px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors whitespace-nowrap",
                        activeTab === tab.id ? "bg-primary text-black font-semibold" : "text-white/60 hover:text-white"
                      )}
                    >
                      <i className={tab.icon}></i>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="glass-effect cinematic-blur rounded-3xl p-6">
                {/* Video Tab */}
                {activeTab === 'video' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                          <i className="ri-video-line text-red-500 text-xl"></i>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">Vídeo de Entrega</h2>
                          <p className="text-gray-400 text-sm">Apresentação completa do seu veículo blindado</p>
                        </div>
                      </div>
                      <button onClick={() => handleDownload('video')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center space-x-2">
                        <i className="ri-download-line"></i>
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                    {deliveryMedia?.finalVideo ? (
                      <div className="video-container rounded-2xl overflow-hidden">
                        <iframe
                          src={deliveryMedia.finalVideo}
                          title="Vídeo de Entrega"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <div className="aspect-video bg-white/5 rounded-2xl flex items-center justify-center">
                        <div className="text-center">
                          <i className="ri-video-line text-gray-500 text-5xl mb-4"></i>
                          <p className="text-gray-400">Vídeo sendo processado...</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-white/5 rounded-xl text-center">
                        <i className="ri-shield-check-line text-primary text-2xl mb-2"></i>
                        <p className="text-sm text-gray-400">Nível de Proteção</p>
                        <p className="font-semibold">{project.vehicle.blindingLevel}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl text-center">
                        <i className="ri-calendar-check-line text-green-400 text-2xl mb-2"></i>
                        <p className="text-sm text-gray-400">Conclusão</p>
                        <p className="font-semibold">{project.actualDelivery ? new Date(project.actualDelivery).toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl text-center">
                        <i className="ri-file-shield-line text-blue-400 text-2xl mb-2"></i>
                        <p className="text-sm text-gray-400">Certificação</p>
                        <p className="font-semibold">ABNT NBR 15000</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl text-center">
                        <i className="ri-award-line text-yellow-400 text-2xl mb-2"></i>
                        <p className="text-sm text-gray-400">Garantia</p>
                        <p className="font-semibold">5 Anos</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Photos Tab */}
                {activeTab === 'photos' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                          <i className="ri-image-line text-blue-500 text-xl"></i>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">Fotos do Carro Pronto</h2>
                          <p className="text-gray-400 text-sm">{deliveryMedia?.finalPhotos?.length || 0} fotos do veículo finalizado</p>
                        </div>
                      </div>
                      <button onClick={() => navigate('/gallery')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center space-x-2">
                        <i className="ri-gallery-line"></i>
                        <span className="hidden sm:inline">Ver Galeria Completa</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(deliveryMedia?.finalPhotos || project.vehicle.images).map((photo, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-40 object-cover rounded-xl transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                            <i className="ri-zoom-in-line text-white text-2xl"></i>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg text-xs">
                            Foto {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button onClick={() => handleDownload('certificate')} className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl flex items-center space-x-2">
                        <i className="ri-file-download-line"></i>
                        <span>Baixar Certificado</span>
                      </button>
                      <button onClick={() => handleDownload('manual')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center space-x-2">
                        <i className="ri-book-open-line"></i>
                        <span>Manual do Proprietário</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Checklist Tab */}
                {activeTab === 'checklist' && (
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                        <i className="ri-checkbox-circle-line text-green-500 text-xl"></i>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Lista de Conferência</h2>
                        <p className="text-gray-400 text-sm">{deliveryChecklist.filter(i => i.checked).length}/{deliveryChecklist.length} itens verificados</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {checklistCategories.map((category) => {
                        const items = deliveryChecklist.filter(i => i.category === category.id)
                        if (items.length === 0) return null
                        return (
                          <div key={category.id}>
                            <div className="flex items-center space-x-2 mb-3">
                              <i className={`${category.icon} text-primary`}></i>
                              <h3 className="font-semibold">{category.label}</h3>
                              <span className="text-xs text-gray-400">({items.filter(i => i.checked).length}/{items.length})</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {items.map((item) => (
                                <div key={item.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                                  <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center",
                                    item.checked ? "bg-green-500" : "bg-white/20"
                                  )}>
                                    {item.checked && <i className="ri-check-line text-white text-sm"></i>}
                                  </div>
                                  <span className={cn("text-sm", item.checked ? "text-white" : "text-gray-400")}>{item.item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {deliveryChecklist.length === 0 && (
                      <div className="text-center py-12">
                        <i className="ri-checkbox-circle-line text-gray-500 text-5xl mb-4"></i>
                        <p className="text-gray-400">Lista de conferência não disponível</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Schedule Tab */}
                {activeTab === 'schedule' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                          <i className="ri-calendar-line text-purple-500 text-xl"></i>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">Agendamento de Entrega</h2>
                          <p className="text-gray-400 text-sm">Informações sobre a retirada do veículo</p>
                        </div>
                      </div>
                      {!deliverySchedule?.confirmed && (
                        <button onClick={() => setShowScheduleModal(true)} className="px-4 py-2 bg-primary text-black font-semibold rounded-xl flex items-center space-x-2">
                          <i className="ri-calendar-check-line"></i>
                          <span>Agendar</span>
                        </button>
                      )}
                    </div>

                    {deliverySchedule ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white/5 rounded-2xl">
                          <div className="flex items-center space-x-3 mb-4">
                            <i className="ri-calendar-event-line text-primary text-xl"></i>
                            <h3 className="font-semibold">Data e Horário</h3>
                          </div>
                          <p className="text-2xl font-bold mb-1">{new Date(deliverySchedule.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          <p className="text-primary text-lg">{deliverySchedule.time}</p>
                          {deliverySchedule.confirmed && (
                            <div className="mt-4 flex items-center space-x-2 text-green-400">
                              <i className="ri-check-double-line"></i>
                              <span className="text-sm font-semibold">Entrega Confirmada</span>
                            </div>
                          )}
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl">
                          <div className="flex items-center space-x-3 mb-4">
                            <i className="ri-map-pin-line text-primary text-xl"></i>
                            <h3 className="font-semibold">Local de Retirada</h3>
                          </div>
                          <p className="font-medium mb-1">{deliverySchedule.location}</p>
                          <p className="text-gray-400 text-sm">Av. das Nações Unidas, 12901 - São Paulo</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl">
                          <div className="flex items-center space-x-3 mb-4">
                            <i className="ri-user-line text-primary text-xl"></i>
                            <h3 className="font-semibold">Contato</h3>
                          </div>
                          <p className="font-medium mb-1">{deliverySchedule.contactPerson}</p>
                          <p className="text-primary">{deliverySchedule.contactPhone}</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl">
                          <div className="flex items-center space-x-3 mb-4">
                            <i className="ri-file-list-line text-primary text-xl"></i>
                            <h3 className="font-semibold">Observações</h3>
                          </div>
                          <p className="text-gray-300 text-sm">{deliverySchedule.notes || 'Nenhuma observação adicional.'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <i className="ri-calendar-line text-gray-500 text-5xl mb-4"></i>
                        <p className="text-gray-400 mb-4">Nenhum agendamento realizado</p>
                        <button onClick={() => setShowScheduleModal(true)} className="px-6 py-3 bg-primary text-black font-semibold rounded-xl">
                          Agendar Entrega
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <button onClick={() => navigate('/elite-card')} className="glass-effect p-4 rounded-xl text-center hover:border-primary/50 transition-all">
                  <i className="ri-vip-crown-line text-primary text-2xl mb-2"></i>
                  <p className="text-sm font-medium">Cartão Elite</p>
                </button>
                <button onClick={() => navigate('/laudo')} className="glass-effect p-4 rounded-xl text-center hover:border-primary/50 transition-all">
                  <i className="ri-file-shield-line text-primary text-2xl mb-2"></i>
                  <p className="text-sm font-medium">Laudo EliteShield</p>
                </button>
                <button onClick={() => navigate('/revisoes')} className="glass-effect p-4 rounded-xl text-center hover:border-primary/50 transition-all">
                  <i className="ri-calendar-check-line text-primary text-2xl mb-2"></i>
                  <p className="text-sm font-medium">Revisões</p>
                </button>
                <button onClick={() => navigate('/chat')} className="glass-effect p-4 rounded-xl text-center hover:border-primary/50 transition-all">
                  <i className="ri-customer-service-2-line text-primary text-2xl mb-2"></i>
                  <p className="text-sm font-medium">Suporte</p>
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl w-full">
            <img src={selectedPhoto} alt="Foto ampliada" className="w-full h-auto rounded-2xl" />
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center" onClick={() => setSelectedPhoto(null)} title="Fechar foto">
              <i className="ri-close-line text-white text-xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-effect cinematic-blur rounded-3xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Agendar Entrega</h2>
              <button onClick={() => setShowScheduleModal(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center" title="Fechar modal">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Data Preferencial</label>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" title="Data preferencial" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Horário</label>
                <select value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" title="Horário da entrega">
                  <option value="" className="bg-gray-900">Selecione...</option>
                  <option value="09:00" className="bg-gray-900">09:00</option>
                  <option value="10:00" className="bg-gray-900">10:00</option>
                  <option value="11:00" className="bg-gray-900">11:00</option>
                  <option value="14:00" className="bg-gray-900">14:00</option>
                  <option value="15:00" className="bg-gray-900">15:00</option>
                  <option value="16:00" className="bg-gray-900">16:00</option>
                </select>
              </div>
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                <p className="text-sm"><strong>Local:</strong> Elite Blindagens - Sede Principal</p>
                <p className="text-sm text-gray-400">Av. das Nações Unidas, 12901 - São Paulo</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setShowScheduleModal(false)} className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl">Cancelar</button>
                <button onClick={handleScheduleDelivery} className="flex-1 px-4 py-3 bg-primary text-black font-semibold rounded-xl">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
