import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useProjects } from '../contexts/ProjectContext'

type TabType = 'personal' | 'security' | 'notifications' | 'vehicle' | 'support' | 'privacy'

// Tabs disponíveis por role
const getTabsForRole = (role: string | undefined): TabType[] => {
  if (role === 'executor') {
    return ['personal', 'security', 'notifications']
  }
  return ['personal', 'security', 'notifications', 'vehicle', 'support', 'privacy']
}

export function Profile() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()
  const { unreadCount, addNotification } = useNotifications()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { projects: allProjects } = useProjects()
  // Filtrar projetos do usuário e remover duplicatas por ID
  const userProjectsRaw = allProjects.filter(p => p.user.id === user?.id || p.user.email === user?.email)
  const userProjects = userProjectsRaw.filter((proj, index, self) => 
    index === self.findIndex(p => p.id === proj.id)
  )
  const project = userProjects[0] || allProjects[0]
  const availableTabs = getTabsForRole(user?.role)
  const isExecutor = user?.role === 'executor'

  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [personalData, setPersonalData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: '123.456.789-01',
    rg: '12.345.678-9',
    profession: 'Empresário',
    address: 'Av. Paulista, 1578',
    number: '1578',
    complement: 'Apto 2501',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    cep: '01310-100',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailUpdates: true,
    emailMessages: true,
    emailDocuments: true,
    emailMarketing: false,
    pushBrowser: true,
    pushUrgent: true,
    pushReminders: true,
    smsSteps: true,
    smsDelivery: true,
    smsEmergency: true,
    smsPayment: false,
  })

  const switchTab = (tab: TabType) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('Você tem alterações não salvas. Deseja continuar sem salvar?')) return
    }
    setActiveTab(tab)
    setHasUnsavedChanges(false)
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (updateUser) updateUser({ ...user, avatar: reader.result as string })
        showNotification('Foto do perfil atualizada!', 'success')
      }
      reader.readAsDataURL(file)
    }
  }

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    addNotification({ type, title: type === 'success' ? 'Sucesso' : 'Informação', message })
  }

  const savePersonalData = () => {
    if (updateUser) updateUser({ ...user, name: personalData.name, email: personalData.email, phone: personalData.phone })
    showNotification('Dados pessoais salvos com sucesso!', 'success')
    setHasUnsavedChanges(false)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const handleDownloadUserData = () => {
    showNotification('Preparando seus dados...', 'info')
    const userData = {
      personal: personalData,
      notifications: notificationSettings,
      vehicles: userProjects.map(p => ({
        brand: p.vehicle.brand,
        model: p.vehicle.model,
        plate: p.vehicle.plate,
        status: p.status,
        progress: p.progress
      })),
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `elite-track-dados-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setTimeout(() => showNotification('Dados baixados com sucesso!', 'success'), 500)
  }

  return (
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden min-h-screen overflow-y-auto pb-20">
      <style>{`
        .profile-section { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        .profile-section:hover { background: rgba(255,255,255,0.08); border-color: rgba(212,175,55,0.3); }
        .switch { position: relative; display: inline-block; width: 48px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background: rgba(255,255,255,0.2); transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background: #D4AF37; }
        input:checked + .slider:before { transform: translateX(24px); }
        .avatar-upload { position: relative; cursor: pointer; }
        .avatar-upload:hover .avatar-overlay { opacity: 1; }
        .avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
      `}</style>

      {isExecutor ? (
        <header className="bg-carbon-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  title="Voltar ao painel"
                >
                  <i className="ri-arrow-left-line text-xl"></i>
                  <span className="text-sm font-medium">Voltar</span>
                </button>
                <div className="w-px h-6 bg-white/20"></div>
                <h1 className="text-xl font-bold">Configurações do Perfil</h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLogout}
                  className="md:hidden w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors"
                  title="Sair"
                >
                  <i className="ri-logout-box-line text-red-400"></i>
                </button>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-500">Executor</div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                  {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" /> : <i className="ri-user-line text-black text-sm"></i>}
                </div>
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className="glass-effect border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                  <img src="/logo-elite.png" alt="Elite Blindagens" className="h-10 w-auto object-contain" />
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                  <span onClick={() => navigate('/timeline')} className="text-white/60 hover:text-white transition-colors text-sm font-medium cursor-pointer">Timeline</span>
                  <span onClick={() => navigate('/chat')} className="text-white/60 hover:text-white transition-colors text-sm font-medium cursor-pointer">Suporte</span>
                  <span onClick={() => navigate('/laudo')} className="text-white/60 hover:text-white transition-colors text-sm font-medium cursor-pointer">Documentos</span>
                  <span className="text-primary font-semibold text-sm">Perfil</span>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  className="md:hidden w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center transition-colors"
                  title="Sair"
                >
                  <i className="ri-logout-box-line text-red-400"></i>
                </button>
                <button className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <i className="ri-notification-3-line text-primary text-sm"></i>
                  </div>
                  {unreadCount > 0 && <span className="bg-primary text-black text-xs px-2 py-1 rounded-full font-semibold">{unreadCount}</span>}
                </button>
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
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
      )}

      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="glass-effect cinematic-blur rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="relative">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" title="Selecionar foto de perfil" aria-label="Selecionar foto de perfil" />
                  <div className="avatar-upload w-32 h-32 rounded-full overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                    {user?.avatar ? <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"><i className="ri-user-line text-black text-4xl"></i></div>}
                    <div className="avatar-overlay"><div className="text-center"><i className="ri-camera-line text-white text-2xl mb-1"></i><p className="text-white text-xs">Alterar foto</p></div></div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-black"><i className="ri-vip-crown-line text-black text-lg"></i></div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h1 className="text-3xl font-bold mb-2">{user?.name}</h1>
                  <p className="text-gray-400 mb-4">Cliente Elite desde Novembro 2025</p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-4">
                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-semibold"><i className="ri-vip-crown-line mr-1"></i>Elite Member</div>
                    <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold"><i className="ri-shield-check-line mr-1"></i>Verificado</div>
                    <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-semibold"><i className="ri-car-line mr-1"></i>{project.vehicle.brand} {project.vehicle.model}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div><div className="text-2xl font-bold text-primary">{userProjects.length}</div><div className="text-xs text-gray-400">Veículos</div></div>
                    <div><div className="text-2xl font-bold text-primary">15</div><div className="text-xs text-gray-400">Dias</div></div>
                    <div><div className="text-2xl font-bold text-primary">24/7</div><div className="text-xs text-gray-400">Suporte</div></div>
                  </div>
                </div>
                <div className="relative w-24 h-24">
                  <svg className="progress-ring w-24 h-24" viewBox="0 0 84 84">
                    <circle stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="transparent" r="40" cx="42" cy="42"/>
                    <circle stroke="#D4AF37" strokeWidth="4" fill="transparent" r="40" cx="42" cy="42" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * project.progress / 100)}/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="text-lg font-bold text-primary">{project.progress}%</div><div className="text-xs text-gray-400">Completo</div></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="glass-effect cinematic-blur rounded-2xl p-2 inline-flex flex-wrap gap-2">
              {availableTabs.map((tab) => (
                <button key={tab} onClick={() => switchTab(tab)} className={cn("px-6 py-3 rounded-xl whitespace-nowrap transition-colors", activeTab === tab ? "bg-primary text-black font-semibold" : "text-white/60 hover:text-white")}>
                  {tab === 'personal' ? 'Dados Pessoais' : tab === 'security' ? 'Segurança' : tab === 'notifications' ? 'Notificações' : tab === 'vehicle' ? 'Veículo' : tab === 'support' ? 'Suporte' : 'Privacidade'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-6">
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold">Informações Básicas</h3><div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><i className="ri-user-line text-primary"></i></div></div>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Nome Completo</label><input type="text" value={personalData.name} onChange={(e) => { setPersonalData({...personalData, name: e.target.value}); setHasUnsavedChanges(true); }} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50" title="Nome completo" placeholder="Seu nome completo" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-400 mb-2">CPF</label><input type="text" value={personalData.cpf} readOnly className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white/60 text-sm" title="CPF" placeholder="000.000.000-00" /></div>
                      <div><label className="block text-sm font-medium text-gray-400 mb-2">RG</label><input type="text" value={personalData.rg} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm" title="RG" placeholder="00.000.000-0" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Profissão</label><input type="text" value={personalData.profession} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm" title="Profissão" placeholder="Sua profissão" /></div>
                  </div>
                </div>
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold">Contato</h3><div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><i className="ri-phone-line text-primary"></i></div></div>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">E-mail</label><div className="relative"><input type="email" value={personalData.email} onChange={(e) => { setPersonalData({...personalData, email: e.target.value}); setHasUnsavedChanges(true); }} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white text-sm" title="E-mail" placeholder="seu@email.com" /><div className="absolute right-3 top-1/2 -translate-y-1/2"><i className="ri-check-line text-green-400"></i></div></div></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Telefone</label><input type="tel" value={personalData.phone} onChange={(e) => { setPersonalData({...personalData, phone: e.target.value}); setHasUnsavedChanges(true); }} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm" title="Telefone" placeholder="(11) 99999-9999" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">WhatsApp</label><div className="relative"><input type="tel" value={personalData.phone} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white text-sm" title="WhatsApp" placeholder="(11) 99999-9999" /><div className="absolute right-3 top-1/2 -translate-y-1/2"><i className="ri-whatsapp-fill text-green-400"></i></div></div></div>
                  </div>
                </div>
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section lg:col-span-2">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold">Endereço</h3><div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><i className="ri-map-pin-line text-primary"></i></div></div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2"><label className="block text-sm font-medium text-gray-400 mb-2">Rua</label><input type="text" value={personalData.address} onChange={(e) => { setPersonalData({...personalData, address: e.target.value}); setHasUnsavedChanges(true); }} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50" title="Rua" placeholder="Nome da rua" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Número</label><input type="text" value={personalData.number} onChange={(e) => { setPersonalData({...personalData, number: e.target.value}); setHasUnsavedChanges(true); }} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50" title="Número" placeholder="123" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Complemento</label><input type="text" value={personalData.complement} onChange={(e) => { setPersonalData({...personalData, complement: e.target.value}); setHasUnsavedChanges(true); }} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50" title="Complemento" placeholder="Apto, Bloco, etc" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Bairro</label><input type="text" value={personalData.neighborhood} onChange={(e) => { setPersonalData({...personalData, neighborhood: e.target.value}); setHasUnsavedChanges(true); }} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50" title="Bairro" placeholder="Nome do bairro" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Cidade</label><input type="text" value={personalData.city} onChange={(e) => { setPersonalData({...personalData, city: e.target.value}); setHasUnsavedChanges(true); }} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50" title="Cidade" placeholder="Nome da cidade" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">CEP</label><input type="text" value={personalData.cep} onChange={(e) => { setPersonalData({...personalData, cep: e.target.value}); setHasUnsavedChanges(true); }} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50" title="CEP" placeholder="00000-000" /></div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 lg:col-span-2">
                  <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">Cancelar</button>
                  <button onClick={savePersonalData} className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl transition-colors">Salvar Alterações</button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section lg:col-span-2">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold">Segurança da Senha</h3><div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><i className="ri-lock-line text-primary"></i></div></div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Senha Atual</label><input type="password" placeholder="••••••••" title="Senha atual" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Nova Senha</label><input type="password" placeholder="••••••••" title="Nova senha" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-400 mb-2">Confirmar</label><input type="password" placeholder="••••••••" title="Confirmar senha" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm" /></div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 lg:col-span-2">
                  <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Cancelar</button>
                  <button onClick={() => showNotification('Configurações de segurança salvas!', 'success')} className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl">Salvar</button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold">E-mail</h3><div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><i className="ri-mail-line text-primary"></i></div></div>
                  <div className="space-y-4">
                    {[{k:'emailUpdates',t:'Atualizações do Processo',d:'Progresso da blindagem'},{k:'emailMessages',t:'Mensagens do Suporte',d:'Quando receber mensagens'},{k:'emailDocuments',t:'Documentos',d:'Novos documentos disponíveis'}].map(i => (
                      <div key={i.k} className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><div className="font-semibold">{i.t}</div><div className="text-sm text-gray-400">{i.d}</div></div><label className="switch"><input type="checkbox" title={i.t} checked={notificationSettings[i.k as keyof typeof notificationSettings]} onChange={(e) => setNotificationSettings({...notificationSettings, [i.k]: e.target.checked})} /><span className="slider"></span></label></div>
                    ))}
                  </div>
                </div>
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold">Push</h3><div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><i className="ri-notification-line text-primary"></i></div></div>
                  <div className="space-y-4">
                    {[{k:'pushBrowser',t:'Navegador',d:'Notificações no browser'},{k:'pushUrgent',t:'Urgência Alta',d:'Questões importantes'},{k:'pushReminders',t:'Lembretes',d:'Agendamentos e prazos'}].map(i => (
                      <div key={i.k} className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><div className="font-semibold">{i.t}</div><div className="text-sm text-gray-400">{i.d}</div></div><label className="switch"><input type="checkbox" title={i.t} checked={notificationSettings[i.k as keyof typeof notificationSettings]} onChange={(e) => setNotificationSettings({...notificationSettings, [i.k]: e.target.checked})} /><span className="slider"></span></label></div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-4 lg:col-span-2">
                  <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Cancelar</button>
                  <button onClick={() => showNotification('Preferências salvas!', 'success')} className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl">Salvar</button>
                </div>
              </div>
            )}

            {activeTab === 'vehicle' && (
              <div className="space-y-6">
                <div className="glass-effect cinematic-blur rounded-3xl p-6">
                  <div className="flex items-center space-x-4 mb-6"><div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center"><i className="ri-car-line text-primary"></i></div><div><h2 className="text-2xl font-bold">Meus Veículos</h2><p className="text-gray-400">Gerencie seus veículos</p></div></div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {userProjects.map((proj) => (
                      <div key={proj.id} className="glass-effect rounded-2xl p-6 profile-section">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-20 h-16 rounded-xl overflow-hidden"><img src={proj.vehicle.images[0]} alt={proj.vehicle.model} className="w-full h-full object-cover" /></div>
                          <div className="flex-1"><h3 className="text-xl font-semibold">{proj.vehicle.brand} {proj.vehicle.model}</h3><p className="text-gray-400">{proj.vehicle.plate} • {proj.vehicle.year}</p></div>
                          <div className={cn("px-3 py-1 rounded-full text-sm font-semibold", proj.status === 'completed' ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary")}>{proj.status === 'completed' ? 'Concluído' : `${proj.progress}%`}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-400">Cor:</span><span className="ml-2">{proj.vehicle.color}</span></div><div><span className="text-gray-400">Nível:</span><span className="ml-2">{proj.vehicle.blindingLevel}</span></div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Central de Suporte</h3>
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="ri-customer-service-2-line text-primary"></i>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => navigate('/chat')} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-4 transition-colors">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><i className="ri-chat-3-line text-blue-400 text-xl"></i></div>
                      <div className="flex-1 text-left"><div className="font-semibold">Chat com Suporte</div><div className="text-sm text-gray-400">Fale com nossa equipe</div></div>
                      <i className="ri-arrow-right-s-line text-gray-400"></i>
                    </button>
                    <button onClick={() => navigate('/elite-card')} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-4 transition-colors">
                      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center"><i className="ri-truck-line text-red-400 text-xl"></i></div>
                      <div className="flex-1 text-left"><div className="font-semibold">Elite Rescue</div><div className="text-sm text-gray-400">Guincho 24h</div></div>
                      <i className="ri-arrow-right-s-line text-gray-400"></i>
                    </button>
                    <button onClick={() => navigate('/revisoes')} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-4 transition-colors">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><i className="ri-calendar-check-line text-green-400 text-xl"></i></div>
                      <div className="flex-1 text-left"><div className="font-semibold">Agendar Revisão</div><div className="text-sm text-gray-400">Manutenção preventiva</div></div>
                      <i className="ri-arrow-right-s-line text-gray-400"></i>
                    </button>
                  </div>
                </div>
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Meus Chamados</h3>
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="ri-ticket-2-line text-primary"></i>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-white/5 rounded-xl border-l-4 border-green-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Ticket #TKT-001</span>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Resolvido</span>
                      </div>
                      <p className="text-sm text-gray-400">Dúvida sobre cronograma de entrega</p>
                      <p className="text-xs text-gray-500 mt-2">Aberto em 10/12/2025</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border-l-4 border-yellow-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Ticket #TKT-002</span>
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Em análise</span>
                      </div>
                      <p className="text-sm text-gray-400">Solicitação de fotos adicionais</p>
                      <p className="text-xs text-gray-500 mt-2">Aberto em 12/12/2025</p>
                    </div>
                    <button onClick={() => navigate('/elite-card')} className="w-full p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl flex items-center justify-center space-x-2 transition-colors">
                      <i className="ri-add-line"></i>
                      <span>Abrir Novo Chamado</span>
                    </button>
                  </div>
                </div>
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Contato Direto</h3>
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <i className="ri-phone-line text-primary"></i>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a href="tel:08007654321" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-4 transition-colors">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center"><i className="ri-phone-line text-primary text-xl"></i></div>
                      <div><div className="font-semibold">0800 765 4321</div><div className="text-sm text-gray-400">Ligação gratuita</div></div>
                    </a>
                    <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-4 transition-colors">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><i className="ri-whatsapp-line text-green-400 text-xl"></i></div>
                      <div><div className="font-semibold">WhatsApp</div><div className="text-sm text-gray-400">(11) 99999-9999</div></div>
                    </a>
                    <a href="mailto:suporte@eliteblindagens.com.br" className="p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-4 transition-colors">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><i className="ri-mail-line text-blue-400 text-xl"></i></div>
                      <div><div className="font-semibold">E-mail</div><div className="text-sm text-gray-400">suporte@elite...</div></div>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold">Privacidade</h3><div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><i className="ri-shield-user-line text-primary"></i></div></div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><div className="font-semibold">Compartilhamento</div><div className="text-sm text-gray-400">Para melhorias</div></div><label className="switch"><input type="checkbox" title="Compartilhamento de dados" /><span className="slider"></span></label></div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><div className="font-semibold">Análise de Uso</div><div className="text-sm text-gray-400">Otimização</div></div><label className="switch"><input type="checkbox" defaultChecked title="Análise de uso" /><span className="slider"></span></label></div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <button onClick={handleDownloadUserData} className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center space-x-3"><i className="ri-download-line text-primary"></i><div><div className="font-semibold text-left">Baixar Meus Dados</div><div className="text-sm text-gray-400">Arquivo com suas informações</div></div></button>
                    <button onClick={() => { if(window.confirm('Excluir conta permanentemente?')) showNotification('Solicitação enviada', 'info') }} className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl flex items-center space-x-3"><i className="ri-delete-bin-line text-red-400"></i><div><div className="font-semibold text-red-400 text-left">Excluir Conta</div><div className="text-sm text-gray-400">Ação irreversível</div></div></button>
                  </div>
                </div>
                <div className="glass-effect cinematic-blur rounded-3xl p-6 profile-section">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-semibold">Visibilidade</h3><div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><i className="ri-eye-line text-primary"></i></div></div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><div className="font-semibold">Perfil Público</div><div className="text-sm text-gray-400">Outros podem ver</div></div><label className="switch"><input type="checkbox" title="Perfil Público" /><span className="slider"></span></label></div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl"><div><div className="font-semibold">Status Online</div><div className="text-sm text-gray-400">Mostrar quando online</div></div><label className="switch"><input type="checkbox" defaultChecked title="Status Online" /><span className="slider"></span></label></div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 lg:col-span-2">
                  <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Cancelar</button>
                  <button onClick={() => showNotification('Configurações salvas!', 'success')} className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl">Salvar</button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-6">
            <button onClick={handleLogout} className="w-full max-w-md mx-auto block px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl transition-colors">
              <i className="ri-logout-box-line mr-2"></i>Sair da Conta
            </button>
            <p className="text-center text-xs text-gray-500 mt-6">EliteTrack™ v1.0.0 • Elite Blindagens</p>
          </div>
        </section>
      </main>
    </div>
  )
}
