import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calculator, Car, Send, CheckCircle,
  ChevronRight, Clock
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useQuotes, QuoteRequest } from '../contexts/QuoteContext'
import { useProjects } from '../contexts/ProjectContext'
import { cn } from '../lib/utils'
import type { Vehicle } from '../types'

interface QuoteOption {
  id: string
  level: string
  name: string
  description: string
  features: string[]
  estimatedDays: number
  popular?: boolean
}

interface ServiceOption {
  id: string
  name: string
  description: string
  icon: string
  estimatedDays: number
}

// Tipos de serviço
const serviceTypes = [
  { id: 'new-blinding', name: 'Nova Blindagem', icon: '🛡️', description: 'Blindagem completa do veículo' },
  { id: 'glass-replacement', name: 'Troca de Vidro', icon: '🪟', description: 'Substituição de vidros blindados' },
  { id: 'door-replacement', name: 'Troca de Porta', icon: '🚪', description: 'Substituição de portas blindadas' },
  { id: 'maintenance', name: 'Manutenção', icon: '🔧', description: 'Manutenção e ajustes' },
  { id: 'revision', name: 'Revisão', icon: '🔍', description: 'Revisão periódica da blindagem' },
  { id: 'other', name: 'Outro Serviço', icon: '✉️', description: 'Descreva o que precisa' },
]

// Opções de serviços específicos
const serviceOptions: ServiceOption[] = [
  { id: 'glass-front', name: 'Vidro Dianteiro (Para-brisa)', description: 'Substituição do para-brisa blindado', icon: '🪟', estimatedDays: 3 },
  { id: 'glass-side', name: 'Vidro Lateral', description: 'Substituição de vidro lateral blindado', icon: '🪟', estimatedDays: 2 },
  { id: 'glass-rear', name: 'Vidro Traseiro', description: 'Substituição do vidro traseiro blindado', icon: '🪟', estimatedDays: 3 },
  { id: 'door-front', name: 'Porta Dianteira', description: 'Substituição de porta dianteira blindada', icon: '🚪', estimatedDays: 5 },
  { id: 'door-rear', name: 'Porta Traseira', description: 'Substituição de porta traseira blindada', icon: '🚪', estimatedDays: 5 },
  { id: 'maintenance-general', name: 'Manutenção Geral', description: 'Ajustes e reparos diversos', icon: '🔧', estimatedDays: 1 },
  { id: 'revision-annual', name: 'Revisão Anual', description: 'Verificação completa da blindagem', icon: '🔍', estimatedDays: 1 },
]

const blindingOptions: QuoteOption[] = [
  {
    id: 'level-ii',
    level: 'II',
    name: 'Proteção Básica',
    description: 'Ideal para uso urbano e proteção contra armas de baixo calibre.',
    features: ['Vidros 15mm', 'Manta parcial', 'Garantia 3 anos', 'Certificação ABNT'],
    estimatedDays: 15,
  },
  {
    id: 'level-iiia',
    level: 'III-A',
    name: 'Proteção Avançada',
    description: 'Proteção completa contra armas de médio calibre. Mais vendido.',
    features: ['Vidros 21mm', 'Manta completa', 'Garantia 5 anos', 'Certificação ABNT', 'Overlap reforçado'],
    estimatedDays: 20,
    popular: true,
  },
  {
    id: 'level-iii',
    level: 'III',
    name: 'Proteção Máxima',
    description: 'Proteção contra armas de grosso calibre e rifles.',
    features: ['Vidros 32mm', 'Manta reforçada', 'Garantia 7 anos', 'Certificação internacional', 'Blindagem de piso', 'Run-flat'],
    estimatedDays: 30,
  },
]

const vehicleTypes = [
  { id: 'sedan', name: 'Sedã', icon: '🚗' },
  { id: 'suv', name: 'SUV', icon: '🚙' },
  { id: 'pickup', name: 'Pickup', icon: '🛻' },
  { id: 'van', name: 'Van', icon: '🚐' },
]

