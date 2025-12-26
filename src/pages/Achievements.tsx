import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Trophy, Star, Shield, Crown, Zap, Target,
  CheckCircle, Lock, Share2, UserPlus, Copy, Gift
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useProjects } from '../contexts/ProjectContext'
import { cn } from '../lib/utils'
import { COMPANY_INFO, getWhatsAppLink } from '../constants/companyInfo'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'progress' | 'engagement' | 'loyalty' | 'special'
  points: number
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  maxProgress?: number
}

const achievementCategories = [
  { id: 'all', label: 'Todas', icon: Trophy },
  { id: 'progress', label: 'Progresso', icon: Target },
  { id: 'engagement', label: 'Engajamento', icon: Zap },
  { id: 'loyalty', label: 'Fidelidade', icon: Crown },
  { id: 'special', label: 'Especiais', icon: Star },
]

export function Achievements() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const { projects } = useProjects()

  const userProjects = projects.filter(p => p.user.email === user?.email)
  const completedProjects = userProjects.filter(p => p.status === 'completed').length

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [referralName, setReferralName] = useState('')
  const [referralPhone, setReferralPhone] = useState('')
  const [referralEmail, setReferralEmail] = useState('')
  const [referrals, setReferrals] = useState<Array<{name: string, phone: string, email: string, status: string, date: string}>>([
    { name: 'Carlos Alberto', phone: '11999998888', email: 'carlos@email.com', status: 'pending', date: '2025-12-10' },
  ])

  // Código de indicação único do usuário
  const referralCode = user ? `ELITE${user.name?.substring(0, 3).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}` : 'ELITE0000'

  const achievements: Achievement[] = [
    // Progress
    { id: 'first-step', name: 'Primeiro Passo', description: 'Seu veículo iniciou o processo de blindagem', icon: '🚗', category: 'progress', points: 50, unlocked: true, unlockedAt: '2025-12-01' },
    { id: 'halfway', name: 'Meio Caminho', description: 'Processo de blindagem 50% concluído', icon: '⚡', category: 'progress', points: 100, unlocked: true, unlockedAt: '2025-12-07' },
    { id: 'glass-done', name: 'Vidros Instalados', description: 'Etapa de vidros blindados concluída', icon: '🪟', category: 'progress', points: 75, unlocked: true, unlockedAt: '2025-12-05' },
    { id: 'armor-done', name: 'Blindagem Completa', description: 'Manta balística instalada com sucesso', icon: '🛡️', category: 'progress', points: 100, unlocked: true, unlockedAt: '2025-12-08' },
    { id: 'finished', name: 'Missão Cumprida', description: 'Blindagem 100% concluída', icon: '🏆', category: 'progress', points: 200, unlocked: completedProjects > 0, unlockedAt: completedProjects > 0 ? '2025-12-12' : undefined },
    
    // Engagement
    { id: 'explorer', name: 'Explorador', description: 'Visitou todas as seções do app', icon: '🔍', category: 'engagement', points: 30, unlocked: true, unlockedAt: '2025-12-02' },
    { id: 'photo-viewer', name: 'Olhos Atentos', description: 'Visualizou 10 fotos do processo', icon: '📸', category: 'engagement', points: 25, unlocked: true, unlockedAt: '2025-12-04' },
    { id: 'chatter', name: 'Comunicador', description: 'Enviou sua primeira mensagem no chat', icon: '💬', category: 'engagement', points: 20, unlocked: true, unlockedAt: '2025-12-03' },
    { id: 'notifier', name: 'Sempre Atualizado', description: 'Ativou notificações push', icon: '🔔', category: 'engagement', points: 15, unlocked: true, unlockedAt: '2025-12-01' },
    { id: 'sharer', name: 'Influenciador', description: 'Compartilhou o status da blindagem', icon: '📤', category: 'engagement', points: 40, unlocked: false, progress: 0, maxProgress: 1 },
    
    // Loyalty
    { id: 'member', name: 'Membro Elite', description: 'Tornou-se cliente Elite Blindagens', icon: '⭐', category: 'loyalty', points: 100, unlocked: true, unlockedAt: '2025-12-01' },
    { id: 'prime', name: 'Elite Prime', description: 'Assinou o programa Elite Prime', icon: '👑', category: 'loyalty', points: 200, unlocked: false },
    { id: 'veteran', name: 'Veterano', description: 'Cliente há mais de 1 ano', icon: '🎖️', category: 'loyalty', points: 150, unlocked: false, progress: 30, maxProgress: 365 },
    { id: 'multi-car', name: 'Frota Protegida', description: 'Blindou mais de um veículo', icon: '🚘', category: 'loyalty', points: 300, unlocked: userProjects.length > 1, unlockedAt: userProjects.length > 1 ? '2025-12-10' : undefined },
    { id: 'referral', name: 'Embaixador', description: 'Indicou um amigo que fechou blindagem', icon: '🤝', category: 'loyalty', points: 500, unlocked: referrals.some(r => r.status === 'converted'), progress: referrals.filter(r => r.status === 'converted').length, maxProgress: 1 },
    
    // Special
    { id: 'early-adopter', name: 'Pioneiro', description: 'Um dos primeiros a usar o EliteTrack', icon: '🚀', category: 'special', points: 100, unlocked: true, unlockedAt: '2025-12-01' },
    { id: 'perfect-rating', name: 'Satisfação Total', description: 'Avaliou o serviço com 5 estrelas', icon: '⭐', category: 'special', points: 50, unlocked: false },
    { id: 'vip', name: 'Cliente VIP', description: 'Recebeu atendimento VIP exclusivo', icon: '💎', category: 'special', points: 250, unlocked: false },
    { id: 'collector', name: 'Colecionador', description: 'Desbloqueou 15 conquistas', icon: '🏅', category: 'special', points: 300, unlocked: false, progress: 10, maxProgress: 15 },
  ]

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory)

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)

  const handleShare = (achievement: Achievement) => {
    const text = `🏆 Conquista desbloqueada no EliteTrack!\n\n${achievement.icon} ${achievement.name}\n${achievement.description}\n\n#EliteBlindagens #EliteTrack`
    if (navigator.share) {
      navigator.share({ title: 'Conquista EliteTrack', text })
    } else {
      navigator.clipboard.writeText(text)
      addNotification({ type: 'success', title: 'Copiado!', message: 'Texto copiado para compartilhar.' })
    }
  }

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    addNotification({ type: 'success', title: 'Código copiado!', message: 'Compartilhe com seus amigos.' })
  }

  const handleShareReferral = () => {
    const text = `🛡️ Indique a Elite Blindagens!\n\nUse meu código: ${referralCode}\n\nBlindagem de qualidade com garantia.\n\n📞 ${COMPANY_INFO.phoneFormatted}\n🌐 ${COMPANY_INFO.websiteDisplay}`
    if (navigator.share) {
      navigator.share({ title: 'Indicação Elite Blindagens', text })
    } else {
      window.open(getWhatsAppLink(text), '_blank')
    }
  }

  const handleSubmitReferral = () => {
    if (!referralName || !referralPhone) {
      addNotification({ type: 'warning', title: 'Campos obrigatórios', message: 'Preencha nome e telefone do indicado.' })
      return
    }
    setReferrals([...referrals, { 
      name: referralName, 
      phone: referralPhone, 
      email: referralEmail, 
      status: 'pending', 
      date: new Date().toISOString().split('T')[0] 
    }])
    addNotification({ type: 'success', title: 'Indicação enviada!', message: `${referralName} foi indicado com sucesso. Você ganhará 500 pontos quando ele fechar!` })
    setReferralName('')
    setReferralPhone('')
    setReferralEmail('')
    setShowReferralModal(false)
  }

  return (
    <div className="min-h-screen bg-black text-white font-['Inter']">
      {/* Header */}
      <header className="bg-carbon-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                title="Voltar"
              >
                <i className="ri-arrow-left-line text-white"></i>
              </button>
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-['Pacifico'] text-xl text-primary">EliteTrack™</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-semibold">Conquistas</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Banner */}
      <section className="bg-gradient-to-r from-primary/20 to-transparent py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Suas Conquistas</h1>
              <p className="text-gray-400">Continue acompanhando para desbloquear mais!</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{totalPoints}</div>
              <div className="text-sm text-gray-400">pontos</div>
            </div>
          </div>
          <div className="mt-6 flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>{unlockedCount} desbloqueadas</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-gray-500" />
              <span>{achievements.length - unlockedCount} bloqueadas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Indique e Ganhe!</h3>
                <p className="text-sm text-gray-400">Ganhe 500 pontos por cada amigo que fechar blindagem</p>
              </div>
            </div>
            <button
              onClick={() => setShowReferralModal(true)}
              className="px-4 py-2 bg-primary text-black rounded-xl font-semibold flex items-center space-x-2 hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Indicar Amigo</span>
            </button>
          </div>
          
          {/* Código de indicação */}
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-400 mb-2">Seu código de indicação:</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold text-primary">{referralCode}</span>
              <div className="flex space-x-2">
                <button 
                  onClick={handleCopyReferralCode}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copiar código"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleShareReferral}
                  className="p-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors text-primary"
                  title="Compartilhar"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Indicações do usuário */}
          {referrals.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Suas indicações ({referrals.length})</p>
              <div className="space-y-2">
                {referrals.map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                    <div>
                      <span className="font-medium">{ref.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{new Date(ref.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      ref.status === 'pending' ? "bg-yellow-500/20 text-yellow-400" :
                      ref.status === 'contacted' ? "bg-blue-500/20 text-blue-400" :
                      ref.status === 'converted' ? "bg-green-500/20 text-green-400" :
                      "bg-gray-500/20 text-gray-400"
                    )}>
                      {ref.status === 'pending' ? 'Aguardando' :
                       ref.status === 'contacted' ? 'Em contato' :
                       ref.status === 'converted' ? 'Fechou! +500pts' : 'Não interessado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-2">
          {achievementCategories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  selectedCategory === cat.id ? "bg-primary text-black" : "bg-white/10 hover:bg-white/20"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Achievements Grid */}
      <main className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={cn(
                "relative p-4 rounded-2xl border cursor-pointer transition-all",
                achievement.unlocked 
                  ? "bg-white/5 border-white/10 hover:bg-white/10" 
                  : "bg-white/[0.02] border-white/5 opacity-60"
              )}
            >
              {achievement.unlocked && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
                  achievement.unlocked ? "bg-primary/20" : "bg-white/5"
                )}>
                  {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{achievement.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                  {achievement.progress !== undefined && !achievement.unlocked && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progresso</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden" title={`Progresso: ${achievement.progress} de ${achievement.maxProgress}`}>
                        <div className={`h-full bg-primary rounded-full transition-all ${
                          achievement.progress === 0 ? 'w-0' :
                          (achievement.progress / (achievement.maxProgress || 1)) <= 0.1 ? 'w-[10%]' :
                          (achievement.progress / (achievement.maxProgress || 1)) <= 0.2 ? 'w-[20%]' :
                          (achievement.progress / (achievement.maxProgress || 1)) <= 0.3 ? 'w-[30%]' :
                          (achievement.progress / (achievement.maxProgress || 1)) <= 0.4 ? 'w-[40%]' :
                          (achievement.progress / (achievement.maxProgress || 1)) <= 0.5 ? 'w-[50%]' :
                          (achievement.progress / (achievement.maxProgress || 1)) <= 0.6 ? 'w-[60%]' :
                          (achievement.progress / (achievement.maxProgress || 1)) <= 0.7 ? 'w-[70%]' :
                          (achievement.progress / (achievement.maxProgress || 1)) <= 0.8 ? 'w-[80%]' :
                          (achievement.progress / (achievement.maxProgress || 1)) <= 0.9 ? 'w-[90%]' : 'w-full'
                        }`} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-primary font-medium">+{achievement.points} pts</span>
                    {achievement.unlockedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Achievement Detail Modal */}
      <Modal isOpen={!!selectedAchievement} onClose={() => setSelectedAchievement(null)} size="sm">
        {selectedAchievement && (
          <div className="p-6 text-center">
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4",
              selectedAchievement.unlocked ? "bg-primary/20" : "bg-white/5"
            )}>
              {selectedAchievement.unlocked ? selectedAchievement.icon : <Lock className="w-10 h-10 text-gray-600" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">{selectedAchievement.name}</h2>
            <p className="text-gray-400 mb-4">{selectedAchievement.description}</p>
            
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Pontos</span>
                <span className="text-primary font-bold">+{selectedAchievement.points}</span>
              </div>
              {selectedAchievement.unlockedAt && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">Desbloqueado em</span>
                  <span>{new Date(selectedAchievement.unlockedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>

            {selectedAchievement.unlocked ? (
              <button
                onClick={() => handleShare(selectedAchievement)}
                className="w-full flex items-center justify-center space-x-2 bg-primary text-black py-3 rounded-xl font-semibold"
              >
                <Share2 className="w-5 h-5" />
                <span>Compartilhar</span>
              </button>
            ) : (
              <div className="text-gray-500 text-sm">
                Complete os requisitos para desbloquear esta conquista
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Referral Modal */}
      <Modal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} size="md">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Indicar um Amigo</h2>
            <p className="text-gray-400">Preencha os dados do seu amigo e ganhe 500 pontos quando ele fechar!</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nome completo *</label>
              <input
                type="text"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                placeholder="Nome do seu amigo"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                title="Nome do indicado"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Telefone/WhatsApp *</label>
              <input
                type="tel"
                value={referralPhone}
                onChange={(e) => setReferralPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                title="Telefone do indicado"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">E-mail (opcional)</label>
              <input
                type="email"
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
                title="E-mail do indicado"
              />
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mt-6">
            <p className="text-sm text-gray-300">
              <strong className="text-primary">Como funciona:</strong> Após enviar a indicação, nossa equipe entrará em contato com seu amigo. 
              Quando ele fechar a blindagem, você receberá <strong className="text-primary">500 pontos</strong> automaticamente!
            </p>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowReferralModal(false)}
              className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitReferral}
              className="flex-1 bg-primary text-black py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Enviar Indicação</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
