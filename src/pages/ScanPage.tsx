import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import QrScanner from 'qr-scanner'
import { 
  Camera, QrCode, Search, Flashlight, SwitchCamera, 
  Upload, Loader2, ArrowLeft, CheckCircle 
} from 'lucide-react'
import { cn } from '../lib/utils'

type ScanState = 'idle' | 'requesting' | 'active' | 'success' | 'error'

export function ScanPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'project'
  const autoStart = searchParams.get('autoStart') === 'true'
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoStartAttempted = useRef(false)
  
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [manualInput, setManualInput] = useState('')
  const [flashOn, setFlashOn] = useState(false)
  const [processingImage, setProcessingImage] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)

  const extractProjectCode = useCallback((data: string): string => {
    if (data.includes('/verify/')) {
      return data.split('/verify/')[1]?.split('?')[0] || data
    } else if (data.includes('/card/')) {
      return data.split('/card/')[1]?.split('?')[0] || data
    } else if (data.includes('/qr/')) {
      return data.split('/qr/')[1]?.split('?')[0] || data
    }
    return data
  }, [])

  const handleScanResult = useCallback((code: string) => {
    const projectCode = extractProjectCode(code)
    setScannedCode(projectCode)
    setScanState('success')
    
    if (scannerRef.current) {
      scannerRef.current.stop()
    }
    
    setTimeout(() => {
      navigate(`/qr/${projectCode}`)
    }, 800)
  }, [extractProjectCode, navigate])

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }
    setScanState('idle')
  }, [])

  const toggleFlash = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.toggleFlash()
        setFlashOn(!flashOn)
      } catch (err) {
        console.error('[ScanPage] Erro ao alternar flash:', err)
      }
    }
  }

  const switchCamera = async () => {
    if (scannerRef.current) {
      try {
        const cameras = await QrScanner.listCameras(true)
        if (cameras.length > 1) {
          const nextIndex = cameras.length > 1 ? 1 : 0
          await scannerRef.current.setCamera(cameras[nextIndex].id)
        }
      } catch (err) {
        console.error('[ScanPage] Erro ao trocar câmera:', err)
      }
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setProcessingImage(true)
    
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      if (result.data) {
        handleScanResult(result.data)
      } else {
        alert('Nenhum QR code encontrado na imagem.')
      }
    } catch (err) {
      console.error('[ScanPage] Erro ao processar imagem:', err)
      alert('Não foi possível ler o QR code da imagem. Tente outra.')
    } finally {
      setProcessingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleManualSearch = () => {
    if (manualInput.trim()) {
      navigate(`/qr/${manualInput.trim()}`)
    }
  }

  const handleClose = () => {
    stopScanner()
    navigate(-1)
  }

  // Auto-start: abre câmera diretamente via input file
  useEffect(() => {
    if (autoStart && !autoStartAttempted.current) {
      autoStartAttempted.current = true
      setTimeout(() => {
        const cameraInput = document.getElementById('camera-capture') as HTMLInputElement
        if (cameraInput) {
          cameraInput.click()
        }
      }, 300)
    }
  }, [autoStart])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Input para upload de imagem */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        aria-label="Enviar imagem do QR Code"
      />
      
      {/* Input para captura direta da câmera */}
      {/* @ts-ignore - capture é suportado em mobile */}
      <input
        id="camera-capture"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
        aria-label="Capturar foto com câmera"
      />
      
      {/* Header */}
      <header className="bg-carbon-900/95 backdrop-blur-xl border-b border-white/10 safe-area-pt">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Scanner QR</h1>
              <p className="text-xs text-gray-400">
                {mode === 'project' ? 'Escaneie o QR do veículo' : 'Escaneie qualquer QR'}
              </p>
            </div>
          </div>
          
          <div className="w-10" />
        </div>
      </header>

      {/* Camera View */}
      <div className="flex-1 relative bg-carbon-900 overflow-hidden">
        {scanState === 'success' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-white font-medium text-lg">QR Code Detectado!</p>
            <p className="text-sm text-gray-400 mt-2 font-mono">{scannedCode}</p>
          </div>
        ) : scanState === 'active' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Scanning frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 sm:w-72 sm:h-72 border-2 border-primary/50 rounded-2xl relative">
                <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
              </div>
            </div>
            {/* Camera controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4">
              <button
                onClick={toggleFlash}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  flashOn ? "bg-primary text-black" : "bg-white/20 text-white backdrop-blur-sm"
                )}
                aria-label="Alternar flash"
              >
                <Flashlight className="w-5 h-5" />
              </button>
              <button
                onClick={switchCamera}
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Trocar câmera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : scanState === 'requesting' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <p className="text-white font-medium">Acessando câmera...</p>
            <p className="text-sm text-gray-400 mt-2">Permita o acesso quando solicitado</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <video ref={videoRef} className="hidden" autoPlay playsInline muted />
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            <p className="text-white font-medium text-lg mb-2">Escanear QR Code</p>
            <p className="text-gray-400 text-center text-sm mb-6">
              Use a câmera para escanear ou envie uma imagem
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {/* Botão principal: abre câmera diretamente */}
              <label
                htmlFor="camera-capture"
                className="bg-primary text-black px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-3 active:scale-95 transition-transform cursor-pointer"
              >
                <Camera className="w-6 h-6" />
                <span>Abrir Câmera</span>
              </label>
              {/* Botão secundário: enviar imagem da galeria */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Enviar da Galeria
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Panel */}
      <div className="bg-carbon-900 border-t border-white/10 p-4 safe-area-pb">
        <p className="text-xs text-gray-500 text-center mb-3">
          Ou digite a placa / código do projeto
        </p>
        <div className="relative mb-3">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
            placeholder="ABC-1D23 ou PRJ-2025-001"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-14 py-3.5 text-white placeholder-gray-500 text-center text-base font-mono uppercase"
            aria-label="Código do projeto ou placa"
          />
          <button
            onClick={handleManualSearch}
            disabled={!manualInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5 text-black" />
          </button>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processingImage}
          className="w-full bg-white/5 text-gray-300 py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {processingImage ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Enviar imagem do QR Code
            </>
          )}
        </button>
      </div>
    </div>
  )
}
