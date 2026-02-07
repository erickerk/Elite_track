import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Share2, ChevronLeft, ChevronRight,
  Shield, Car, User, Zap, FileText, Map, Camera, Settings, CheckCircle,
  PenTool, Award, QrCode, MessageSquare, FileCheck, Clock
} from 'lucide-react'
import { useEliteShield, ELITESHIELD_SCREENS } from '../../contexts/EliteShieldContext'
import { cn } from '../../lib/utils'

interface EliteShieldViewerProps {
  projectId: string
  onClose?: () => void
}

export function EliteShieldViewer({ projectId, onClose }: EliteShieldViewerProps) {
  const navigate = useNavigate()
  const {
    currentReport,
    isLoading,
    loadReport,
    currentScreen,
    setCurrentScreen,
    nextScreen,
    prevScreen,
    defaultSections
  } = useEliteShield()

  useEffect(() => {
    loadReport(projectId)
  }, [projectId, loadReport])

  const getScreenIcon = (screenId: number) => {
    const icons: Record<number, React.ReactNode> = {
      1: <Shield className="w-5 h-5" />,
      2: <Car className="w-5 h-5" />,
      3: <User className="w-5 h-5" />,
      4: <Zap className="w-5 h-5" />,
      5: <FileText className="w-5 h-5" />,
      6: <Map className="w-5 h-5" />,
      7: <Camera className="w-5 h-5" />,
      8: <Settings className="w-5 h-5" />,
      9: <CheckCircle className="w-5 h-5" />,
      10: <PenTool className="w-5 h-5" />,
      11: <Award className="w-5 h-5" />,
      12: <QrCode className="w-5 h-5" />,
      13: <MessageSquare className="w-5 h-5" />,
      14: <FileCheck className="w-5 h-5" />,
      15: <Clock className="w-5 h-5" />,
    }
    return icons[screenId]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando Laudo EliteShield™...</p>
        </div>
      </div>
    )
  }

  if (!currentReport) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Laudo não encontrado</h2>
          <p className="text-gray-400 mb-6">O laudo EliteShield™ ainda não foi criado para este projeto.</p>
          <button
            onClick={() => onClose?.() || navigate(-1)}
            className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const currentScreenData = ELITESHIELD_SCREENS.find(s => s.id === currentScreen)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => onClose?.() || navigate(-1)}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
            title="Voltar"
            aria-label="Voltar para a página anterior"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h1 className="font-bold text-primary">EliteShield™</h1>
            <p className="text-xs text-gray-400">Laudo Técnico Digital</p>
          </div>
          
          <button
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
            title="Compartilhar laudo"
            aria-label="Compartilhar laudo EliteShield"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Screen Navigation */}
        <div className="px-4 pb-3 flex items-center space-x-2 overflow-x-auto scrollbar-hide">
          {ELITESHIELD_SCREENS.map((screen) => (
            <button
              key={screen.id}
              onClick={() => setCurrentScreen(screen.id)}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center space-x-2",
                currentScreen === screen.id
                  ? "bg-primary text-black"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              )}
            >
              {getScreenIcon(screen.id)}
              <span className="hidden md:inline">{screen.name}</span>
              <span className="md:hidden">{screen.id}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="pt-32 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Screen Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {getScreenIcon(currentScreen)}
            </div>
            <h2 className="text-2xl font-bold">{currentScreenData?.name}</h2>
            <p className="text-gray-400 text-sm mt-1">Tela {currentScreen} de 15</p>
          </div>

          {/* Screen Content */}
          <div className="bg-carbon-900 rounded-3xl border border-white/10 p-6">
            {currentScreen === 1 && <ScreenCapa report={currentReport} />}
            {currentScreen === 2 && <ScreenVeiculo report={currentReport} />}
            {currentScreen === 3 && <ScreenCliente report={currentReport} />}
            {currentScreen === 4 && <ScreenBlindagem report={currentReport} />}
            {currentScreen === 5 && <ScreenEspecificacao report={currentReport} />}
            {currentScreen === 6 && <ScreenMapa report={currentReport} />}
            {currentScreen === 7 && <ScreenFotos report={currentReport} />}
            {currentScreen === 8 && <ScreenExecucao report={currentReport} />}
            {currentScreen === 9 && <ScreenTestes report={currentReport} />}
            {currentScreen === 10 && <ScreenResponsaveis report={currentReport} />}
            {currentScreen === 11 && <ScreenGarantias report={currentReport} />}
            {currentScreen === 12 && <ScreenQRCode report={currentReport} />}
            {currentScreen === 13 && <ScreenObservacoes report={currentReport} defaultSections={defaultSections} />}
            {currentScreen === 14 && <ScreenDeclaracao report={currentReport} />}
            {currentScreen === 15 && <ScreenStatus report={currentReport} />}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={prevScreen}
            disabled={currentScreen === 1}
            className={cn(
              "flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-colors",
              currentScreen === 1
                ? "bg-white/5 text-gray-600 cursor-not-allowed"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center space-x-1">
            {[...Array(15)].map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  currentScreen === idx + 1 ? "bg-primary" : "bg-white/20"
                )}
              />
            ))}
          </div>

          <button
            onClick={nextScreen}
            disabled={currentScreen === 15}
            className={cn(
              "flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-colors",
              currentScreen === 15
                ? "bg-white/5 text-gray-600 cursor-not-allowed"
                : "bg-primary text-black hover:bg-primary/90"
            )}
          >
            <span>Próximo</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  )
}

