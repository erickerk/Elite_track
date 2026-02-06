import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, Lock, Bell, MessageCircle, 
  ArrowLeft, LogOut, Camera, CheckCircle, 
  Mail, MapPin, ChevronRight, Download, 
  Trash2, Globe, ShieldCheck
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useProjects } from '../contexts/ProjectContext'
import { supabase } from '../lib/supabase'

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
  const { addNotification } = useNotifications()
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

  const savePersonalData = async () => {
    if (!user) return

    try {
      // Salvar todos os campos no Supabase
      const { error } = await (supabase as any)
        .from('users_elitetrack')
        .update({
          name: personalData.name,
          email: personalData.email.toLowerCase().trim(),
          phone: personalData.phone,
          cpf: personalData.cpf,
          rg: personalData.rg,
          profession: personalData.profession,
          address: personalData.address,
          address_number: personalData.number,
          address_complement: personalData.complement,
          neighborhood: personalData.neighborhood,
          city: personalData.city,
          cep: personalData.cep,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        console.error('[Profile] Erro ao salvar dados:', error)
        showNotification('Erro ao salvar dados no servidor', 'error')
        return
      }

      // Atualizar estado local
      if (updateUser) {
        updateUser({ ...user, name: personalData.name, email: personalData.email, phone: personalData.phone })
      }
      
      showNotification('Dados pessoais salvos com sucesso!', 'success')
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('[Profile] Erro ao salvar:', err)
      showNotification('Erro ao salvar dados', 'error')
    }
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
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden min-h-screen overflow-y-auto pb-24">
      {/* Header Premium Mobile */}
      <header className="bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors active:scale-90"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-bold tracking-tight">Perfil</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center transition-colors border border-red-500/20 active:scale-90"
                title="Sair"
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg border border-primary/20">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <User className="w-5 h-5 text-black" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6 pt-6 px-4 sm:px-6">
        {/* Profile Card Section */}
        <section>
          <div className="glass-effect rounded-[2.5rem] p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative z-10">
              {/* Avatar */}
              <div className="relative group">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" title="Upload foto de perfil" aria-label="Upload foto de perfil" />
                <div 
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-all duration-500 shadow-2xl cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <User className="text-black w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="text-white w-8 h-8 mb-1 mx-auto" />
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest">Alterar</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary rounded-xl flex items-center justify-center border-4 border-black shadow-lg">
                  <ShieldCheck className="text-black w-5 h-5" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-4 mb-2">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{user?.name}</h2>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md",
                    isExecutor ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-primary/10 border-primary/20 text-primary"
                  )}>
                    {isExecutor ? 'Equipe Elite' : 'Elite Member'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium mb-6">
                  Membro ativo • Elite Blindagens
                </p>
                
                <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-sm mx-auto md:mx-0">
                  <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl text-center">
                    <div className="text-lg font-bold text-primary tracking-tight">{userProjects.length}</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Frota</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl text-center">
                    <div className="text-lg font-bold text-primary tracking-tight">Elite</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Member</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl text-center">
                    <div className="text-lg font-bold text-primary tracking-tight">Breve</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Atendimento</div>
                  </div>
                </div>
              </div>

              {/* Status Ring (Client) */}
              {!isExecutor && project && (
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/[0.05]" />
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="transparent" 
                      strokeDasharray={282.7}
                      strokeDashoffset={282.7 - (282.7 * project.progress / 100)}
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xl font-bold text-white">{project.progress}%</div>
                    <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Status</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tab Switcher - Mobile Friendly */}
        <section className="px-4 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
            <div className="inline-flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1 min-w-max">
              {availableTabs.map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => switchTab(tab)}
                  type="button"
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-95 touch-manipulation", 
                    activeTab === tab 
                      ? "bg-primary text-black" 
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  {tab === 'personal' ? 'Dados' : 
                   tab === 'security' ? 'Segurança' : 
                   tab === 'notifications' ? 'Alertas' : 
                   tab === 'vehicle' ? 'Frota' : 
                   tab === 'support' ? 'Suporte' : 'Privacidade'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Tab Content Area */}
        <section className="px-4 sm:px-6 pb-12">
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Dados Pessoais</h3>
                    <p className="text-[9px] text-gray-500 uppercase">Identificação</p>
                  </div>
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase mb-1 block">Nome Completo</label>
                    <input 
                      type="text" 
                      value={personalData.name} 
                      onChange={(e) => { setPersonalData({...personalData, name: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50" 
                      title="Nome completo" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase mb-1 block">CPF</label>
                      <input 
                        type="text" 
                        value={personalData.cpf} 
                        onChange={(e) => { setPersonalData({...personalData, cpf: e.target.value}); setHasUnsavedChanges(true); }} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50" 
                        title="CPF" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase mb-1 block">Profissão</label>
                      <input 
                        type="text" 
                        value={personalData.profession} 
                        onChange={(e) => { setPersonalData({...personalData, profession: e.target.value}); setHasUnsavedChanges(true); }} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50" 
                        title="Profissão" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Contato</h3>
                    <p className="text-[9px] text-gray-500 uppercase">Comunicação</p>
                  </div>
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase mb-1 block">E-mail</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={personalData.email} 
                        onChange={(e) => { setPersonalData({...personalData, email: e.target.value}); setHasUnsavedChanges(true); }} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-white text-sm focus:border-primary/50" 
                        title="E-mail" 
                      />
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase mb-1 block">WhatsApp</label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        value={personalData.phone} 
                        onChange={(e) => { setPersonalData({...personalData, phone: e.target.value}); setHasUnsavedChanges(true); }} 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-white text-sm focus:border-primary/50" 
                        title="Telefone" 
                      />
                      <MessageCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="lg:col-span-2 bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Endereço</h3>
                    <p className="text-[9px] text-gray-500 uppercase">Entrega e faturamento</p>
                  </div>
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[9px] text-gray-500 uppercase mb-1 block">Rua / Avenida</label>
                    <input 
                      type="text" 
                      value={personalData.address} 
                      onChange={(e) => { setPersonalData({...personalData, address: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary/50" 
                      title="Endereço" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase mb-1 block">Número</label>
                    <input 
                      type="text" 
                      value={personalData.number} 
                      onChange={(e) => { setPersonalData({...personalData, number: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary/50" 
                      title="Número" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase mb-1 block">Bairro</label>
                    <input 
                      type="text" 
                      value={personalData.neighborhood} 
                      onChange={(e) => { setPersonalData({...personalData, neighborhood: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary/50" 
                      title="Bairro" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase mb-1 block">Cidade</label>
                    <input 
                      type="text" 
                      value={personalData.city} 
                      onChange={(e) => { setPersonalData({...personalData, city: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary/50" 
                      title="Cidade" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase mb-1 block">CEP</label>
                    <input 
                      type="text" 
                      value={personalData.cep} 
                      onChange={(e) => { setPersonalData({...personalData, cep: e.target.value}); setHasUnsavedChanges(true); }} 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary/50" 
                      title="CEP" 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="lg:col-span-2 flex justify-end gap-3 pt-3">
                <button className="px-4 py-2.5 bg-white/5 text-white text-xs font-semibold rounded-lg border border-white/10 active:scale-95">Descartar</button>
                <button onClick={() => void savePersonalData()} className="px-4 py-2.5 bg-primary text-black text-xs font-bold rounded-lg active:scale-95">Salvar</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="glass-effect rounded-[2rem] p-6 sm:p-10 border border-white/5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Segurança</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Proteção de acesso à conta</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 transition-colors group-hover:bg-primary/20">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Senha Atual</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Nova Senha</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all" />
                  </div>
                  <button onClick={() => showNotification('Senha alterada com sucesso!', 'success')} className="w-full bg-primary text-black font-black text-xs uppercase tracking-widest py-5 rounded-2xl shadow-lg shadow-primary/20 mt-4 active:scale-95 transition-all">Atualizar Senha</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="glass-effect rounded-[2rem] p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 transition-colors group-hover:bg-primary/20">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">E-mail</h3>
                </div>
                <div className="space-y-4 relative z-10">
                  {[
                    { k: 'emailUpdates', t: 'Atualizações do Projeto', d: 'Receba notificações de progresso' },
                    { k: 'emailMessages', t: 'Mensagens', d: 'Comunicações da equipe' },
                    { k: 'emailDocuments', t: 'Documentos', d: 'Alertas de novos documentos' },
                    { k: 'emailMarketing', t: 'Ofertas e Novidades', d: 'Promoções exclusivas' }
                  ].map(item => (
                    <div key={item.k} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div>
                        <div className="text-sm font-bold text-white tracking-tight">{item.t}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{item.d}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" title={item.t} checked={notificationSettings[item.k as keyof typeof notificationSettings]} onChange={(e) => setNotificationSettings({...notificationSettings, [item.k]: e.target.checked})} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-effect rounded-[2rem] p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 transition-colors group-hover:bg-primary/20">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Push Mobile</h3>
                </div>
                <div className="space-y-4 relative z-10">
                  {[
                    { k: 'pushBrowser', t: 'Notificações Push', d: 'Alertas no navegador' },
                    { k: 'pushUrgent', t: 'Urgentes', d: 'Avisos prioritários' },
                    { k: 'pushReminders', t: 'Lembretes', d: 'Agendamentos e prazos' }
                  ].map(item => (
                    <div key={item.k} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div>
                        <div className="text-sm font-bold text-white tracking-tight">{item.t}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{item.d}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" title={item.t} checked={notificationSettings[item.k as keyof typeof notificationSettings]} onChange={(e) => setNotificationSettings({...notificationSettings, [item.k]: e.target.checked})} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                {userProjects.map((proj) => (
                  <div key={proj.id} className="glass-effect rounded-[2.5rem] p-6 sm:p-8 border border-white/5 hover:border-primary/20 transition-all duration-500 group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
                    <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                      <div className="w-full sm:w-48 h-32 rounded-[1.5rem] overflow-hidden border border-white/10 shadow-xl">
                        <img src={proj.vehicle.images[0]} alt={proj.vehicle.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 tracking-tighter">
                            {proj.vehicle.plate}
                          </span>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                            proj.status === 'completed' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-primary/10 border-primary/20 text-primary"
                          )}>
                            {proj.status === 'completed' ? 'Finalizado' : `${proj.progress}% Concluído`}
                          </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-4">{proj.vehicle.brand} <span className="text-primary">{proj.vehicle.model}</span></h3>
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          <div>Cor: <span className="text-white ml-1">{proj.vehicle.color}</span></div>
                          <div>Nível: <span className="text-white ml-1">{proj.vehicle.blindingLevel}</span></div>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full sm:w-auto h-12 px-6 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all active:scale-90"
                      >
                        Gerenciar <ChevronRight className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="glass-effect rounded-[2rem] p-6 sm:p-8 border border-white/5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-lg font-bold text-white tracking-tight">Atendimento Elite</h3>
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 transition-colors group-hover:bg-primary/20">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="space-y-3 relative z-10">
                  <button onClick={() => navigate('/chat')} className="w-full p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-[1.5rem] border border-white/5 flex items-center gap-4 transition-all group/btn active:scale-95">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover/btn:bg-blue-500/20 transition-colors">
                      <MessageCircle className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-white tracking-tight">Chat em Tempo Real</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Suporte técnico especializado</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover/btn:text-primary transition-colors" />
                  </button>
                  <button onClick={() => navigate('/revisoes')} className="w-full p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-[1.5rem] border border-white/5 flex items-center gap-4 transition-all group/btn active:scale-95">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 group-hover/btn:bg-green-500/20 transition-colors">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-white tracking-tight">Agendar Revisão</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Manutenção e checkout</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover/btn:text-primary transition-colors" />
                  </button>
                </div>
              </div>

              <div className="glass-effect rounded-[2rem] p-6 sm:p-8 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
                <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 mb-6 shadow-xl shadow-primary/5 relative z-10">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight relative z-10">Suporte 24/7 Premium</h3>
                <p className="text-sm text-gray-500 font-medium mb-8 max-w-xs relative z-10">Nosso time de especialistas está pronto para atender suas solicitações com máxima prioridade.</p>
                <button 
                  onClick={() => navigate('/elite-card')}
                  className="w-full py-4 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all relative z-10"
                >
                  Abrir Novo Chamado
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="glass-effect rounded-[2.5rem] p-6 sm:p-10 border border-white/5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <h3 className="text-xl font-bold text-white tracking-tight">Sua Privacidade</h3>
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 transition-colors group-hover:bg-primary/20">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                    <div>
                      <div className="text-sm font-bold text-white tracking-tight">Análise de Uso</div>
                      <div className="text-[10px] text-gray-500 font-medium">Melhoria contínua da experiência</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked title="Análise de Uso" />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="pt-6 space-y-3">
                    <button onClick={handleDownloadUserData} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-4 transition-all active:scale-95">
                      <Download className="w-5 h-5 text-primary" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">Exportar Dados</div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Backup completo da sua conta</div>
                      </div>
                    </button>
                    <button onClick={() => window.confirm('Deseja excluir permanentemente?') && showNotification('Solicitação enviada', 'info')} className="w-full p-4 bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/10 flex items-center gap-4 transition-all active:scale-95">
                      <Trash2 className="w-5 h-5 text-red-400" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-red-400">Excluir Conta</div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Esta ação é irreversível</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Footer Info Mobile */}
        <section className="px-4 sm:px-6 pb-8 text-center">
          <button onClick={handleLogout} className="w-full max-w-md mx-auto block px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] uppercase tracking-widest rounded-2xl border border-red-500/20 transition-all active:scale-95 mb-8">
            <LogOut className="w-4 h-4 inline-block mr-2" /> Encerrar Sessão
          </button>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">EliteTrack™ v1.0.0 • 2026 Elite Blindagens</p>
        </section>
      </main>
    </div>
  )
}
export default Profile
