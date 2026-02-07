import { useState, useRef } from 'react'
import { 
  User, Car, Shield, CheckCircle, ChevronRight, ChevronLeft, 
  Camera, Image as ImageIcon, X, Calendar, Users
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface CreateProjectWizardProps {
  onClose: () => void
  onCreate: (data: NewProjectData) => void
  vehiclePhoto: string | null
  onPhotoChange: (photo: string | null) => void
}

export interface NewProjectData {
  // Cliente
  clientName: string
  clientEmail: string
  clientPhone: string
  clientCpfCnpj: string
  clientAddress: string
  // Veículo
  brand: string
  model: string
  version: string
  year: string
  plate: string
  color: string
  chassis: string
  kmCheckin: string
  vehicleType: string
  // Projeto - Datas
  vehicleReceivedDate: string
  processStartDate: string
  estimatedDeliveryDate: string
  // Projeto - Blindagem
  blindingLine: string
  protectionLevel: string
  // Vidros
  glassManufacturer: string
  glassThickness: string
  glassWarrantyYears: string
  // Opacos
  aramidLayers: string
  opaqueManufacturer: string
  // Responsáveis
  technicalResponsible: string
  supervisorName: string
}

const steps = [
  { id: 1, name: 'Cliente', icon: User, description: 'Dados do cliente' },
  { id: 2, name: 'Veículo', icon: Car, description: 'Informações do carro' },
  { id: 3, name: 'Blindagem', icon: Shield, description: 'Especificações técnicas' },
  { id: 4, name: 'Revisão', icon: CheckCircle, description: 'Confirmar dados' },
]

export function CreateProjectWizard({ onClose, onCreate, vehiclePhoto, onPhotoChange }: CreateProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const vehiclePhotoInputRef = useRef<HTMLInputElement>(null)
  const vehicleCameraInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<NewProjectData>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCpfCnpj: '',
    clientAddress: '',
    brand: '',
    model: '',
    version: '',
    year: '',
    plate: '',
    color: '',
    chassis: '',
    kmCheckin: '',
    vehicleType: 'SUV',
    vehicleReceivedDate: new Date().toISOString().split('T')[0],
    processStartDate: '',
    estimatedDeliveryDate: '',
    blindingLine: 'UltraLite Armor™',
    protectionLevel: 'NIJ III-A',
    glassManufacturer: 'SafeMax',
    glassThickness: '21',
    glassWarrantyYears: '10',
    aramidLayers: '9',
    opaqueManufacturer: 'NextOne',
    technicalResponsible: '',
    supervisorName: '',
  })

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem (JPG ou PNG).')
      return
    }

    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      alert('Imagem muito grande. Máximo 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      onPhotoChange(imageUrl)
    }
    reader.readAsDataURL(file)
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Cliente
        return !!(formData.clientName && formData.clientEmail && formData.clientPhone)
      case 2: // Veículo
        return !!(formData.brand && formData.model && formData.year && formData.plate)
      case 3: // Blindagem
        return !!(formData.protectionLevel && formData.vehicleReceivedDate)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      alert('Preencha todos os campos obrigatórios (*)')
      return
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = () => {
    if (!vehiclePhoto) {
      alert('Adicione uma foto do veículo antes de finalizar.')
      return
    }
    onCreate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-carbon-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Novo Projeto</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 transition-all",
                      currentStep >= step.id
                        ? "bg-primary text-black"
                        : "bg-white/10 text-gray-400"
                    )}
                  >
                    <step.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium text-center hidden md:block",
                    currentStep >= step.id ? "text-white" : "text-gray-500"
                  )}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2 transition-all",
                      currentStep > step.id ? "bg-primary" : "bg-white/10"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Step 1: Cliente */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary mb-4">Dados do Cliente</h3>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="João da Silva"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    placeholder="joao@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Telefone *</label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">CPF/CNPJ</label>
                <input
                  type="text"
                  value={formData.clientCpfCnpj}
                  onChange={(e) => setFormData({ ...formData, clientCpfCnpj: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Endereço</label>
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
                />
              </div>
            </div>
          )}

          {/* Step 2: Veículo */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary mb-4">Dados do Veículo</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Marca *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    placeholder="BMW"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Modelo *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    placeholder="X5"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ano *</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Placa *</label>
                  <input
                    type="text"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono"
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Cor</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    placeholder="Preto"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Chassi</label>
                <input
                  type="text"
                  value={formData.chassis}
                  onChange={(e) => setFormData({ ...formData, chassis: e.target.value.toUpperCase() })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono"
                  placeholder="9BWZZZ377VT004251"
                />
              </div>

              {/* Foto do Veículo */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Foto do Veículo *</label>
                <input
                  ref={vehiclePhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  title="Selecionar foto da galeria"
                  aria-label="Selecionar foto da galeria"
                />
                <input
                  ref={vehicleCameraInputRef}
                  type="file"
                  accept="image/*"
                  {...({ capture: 'environment' } as React.InputHTMLAttributes<HTMLInputElement>)}
                  onChange={handlePhotoSelect}
                  className="hidden"
                  title="Tirar foto com câmera"
                  aria-label="Tirar foto com câmera"
                />

                {vehiclePhoto ? (
                  <div className="relative border-2 border-primary/30 rounded-xl p-2">
                    <img src={vehiclePhoto} alt="Veículo" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => onPhotoChange(null)}
                      className="absolute top-4 right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                      title="Remover foto"
                      aria-label="Remover foto"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => vehicleCameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-primary/50 hover:bg-primary/5"
                    >
                      <Camera className="w-10 h-10 text-primary mb-2" />
                      <span className="text-sm font-medium">Tirar Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => vehiclePhotoInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-primary/50 hover:bg-primary/5"
                    >
                      <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">Galeria</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Blindagem */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary mb-4">Especificações da Blindagem</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nível de Proteção *</label>
                  <select
                    value={formData.protectionLevel}
                    onChange={(e) => setFormData({ ...formData, protectionLevel: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Nível de proteção"
                    aria-label="Selecionar nível de proteção"
                  >
                    <option value="NIJ II">NIJ II</option>
                    <option value="NIJ III-A">NIJ III-A</option>
                    <option value="NIJ III">NIJ III</option>
                    <option value="NIJ IV">NIJ IV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Linha de Blindagem</label>
                  <select
                    value={formData.blindingLine}
                    onChange={(e) => setFormData({ ...formData, blindingLine: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    title="Linha de blindagem"
                    aria-label="Selecionar linha de blindagem"
                  >
                    <option value="UltraLite Armor™">UltraLite Armor™</option>
                    <option value="MaxProtect™">MaxProtect™</option>
                    <option value="TitanShield™">TitanShield™</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Datas do Processo
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Data de Recebimento *</label>
                    <input
                      type="date"
                      value={formData.vehicleReceivedDate}
                      onChange={(e) => setFormData({ ...formData, vehicleReceivedDate: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                      title="Data de recebimento"
                      aria-label="Data de recebimento do veículo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Previsão de Entrega</label>
                    <input
                      type="date"
                      value={formData.estimatedDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, estimatedDeliveryDate: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                      title="Previsão de entrega"
                      aria-label="Previsão de entrega"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Responsáveis Técnicos
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Responsável Técnico</label>
                    <input
                      type="text"
                      value={formData.technicalResponsible}
                      onChange={(e) => setFormData({ ...formData, technicalResponsible: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                      placeholder="Nome | Cargo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Supervisor</label>
                    <input
                      type="text"
                      value={formData.supervisorName}
                      onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                      placeholder="Nome | Cargo"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Revisão */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary mb-4">Revisar Informações</h3>
              
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente
                </h4>
                <div className="text-sm space-y-1 text-gray-300">
                  <p><span className="text-gray-500">Nome:</span> {formData.clientName}</p>
                  <p><span className="text-gray-500">Email:</span> {formData.clientEmail}</p>
                  <p><span className="text-gray-500">Telefone:</span> {formData.clientPhone}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Veículo
                </h4>
                <div className="text-sm space-y-1 text-gray-300">
                  <p><span className="text-gray-500">Modelo:</span> {formData.brand} {formData.model} {formData.year}</p>
                  <p><span className="text-gray-500">Placa:</span> <span className="font-mono text-primary">{formData.plate}</span></p>
                  {formData.color && <p><span className="text-gray-500">Cor:</span> {formData.color}</p>}
                </div>
                {vehiclePhoto && (
                  <img src={vehiclePhoto} alt="Veículo" className="w-full h-32 object-cover rounded-lg mt-2" />
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Blindagem
                </h4>
                <div className="text-sm space-y-1 text-gray-300">
                  <p><span className="text-gray-500">Nível:</span> {formData.protectionLevel}</p>
                  <p><span className="text-gray-500">Linha:</span> {formData.blindingLine}</p>
                  <p><span className="text-gray-500">Recebimento:</span> {new Date(formData.vehicleReceivedDate).toLocaleDateString('pt-BR')}</p>
                  {formData.estimatedDeliveryDate && (
                    <p><span className="text-gray-500">Previsão:</span> {new Date(formData.estimatedDeliveryDate).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Tudo pronto!</p>
                  <p className="text-blue-400">O projeto será criado e sincronizado com o Supabase. O cliente receberá um QR Code e senha temporária para acesso.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="px-4 md:px-6 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">{currentStep === 1 ? 'Cancelar' : 'Voltar'}</span>
            <span className="md:hidden">{currentStep === 1 ? 'Sair' : 'Voltar'}</span>
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-primary text-black rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <span>Próximo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Criar Projeto</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