export function Quotes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const { addQuote, getQuotesByClient, clientApproveQuote, clientRejectQuote } = useQuotes()
  const { userProjects } = useProjects()
  
  const myQuotes = user ? getQuotesByClient(user.email) : []
  const [showMyQuotes, setShowMyQuotes] = useState(false)

  // Veículos cadastrados do usuário
  const userVehicles: Vehicle[] = userProjects.map(p => p.vehicle)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isNewVehicle, setIsNewVehicle] = useState(false)

  const [step, setStep] = useState(1)
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quoteGenerated, setQuoteGenerated] = useState(false)
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [customDescription, setCustomDescription] = useState('')
  const [showQuoteDetailModal, setShowQuoteDetailModal] = useState(false)
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<QuoteRequest | null>(null)
  const [clientResponseText, setClientResponseText] = useState('')

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsNewVehicle(false)
    setVehicleBrand(vehicle.brand)
    setVehicleModel(vehicle.model)
    setVehicleYear(vehicle.year.toString())
    setVehicleType('suv')
  }

  const handleNewVehicle = () => {
    setSelectedVehicle(null)
    setIsNewVehicle(true)
    setVehicleBrand('')
    setVehicleModel('')
    setVehicleYear('')
    setVehicleType('')
  }

  const handleGenerateQuote = () => {
    if (selectedServiceType === 'new-blinding') {
      if (!vehicleBrand || !vehicleModel || !selectedLevel) {
        addNotification({ type: 'warning', title: 'Campos Incompletos', message: 'Preencha todos os campos para gerar o orçamento.' })
        return
      }
    } else if (selectedServiceType === 'other') {
      if (!vehicleBrand || !vehicleModel || !customDescription) {
        addNotification({ type: 'warning', title: 'Campos Incompletos', message: 'Preencha todos os campos e descreva o serviço desejado.' })
        return
      }
    } else {
      if (!vehicleBrand || !vehicleModel || !selectedService) {
        addNotification({ type: 'warning', title: 'Campos Incompletos', message: 'Preencha todos os campos para gerar o orçamento.' })
        return
      }
    }
    setShowQuoteModal(true)
    setTimeout(() => setQuoteGenerated(true), 2000)
  }

  const getSelectedServiceOption = () => serviceOptions.find(s => s.id === selectedService)

  const handleRequestQuote = () => {
    if (user) {
      const serviceDesc = selectedServiceType === 'new-blinding' 
        ? `Nova Blindagem - Nível ${selectedLevel?.replace('level-', '').toUpperCase()}`
        : selectedServiceType === 'other'
        ? 'Serviço personalizado'
        : getSelectedServiceOption()?.name || ''

      addQuote({
        clientId: user.id || '1',
        clientName: user.name,
        clientEmail: user.email,
        clientPhone: user.phone,
        vehicleType,
        vehicleBrand,
        vehicleModel,
        vehicleYear,
        vehiclePlate: selectedVehicle?.plate,
        blindingLevel: selectedLevel?.replace('level-', '').toUpperCase() || '',
        serviceType: selectedServiceType as 'new-blinding' | 'glass-replacement' | 'door-replacement' | 'maintenance' | 'revision' | 'other',
        serviceDescription: serviceDesc,
        clientDescription: customDescription || undefined,
      })
    }
    addNotification({ 
      type: 'success', 
      title: 'Orçamento Solicitado!', 
      message: 'Sua solicitação foi enviada para análise. Você receberá uma resposta em até 24h.' 
    })
    setShowQuoteModal(false)
    setStep(1)
    setVehicleType('')
    setVehicleBrand('')
    setVehicleModel('')
    setVehicleYear('')
    setSelectedLevel(null)
    setQuoteGenerated(false)
    setCustomDescription('')
    setSelectedServiceType('')
    setSelectedService(null)
  }

  const selectedOption = blindingOptions.find(o => o.id === selectedLevel)

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
                <img src="/logo-elite.png" alt="Elite Blindagens" className="h-10 w-auto object-contain" />
              </div>
            </div>
            <h1 className="text-lg font-semibold">Solicitar Orçamento</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* My Quotes Toggle */}
        {myQuotes.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowMyQuotes(!showMyQuotes)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-semibold">Meus Orçamentos ({myQuotes.length})</span>
              </div>
              <ChevronRight className={cn("w-5 h-5 transition-transform", showMyQuotes && "rotate-90")} />
            </button>
            
            {showMyQuotes && (
              <div className="mt-4 space-y-3">
                {myQuotes.map((quote) => (
                  <div 
                    key={quote.id} 
                    className={cn(
                      "p-4 bg-white/5 border rounded-xl transition-colors",
                      quote.status === 'sent' ? "border-primary/50 cursor-pointer hover:bg-white/10" : "border-white/10"
                    )}
                    onClick={() => {
                      if (quote.status === 'sent') {
                        setSelectedQuoteDetail(quote)
                        setShowQuoteDetailModal(true)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{quote.vehicleBrand} {quote.vehicleModel}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        quote.status === 'pending' ? "bg-yellow-500/20 text-yellow-400" :
                        quote.status === 'analyzed' ? "bg-blue-500/20 text-blue-400" :
                        quote.status === 'sent' ? "bg-primary/20 text-primary" :
                        quote.status === 'approved' ? "bg-green-500/20 text-green-400" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {quote.status === 'pending' ? 'Aguardando Análise' :
                         quote.status === 'analyzed' ? 'Em Análise' :
                         quote.status === 'sent' ? 'Aguardando Sua Aprovação' :
                         quote.status === 'approved' ? 'Aprovado' : 'Recusado'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>Nível: {quote.blindingLevel} • {new Date(quote.createdAt).toLocaleDateString('pt-BR')}</p>
                                            {quote.estimatedDays && (
                        <p className="text-gray-500">Prazo: {quote.estimatedDays} dias</p>
                      )}
                    </div>
                    {quote.status === 'sent' && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-primary flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Clique para ver detalhes e aprovar/rejeitar
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                step >= s ? "bg-primary text-black" : "bg-white/10 text-gray-400"
              )}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={cn("w-16 h-1 mx-2", step > s ? "bg-primary" : "bg-white/10")} />}
            </div>
          ))}
        </div>

        {/* Step 1: Service Type Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">O que você precisa?</h2>
              <p className="text-gray-400">Selecione o tipo de serviço desejado</p>
            </div>

            {/* Service Type Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {serviceTypes.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    console.log('Clicked service:', service.id);
                    setSelectedServiceType(service.id);
                  }}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all text-center",
                    selectedServiceType === service.id 
                      ? "border-primary bg-primary/10" 
                      : "border-white/10 hover:border-white/30"
                  )}
                  title={service.description}
                >
                  <div className="text-3xl mb-2">{service.icon}</div>
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{service.description}</div>
                </button>
              ))}
            </div>

            {selectedServiceType && (
              <button
                onClick={() => setStep(2)}
                className="w-full bg-primary text-black py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
              >
                <span>Continuar</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Step 2: Vehicle Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Selecione o Veículo</h2>
              <p className="text-gray-400">Escolha um veículo cadastrado ou adicione um novo</p>
            </div>

            {/* Veículos Cadastrados */}
            {userVehicles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Car className="w-5 h-5 text-primary" />
                  <span>Seus Veículos Cadastrados</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {userVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => handleSelectVehicle(vehicle)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-left flex items-center space-x-4",
                        selectedVehicle?.id === vehicle.id 
                          ? "border-primary bg-primary/10" 
                          : "border-white/10 hover:border-white/30"
                      )}
                      title={`Selecionar ${vehicle.brand} ${vehicle.model}`}
                    >
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-white/10">
                        {vehicle.images[0] && (
                          <img src={vehicle.images[0]} alt={vehicle.model} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{vehicle.brand} {vehicle.model}</div>
                        <div className="text-sm text-gray-400">{vehicle.year} • {vehicle.plate}</div>
                      </div>
                      {selectedVehicle?.id === vehicle.id && (
                        <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Adicionar Novo Veículo */}
            <div className="border-t border-white/10 pt-6">
              <button
                onClick={handleNewVehicle}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-center space-x-2",
                  isNewVehicle 
                    ? "border-primary bg-primary/10" 
                    : "border-white/10 hover:border-white/30"
                )}
                title="Adicionar novo veículo"
              >
                <i className="ri-add-line text-xl"></i>
                <span>Adicionar Novo Veículo</span>
              </button>
            </div>

            {/* Formulário para novo veículo */}
            {isNewVehicle && (
              <div className="space-y-4 p-4 bg-white/5 rounded-2xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {vehicleTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setVehicleType(type.id)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all",
                        vehicleType === type.id 
                          ? "border-primary bg-primary/10" 
                          : "border-white/10 hover:border-white/30"
                      )}
                      title={`Tipo: ${type.name}`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <div className="font-medium">{type.name}</div>
                    </button>
                  ))}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Marca *</label>
                    <input
                      type="text"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      placeholder="Ex: Toyota"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      title="Marca do veículo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Modelo *</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Ex: Corolla"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      title="Modelo do veículo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ano</label>
                    <input
                      type="text"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      placeholder="Ex: 2025"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      title="Ano do veículo"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/10 py-4 rounded-xl font-semibold">
                Voltar
              </button>
              <button
                onClick={() => (selectedVehicle || (vehicleBrand && vehicleModel)) && setStep(3)}
                disabled={!selectedVehicle && (!vehicleBrand || !vehicleModel)}
                className="flex-1 bg-primary text-black py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                title="Continuar para próxima etapa"
              >
                <span>Continuar</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Service Details */}
        {step === 3 && (
          <div className="space-y-6">
            {/* New Blinding - Show blinding levels */}
            {selectedServiceType === 'new-blinding' && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Nível de Proteção</h2>
                  <p className="text-gray-400">Escolha o nível de blindagem adequado para suas necessidades</p>
                </div>

                <div className="space-y-4">
                  {blindingOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedLevel(option.id)}
                      className={cn(
                        "w-full p-6 rounded-2xl border-2 text-left transition-all relative",
                        selectedLevel === option.id 
                          ? "border-primary bg-primary/10" 
                          : "border-white/10 hover:border-white/30"
                      )}
                    >
                      {option.popular && (
                        <span className="absolute -top-3 right-4 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full">
                          MAIS VENDIDO
                        </span>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl font-bold text-primary">Nível {option.level}</span>
                            <span className="text-lg font-semibold">{option.name}</span>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">{option.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {option.features.map((feature, i) => (
                              <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded-lg">{feature}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 flex items-center justify-end">
                            <Clock className="w-3 h-3 mr-1" />
                            ~{option.estimatedDays} dias
                          </div>
                          <div className="text-xs text-primary mt-1">Or\u00e7amento sob consulta</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Glass or Door Replacement - Show specific options */}
            {(selectedServiceType === 'glass-replacement' || selectedServiceType === 'door-replacement') && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedServiceType === 'glass-replacement' ? 'Qual vidro?' : 'Qual porta?'}
                  </h2>
                  <p className="text-gray-400">Selecione o item a ser substituído</p>
                </div>

                <div className="space-y-4">
                  {serviceOptions
                    .filter(s => selectedServiceType === 'glass-replacement' ? s.id.startsWith('glass') : s.id.startsWith('door'))
                    .map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedService(option.id)}
                      className={cn(
                        "w-full p-5 rounded-2xl border-2 text-left transition-all",
                        selectedService === option.id 
                          ? "border-primary bg-primary/10" 
                          : "border-white/10 hover:border-white/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <div className="font-semibold">{option.name}</div>
                            <div className="text-sm text-gray-400">{option.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">~{option.estimatedDays} dias</div>
                          <div className="text-xs text-primary">Or\u00e7amento sob consulta</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Maintenance or Revision */}
            {(selectedServiceType === 'maintenance' || selectedServiceType === 'revision') && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedServiceType === 'maintenance' ? 'Tipo de Manutenção' : 'Tipo de Revisão'}
                  </h2>
                  <p className="text-gray-400">Selecione o serviço desejado</p>
                </div>

                <div className="space-y-4">
                  {serviceOptions
                    .filter(s => selectedServiceType === 'maintenance' ? s.id.startsWith('maintenance') : s.id.startsWith('revision'))
                    .map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedService(option.id)}
                      className={cn(
                        "w-full p-5 rounded-2xl border-2 text-left transition-all",
                        selectedService === option.id 
                          ? "border-primary bg-primary/10" 
                          : "border-white/10 hover:border-white/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <div className="font-semibold">{option.name}</div>
                            <div className="text-sm text-gray-400">{option.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">~{option.estimatedDays} dias</div>
                          <div className="text-xs text-primary">Orçamento sob consulta</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Other Service - Free text */}
            {selectedServiceType === 'other' && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Descreva o Serviço</h2>
                  <p className="text-gray-400">Conte-nos o que você precisa</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Descrição detalhada do serviço *</label>
                    <textarea
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Descreva detalhadamente o que você precisa. Ex: Preciso trocar as borrachas de vedação, ajustar o vidro traseiro que está com barulho, etc."
                      rows={5}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none"
                      title="Descrição do serviço"
                    />
                  </div>
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <p className="text-sm text-gray-300">
                      <strong className="text-primary">Nota:</strong> Nossa equipe analisará sua solicitação e entrará em contato para fornecer um orçamento personalizado.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Campo de descrição adicional para todos os tipos de serviço (exceto 'other' que já tem) */}
            {selectedServiceType && selectedServiceType !== 'other' && (
              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <label className="block text-sm text-gray-400 mb-2">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Descreva detalhes adicionais sobre o serviço desejado, condições do veículo, urgência, etc."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none"
                  title="Observações adicionais"
                />
              </div>
            )}

            <div className="flex space-x-4 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 bg-white/10 py-4 rounded-xl font-semibold">
                Voltar
              </button>
              <button
                onClick={handleGenerateQuote}
                disabled={
                  (selectedServiceType === 'new-blinding' && !selectedLevel) ||
                  (selectedServiceType === 'other' && !customDescription) ||
                  (!['new-blinding', 'other'].includes(selectedServiceType) && !selectedService)
                }
                className="flex-1 bg-primary text-black py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Solicitar Orçamento</span>
              </button>
            </div>
          </div>
        )}

        </main>

      {/* Quote Modal */}
      <Modal isOpen={showQuoteModal} onClose={() => setShowQuoteModal(false)} size="md">
        <div className="p-6 text-center">
          {!quoteGenerated ? (
            <>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Gerando Orçamento...</h2>
              <p className="text-gray-400">Aguarde enquanto processamos sua solicitação.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Solicitação Enviada!</h2>
              <p className="text-gray-400 mb-6">Nossa equipe entrará em contato em breve.</p>
              
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                {selectedServiceType === 'new-blinding' && selectedOption && (
                  <>
                    <div className="text-xl font-bold text-primary mb-1">Nível {selectedOption.level} - {selectedOption.name}</div>
                    <div className="text-sm text-gray-400">Prazo estimado: {selectedOption.estimatedDays} dias</div>
                  </>
                )}
                {selectedServiceType !== 'new-blinding' && selectedServiceType !== 'other' && getSelectedServiceOption() && (
                  <>
                    <div className="text-xl font-bold text-primary mb-1">{getSelectedServiceOption()?.name}</div>
                    <div className="text-sm text-gray-400">Prazo estimado: {getSelectedServiceOption()?.estimatedDays} dias</div>
                  </>
                )}
                {selectedServiceType === 'other' && (
                  <>
                    <div className="text-xl font-bold text-primary mb-1">Orçamento Personalizado</div>
                    <div className="text-sm text-gray-400">Análise da sua solicitação</div>
                  </>
                )}
                <div className="text-xs text-gray-500 mt-2">{vehicleBrand} {vehicleModel} {vehicleYear}</div>
              </div>

              <button
                onClick={handleRequestQuote}
                className="w-full bg-primary text-black py-4 rounded-xl font-semibold"
              >
                Receber Orçamento Detalhado
              </button>
              <p className="text-xs text-gray-500 mt-3">Você receberá o orçamento completo por e-mail e WhatsApp</p>
            </>
          )}
        </div>
      </Modal>

      {/* Modal de Detalhes do Orçamento - Aprovação/Rejeição pelo Cliente */}
      {showQuoteDetailModal && selectedQuoteDetail && (
        <Modal isOpen={showQuoteDetailModal} onClose={() => { setShowQuoteDetailModal(false); setSelectedQuoteDetail(null); setClientResponseText(''); }} size="lg">
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-1">Orçamento Recebido</h2>
              <p className="text-gray-400">Analise os detalhes e aprove ou recuse</p>
            </div>

            {/* Informações do Veículo */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Car className="w-5 h-5 text-primary" />
                <span className="font-semibold">{selectedQuoteDetail.vehicleBrand} {selectedQuoteDetail.vehicleModel}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-gray-400">Ano:</span> {selectedQuoteDetail.vehicleYear}</p>
                <p><span className="text-gray-400">Nível:</span> {selectedQuoteDetail.blindingLevel}</p>
              </div>
            </div>

            {/* Prazo */}
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">Prazo estimado</div>
              <div className="text-3xl font-bold text-white">{selectedQuoteDetail.estimatedDays} dias úteis</div>
            </div>

            {/* Observações do Executor */}
            {selectedQuoteDetail.executorNotes && (
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Observações:</h4>
                <p className="text-sm text-gray-400">{selectedQuoteDetail.executorNotes}</p>
              </div>
            )}

            {/* Campo de Resposta do Cliente */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sua resposta (opcional)</label>
              <textarea
                value={clientResponseText}
                onChange={(e) => setClientResponseText(e.target.value)}
                placeholder="Deixe uma mensagem para a blindadora..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  clientRejectQuote(selectedQuoteDetail.id, clientResponseText)
                  addNotification({ 
                    type: 'info', 
                    title: 'Orçamento Recusado', 
                    message: 'O orçamento foi recusado. A blindadora será notificada.' 
                  })
                  setShowQuoteDetailModal(false)
                  setSelectedQuoteDetail(null)
                  setClientResponseText('')
                }}
                className="flex-1 px-6 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-semibold transition-colors"
              >
                Recusar
              </button>
              <button 
                onClick={() => {
                  clientApproveQuote(selectedQuoteDetail.id, clientResponseText)
                  addNotification({ 
                    type: 'success', 
                    title: 'Orçamento Aprovado!', 
                    message: 'Parabéns! O orçamento foi aprovado. Entraremos em contato para agendar o serviço.' 
                  })
                  setShowQuoteDetailModal(false)
                  setSelectedQuoteDetail(null)
                  setClientResponseText('')
                }}
                className="flex-1 px-6 py-3 bg-green-500 text-white hover:bg-green-600 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Aprovar Orçamento
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
