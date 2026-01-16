import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { useLeads } from '../contexts/LeadsContext'
import { useNotifications } from '../contexts/NotificationContext'
import '../styles/LandingPage.css'

export function LandingPage() {
  const navigate = useNavigate()
  const headerRef = useRef<HTMLElement>(null)
  const { addLead } = useLeads()
  const { addNotification } = useNotifications()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    wantsSpecialist: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConsultaModal, setShowConsultaModal] = useState(false)
  const [consultaInput, setConsultaInput] = useState('')
  
  const handleConsulta = () => {
    if (consultaInput.trim()) {
      setShowConsultaModal(false)
      navigate(`/verify/${consultaInput.trim()}`)
      setConsultaInput('')
    }
  }

  
  const closeModal = () => {
    setShowConsultaModal(false)
    setConsultaInput('')
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.phone) {
      addNotification({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha todos os campos.'
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      addLead({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        wantsSpecialist: formData.wantsSpecialist,
        source: 'landing-page'
      })

      addNotification({
        type: 'success',
        title: 'Cadastro realizado!',
        message: 'Em breve entraremos em contato.'
      })

      setFormData({ name: '', email: '', phone: '', wantsSpecialist: false })
    } catch {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Ocorreu um erro. Tente novamente.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  useEffect(() => {
    // Scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el)
    })

    // Header scroll effect
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const header = headerRef.current
      if (!header) return

      const currentScrollY = window.scrollY
      if (currentScrollY > 100) {
        header.classList.add('backdrop-blur-xl', 'bg-black/80')
        header.classList.remove('bg-transparent')
      } else {
        header.classList.remove('backdrop-blur-xl', 'bg-black/80')
        header.classList.add('bg-transparent')
      }
      
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        header.style.transform = 'translateY(-100%)'
      } else {
        header.style.transform = 'translateY(0)'
      }
      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="bg-black text-white font-['Inter'] overflow-x-hidden">
      <style>{`
        :where([class^="ri-"])::before {
          content: "\\f3c2";
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .gradient-gold {
          background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
        }
        .hero-bg {
          background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.15) 0%, rgba(26, 26, 26, 0.95) 40%, #0A0A0A 100%);
          position: relative;
        }
        .hero-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, transparent 50%, rgba(212, 175, 55, 0.05) 100%);
        }
        .floating-animation {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .luxury-glow {
          box-shadow: 0 0 50px rgba(212, 175, 55, 0.15), 0 0 100px rgba(212, 175, 55, 0.1);
        }
        .cinematic-blur {
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
        }
        .premium-shadow {
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .hero-car-overlay {
          background: linear-gradient(90deg, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.8) 30%, rgba(10, 10, 10, 0.3) 60%, transparent 100%);
        }
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .progress-bar {
          background: linear-gradient(90deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%);
          height: 4px;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        .progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css');
      `}</style>

      {/* Hero Section */}
      <section id="inicio" className="min-h-screen hero-bg relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <div className="hero-bg-image" />
          <div className="hero-car-overlay absolute inset-0" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full floating-animation opacity-60 luxury-glow" />
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-primary rounded-full floating-animation opacity-40 luxury-glow delay-2s" />
          <div className="absolute top-1/2 left-3/4 w-2.5 h-2.5 bg-primary rounded-full floating-animation opacity-50 luxury-glow delay-4s" />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-primary rounded-full floating-animation opacity-30 luxury-glow delay-3s" />
          <div className="absolute bottom-1/3 left-1/6 w-2 h-2 bg-primary rounded-full floating-animation opacity-45 luxury-glow delay-5s" />
        </div>

        {/* Fixed Header */}
        <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" id="main-header">
          <div className="glass-effect cinematic-blur border-b border-white/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="/logo-elite.png" alt="Elite Blindagens" className="h-10 w-auto" />
                <div className="font-['Pacifico'] text-2xl text-primary luxury-glow">EliteTrack™</div>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a href="#inicio" className="text-gray-200 hover:text-primary transition-all duration-300 font-medium text-sm uppercase tracking-wider">Início</a>
                <a href="#como-funciona" className="text-gray-200 hover:text-primary transition-all duration-300 font-medium text-sm uppercase tracking-wider">Como Funciona</a>
                <a href="#beneficios" className="text-gray-200 hover:text-primary transition-all duration-300 font-medium text-sm uppercase tracking-wider">Benefícios</a>
                <a href="#preview" className="text-gray-200 hover:text-primary transition-all duration-300 font-medium text-sm uppercase tracking-wider">Preview</a>
                <a href="#confianca" className="text-gray-200 hover:text-primary transition-all duration-300 font-medium text-sm uppercase tracking-wider">Confiança</a>
                <a href="#contato" className="text-gray-200 hover:text-primary transition-all duration-300 font-medium text-sm uppercase tracking-wider">Contato</a>
              </nav>
              <button 
                onClick={() => navigate('/login')}
                className="md:hidden text-white"
                aria-label="Acessar login"
                title="Acessar login"
              >
                <i className="ri-login-box-line text-2xl"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-20 px-4 sm:px-6 flex items-center min-h-[90vh] pt-20 sm:pt-24">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-5xl">
              <div className="glass-effect cinematic-blur p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] premium-shadow mb-8 border border-white/10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary luxury-glow animate-pulse"></div>
                  <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-[0.2em]">Exclusividade Elite</span>
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
                  EliteTrack™<br />
                  <span className="text-primary luxury-glow font-light italic">Transparência Absoluta</span>
                </h1>
                <p className="text-base sm:text-lg md:text-2xl text-gray-400 mb-8 leading-relaxed max-w-2xl font-light">
                  Acompanhe cada detalhe da blindagem em tempo real. 
                  <span className="hidden sm:inline"> Tecnologia avançada para uma experiência premium incomparável.</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
                  <button 
                    onClick={() => navigate('/login')}
                    className="gradient-gold text-black font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all duration-500 whitespace-nowrap transform hover:scale-105 text-xs sm:text-sm uppercase tracking-[0.15em] w-full sm:w-auto shadow-lg"
                  >
                    Iniciar Experiência
                  </button>
                  <a 
                    href="https://wa.me/5511913123071?text=Olá!%20Gostaria%20de%20falar%20com%20um%20especialista%20sobre%20blindagem%20de%20veículos."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-effect cinematic-blur border border-white/10 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-500 whitespace-nowrap transform hover:scale-105 text-xs sm:text-sm uppercase tracking-[0.15em] w-full sm:w-auto text-center"
                  >
                    Consultar Especialista
                  </a>
                </div>
                
                {/* Consultar Histórico - Redesenhado para Mobile */}
                <button
                  onClick={() => setShowConsultaModal(true)}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-primary/40 transition-all duration-500 group flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <span className="font-bold text-sm sm:text-base block text-white tracking-tight">Consultar Histórico</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 truncate block mt-0.5">Acesse status e fotos via placa ou QR Code</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-all">
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-16 sm:py-24 px-4 sm:px-6 bg-black relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20 fade-in">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">O Processo <span className="text-primary font-light italic">Elite</span></h2>
            <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto font-medium">
              Simplicidade e transparência em cada detalhe da execução.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="glass-effect p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white/[0.03] rounded-2xl mb-8 group-hover:bg-primary/10 transition-all duration-500 border border-white/10 group-hover:border-primary/30">
                <i className="ri-calendar-check-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white tracking-tight">Agendamento</h3>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base font-medium">
                Todo o processo já nasce integrado ao EliteTrack™, garantindo rastreabilidade total desde o primeiro dia de blindagem.
              </p>
            </div>
            <div className="glass-effect p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white/[0.03] rounded-2xl mb-8 group-hover:bg-primary/10 transition-all duration-500 border border-white/10 group-hover:border-primary/30">
                <i className="ri-eye-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white tracking-tight">Monitoramento</h3>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base font-medium">
                Acompanhe cada etapa com fotos em tempo real e registros técnicos diretamente na palma da sua mão.
              </p>
            </div>
            <div className="glass-effect p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white/[0.03] rounded-2xl mb-8 group-hover:bg-primary/10 transition-all duration-500 border border-white/10 group-hover:border-primary/30">
                <i className="ri-shield-check-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white tracking-tight">Certificação</h3>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base font-medium">
                Receba seu veículo com documentação organizada e histórico permanente do processo com a qualidade Elite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios Principais */}
      <section id="beneficios" className="py-20 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-black via-carbon-900 to-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="benefits-bg" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 sm:mb-20 fade-in">
            <h2 className="text-3xl sm:text-6xl font-bold mb-6 tracking-tight">Experiência <span className="text-primary font-light italic">Superior</span></h2>
            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">Tecnologia automotiva de luxo aplicada à sua segurança.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="glass-effect p-8 rounded-[2rem] border border-white/5 hover:border-primary/30 transition-all duration-500 group">
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-2xl mb-6 group-hover:bg-primary/20 transition-all border border-primary/20">
                <i className="ri-search-eye-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Transparência Total</h3>
              <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">Visualize cada etapa da blindagem sem intermediários, direto do seu smartphone.</p>
            </div>
            <div className="glass-effect p-8 rounded-[2rem] border border-white/5 hover:border-primary/30 transition-all duration-500 group">
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-2xl mb-6 group-hover:bg-primary/20 transition-all border border-primary/20">
                <i className="ri-notification-3-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Push Real-time</h3>
              <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">Receba notificações instantâneas sobre o progresso e novas evidências registradas.</p>
            </div>
            <div className="glass-effect p-8 rounded-[2rem] border border-white/5 hover:border-primary/30 transition-all duration-500 group">
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-2xl mb-6 group-hover:bg-primary/20 transition-all border border-primary/20">
                <i className="ri-file-shield-2-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Cofre Digital</h3>
              <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">Documentação, certificados e laudos técnicos organizados e seguros em nuvem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Preview ao Vivo */}
      <section id="preview" className="py-20 sm:py-32 px-4 sm:px-6 bg-black overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 sm:mb-24 fade-in">
            <h2 className="text-3xl sm:text-6xl font-bold mb-6 tracking-tight">Monitoramento <span className="text-primary font-light italic">Ativo</span></h2>
            <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto font-medium">Visualize a interface que você terá em mãos.</p>
          </div>
          
          <div className="glass-effect p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] fade-in relative border border-white/10 shadow-2xl">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px]"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
              <div>
                <h3 className="text-2xl sm:text-4xl font-bold mb-2 tracking-tight text-white">Mercedes-Benz <span className="text-primary">S 500</span></h3>
                <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-widest">Nível NIJ III-A • Registro #2948</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary luxury-glow animate-pulse"></div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-none">Último Log</p>
                  <p className="text-xs text-white font-bold mt-1">Hoje, 14:32</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-5 relative">
                <div className="absolute top-10 bottom-0 left-5 w-px bg-white/10 hidden sm:block"></div>
                <div className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-full flex-shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  <i className="ri-check-line text-white text-lg"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 className="font-bold text-white text-lg tracking-tight">Check-in Concluído</h4>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded">10/12 09:00</span>
                  </div>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed">Vistoria cautelar e catalogação de componentes originais finalizada.</p>
                </div>
              </div>

              <div className="flex items-start gap-5 relative">
                <div className="absolute top-10 bottom-0 left-5 w-px bg-white/10 hidden sm:block"></div>
                <div className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-full flex-shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  <i className="ri-check-line text-white text-lg"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 className="font-bold text-white text-lg tracking-tight">Estrutural</h4>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded">11/12 14:20</span>
                  </div>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed">Desmontagem técnica e preparação da carroceria para aramida.</p>
                </div>
              </div>

              <div className="flex items-start gap-5 relative group">
                <div className="absolute top-10 bottom-0 left-5 w-px bg-white/10 hidden sm:block"></div>
                <div className="w-10 h-10 flex items-center justify-center bg-primary rounded-full flex-shrink-0 shadow-[0_0_25px_rgba(212,175,55,0.4)]">
                  <i className="ri-tools-line text-black text-lg"></i>
                </div>
                <div className="flex-1 min-w-0 bg-primary/5 p-4 rounded-2xl border border-primary/20 transform transition-all duration-500 group-hover:bg-primary/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <h4 className="font-bold text-primary text-lg tracking-tight">Instalação Balística</h4>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.1em]">Em Execução</span>
                  </div>
                  <p className="text-sm text-gray-300 font-medium leading-relaxed mb-4">Aplicação de UltraLite Armor™ e sobreposição de camadas.</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(212,175,55,0.5)] w-[65%]" />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-5 opacity-30 group">
                <div className="w-10 h-10 flex items-center justify-center border-2 border-white/20 rounded-full flex-shrink-0 transition-all group-hover:border-white/40">
                  <i className="ri-search-line text-white/40 text-lg"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white/40 text-lg tracking-tight mb-1">Qualidade Elite</h4>
                  <p className="text-sm text-white/30 font-medium">Testes de rodagem, infiltração e vedação acústica.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documentos e Rastreabilidade */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-carbon-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 sm:mb-24 fade-in">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-6xl font-bold mb-6 tracking-tight text-white">Patrimônio <span className="text-primary font-light italic">Documentado</span></h2>
              <p className="text-base sm:text-xl text-gray-400 font-medium leading-relaxed">Segurança não é apenas física, é informação organizada e acessível quando você precisar.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.03] px-6 py-4 rounded-3xl border border-white/5 backdrop-blur-md">
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Armazenamento Cloud</p>
                <p className="text-sm text-white font-bold">Criptografia Militar</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <i className="ri-cloud-line text-2xl text-primary"></i>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="glass-effect p-8 rounded-[2rem] fade-in hover:bg-white/[0.08] transition-all duration-500 group border border-white/5 hover:border-blue-400/30">
              <div className="w-14 h-14 flex items-center justify-center bg-blue-500/10 rounded-2xl mb-8 group-hover:bg-blue-500/20 transition-all border border-blue-500/20 shadow-lg shadow-blue-500/5">
                <i className="ri-file-text-line text-2xl text-blue-400"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Laudos Técnicos</h3>
              <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">Certificação detalhada de cada material e processo aplicado.</p>
            </div>
            <div className="glass-effect p-8 rounded-[2rem] fade-in hover:bg-white/[0.08] transition-all duration-500 group border border-white/5 hover:border-green-400/30 delay-0-1s">
              <div className="w-14 h-14 flex items-center justify-center bg-green-500/10 rounded-2xl mb-8 group-hover:bg-green-500/20 transition-all border border-green-500/20 shadow-lg shadow-green-500/5">
                <i className="ri-receipt-line text-2xl text-green-400"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Notas Fiscais</h3>
              <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">Repositório completo da sua documentação fiscal e garantias.</p>
            </div>
            <div className="glass-effect p-8 rounded-[2rem] fade-in hover:bg-white/[0.08] transition-all duration-500 group border border-white/5 hover:border-purple-400/30 delay-0-2s">
              <div className="w-14 h-14 flex items-center justify-center bg-purple-500/10 rounded-2xl mb-8 group-hover:bg-purple-500/20 transition-all border border-purple-500/20 shadow-lg shadow-purple-500/5">
                <i className="ri-camera-line text-2xl text-purple-400"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Galeria Técnica</h3>
              <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">Registro visual de alta definição de cada ponto de proteção.</p>
            </div>
            <div className="glass-effect p-8 rounded-[2rem] fade-in hover:bg-white/[0.08] transition-all duration-500 group border border-white/5 hover:border-primary/30 delay-0-3s">
              <div className="w-14 h-14 flex items-center justify-center bg-primary/10 rounded-2xl mb-8 group-hover:bg-primary/20 transition-all border border-primary/20 shadow-lg shadow-primary/5">
                <i className="ri-award-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Certificados</h3>
              <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">Autenticidade EliteShield™ validada via QR Code único.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sinais de Confiança */}
      <section id="confianca" className="py-20 sm:py-32 px-4 sm:px-6 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-24 fade-in">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight text-white">Excelência <span className="text-primary font-light italic">Certificada</span></h2>
            <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto font-medium">Compromisso inabalável com os mais altos padrões de segurança.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center fade-in group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white/[0.02] rounded-[2rem] mx-auto mb-6 border border-white/5 group-hover:border-primary/30 transition-all duration-500 shadow-xl group-hover:shadow-primary/5">
                <i className="ri-shield-check-line text-3xl text-primary/60 group-hover:text-primary transition-colors"></i>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mb-1">ISO 9001</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">Qualidade Premium</p>
            </div>
            <div className="text-center fade-in delay-0-1s group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white/[0.02] rounded-[2rem] mx-auto mb-6 border border-white/5 group-hover:border-primary/30 transition-all duration-500 shadow-xl group-hover:shadow-primary/5">
                <i className="ri-lock-line text-3xl text-primary/60 group-hover:text-primary transition-colors"></i>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mb-1">AES-256</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">Dados Blindados</p>
            </div>
            <div className="text-center fade-in delay-0-2s group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white/[0.02] rounded-[2rem] mx-auto mb-6 border border-white/5 group-hover:border-primary/30 transition-all duration-500 shadow-xl group-hover:shadow-primary/5">
                <i className="ri-eye-off-line text-3xl text-primary/60 group-hover:text-primary transition-colors"></i>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mb-1">LGPD</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">Privacidade Total</p>
            </div>
            <div className="text-center fade-in delay-0-3s group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white/[0.02] rounded-[2rem] mx-auto mb-6 border border-white/5 group-hover:border-primary/30 transition-all duration-500 shadow-xl group-hover:shadow-primary/5">
                <i className="ri-medal-line text-3xl text-primary/60 group-hover:text-primary transition-colors"></i>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mb-1">25+ Anos</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">Liderança de Mercado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 sm:mb-24 fade-in">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-6xl font-bold mb-6 tracking-tight text-white">Voz da <span className="text-primary font-light italic">Confiança</span></h2>
              <p className="text-base sm:text-xl text-gray-500 font-medium">A satisfação de quem não abre mão do melhor acompanhamento.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="glass-effect p-8 sm:p-10 rounded-[2.5rem] fade-in border border-white/5 hover:border-primary/20 transition-all duration-500 relative">
              <i className="ri-double-quotes-l text-4xl text-primary/20 absolute top-8 left-8"></i>
              <p className="text-gray-300 italic mb-10 leading-relaxed text-sm sm:text-base font-medium relative z-10 pt-6">
                "O EliteTrack™ revolucionou minha experiência. Poder acompanhar cada detalhe da blindagem em tempo real trouxe uma tranquilidade que eu nunca havia sentido antes."
              </p>
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">RM</div>
                <div>
                  <p className="font-bold text-white text-sm sm:text-base tracking-tight">Ricardo Mendes</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">CEO, Mendes Holdings</p>
                </div>
              </div>
            </div>
            <div className="glass-effect p-8 sm:p-10 rounded-[2.5rem] fade-in border border-white/5 hover:border-primary/20 transition-all duration-500 relative delay-0-2s">
              <i className="ri-double-quotes-l text-4xl text-primary/20 absolute top-8 left-8"></i>
              <p className="text-gray-300 italic mb-10 leading-relaxed text-sm sm:text-base font-medium relative z-10 pt-6">
                "A transparência é impressionante. Consegui acompanhar minha frota inteira sendo blindada, com documentação completa e atualizações constantes. Serviço premium."
              </p>
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">MS</div>
                <div>
                  <p className="font-bold text-white text-sm sm:text-base tracking-tight">Marina Silva</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Diretora, Silva Transportes</p>
                </div>
              </div>
            </div>
            <div className="glass-effect p-8 sm:p-10 rounded-[2.5rem] fade-in border border-white/5 hover:border-primary/20 transition-all duration-500 relative delay-0-4s">
              <i className="ri-double-quotes-l text-4xl text-primary/20 absolute top-8 left-8"></i>
              <p className="text-gray-300 italic mb-10 leading-relaxed text-sm sm:text-base font-medium relative z-10 pt-6">
                "Tecnologia de ponta aliada à qualidade Elite. O EliteTrack™ me deu total confiança no processo, desde o primeiro dia até a entrega final do meu veículo."
              </p>
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">CE</div>
                <div>
                  <p className="font-bold text-white text-sm sm:text-base tracking-tight">Carlos Eduardo</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Empresário</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato e Captura de Leads */}
      <section id="contato" className="py-20 sm:py-32 px-4 sm:px-6 bg-black relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none">
          <div className="hero-bg-image" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16 sm:mb-24 fade-in">
            <h2 className="text-3xl sm:text-6xl font-bold mb-6 tracking-tight text-white">Inicie sua <span className="text-primary font-light italic">Jornada</span></h2>
            <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto font-medium">Entre em contato e descubra o padrão Elite de transparência.</p>
          </div>
          
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2 space-y-8 fade-in">
              <div className="glass-effect p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <i className="ri-whatsapp-line text-2xl text-green-400"></i>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">WhatsApp Direto</p>
                    <p className="text-lg text-white font-bold tracking-tight">(11) 9.1312-3071</p>
                  </div>
                </div>
                <a 
                  href="https://wa.me/5511913123071"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-bold text-primary uppercase tracking-widest group-hover:gap-3 transition-all"
                >
                  Falar agora <i className="ri-arrow-right-line ml-2"></i>
                </a>
              </div>

              <div className="glass-effect p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <i className="ri-map-pin-line text-2xl text-primary"></i>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Localização</p>
                    <p className="text-sm text-white font-bold tracking-tight leading-relaxed">São Paulo - SP<br />Atendimento Nacional</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 glass-effect p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/10 shadow-2xl relative fade-in delay-0-2s">
              <form className="space-y-6" onSubmit={handleFormSubmit}>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:border-primary focus:bg-white/[0.05] focus:outline-none transition-all duration-300 font-medium" 
                      placeholder="Ex: Ricardo Mendes" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:border-primary focus:bg-white/[0.05] focus:outline-none transition-all duration-300 font-medium" 
                      placeholder="seu@email.com" 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">WhatsApp</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:border-primary focus:bg-white/[0.05] focus:outline-none transition-all duration-300 font-medium" 
                    placeholder="(11) 9.0000-0000" 
                    required
                  />
                </div>
                <div className="flex items-center space-x-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5 group cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, wantsSpecialist: !prev.wantsSpecialist }))}>
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                    formData.wantsSpecialist ? "bg-primary border-primary" : "border-white/20"
                  )}>
                    {formData.wantsSpecialist && <i className="ri-check-line text-black font-bold"></i>}
                  </div>
                  <label className="text-sm text-gray-400 font-medium cursor-pointer group-hover:text-gray-200 transition-colors">
                    Desejo falar com um especialista em segurança balística
                  </label>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full gradient-gold text-black font-bold py-5 rounded-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-500 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-[0.2em] transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? 'Enviando...' : 'Solicitar Atendimento Premium'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-['Pacifico'] text-2xl text-primary mb-4">EliteTrack™</div>
              <p className="text-gray-400 text-sm leading-relaxed">A plataforma de transparência em blindagem mais avançada do Brasil. Desenvolvida pela Elite Blindagem.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://elite-blindagens.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Sobre Nós</a></li>
                <li><a href="https://wa.me/5511913123071?text=Olá!%20Gostaria%20de%20falar%20com%20o%20contato%20da%20Elite%20Blindagens." target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://wa.me/5511913123071?text=Olá!%20Preciso%20de%20ajuda%20com%20o%20sistema%20EliteTrack." target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">EliteTrack</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => navigate('/login')} className="hover:text-primary transition-colors">Acessar Sistema</button></li>
                <li><button onClick={() => setShowConsultaModal(true)} className="hover:text-primary transition-colors">Consultar Histórico</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 Elite Blindagem. Todos os direitos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="https://wa.me/5511913123071" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" title="WhatsApp">
                <i className="ri-whatsapp-line text-xl"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Consulta de Histórico */}
      {showConsultaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Consultar Histórico</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors" title="Fechar" aria-label="Fechar modal">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <p className="text-gray-400 mb-6">
              Consulte o histórico completo de blindagem, materiais, certificações e laudos do seu veículo.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Código do projeto ou placa</label>
                <input
                  type="text"
                  value={consultaInput}
                  onChange={(e) => setConsultaInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleConsulta()}
                  placeholder="PRJ-2025-003 ou ABC-1234"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors text-center font-mono uppercase"
                  autoFocus
                />
              </div>
              <button
                onClick={() => navigate('/scan?mode=verify')}
                className="w-full py-3 bg-primary/20 border border-primary/40 rounded-xl text-sm hover:bg-primary/30 transition-colors flex items-center justify-center gap-2 font-semibold text-primary"
              >
                <i className="ri-qr-scan-2-line text-primary text-lg"></i>
                Escanear QR Code
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleConsulta}
                disabled={!consultaInput.trim()}
                className="flex-1 py-3 gradient-gold text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Consultar
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              Exemplo: PRJ-2025-003 • Consulta gratuita
            </p>
          </div>
        </div>
      )}

      </div>
  )
}