// =====================================================
// COMPONENTES DAS TELAS
// =====================================================

function ScreenCapa({ report }: { report: any }) {
  return (
    <div className="text-center space-y-6">
      {/* Logo */}
      <div className="flex justify-center">
        <img src="/logo-elite.png" alt="Elite Blindagens" className="h-16 w-auto" />
      </div>
      
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">ELITESHIELD™</h1>
        <p className="text-gray-400">Laudo Técnico Digital</p>
      </div>
      
      {/* Foto do Veículo */}
      {report.cover_photo_url ? (
        <img 
          src={report.cover_photo_url} 
          alt="Veículo" 
          className="w-full aspect-video object-cover rounded-2xl border border-white/10"
        />
      ) : (
        <div className="w-full aspect-video bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
          <Car className="w-16 h-16 text-gray-600" />
        </div>
      )}
      
      {/* Informações */}
      <div className="space-y-2">
        <p className="text-lg font-semibold">{report.client_name || 'Cliente não informado'}</p>
        <p className="text-gray-400">
          {report.vehicle_brand} {report.vehicle_model} / {report.vehicle_year || 'Ano não informado'}
        </p>
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {report.status === 'finalized' ? 'Finalizado' : 'Em andamento'}
          </span>
        </div>
      </div>
      
      {/* Data */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-sm text-gray-500">
          Data de conclusão: {report.completion_date || 'Pendente'}
        </p>
      </div>
    </div>
  )
}

function ScreenVeiculo({ report }: { report: any }) {
  const fields = [
    { label: 'Marca', value: report.vehicle_brand },
    { label: 'Modelo', value: report.vehicle_model },
    { label: 'Ano/Modelo', value: report.vehicle_year },
    { label: 'Cor', value: report.vehicle_color },
    { label: 'Placa', value: report.vehicle_plate },
    { label: 'Chassi', value: report.vehicle_chassis || '****1234' },
    { label: 'KM Check-in', value: report.vehicle_km_checkin ? `${report.vehicle_km_checkin.toLocaleString()} km` : '-' },
    { label: 'Tipo', value: report.vehicle_type || 'SUV' },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Identificação do Veículo</h3>
      {fields.map((field, i) => (
        <div key={i} className="flex justify-between items-center py-3 border-b border-white/10">
          <span className="text-gray-400">{field.label}:</span>
          <span className="font-medium">{field.value || '-'}</span>
        </div>
      ))}
    </div>
  )
}

function ScreenCliente({ report }: { report: any }) {
  const fields = [
    { label: 'Nome / Razão Social', value: report.client_name },
    { label: 'CPF/CNPJ', value: report.client_document || '***.***.***-**' },
    { label: 'Telefone', value: report.client_phone },
    { label: 'E-mail', value: report.client_email },
    { label: 'Cidade / Estado', value: report.client_city && report.client_state ? `${report.client_city} / ${report.client_state}` : '-' },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Dados do Cliente</h3>
      {fields.map((field, i) => (
        <div key={i} className="flex justify-between items-center py-3 border-b border-white/10">
          <span className="text-gray-400">{field.label}:</span>
          <span className="font-medium">{field.value || '-'}</span>
        </div>
      ))}
    </div>
  )
}

function ScreenBlindagem({ report }: { report: any }) {
  const lines = [
    { name: 'UltraLite Armor™', desc: 'Blindagem Ultra Leve', seal: 'Premium Technology', selected: report.blinding_line?.name === 'ultralite_armor' },
    { name: 'SafeCore™', desc: 'Segurança Inteligente', seal: 'Smart Balance', selected: report.blinding_line?.name === 'safecore' },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Linha de Blindagem</h3>
      
      {lines.map((line, i) => (
        <div 
          key={i} 
          className={cn(
            "p-4 rounded-2xl border transition-colors",
            line.selected 
              ? "border-primary bg-primary/10" 
              : "border-white/10 bg-white/5"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold">{line.name}</h4>
              <p className="text-sm text-gray-400">{line.desc}</p>
            </div>
            <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full">
              {line.seal}
            </span>
          </div>
        </div>
      ))}
      
      <div className="pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Nível:</span>
          <span className="font-medium">{report.protection_level || 'NIJ III-A'}</span>
        </div>
      </div>
    </div>
  )
}

function ScreenEspecificacao({ report }: { report: any }) {
  return (
    <div className="space-y-6">
      {/* Vidros */}
      <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5">
        <h4 className="font-bold text-primary mb-3">Vidros Blindados</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Fabricante:</span>
            <span>{report.glass_spec?.manufacturer || 'SafeMax'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Espessura:</span>
            <span>{report.glass_thickness_mm || 42}mm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Garantia:</span>
            <span>{report.glass_warranty_years || 10} anos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Lote / Série:</span>
            <span>{report.glass_lot_number || 'N/A'}</span>
          </div>
        </div>
      </div>
      
      {/* Opacos */}
      <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
        <h4 className="font-bold mb-3">Materiais Opacos</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Aramida:</span>
            <span>{report.aramid_layers || '8-11'} camadas</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Complemento:</span>
            <span>{report.complement_material || 'Tensylon'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fabricante:</span>
            <span>{report.opaque_material?.manufacturer || 'NextOne'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScreenMapa({ report }: { report: any }) {
  const areas = report.protected_areas || ['Portas', 'Vidros', 'Colunas', 'Área traseira']
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Mapa da Blindagem</h3>
      
      {/* Silhueta do carro (placeholder) */}
      <div className="aspect-[4/3] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center relative">
        <Car className="w-32 h-32 text-gray-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-gray-500">Visualização do mapa</p>
        </div>
      </div>
      
      {/* Áreas protegidas */}
      <div className="grid grid-cols-2 gap-2">
        {areas.map((area: string, i: number) => (
          <div key={i} className="flex items-center space-x-2 p-3 bg-primary/10 rounded-xl">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-sm">{area}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScreenFotos({ report }: { report: any }) {
  const stages = [
    { key: 'desmontagem', name: 'Desmontagem' },
    { key: 'vidros', name: 'Instalação dos Vidros' },
    { key: 'opacos', name: 'Mantas Opacas' },
    { key: 'fechamento', name: 'Antes do Fechamento' },
  ]
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Registro Fotográfico</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {stages.map((stage) => {
          const photo = report.photos?.find((p: any) => p.stage === stage.key)
          return (
            <div key={stage.key} className="space-y-2">
              {photo ? (
                <img 
                  src={photo.photo_url} 
                  alt={stage.name}
                  className="aspect-square object-cover rounded-xl border border-white/10"
                />
              ) : (
                <div className="aspect-square bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-600" />
                </div>
              )}
              <p className="text-xs text-center text-gray-400">{stage.name}</p>
            </div>
          )
        })}
      </div>
      
      <p className="text-xs text-gray-500 text-center mt-4">
        * Sem fotos → laudo não finaliza
      </p>
    </div>
  )
}

function ScreenExecucao({ report }: { report: any }) {
  const defaultSteps = [
    'Check-in', 'Desmontagem', 'Vidros', 'Opacos', 
    'Montagem', 'Acabamento', 'Testes', 'Liberação'
  ]
  
  const steps = report.execution_steps?.length > 0 
    ? report.execution_steps 
    : defaultSteps.map((name) => ({ step_name: name, status: 'pending' }))
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Processo de Execução</h3>
      
      <div className="space-y-3">
        {steps.map((step: any, i: number) => (
          <div key={i} className="flex items-center space-x-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              step.status === 'completed' 
                ? "bg-green-500/20 text-green-400" 
                : step.status === 'in_progress'
                  ? "bg-primary/20 text-primary"
                  : "bg-white/10 text-gray-500"
            )}>
              {step.status === 'completed' ? '✔' : i + 1}
            </div>
            <span className={cn(
              step.status === 'completed' ? "text-green-400" : "text-gray-400"
            )}>
              {step.step_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScreenTestes({ report }: { report: any }) {
  const tests = [
    'Ajuste de portas',
    'Funcionamento dos vidros',
    'Vedação',
    'Acabamento',
    'Rodagem de teste',
    'Ausência de ruídos',
  ]
  
  const checklist = report.tests_checklist || {}
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Testes e Verificações</h3>
      
      <div className="space-y-3">
        {tests.map((test, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
            <div className={cn(
              "w-6 h-6 rounded flex items-center justify-center text-xs",
              checklist[test] || report.tests_approved
                ? "bg-green-500/20 text-green-400"
                : "bg-white/10 text-gray-500"
            )}>
              ✓
            </div>
            <span>{test}</span>
          </div>
        ))}
      </div>
      
      {/* Status Final */}
      <div className={cn(
        "p-6 rounded-2xl text-center",
        report.tests_approved 
          ? "bg-green-500/20 border border-green-500/30" 
          : "bg-yellow-500/20 border border-yellow-500/30"
      )}>
        <p className={cn(
          "text-2xl font-bold",
          report.tests_approved ? "text-green-400" : "text-yellow-400"
        )}>
          {report.tests_approved ? 'APROVADO ✔️' : 'PENDENTE'}
        </p>
      </div>
    </div>
  )
}

function ScreenResponsaveis({ report }: { report: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-primary mb-4">Responsáveis Técnicos</h3>
      
      {/* Responsável Técnico */}
      <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
        <p className="text-sm text-gray-400 mb-2">Responsável Técnico</p>
        <p className="font-bold">{report.technical_responsible?.name || 'Nome do Responsável'}</p>
        <p className="text-sm text-gray-400">{report.technical_responsible?.position || 'Cargo'}</p>
        <div className="mt-4 h-16 border border-dashed border-white/20 rounded-xl flex items-center justify-center">
          {report.technical_signature_url ? (
            <img src={report.technical_signature_url} alt="Assinatura" className="h-12" />
          ) : (
            <p className="text-xs text-gray-500">[ Assinatura digital ]</p>
          )}
        </div>
      </div>
      
      {/* Supervisor */}
      <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
        <p className="text-sm text-gray-400 mb-2">Supervisor Técnico</p>
        <p className="font-bold">{report.supervisor?.name || 'Nome do Supervisor'}</p>
        <p className="text-sm text-gray-400">{report.supervisor?.position || 'Cargo'}</p>
        <div className="mt-4 h-16 border border-dashed border-white/20 rounded-xl flex items-center justify-center">
          {report.supervisor_signature_url ? (
            <img src={report.supervisor_signature_url} alt="Assinatura" className="h-12" />
          ) : (
            <p className="text-xs text-gray-500">[ Assinatura digital ]</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ScreenGarantias({ report }: { report: any }) {
  const warranties = report.warranties || [
    { component: 'Vidros', duration_months: 120 },
    { component: 'Opacos', duration_months: 60 },
    { component: 'Acabamento', duration_months: 12 },
  ]
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Garantias Ativas</h3>
      
      {warranties.map((warranty: any, i: number) => (
        <div key={i} className="flex items-center space-x-3 p-4 bg-white/5 rounded-2xl border border-white/10">
          <Shield className="w-8 h-8 text-primary" />
          <div className="flex-1">
            <p className="font-bold">{warranty.component}</p>
            <p className="text-sm text-gray-400">
              {warranty.duration_months >= 12 
                ? `${Math.floor(warranty.duration_months / 12)} anos` 
                : `${warranty.duration_months} meses`}
            </p>
          </div>
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
      ))}
    </div>
  )
}

function ScreenQRCode({ report }: { report: any }) {
  return (
    <div className="text-center space-y-6">
      <h3 className="text-lg font-bold text-primary mb-4">EliteTrace™</h3>
      
      {/* QR Code */}
      <div className="bg-white p-6 rounded-2xl inline-block mx-auto">
        {report.qr_code_url ? (
          <img src={report.qr_code_url} alt="QR Code" className="w-48 h-48" />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center">
            <QrCode className="w-32 h-32 text-black" />
          </div>
        )}
      </div>
      
      <div>
        <h4 className="font-bold text-xl text-primary">EliteTrace™</h4>
        <p className="text-gray-400 mt-2">
          Escaneie para acessar<br />
          o histórico completo<br />
          da blindagem.
        </p>
      </div>
      
      {report.trace_token && (
        <p className="text-xs text-gray-500 font-mono">
          Token: {report.trace_token}
        </p>
      )}
    </div>
  )
}

function ScreenObservacoes({ report }: { report: any; defaultSections?: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Observações Técnicas</h3>
      
      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
        <p className="text-sm text-gray-300 whitespace-pre-wrap">
          {report.technical_observations || 'Nenhuma observação técnica registrada.'}
        </p>
      </div>
      
      {report.recommendations && (
        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <p className="text-sm font-bold text-primary mb-2">Recomendações</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {report.recommendations}
          </p>
        </div>
      )}
    </div>
  )
}

function ScreenDeclaracao({ report }: { report: any }) {
  const defaultDeclaration = `Declaramos que as informações contidas neste EliteShield™ – Laudo Técnico de Blindagem Veicular refletem fielmente o processo executado e os materiais aplicados, sendo este documento emitido para fins de registro técnico, transparência, garantia e comprovação do serviço prestado.

Elite Blindagens
Proteção elevada ao estado da arte.`

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">Declaração Final</h3>
      
      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
          {report.final_declaration || defaultDeclaration}
        </p>
      </div>
      
      {report.declaration_accepted && (
        <div className="flex items-center justify-center space-x-2 text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Declaração aceita em {new Date(report.declaration_date).toLocaleDateString('pt-BR')}</span>
        </div>
      )}
    </div>
  )
}

function ScreenStatus({ report }: { report: any }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'text-gray-400' },
    in_progress: { label: 'Em andamento', color: 'text-yellow-400' },
    review: { label: 'Em revisão', color: 'text-blue-400' },
    finalized: { label: 'FINALIZADO ✔️', color: 'text-green-400' },
  }
  
  const status = statusConfig[report.status] || statusConfig.draft
  
  return (
    <div className="text-center space-y-6">
      <h3 className="text-lg font-bold text-primary mb-4">Status do Documento</h3>
      
      <div className={cn(
        "p-8 rounded-2xl",
        report.status === 'finalized' 
          ? "bg-green-500/20 border border-green-500/30" 
          : "bg-white/5 border border-white/10"
      )}>
        <p className={cn("text-3xl font-bold", status.color)}>
          {status.label}
        </p>
      </div>
      
      <div className="space-y-3 text-left">
        <div className="flex justify-between py-2 border-b border-white/10">
          <span className="text-gray-400">Data de emissão:</span>
          <span>{report.issue_date || 'Pendente'}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-white/10">
          <span className="text-gray-400">Versão:</span>
          <span>{report.document_version || '1.0'}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-400">Token EliteTrace:</span>
          <span className="font-mono text-xs">{report.trace_token || 'N/A'}</span>
        </div>
      </div>
    </div>
  )
}

export default EliteShieldViewer
