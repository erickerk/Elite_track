import { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  Users, Car, BarChart3, Search, Shield, Key, Trash2,
  CheckCircle, Clock, TrendingUp, Settings, UserCheck,
  Eye, EyeOff, UserPlus, LogOut, Activity, Database,
  DollarSign, Calendar, FileText, Download, X, ChevronRight, Mail, Send,
  Filter, History, ArrowLeft, RefreshCw, Menu
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { InviteManager } from '../components/admin/InviteManager'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useProjects } from '../contexts/ProjectContext'
import { useQuotes } from '../contexts/QuoteContext'
import { useLeads } from '../contexts/LeadsContext'
import { cn } from '../lib/utils'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { generateEliteShieldPDF } from '../utils/pdfGenerator'
import { generateArchitectureDoc } from '../utils/architectureDocGenerator'

interface ExecutorUser {
  id: string
  name: string
  email: string
  phone: string
  role: 'executor'
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
  projectsCount: number
}

interface ExecutorAction {
  id: string
  type: 'project_created' | 'project_updated' | 'client_created' | 'photo_uploaded' | 'timeline_updated' | 'login'
  description: string
  timestamp: string
  projectId?: string
  projectName?: string
}

interface Schedule {
  id: string
  project_id?: string
  client_name: string
  client_email?: string
  client_phone?: string
  vehicle: string
  scheduled_date: string
  scheduled_time: string
  type: 'revisao' | 'entrega' | 'vistoria'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

interface ClientInfo {
  id: string
  name: string
  email: string
  phone: string
  vehiclesCount: number
  hasAccessed: boolean
  lastAccess?: string
  projects: {
    id: string
    vehicle: string
    status: string
    qrCode?: string
  }[]
}

const exportToExcelGeneric = (data: Record<string, unknown>[], filename: string) => {
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(';'),
    ...data.map(row => headers.map(h => String(row[h] ?? '')).join(';'))
  ].join('\n')
  
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

type AdminTab = 'dashboard' | 'executors' | 'clients' | 'projects' | 'quotes' | 'schedule' | 'leads' | 'invites' | 'settings'

export function AdminDashboard() {
  const { user, logout } = useAuth()
  const { addNotification } = useNotifications()
  const { projects } = useProjects()
  const { quotes, getPendingQuotes } = useQuotes()
  const { leads, clearAllLeads, removeLead } = useLeads()
  
  const exportToExcel = () => {
    const data = leads.map(l => ({
      Nome: l.name,
      Email: l.email,
      Telefone: l.phone,
      'Quer Especialista': l.wantsSpecialist ? 'Sim' : 'Não',
      Origem: l.source,
      Data: new Date(l.createdAt).toLocaleDateString('pt-BR')
    }))
    exportToExcelGeneric(data, 'leads')
    addNotification({ type: 'success', title: 'Exportação', message: `${data.length} leads exportados!` })
  }
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [executors, setExecutors] = useState<ExecutorUser[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loadingExecutors, setLoadingExecutors] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewExecutorModal, setShowNewExecutorModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedExecutor, setSelectedExecutor] = useState<ExecutorUser | null>(null)
  const [showExecutorDetail, setShowExecutorDetail] = useState(false)
  const [executorActions, setExecutorActions] = useState<ExecutorAction[]>([])
  const [showPassword, setShowPassword] = useState(false)
  
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null)
  const [clientFilter, setClientFilter] = useState<'all' | 'accessed' | 'pending'>('all')
  
  const [quoteFilter, setQuoteFilter] = useState<'all' | 'pending' | 'sent' | 'approved' | 'rejected'>('all')
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'revisao' | 'entrega' | 'confirmed' | 'pending'>('all')
  
  // Estado do menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [newExecutorData, setNewExecutorData] = useState({
    name: '', email: '', phone: '', password: '',
  })
  const [newPassword, setNewPassword] = useState('')

  // Carregar executores do Supabase
  const loadExecutors = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoadingExecutors(false)
      return
    }
    
    try {
      const { data, error } = await (supabase as any)
        .from('users_elitetrack')
        .select('*')
        .eq('role', 'executor')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('[AdminDashboard] Erro ao carregar executores:', error)
        return
      }
      
      const mappedExecutors: ExecutorUser[] = (data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        phone: e.phone || '',
        role: 'executor' as const,
        status: e.is_active ? 'active' : 'inactive',
        createdAt: e.created_at?.split('T')[0] || '',
        lastLogin: e.last_login?.split('T')[0],
        projectsCount: 0,
      }))
      
      setExecutors(mappedExecutors)
      console.log('[AdminDashboard] ✓ Executores carregados do Supabase:', mappedExecutors.length)
    } catch (err) {
      console.error('[AdminDashboard] Erro inesperado:', err)
    } finally {
      setLoadingExecutors(false)
    }
  }, [])

  // Carregar agendamentos do Supabase
  const loadSchedules = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      return
    }
    
    try {
      const { data, error } = await (supabase as any)
        .from('schedules')
        .select('*')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
      
      if (error) {
        console.error('[AdminDashboard] Erro ao carregar agendamentos:', error)
        return
      }
      
      setSchedules(data || [])
      console.log('[AdminDashboard] ✓ Agendamentos carregados:', data?.length || 0)
    } catch (err) {
      console.error('[AdminDashboard] Erro inesperado ao carregar agendamentos:', err)
    }
  }, [])

  useEffect(() => {
    void loadExecutors()
    void loadSchedules()
  }, [loadExecutors, loadSchedules])

  // Carregar histórico de ações do executor
  const loadExecutorActions = useCallback(async (executorId: string) => {
    console.log('[AdminDashboard] Carregando histórico do executor:', executorId)
    // Simulação de ações (em produção, viria de uma tabela de audit_log)
    const mockActions: ExecutorAction[] = [
      { id: '1', type: 'login', description: 'Login realizado', timestamp: new Date().toISOString() },
      { id: '2', type: 'project_created', description: 'Projeto criado', timestamp: new Date(Date.now() - 86400000).toISOString(), projectName: 'Honda Civic - ABC123' },
      { id: '3', type: 'photo_uploaded', description: 'Fotos adicionadas ao projeto', timestamp: new Date(Date.now() - 172800000).toISOString(), projectName: 'Mercedes GLE 450' },
      { id: '4', type: 'timeline_updated', description: 'Timeline atualizada', timestamp: new Date(Date.now() - 259200000).toISOString(), projectName: 'BMW X5' },
      { id: '5', type: 'client_created', description: 'Cliente cadastrado', timestamp: new Date(Date.now() - 345600000).toISOString() },
    ]
    setExecutorActions(mockActions)
  }, [])

  // Extrair clientes únicos dos projetos
  const clients = useMemo<ClientInfo[]>(() => {
    const clientMap = new Map<string, ClientInfo>()
    
    projects.forEach(p => {
      const existing = clientMap.get(p.user.email)
      if (existing) {
        existing.vehiclesCount++
        existing.projects.push({
          id: p.id,
          vehicle: `${p.vehicle.brand} ${p.vehicle.model}`,
          status: p.status,
          qrCode: p.qrCode,
        })
      } else {
        clientMap.set(p.user.email, {
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
          phone: p.user.phone || '',
          vehiclesCount: 1,
          hasAccessed: Math.random() > 0.3, // Simulação - em produção viria do backend
          lastAccess: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          projects: [{
            id: p.id,
            vehicle: `${p.vehicle.brand} ${p.vehicle.model}`,
            status: p.status,
            qrCode: p.qrCode,
          }],
        })
      }
    })
    
    return Array.from(clientMap.values())
  }, [projects])

  // Estatísticas
  const stats = {
    totalProjects: projects.length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    pending: projects.filter(p => p.status === 'pending').length,
    totalExecutors: executors.length,
    activeExecutors: executors.filter(e => e.status === 'active').length,
    totalClients: clients.length,
    clientsWithAccess: clients.filter(c => c.hasAccessed).length,
  }

  const filteredExecutors = executors.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateExecutor = async () => {
    if (!newExecutorData.name || !newExecutorData.email || !newExecutorData.password) {
      addNotification({ type: 'warning', title: 'Campos Obrigatórios', message: 'Preencha todos os campos obrigatórios.' })
      return
    }
    
    // Salvar no Supabase (tabela users_elitetrack)
    if (isSupabaseConfigured() && supabase && user) {
      try {
        const { data, error } = await (supabase as any)
          .from('users_elitetrack')
          .insert({
            name: newExecutorData.name,
            email: newExecutorData.email.toLowerCase().trim(),
            phone: newExecutorData.phone || null,
            role: 'executor',
            password_hash: newExecutorData.password,
            created_by: user.id,
            is_active: true,
          })
          .select()
          .single()
        
        if (error) {
          console.error('[AdminDashboard] Erro ao criar executor:', error)
          if (error.code === '23505') {
            addNotification({ type: 'error', title: 'Email já cadastrado', message: 'Este email já está em uso.' })
          } else {
            addNotification({ type: 'error', title: 'Erro', message: 'Erro ao criar executor no banco de dados.' })
          }
          return
        }
        
        const newExecutor: ExecutorUser = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          role: 'executor',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
          projectsCount: 0,
        }
        
        setExecutors(prev => [...prev, newExecutor])
        setShowNewExecutorModal(false)
        setNewExecutorData({ name: '', email: '', phone: '', password: '' })
        addNotification({ type: 'success', title: 'Executor Criado', message: `${newExecutor.name} foi adicionado com sucesso no Supabase.` })
        console.log('[AdminDashboard] ✓ Executor criado no Supabase:', data.id)
      } catch (err) {
        console.error('[AdminDashboard] Erro inesperado:', err)
        addNotification({ type: 'error', title: 'Erro', message: 'Erro inesperado ao criar executor.' })
      }
    } else {
      // Fallback para mock data (apenas desenvolvimento)
      const newExecutor: ExecutorUser = {
        id: `EXE-${Date.now()}`,
        name: newExecutorData.name,
        email: newExecutorData.email,
        phone: newExecutorData.phone,
        role: 'executor',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        projectsCount: 0,
      }
      
      setExecutors(prev => [...prev, newExecutor])
      setShowNewExecutorModal(false)
      setNewExecutorData({ name: '', email: '', phone: '', password: '' })
      addNotification({ type: 'success', title: 'Executor Criado', message: `${newExecutor.name} foi adicionado (modo dev).` })
    }
  }

  const handleToggleExecutorStatus = async (executor: ExecutorUser) => {
    const newStatus = executor.status === 'active' ? 'inactive' : 'active'
    
    // Atualizar no Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await (supabase as any)
          .from('users_elitetrack')
          .update({ is_active: newStatus === 'active' })
          .eq('id', executor.id)
        
        if (error) {
          console.error('[AdminDashboard] Erro ao atualizar status:', error)
          addNotification({ type: 'error', title: 'Erro', message: 'Não foi possível atualizar o status.' })
          return
        }
      } catch (err) {
        console.error('[AdminDashboard] Erro inesperado:', err)
        addNotification({ type: 'error', title: 'Erro', message: 'Erro inesperado ao atualizar status.' })
        return
      }
    }
    
    // Atualizar estado local
    setExecutors(prev => prev.map(e => 
      e.id === executor.id ? { ...e, status: newStatus } : e
    ))
    addNotification({ 
      type: 'success', 
      title: 'Status Atualizado', 
      message: `${executor.name} foi ${newStatus === 'active' ? 'ativado' : 'desativado'}.` 
    })
  }

  const handleResetPassword = async () => {
    if (!selectedExecutor) {
      addNotification({ type: 'error', title: 'Erro', message: 'Nenhum executor selecionado.' })
      return
    }

    if (!newPassword || newPassword.length < 6) {
      addNotification({ type: 'warning', title: 'Senha Inválida', message: 'A senha deve ter pelo menos 6 caracteres.' })
      return
    }

    // Atualizar senha diretamente na tabela users_elitetrack
    if (!isSupabaseConfigured() || !supabase) {
      addNotification({ type: 'error', title: 'Supabase não configurado', message: 'Não foi possível atualizar a senha no banco de dados.' })
      return
    }

    try {
      const { error } = await (supabase as any)
        .from('users_elitetrack')
        .update({
          password_hash: newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedExecutor.id)

      if (error) {
        console.error('[AdminDashboard] Erro ao resetar senha do executor:', error)
        addNotification({ type: 'error', title: 'Erro ao atualizar senha', message: 'Não foi possível salvar a nova senha no banco.' })
        return
      }

      addNotification({ type: 'success', title: 'Senha Alterada', message: `Senha de ${selectedExecutor.name} foi alterada com sucesso.` })
      setShowResetPasswordModal(false)
      setNewPassword('')
      setSelectedExecutor(null)
    } catch (err) {
      console.error('[AdminDashboard] Erro inesperado ao resetar senha:', err)
      addNotification({ type: 'error', title: 'Erro inesperado', message: 'Ocorreu um erro ao tentar atualizar a senha.' })
    }
  }

  const handleDeleteExecutor = (executor: ExecutorUser) => {
    if (window.confirm(`Tem certeza que deseja excluir ${executor.name}?`)) {
      setExecutors(prev => prev.filter(e => e.id !== executor.id))
      addNotification({ type: 'success', title: 'Executor Excluído', message: `${executor.name} foi removido do sistema.` })
    }
  }

  const handleLogout = () => {
    logout()
  }

  const pendingQuotes = getPendingQuotes()

  // Filtros aplicados
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => quoteFilter === 'all' || q.status === quoteFilter)
  }, [quotes, quoteFilter])

  const filteredSchedule = useMemo(() => {
    return schedules.filter(s => {
      if (scheduleFilter === 'all') return true
      if (scheduleFilter === 'revisao' || scheduleFilter === 'entrega') return s.type === scheduleFilter
      if (scheduleFilter === 'confirmed' || scheduleFilter === 'pending') return s.status === scheduleFilter
      return true
    })
  }, [schedules, scheduleFilter])

  const filteredClientsList = useMemo(() => {
    let result = clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (clientFilter === 'accessed') result = result.filter(c => c.hasAccessed)
    if (clientFilter === 'pending') result = result.filter(c => !c.hasAccessed)
    return result
  }, [clients, searchTerm, clientFilter])

  // Funções de exportação Excel
  const handleExportClients = () => {
    const data = filteredClientsList.map(c => ({
      Nome: c.name,
      Email: c.email,
      Telefone: c.phone,
      Veículos: c.vehiclesCount,
      Status: c.hasAccessed ? 'Acessou' : 'Não acessou',
      'Último Acesso': c.lastAccess ? new Date(c.lastAccess).toLocaleDateString('pt-BR') : 'Nunca'
    }))
    exportToExcelGeneric(data, 'clientes')
    addNotification({ type: 'success', title: 'Exportação', message: `${data.length} clientes exportados!` })
  }

  const handleExportQuotes = () => {
    const data = filteredQuotes.map(q => ({
      Cliente: q.clientName,
      Email: q.clientEmail,
      Veículo: `${q.vehicleBrand} ${q.vehicleModel}`,
      'Nível Blindagem': q.blindingLevel,
      Status: q.status === 'pending' ? 'Aguardando' : q.status === 'sent' ? 'Enviado' : q.status === 'approved' ? 'Aprovado' : 'Rejeitado',
      Valor: q.estimatedPrice || 'A definir',
      'Data Solicitação': new Date(q.createdAt).toLocaleDateString('pt-BR')
    }))
    exportToExcelGeneric(data, 'orcamentos')
    addNotification({ type: 'success', title: 'Exportação', message: `${data.length} orçamentos exportados!` })
  }

  const handleExportSchedule = () => {
    const data = filteredSchedule.map(s => ({
      Cliente: s.client_name,
      Email: s.client_email || '',
      Telefone: s.client_phone || '',
      Veículo: s.vehicle,
      Data: new Date(s.scheduled_date).toLocaleDateString('pt-BR'),
      Horário: s.scheduled_time,
      Tipo: s.type === 'revisao' ? 'Revisão' : s.type === 'entrega' ? 'Entrega' : 'Vistoria',
      Status: s.status === 'confirmed' ? 'Confirmado' : s.status === 'pending' ? 'Pendente' : s.status === 'cancelled' ? 'Cancelado' : 'Concluído'
    }))
    exportToExcelGeneric(data, 'agenda')
    addNotification({ type: 'success', title: 'Exportação', message: `${data.length} agendamentos exportados!` })
  }

  const handleViewExecutorDetail = (executor: ExecutorUser) => {
    setSelectedExecutor(executor)
    setShowExecutorDetail(true)
    void loadExecutorActions(executor.id)
  }

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: BarChart3 },
    { id: 'executors' as AdminTab, label: 'Executores', icon: Users },
    { id: 'clients' as AdminTab, label: 'Clientes', icon: UserCheck },
    { id: 'projects' as AdminTab, label: 'Projetos', icon: Car },
    { id: 'quotes' as AdminTab, label: 'Orçamentos', icon: DollarSign, badge: pendingQuotes.length },
    { id: 'schedule' as AdminTab, label: 'Agenda', icon: Calendar },
    { id: 'leads' as AdminTab, label: 'Leads', icon: Mail, badge: leads.length },
    { id: 'invites' as AdminTab, label: 'Convites', icon: Send },
    { id: 'settings' as AdminTab, label: 'Configurações', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-carbon-900 border-r border-white/10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <img src="/logo-elite.png" alt="Elite Blindagens" className="h-10 w-auto" />
            <div>
              <span className="text-xs text-gray-500">Painel Admin</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all",
                  activeTab === item.id 
                    ? "bg-primary text-black" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {'badge' in item && (item as { badge?: number }).badge !== undefined && (item as { badge?: number }).badge! > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{(item as { badge?: number }).badge}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-red-400 py-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Menu Drawer */}
          <aside 
            className="absolute left-0 top-0 h-full w-72 bg-carbon-900 border-r border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src="/logo-elite.png" alt="Elite Blindagens" className="h-8 w-auto" />
                <span className="text-xs text-gray-500">Painel Admin</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all",
                      activeTab === item.id 
                        ? "bg-primary text-black" 
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {'badge' in item && (item as { badge?: number }).badge !== undefined && (item as { badge?: number }).badge! > 0 && (
                      <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{(item as { badge?: number }).badge}</span>
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="p-4 border-t border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{user?.name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-red-400 py-3 rounded-xl hover:bg-white/5 transition-colors border border-white/10"
                aria-label="Sair da conta"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-carbon-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="lg:hidden flex items-center space-x-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <img src="/logo-elite.png" alt="Elite Blindagens" className="h-6 w-auto" />
              </div>
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'executors' && 'Gestão de Executores'}
                  {activeTab === 'clients' && 'Gestão de Clientes'}
                  {activeTab === 'projects' && 'Projetos'}
                  {activeTab === 'quotes' && 'Gestão de Orçamentos'}
                  {activeTab === 'schedule' && 'Agenda de Revisões'}
                  {activeTab === 'invites' && 'Gestão de Convites'}
                  {activeTab === 'leads' && 'Gestão de Leads'}
                  {activeTab === 'settings' && 'Configurações'}
                </h2>
              </div>
              <div className="text-sm text-gray-400">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalProjects}</p>
                      <p className="text-sm text-gray-400">Total Projetos</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.inProgress}</p>
                      <p className="text-sm text-gray-400">Em Andamento</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.completed}</p>
                      <p className="text-sm text-gray-400">Concluídos</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.activeExecutors}</p>
                      <p className="text-sm text-gray-400">Executores Ativos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <span>Ações Rápidas</span>
                  </h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => { setActiveTab('executors'); setShowNewExecutorModal(true); }}
                      className="w-full flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <UserPlus className="w-5 h-5 text-primary" />
                      <span>Criar Novo Executor</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('executors')}
                      className="w-full flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Key className="w-5 h-5 text-yellow-500" />
                      <span>Gerenciar Senhas</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('projects')}
                      className="w-full flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <Database className="w-5 h-5 text-blue-500" />
                      <span>Ver Todos os Projetos</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>Resumo do Sistema</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-gray-400">Total de Clientes</span>
                      <span className="font-bold">{stats.totalClients}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-gray-400">Executores Cadastrados</span>
                      <span className="font-bold">{stats.totalExecutors}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                      <span className="text-gray-400">Projetos Pendentes</span>
                      <span className="font-bold text-yellow-500">{stats.pending}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Projects */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Projetos Recentes</h3>
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-carbon-700">
                          <img src={project.vehicle.images[0]} alt={project.vehicle.model} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium">{project.vehicle.brand} {project.vehicle.model}</p>
                          <p className="text-sm text-gray-400">{project.user.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          project.status === 'completed' ? "bg-green-500/20 text-green-400" :
                          project.status === 'in_progress' ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-gray-500/20 text-gray-400"
                        )}>
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Executors Tab */}
          {activeTab === 'executors' && (
            <div className="space-y-6">
              {showExecutorDetail && selectedExecutor ? (
                /* Tela de Detalhes do Executor */
                <div className="space-y-6">
                  <button
                    onClick={() => { setShowExecutorDetail(false); setSelectedExecutor(null); }}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Voltar para lista</span>
                  </button>

                  {/* Cabeçalho do Executor */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <span className="text-black font-bold text-2xl">{selectedExecutor.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h2 className="text-2xl font-bold">{selectedExecutor.name}</h2>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium",
                            selectedExecutor.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                          )}>
                            {selectedExecutor.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <p className="text-gray-400">{selectedExecutor.email}</p>
                        <p className="text-sm text-gray-500">{selectedExecutor.phone} • Cadastrado em {selectedExecutor.createdAt}</p>
                      </div>
                    </div>
                  </div>

                  {/* Histórico de Ações */}
                  <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="font-semibold flex items-center space-x-2">
                        <History className="w-5 h-5 text-primary" />
                        <span>Histórico de Ações</span>
                      </h3>
                      <button
                        onClick={() => void loadExecutorActions(selectedExecutor.id)}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        title="Atualizar"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="divide-y divide-white/10">
                      {executorActions.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Nenhuma ação registrada</p>
                        </div>
                      ) : (
                        executorActions.map(action => (
                          <div key={action.id} className="p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-start space-x-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                action.type === 'login' ? "bg-blue-500/20" :
                                action.type === 'project_created' ? "bg-green-500/20" :
                                action.type === 'photo_uploaded' ? "bg-purple-500/20" :
                                action.type === 'timeline_updated' ? "bg-yellow-500/20" :
                                "bg-primary/20"
                              )}>
                                {action.type === 'login' && <Users className="w-5 h-5 text-blue-400" />}
                                {action.type === 'project_created' && <Car className="w-5 h-5 text-green-400" />}
                                {action.type === 'photo_uploaded' && <FileText className="w-5 h-5 text-purple-400" />}
                                {action.type === 'timeline_updated' && <Clock className="w-5 h-5 text-yellow-400" />}
                                {action.type === 'client_created' && <UserPlus className="w-5 h-5 text-primary" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{action.description}</p>
                                {action.projectName && (
                                  <p className="text-sm text-gray-400">{action.projectName}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(action.timestamp).toLocaleDateString('pt-BR')} às {new Date(action.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Lista de Executores */
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar executores..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500"
                        title="Buscar executores"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => void loadExecutors()}
                        className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                        title="Atualizar lista"
                      >
                        <RefreshCw className={cn("w-5 h-5", loadingExecutors && "animate-spin")} />
                      </button>
                      <button
                        onClick={() => setShowNewExecutorModal(true)}
                        className="flex items-center space-x-2 bg-primary text-black px-4 py-3 rounded-xl font-semibold"
                      >
                        <UserPlus className="w-5 h-5" />
                        <span>Novo Executor</span>
                      </button>
                    </div>
                  </div>

                  {loadingExecutors ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
                      <p className="text-gray-400">Carregando executores...</p>
                    </div>
                  ) : filteredExecutors.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                      <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">Nenhum executor cadastrado</p>
                      <p className="text-sm text-gray-500">Clique em "Novo Executor" para adicionar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredExecutors.map((executor) => (
                        <div 
                          key={executor.id} 
                          className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => handleViewExecutorDetail(executor)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                                <span className="text-black font-bold text-lg">{executor.name.charAt(0)}</span>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold">{executor.name}</h4>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    executor.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                                  )}>
                                    {executor.status === 'active' ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400">{executor.email}</p>
                                <p className="text-xs text-gray-500">{executor.phone || 'Sem telefone'} • {executor.projectsCount} projetos</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => { setSelectedExecutor(executor); setShowResetPasswordModal(true); }}
                                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                title="Alterar senha"
                              >
                                <Key className="w-4 h-4 text-yellow-500" />
                              </button>
                              <button
                                onClick={() => void handleToggleExecutorStatus(executor)}
                                className={cn(
                                  "px-3 py-2 rounded-lg font-medium text-xs transition-colors flex items-center space-x-1",
                                  executor.status === 'active' 
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                                    : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                )}
                              >
                                {executor.status === 'active' ? (
                                  <>
                                    <EyeOff className="w-4 h-4" />
                                    <span>Inativar</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    <span>Ativar</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => void handleDeleteExecutor(executor)}
                                className="p-2 bg-white/10 rounded-lg hover:bg-red-500/20 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              {!selectedClient ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar clientes..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500"
                        title="Buscar clientes"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleExportClients}
                        disabled={filteredClientsList.length === 0}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Exportar Excel</span>
                      </button>
                    </div>
                  </div>

                  {/* Filtros de Clientes */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Filtrar:</span>
                    {(['all', 'accessed', 'pending'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setClientFilter(f)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          clientFilter === f ? "bg-primary text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"
                        )}
                      >
                        {f === 'all' ? `Todos (${clients.length})` : 
                         f === 'accessed' ? `Acessaram (${stats.clientsWithAccess})` : 
                         `Pendentes (${stats.totalClients - stats.clientsWithAccess})`}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {filteredClientsList.map((client) => (
                      <div 
                        key={client.id} 
                        className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{client.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold">{client.name}</h4>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  client.hasAccessed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                                )}>
                                  {client.hasAccessed ? 'Acessou' : 'Não acessou'}
                                </span>
                                {client.vehiclesCount > 1 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                                    {client.vehiclesCount} veículos
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">{client.email}</p>
                              <p className="text-xs text-gray-500">{client.phone || 'Sem telefone'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">Ver documentos</span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Detalhes do Cliente com Documentação */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                      <span>Voltar para lista</span>
                    </button>
                  </div>

                  {/* Cabeçalho do Cliente */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">{selectedClient.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                        <p className="text-gray-400">{selectedClient.email}</p>
                        <p className="text-sm text-gray-500">{selectedClient.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documentação do Cliente */}
                  <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="font-semibold flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span>Documentação do Cliente</span>
                      </h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* CNH */}
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">CNH - Carteira de Habilitação</p>
                            <p className="text-xs text-gray-500">Documento pessoal do proprietário</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = '/documents/cnh-exemplo.pdf'
                            link.download = `CNH_${selectedClient.name.replace(/\s/g, '_')}.pdf`
                            link.click()
                            addNotification({ type: 'success', title: 'Download', message: 'CNH baixado com sucesso!' })
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-primary text-black rounded-lg font-medium text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Baixar</span>
                        </button>
                      </div>

                      {/* CRLV */}
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">CRLV - Documento do Veículo</p>
                            <p className="text-xs text-gray-500">Certificado de registro e licenciamento</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = '/documents/crlv-exemplo.pdf'
                            link.download = `CRLV_${selectedClient.name.replace(/\s/g, '_')}.pdf`
                            link.click()
                            addNotification({ type: 'success', title: 'Download', message: 'CRLV baixado com sucesso!' })
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-primary text-black rounded-lg font-medium text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Baixar</span>
                        </button>
                      </div>

                      {/* Contrato */}
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-medium">Contrato de Serviço</p>
                            <p className="text-xs text-gray-500">Contrato de blindagem assinado</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = '/documents/contrato-exemplo.pdf'
                            link.download = `Contrato_${selectedClient.name.replace(/\s/g, '_')}.pdf`
                            link.click()
                            addNotification({ type: 'success', title: 'Download', message: 'Contrato baixado com sucesso!' })
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-primary text-black rounded-lg font-medium text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Baixar</span>
                        </button>
                      </div>

                      {/* Laudo EliteShield */}
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Laudo EliteShield™</p>
                            <p className="text-xs text-gray-500">Laudo técnico da blindagem</p>
                          </div>
                        </div>
                        <button
                          onClick={() => void (async () => {
                            // Buscar projeto real do cliente para gerar PDF dinâmico
                            const clientProject = selectedClient.projects[0]
                            if (!clientProject) {
                              addNotification({ type: 'error', title: 'Erro', message: 'Nenhum projeto encontrado para este cliente.' })
                              return
                            }
                            
                            // Buscar projeto completo do contexto
                            const fullProject = projects.find(p => p.id === clientProject.id)
                            if (!fullProject) {
                              addNotification({ type: 'error', title: 'Erro', message: 'Projeto não encontrado no sistema.' })
                              return
                            }
                            
                            addNotification({ type: 'info', title: 'Gerando PDF', message: 'Aguarde enquanto o laudo é gerado...' })
                            
                            try {
                              const pdfBlob = await generateEliteShieldPDF(fullProject)
                              const url = URL.createObjectURL(pdfBlob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `Laudo_EliteShield_${fullProject.vehicle.plate}_${new Date().getTime()}.pdf`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              URL.revokeObjectURL(url)
                              addNotification({ type: 'success', title: 'Download', message: 'Laudo baixado com sucesso!' })
                            } catch (error) {
                              console.error('Erro ao gerar PDF:', error)
                              addNotification({ type: 'error', title: 'Erro', message: 'Erro ao gerar o PDF do laudo.' })
                            }
                          })()}
                          className="flex items-center space-x-2 px-4 py-2 bg-primary text-black rounded-lg font-medium text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Baixar</span>
                        </button>
                      </div>

                      {/* Baixar Todos */}
                      <div className="pt-4 border-t border-white/10">
                        <button
                          onClick={() => {
                            addNotification({ type: 'info', title: 'Download', message: 'Preparando pacote de documentos...' })
                            setTimeout(() => {
                              addNotification({ type: 'success', title: 'Download', message: 'Todos os documentos foram baixados!' })
                            }, 1500)
                          }}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary to-yellow-500 text-black rounded-xl font-semibold"
                        >
                          <Download className="w-5 h-5" />
                          <span>Baixar Todos os Documentos</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Veículos do Cliente */}
                  <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="font-semibold flex items-center space-x-2">
                        <Car className="w-5 h-5 text-primary" />
                        <span>Veículos ({selectedClient.vehiclesCount})</span>
                      </h3>
                    </div>
                    <div className="divide-y divide-white/10">
                      {selectedClient.projects.map((project) => (
                        <div key={project.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{project.vehicle}</p>
                            <p className="text-xs text-gray-500">{project.id}</p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            project.status === 'Concluído' ? "bg-green-500/20 text-green-400" :
                            project.status === 'Em Andamento' ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-gray-500/20 text-gray-400"
                          )}>
                            {project.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar projetos..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500"
                  title="Buscar projetos"
                />
              </div>

              <div className="grid gap-4">
                {projects.filter(p => 
                  p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((project) => (
                  <div key={project.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-12 rounded-xl overflow-hidden bg-carbon-700">
                          <img src={project.vehicle.images[0]} alt={project.vehicle.model} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{project.vehicle.brand} {project.vehicle.model}</h4>
                          <p className="text-sm text-gray-400">{project.user.name} • {project.vehicle.plate}</p>
                          <p className="text-xs text-gray-500">{project.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{project.progress}%</div>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          project.status === 'completed' ? "bg-green-500/20 text-green-400" :
                          project.status === 'in_progress' ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-gray-500/20 text-gray-400"
                        )}>
                          {project.status === 'completed' ? 'Concluído' : project.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotes Tab - Orçamentos (Visão Gerencial) */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Painel de Orçamentos</h2>
                  <p className="text-gray-400">Acompanhe todos os orçamentos enviados aos clientes</p>
                </div>
                <button
                  onClick={handleExportQuotes}
                  disabled={filteredQuotes.length === 0}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </button>
              </div>

              {/* Filtros de Orçamentos */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Filtrar:</span>
                {(['all', 'pending', 'sent', 'approved', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setQuoteFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      quoteFilter === f ? "bg-primary text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"
                    )}
                  >
                    {f === 'all' ? `Todos (${quotes.length})` : 
                     f === 'pending' ? `Aguardando (${quotes.filter(q => q.status === 'pending').length})` : 
                     f === 'sent' ? `Enviados (${quotes.filter(q => q.status === 'sent').length})` :
                     f === 'approved' ? `Aprovados (${quotes.filter(q => q.status === 'approved').length})` :
                     `Rejeitados (${quotes.filter(q => q.status === 'rejected').length})`}
                  </button>
                ))}
              </div>

              {/* Resumo Gerencial */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                  <div className="text-3xl font-bold text-yellow-400">{quotes.filter(q => q.status === 'pending').length}</div>
                  <div className="text-sm text-gray-400">Aguardando Análise</div>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="text-3xl font-bold text-blue-400">{quotes.filter(q => q.status === 'sent').length}</div>
                  <div className="text-sm text-gray-400">Enviados ao Cliente</div>
                </div>
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <div className="text-3xl font-bold text-green-400">{quotes.filter(q => q.status === 'approved').length}</div>
                  <div className="text-sm text-gray-400">Aprovados</div>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <div className="text-3xl font-bold text-red-400">{quotes.filter(q => q.status === 'rejected').length}</div>
                  <div className="text-sm text-gray-400">Rejeitados</div>
                </div>
              </div>

              {/* Lista de Orçamentos */}
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="font-semibold">Lista de Orçamentos ({filteredQuotes.length})</h3>
                  <span className="text-sm text-gray-400">* Aprovação é feita pelo cliente</span>
                </div>
                <div className="divide-y divide-white/10">
                  {filteredQuotes.map((quote) => (
                    <div key={quote.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            quote.status === 'pending' ? "bg-yellow-500/20" :
                            quote.status === 'sent' ? "bg-blue-500/20" :
                            quote.status === 'approved' ? "bg-green-500/20" : "bg-red-500/20"
                          )}>
                            <DollarSign className={cn(
                              "w-6 h-6",
                              quote.status === 'pending' ? "text-yellow-400" :
                              quote.status === 'sent' ? "text-blue-400" :
                              quote.status === 'approved' ? "text-green-400" : "text-red-400"
                            )} />
                          </div>
                          <div>
                            <h4 className="font-semibold">{quote.clientName}</h4>
                            <p className="text-sm text-gray-400">{quote.clientEmail}</p>
                            <p className="text-xs text-gray-500">{quote.vehicleBrand} {quote.vehicleModel} • Nível {quote.blindingLevel}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium inline-block mb-2",
                            quote.status === 'pending' ? "bg-yellow-500/20 text-yellow-400" :
                            quote.status === 'sent' ? "bg-blue-500/20 text-blue-400" :
                            quote.status === 'approved' ? "bg-green-500/20 text-green-400" :
                            "bg-red-500/20 text-red-400"
                          )}>
                            {quote.status === 'pending' ? 'Aguardando Análise' :
                             quote.status === 'sent' ? 'Aguardando Cliente' :
                             quote.status === 'approved' ? 'Aprovado pelo Cliente' : 'Rejeitado'}
                          </span>
                          {quote.estimatedPrice && (
                            <div className="text-xl font-bold text-primary">{quote.estimatedPrice}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            Solicitado em {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      {quote.status === 'sent' && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-sm text-yellow-400">⏳ Aguardando aprovação do cliente</span>
                          <button
                            onClick={() => {
                              const phone = '11913123071'
                              const msg = `Olá ${quote.clientName}! Verificamos que seu orçamento de blindagem ainda está pendente. Valor: ${quote.estimatedPrice}. Posso ajudar com alguma dúvida?`
                              window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank')
                            }}
                            className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30 transition-colors"
                          >
                            Cobrar via WhatsApp
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Tab - Agenda */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Agenda de Revisões</h2>
                  <p className="text-gray-400">Visualize todos os agendamentos</p>
                </div>
                <button
                  onClick={handleExportSchedule}
                  disabled={filteredSchedule.length === 0}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </button>
              </div>

              {/* Filtros de Agenda */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Filtrar:</span>
                {(['all', 'revisao', 'entrega', 'confirmed', 'pending'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setScheduleFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      scheduleFilter === f ? "bg-primary text-black" : "bg-white/10 text-gray-400 hover:bg-white/20"
                    )}
                  >
                    {f === 'all' ? `Todos (${schedules.length})` : 
                     f === 'revisao' ? `Revisões (${schedules.filter(s => s.type === 'revisao').length})` : 
                     f === 'entrega' ? `Entregas (${schedules.filter(s => s.type === 'entrega').length})` :
                     f === 'confirmed' ? `Confirmados (${schedules.filter(s => s.status === 'confirmed').length})` :
                     `Pendentes (${schedules.filter(s => s.status === 'pending').length})`}
                  </button>
                ))}
              </div>

              <div className="grid gap-4">
                {filteredSchedule.map((item) => (
                  <div key={item.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          item.type === 'revisao' ? "bg-blue-500/20" : "bg-green-500/20"
                        )}>
                          <Calendar className={cn(
                            "w-6 h-6",
                            item.type === 'revisao' ? "text-blue-400" : "text-green-400"
                          )} />
                        </div>
                        <div>
                          <h4 className="font-semibold">{item.client_name}</h4>
                          <p className="text-sm text-gray-400">{item.vehicle}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.scheduled_date).toLocaleDateString('pt-BR')} às {item.scheduled_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium",
                          item.type === 'revisao' ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                        )}>
                          {item.type === 'revisao' ? 'Revisão' : 'Entrega'}
                        </span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium",
                          item.status === 'confirmed' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {item.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Leads Capturados</h3>
                  <p className="text-sm text-gray-400">Contatos interessados cadastrados na landing page</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={exportToExcel}
                    disabled={leads.length === 0}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Excel</span>
                  </button>
                  {leads.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja limpar todos os leads?')) {
                          clearAllLeads()
                          addNotification({ type: 'success', title: 'Leads limpos', message: 'Todos os leads foram removidos.' })
                        }
                      }}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Limpar Todos</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <Mail className="w-6 h-6 text-primary" />
                    <span className="text-2xl font-bold">{leads.length}</span>
                  </div>
                  <p className="text-sm text-gray-400">Total de Leads</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <UserCheck className="w-6 h-6 text-green-500" />
                    <span className="text-2xl font-bold">{leads.filter(l => l.wantsSpecialist).length}</span>
                  </div>
                  <p className="text-sm text-gray-400">Querem Especialista</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-6 h-6 text-blue-500" />
                    <span className="text-2xl font-bold">
                      {leads.filter(l => {
                        const date = new Date(l.createdAt)
                        const today = new Date()
                        return date.toDateString() === today.toDateString()
                      }).length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Hoje</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-6 h-6 text-yellow-500" />
                    <span className="text-2xl font-bold">
                      {leads.filter(l => {
                        const date = new Date(l.createdAt)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return date >= weekAgo
                      }).length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">Última Semana</p>
                </div>
              </div>

              {/* Leads List */}
              {leads.length === 0 ? (
                <div className="bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
                  <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum lead cadastrado</h3>
                  <p className="text-gray-400">Os leads capturados na landing page aparecerão aqui.</p>
                </div>
              ) : (
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-400">Nome</th>
                          <th className="text-left p-4 font-medium text-gray-400">Email</th>
                          <th className="text-left p-4 font-medium text-gray-400">Telefone</th>
                          <th className="text-left p-4 font-medium text-gray-400">Especialista</th>
                          <th className="text-left p-4 font-medium text-gray-400">Data</th>
                          <th className="text-right p-4 font-medium text-gray-400">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {leads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium">{lead.name}</td>
                            <td className="p-4 text-gray-300">{lead.email}</td>
                            <td className="p-4 text-gray-300">{lead.phone}</td>
                            <td className="p-4">
                              {lead.wantsSpecialist ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Sim</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">Não</span>
                              )}
                            </td>
                            <td className="p-4 text-gray-400 text-sm">
                              {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => {
                                  removeLead(lead.id)
                                  addNotification({ type: 'success', title: 'Lead removido', message: `${lead.name} foi removido.` })
                                }}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Remover lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invites Tab */}
          {activeTab === 'invites' && (
            <div className="space-y-6">
              <InviteManager />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Configurações do Sistema</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="font-medium">Notificações por E-mail</p>
                      <p className="text-sm text-gray-400">Receber alertas de novos projetos</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" title="Notificações por e-mail" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="font-medium">Backup Automático</p>
                      <p className="text-sm text-gray-400">Backup diário dos dados</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" title="Backup automático" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Documentação Técnica</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Baixe o manual completo explicando a arquitetura, custos e infraestrutura do Elite Track.
                </p>
                <button
                  onClick={() => {
                    void generateArchitectureDoc()
                    addNotification({ type: 'success', title: 'Documento gerado', message: 'Manual de arquitetura baixado com sucesso!' })
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-black rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Baixar Manual de Arquitetura (.docx)</span>
                </button>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Informações do Sistema</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-gray-400">Versão</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-gray-400">Última atualização</span>
                    <span>14/12/2025</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Ambiente</span>
                    <span className="text-green-400">Produção</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Novo Executor */}
      <Modal isOpen={showNewExecutorModal} onClose={() => setShowNewExecutorModal(false)} size="md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Criar Novo Executor</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nome Completo *</label>
              <input
                type="text"
                value={newExecutorData.name}
                onChange={(e) => setNewExecutorData({ ...newExecutorData, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                placeholder="Nome do executor"
                title="Nome do executor"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">E-mail *</label>
              <input
                type="email"
                value={newExecutorData.email}
                onChange={(e) => setNewExecutorData({ ...newExecutorData, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                placeholder="email@exemplo.com"
                title="E-mail do executor"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Telefone</label>
              <input
                type="tel"
                value={newExecutorData.phone}
                onChange={(e) => setNewExecutorData({ ...newExecutorData, phone: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                placeholder="(11) 99999-9999"
                title="Telefone do executor"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Senha Inicial *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newExecutorData.password}
                  onChange={(e) => setNewExecutorData({ ...newExecutorData, password: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-12"
                  placeholder="Mínimo 6 caracteres"
                  title="Senha inicial"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  title="Mostrar/ocultar senha"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={() => setShowNewExecutorModal(false)} className="px-6 py-3 bg-white/10 rounded-xl">Cancelar</button>
            <button onClick={() => void handleCreateExecutor()} className="px-6 py-3 bg-primary text-black rounded-xl font-semibold">Criar Executor</button>
          </div>
        </div>
      </Modal>

      {/* Modal Reset Password */}
      <Modal isOpen={showResetPasswordModal} onClose={() => { setShowResetPasswordModal(false); setSelectedExecutor(null); }} size="sm">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-2">Alterar Senha</h2>
          <p className="text-gray-400 mb-6">{selectedExecutor?.name}</p>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nova Senha *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-12"
                placeholder="Mínimo 6 caracteres"
                title="Nova senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                title="Mostrar/ocultar senha"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={() => { setShowResetPasswordModal(false); setSelectedExecutor(null); }} className="px-6 py-3 bg-white/10 rounded-xl">Cancelar</button>
            <button onClick={() => void handleResetPassword()} className="px-6 py-3 bg-primary text-black rounded-xl font-semibold">Salvar Senha</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
export default AdminDashboard
