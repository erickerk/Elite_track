import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export function LandingPage() {
  const navigate = useNavigate()
  const headerRef = useRef<HTMLElement>(null)
  
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
          <div style={{ 
            backgroundImage: "url('https://readdy.ai/api/search-image?query=luxury%20sports%20car%20being%20armored%20in%20high-tech%20modern%20facility%20with%20dramatic%20cinematic%20lighting%2C%20sophisticated%20automotive%20workshop%20with%20golden%20accent%20lights%2C%20sleek%20supercar%20with%20bulletproof%20glass%20installation%2C%20premium%20armoring%20process%20with%20metallic%20reflections%20and%20professional%20equipment%2C%20dark%20atmospheric%20setting%20with%20luxury%20vehicle%20protection%20services%2C%20cinematic%20automotive%20photography%20with%20dramatic%20shadows%20and%20premium%20lighting&width=1920&height=1080&seq=hero-armoring-process&orientation=landscape')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%',
            filter: 'brightness(0.7) contrast(1.2)'
          }} />
          <div className="hero-car-overlay absolute inset-0" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full floating-animation opacity-60 luxury-glow" />
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-primary rounded-full floating-animation opacity-40 luxury-glow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-3/4 w-2.5 h-2.5 bg-primary rounded-full floating-animation opacity-50 luxury-glow" style={{ animationDelay: '4s' }} />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-primary rounded-full floating-animation opacity-30 luxury-glow" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-1/3 left-1/6 w-2 h-2 bg-primary rounded-full floating-animation opacity-45 luxury-glow" style={{ animationDelay: '5s' }} />
        </div>

        {/* Fixed Header */}
        <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" id="main-header">
          <div className="glass-effect cinematic-blur border-b border-white/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="font-['Pacifico'] text-2xl text-primary luxury-glow">EliteTrack™</div>
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
              >
                <i className="ri-login-box-line text-2xl"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-20 px-6 flex items-center min-h-[85vh]">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-5xl">
              <div className="glass-effect cinematic-blur p-8 rounded-3xl premium-shadow mb-8">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
                  EliteTrack™<br />
                  <span className="text-primary luxury-glow font-light">Transparência Absoluta</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl font-light">
                  Monitore a blindagem do seu veículo com precisão absoluta. Tecnologia avançada para uma experiência premium incomparável.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <button 
                    onClick={() => navigate('/login')}
                    className="gradient-gold text-black font-semibold px-8 py-3 rounded-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 whitespace-nowrap transform hover:scale-105 luxury-glow text-sm uppercase tracking-wider inline-block text-center"
                  >
                    Inicie sua Experiência
                  </button>
                  <button className="glass-effect cinematic-blur border border-primary/50 text-primary font-semibold px-8 py-3 rounded-lg hover:bg-primary hover:text-black transition-all duration-300 whitespace-nowrap transform hover:scale-105 text-sm uppercase tracking-wider">
                    Fale com Especialista
                  </button>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-light">Experiência premium • Máxima discrição</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Como Funciona</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Processo simplificado em três etapas para máxima transparência</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-effect cinematic-blur p-10 rounded-3xl fade-in hover:bg-white/15 transition-all duration-500 transform hover:scale-105 premium-shadow group">
              <div className="w-20 h-20 flex items-center justify-center bg-primary/25 rounded-3xl mb-8 luxury-glow group-hover:bg-primary/35 transition-all duration-300">
                <i className="ri-calendar-check-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-3xl font-bold mb-6 text-white">1. Agende</h3>
              <p className="text-gray-300 leading-relaxed text-lg">Solicite seu orçamento e agende a blindagem com nossa equipe especializada. Processo 100% personalizado para clientes exigentes.</p>
            </div>
            <div className="glass-effect cinematic-blur p-10 rounded-3xl fade-in hover:bg-white/15 transition-all duration-500 transform hover:scale-105 premium-shadow group" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 flex items-center justify-center bg-primary/25 rounded-3xl mb-8 luxury-glow group-hover:bg-primary/35 transition-all duration-300">
                <i className="ri-eye-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-3xl font-bold mb-6 text-white">2. Acompanhe em Tempo Real</h3>
              <p className="text-gray-300 leading-relaxed text-lg">Monitore cada etapa da blindagem através do EliteTrack™. Atualizações instantâneas e documentação completa em tempo real.</p>
            </div>
            <div className="glass-effect cinematic-blur p-10 rounded-3xl fade-in hover:bg-white/15 transition-all duration-500 transform hover:scale-105 premium-shadow group" style={{ animationDelay: '0.4s' }}>
              <div className="w-20 h-20 flex items-center justify-center bg-primary/25 rounded-3xl mb-8 luxury-glow group-hover:bg-primary/35 transition-all duration-300">
                <i className="ri-shield-check-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-3xl font-bold mb-6 text-white">3. Receba com Confiança</h3>
              <p className="text-gray-300 leading-relaxed text-lg">Entrega com certificação completa e garantia total. Seu veículo blindado com a máxima qualidade Elite Blindagem.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios Principais */}
      <section id="beneficios" className="py-24 px-6 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative">
        <div className="absolute inset-0 opacity-10">
          <div style={{ 
            backgroundImage: "url('https://readdy.ai/api/search-image?query=luxury%20automotive%20workshop%20with%20high-tech%20equipment%20and%20sophisticated%20armoring%20tools%2C%20premium%20vehicle%20protection%20facility%20with%20metallic%20surfaces%20and%20golden%20lighting%20accents%2C%20modern%20industrial%20setting%20with%20luxury%20car%20parts%20and%20bulletproof%20materials%2C%20cinematic%20automotive%20technology%20background%20with%20dramatic%20lighting&width=1920&height=1080&seq=benefits-bg&orientation=landscape')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 fade-in">
            <h2 className="text-5xl md:text-6xl font-black mb-8 luxury-glow">Benefícios <span className="text-primary">Exclusivos</span></h2>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">Tecnologia de ponta para uma experiência premium incomparável no mundo da blindagem automotiva</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass-effect cinematic-blur p-10 rounded-3xl fade-in hover:bg-white/15 transition-all duration-500 group transform hover:scale-105 premium-shadow">
              <div className="w-20 h-20 flex items-center justify-center bg-primary/25 rounded-3xl mb-8 group-hover:bg-primary/35 transition-all duration-300 luxury-glow">
                <i className="ri-search-eye-line text-3xl text-primary"></i>
              </div>
              <h3 className="text-2xl font-bold mb-6 text-white">Transparência Absoluta</h3>
              <p className="text-gray-300 text-lg leading-relaxed">Visibilidade completa de cada etapa do processo de blindagem em tempo real com tecnologia avançada.</p>
            </div>
            <div className="glass-effect p-8 rounded-2xl fade-in hover:bg-white/10 transition-all duration-300 group" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-2xl mb-6 group-hover:bg-primary/30 transition-colors">
                <i className="ri-notification-3-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-4">Atualizações em Tempo Real</h3>
              <p className="text-gray-400">Notificações instantâneas sobre o progresso do seu veículo.</p>
            </div>
            <div className="glass-effect p-8 rounded-2xl fade-in hover:bg-white/10 transition-all duration-300 group" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-2xl mb-6 group-hover:bg-primary/30 transition-colors">
                <i className="ri-file-shield-2-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-4">Documentos Centralizados</h3>
              <p className="text-gray-400">Todos os documentos e certificações organizados em um só lugar.</p>
            </div>
            <div className="glass-effect p-8 rounded-2xl fade-in hover:bg-white/10 transition-all duration-300 group" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-2xl mb-6 group-hover:bg-primary/30 transition-colors">
                <i className="ri-vip-crown-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-4">Experiência Premium</h3>
              <p className="text-gray-400">Interface elegante e intuitiva projetada para clientes exigentes.</p>
            </div>
            <div className="glass-effect p-8 rounded-2xl fade-in hover:bg-white/10 transition-all duration-300 group" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-2xl mb-6 group-hover:bg-primary/30 transition-colors">
                <i className="ri-rocket-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-4">Liderança Tecnológica</h3>
              <p className="text-gray-400">Primeira plataforma de rastreamento de blindagem do Brasil.</p>
            </div>
            <div className="glass-effect p-8 rounded-2xl fade-in hover:bg-white/10 transition-all duration-300 group" style={{ animationDelay: '0.5s' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-2xl mb-6 group-hover:bg-primary/30 transition-colors">
                <i className="ri-lock-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-4">Segurança Total</h3>
              <p className="text-gray-400">Dados protegidos com criptografia de nível bancário.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Preview ao Vivo */}
      <section id="preview" className="py-20 px-6 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Acompanhe em Tempo Real</h2>
            <p className="text-xl text-gray-400">Veja como funciona o monitoramento do seu veículo</p>
          </div>
          <div className="glass-effect p-8 rounded-3xl fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold mb-2">Mercedes-Benz S 500</h3>
                <p className="text-gray-400">Nível IIIA • Em processo</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Última atualização</p>
                <p className="text-primary font-semibold">Hoje, 14:32</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center bg-green-500 rounded-full">
                  <i className="ri-check-line text-white text-sm"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Veículo Recebido</h4>
                  <p className="text-sm text-gray-400">Inspeção inicial concluída</p>
                </div>
                <span className="text-sm text-gray-500">10/12 09:00</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center bg-green-500 rounded-full">
                  <i className="ri-check-line text-white text-sm"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Desmontagem</h4>
                  <p className="text-sm text-gray-400">Componentes removidos e catalogados</p>
                </div>
                <span className="text-sm text-gray-500">11/12 14:20</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-full">
                  <i className="ri-tools-line text-black text-sm"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary">Instalação da Blindagem</h4>
                  <p className="text-sm text-gray-400">Em andamento - Aplicação do aço balístico</p>
                  <div className="progress-bar w-full mt-2" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm text-primary">Em andamento</span>
              </div>
              <div className="flex items-center space-x-4 opacity-50">
                <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-600 rounded-full">
                  <i className="ri-search-line text-gray-600 text-sm"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Controle de Qualidade</h4>
                  <p className="text-sm text-gray-400">Testes balísticos e verificações finais</p>
                </div>
                <span className="text-sm text-gray-500">Aguardando</span>
              </div>
              <div className="flex items-center space-x-4 opacity-50">
                <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-600 rounded-full">
                  <i className="ri-truck-line text-gray-600 text-sm"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Entrega</h4>
                  <p className="text-sm text-gray-400">Veículo pronto para retirada</p>
                </div>
                <span className="text-sm text-gray-500">Aguardando</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documentos e Rastreabilidade */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Documentos & Rastreabilidade</h2>
            <p className="text-xl text-gray-400">Toda documentação organizada e acessível</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-effect p-6 rounded-2xl fade-in hover:bg-white/10 transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-500/20 rounded-xl mb-4 group-hover:bg-blue-500/30 transition-colors">
                <i className="ri-file-text-line text-xl text-blue-400"></i>
              </div>
              <h3 className="font-semibold mb-2">Laudos Técnicos</h3>
              <p className="text-sm text-gray-400">Relatórios detalhados de cada etapa</p>
            </div>
            <div className="glass-effect p-6 rounded-2xl fade-in hover:bg-white/10 transition-all duration-300 group cursor-pointer" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 flex items-center justify-center bg-green-500/20 rounded-xl mb-4 group-hover:bg-green-500/30 transition-colors">
                <i className="ri-receipt-line text-xl text-green-400"></i>
              </div>
              <h3 className="font-semibold mb-2">Notas Fiscais</h3>
              <p className="text-sm text-gray-400">Documentação fiscal completa</p>
            </div>
            <div className="glass-effect p-6 rounded-2xl fade-in hover:bg-white/10 transition-all duration-300 group cursor-pointer" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 flex items-center justify-center bg-purple-500/20 rounded-xl mb-4 group-hover:bg-purple-500/30 transition-colors">
                <i className="ri-camera-line text-xl text-purple-400"></i>
              </div>
              <h3 className="font-semibold mb-2">Fotos do Processo</h3>
              <p className="text-sm text-gray-400">Registro visual de cada etapa</p>
            </div>
            <div className="glass-effect p-6 rounded-2xl fade-in hover:bg-white/10 transition-all duration-300 group cursor-pointer" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 flex items-center justify-center bg-primary/20 rounded-xl mb-4 group-hover:bg-primary/30 transition-colors">
                <i className="ri-award-line text-xl text-primary"></i>
              </div>
              <h3 className="font-semibold mb-2">Certificados</h3>
              <p className="text-sm text-gray-400">Certificações de qualidade e conformidade</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sinais de Confiança */}
      <section id="confianca" className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Confiança & Segurança</h2>
            <p className="text-xl text-gray-400">Certificações e padrões de excelência</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center fade-in">
              <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-2xl mx-auto mb-4">
                <i className="ri-shield-check-line text-2xl text-primary"></i>
              </div>
              <h3 className="font-semibold mb-2">ISO 9001</h3>
              <p className="text-sm text-gray-400">Gestão de qualidade certificada</p>
            </div>
            <div className="text-center fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-2xl mx-auto mb-4">
                <i className="ri-lock-line text-2xl text-primary"></i>
              </div>
              <h3 className="font-semibold mb-2">Dados Seguros</h3>
              <p className="text-sm text-gray-400">Criptografia de nível bancário</p>
            </div>
            <div className="text-center fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-2xl mx-auto mb-4">
                <i className="ri-eye-off-line text-2xl text-primary"></i>
              </div>
              <h3 className="font-semibold mb-2">Privacidade</h3>
              <p className="text-sm text-gray-400">LGPD compliance total</p>
            </div>
            <div className="text-center fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 flex items-center justify-center bg-primary/20 rounded-2xl mx-auto mb-4">
                <i className="ri-medal-line text-2xl text-primary"></i>
              </div>
              <h3 className="font-semibold mb-2">Excelência</h3>
              <p className="text-sm text-gray-400">25+ anos de experiência</p>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">O que Nossos Clientes Dizem</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-effect p-8 rounded-2xl fade-in">
              <div className="text-4xl text-primary mb-4">"</div>
              <p className="text-gray-300 italic mb-6 leading-relaxed">O EliteTrack™ revolucionou minha experiência. Poder acompanhar cada detalhe da blindagem em tempo real trouxe uma tranquilidade que eu nunca havia sentido antes.</p>
              <div>
                <p className="font-semibold">Ricardo Mendes</p>
                <p className="text-sm text-gray-500">CEO, Mendes Holdings</p>
              </div>
            </div>
            <div className="glass-effect p-8 rounded-2xl fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl text-primary mb-4">"</div>
              <p className="text-gray-300 italic mb-6 leading-relaxed">A transparência é impressionante. Consegui acompanhar minha frota inteira sendo blindada, com documentação completa e atualizações constantes. Serviço premium de verdade.</p>
              <div>
                <p className="font-semibold">Marina Silva</p>
                <p className="text-sm text-gray-500">Diretora, Silva Transportes</p>
              </div>
            </div>
            <div className="glass-effect p-8 rounded-2xl fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-4xl text-primary mb-4">"</div>
              <p className="text-gray-300 italic mb-6 leading-relaxed">Tecnologia de ponta aliada à qualidade Elite Blindagem. O EliteTrack™ me deu total confiança no processo, desde o primeiro dia até a entrega final.</p>
              <div>
                <p className="font-semibold">Carlos Eduardo</p>
                <p className="text-sm text-gray-500">Empresário</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato e Captura de Leads */}
      <section id="contato" className="py-20 px-6 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Comece sua Experiência Elite</h2>
            <p className="text-xl text-gray-400">Entre em contato e descubra a blindagem do futuro</p>
          </div>
          <div className="glass-effect p-8 rounded-3xl fade-in">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Completo</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors" placeholder="Seu nome completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors" placeholder="seu@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <input type="tel" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors" placeholder="(11) 99999-9999" />
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="specialist" className="hidden peer" />
                <label htmlFor="specialist" className="flex items-center cursor-pointer group">
                  <div className="w-5 h-5 border-2 border-white/30 rounded flex items-center justify-center mr-3 transition-colors hover:border-primary peer-checked:bg-primary/20 peer-checked:border-primary">
                    <i className="ri-check-line text-xs text-primary opacity-0 transition-opacity peer-checked:opacity-100 group-hover:opacity-50"></i>
                  </div>
                  <span className="text-gray-300">Quero falar com um especialista</span>
                </label>
              </div>
              <button type="submit" className="w-full gradient-gold text-black font-semibold py-4 rounded-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 whitespace-nowrap">
                Solicitar Contato
              </button>
            </form>
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
                <li><a href="#" className="hover:text-primary transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Serviços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Certificações</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status do Sistema</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">LGPD</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2024 Elite Blindagem. Todos os direitos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                <i className="ri-instagram-line text-xl"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                <i className="ri-linkedin-line text-xl"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                <i className="ri-youtube-line text-xl"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
