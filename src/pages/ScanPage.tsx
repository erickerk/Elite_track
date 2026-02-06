import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import QrScanner from 'qr-scanner'
import { 
  Camera, QrCode, Search, Flashlight, SwitchCamera, 
  Upload, Loader2, ArrowLeft, CheckCircle, AlertTriangle
} from 'lucide-react'
import { cn } from '../lib/utils'

type ScanState = 'idle' | 'requesting' | 'active' | 'success' | 'error'

export function ScanPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'verify'
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [processingImage, setProcessingImage] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)

  const extractCode = (data: string): string => {
    if (data.includes('/verify/')) return data.split('/verify/')[1]?.split('?')[0] || data
    if (data.includes('/card/')) return data.split('/card/')[1]?.split('?')[0] || data
    if (data.includes('/qr/')) return data.split('/qr/')[1]?.split('?')[0] || data
    return data
  }

  const handleResult = useCallback((code: string) => {
    const projectCode = extractCode(code)
    setScannedCode(projectCode)
    setScanState('success')
    
    if (scannerRef.current) {
      scannerRef.current.stop()
    }
    
    setTimeout(() => navigate(`/qr/${projectCode}`), 800)
  }, [navigate])

  const startCamera = useCallback(async () => {
    if (scanState === 'requesting' || scanState === 'active') return
    if (!videoRef.current) return
    
    setScanState('requesting')
    setErrorMessage('')
    
    try {
      // Limpar scanner anterior se existir
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
        scannerRef.current = null
      }
      
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (result.data) {
            console.log('[Scanner] QR detectado:', result.data)
            handleResult(result.data)
          }
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )
      
      scannerRef.current = scanner
      await scanner.start()
      
      setScanState('active')
      
      try {
        const flash = await scanner.hasFlash()
        setHasFlash(flash)
      } catch {
        setHasFlash(false)
      }
      
    } catch (err) {
      console.error('[Scanner] Erro:', err)
      setScanState('error')
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setErrorMessage('Permissão de câmera negada. Permita o acesso nas configurações.')
        } else if (err.name === 'NotFoundError') {
          setErrorMessage('Nenhuma câmera encontrada neste dispositivo.')
        } else {
          setErrorMessage(err.message || 'Erro ao acessar câmera.')
        }
      } else {
        setErrorMessage('Erro desconhecido ao acessar câmera.')
      }
    }
  }, [scanState, handleResult])

  const stopCamera = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }
    setScanState('idle')
  }, [])

  const toggleFlash = async () => {
    if (scannerRef.current && hasFlash) {
      await scannerRef.current.toggleFlash()
      setFlashOn(!flashOn)
    }
  }

  const switchCamera = async () => {
    if (!scannerRef.current) return
    const cameras = await QrScanner.listCameras(true)
    if (cameras.length > 1) {
      await scannerRef.current.setCamera(cameras[1].id)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setProcessingImage(true)
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      if (result.data) {
        handleResult(result.data)
      } else {
        alert('Nenhum QR code encontrado na imagem.')
      }
    } catch {
      alert('Não foi possível ler o QR code da imagem.')
    } finally {
      setProcessingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleManualSearch = () => {
    if (manualInput.trim()) {
      navigate(`/qr/${manualInput.trim()}`)
    }
  }

  const handleClose = () => {
    stopCamera()
    navigate(-1)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => void handleImageUpload(e)}
        className="hidden"
        aria-label="Enviar imagem do QR Code"
      />
      
      {/* Header */}
      <header className="bg-black/90 backdrop-blur border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Scanner QR</h1>
              <p className="text-xs text-gray-400">Escaneie o QR Code</p>
            </div>
          </div>
          
          <div className="w-10" />
        </div>
      </header>

      {/* Camera Area - Video SEMPRE presente no DOM */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {/* Video element - sempre renderizado, visibilidade controlada por CSS */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            scanState === 'active' ? "opacity-100" : "opacity-0"
          )}
        />
        
        {/* Overlay de frame quando ativo */}
        {scanState === 'active' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-primary/50 rounded-2xl relative">
                <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
              </div>
            </div>
            
            {/* Controles da câmera */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              {hasFlash && (
                <button
                  onClick={() => void toggleFlash()}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    flashOn ? "bg-primary text-black" : "bg-white/20 text-white"
                  )}
                  aria-label="Alternar flash"
                >
                  <Flashlight className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => void switchCamera()}
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white"
                aria-label="Trocar câmera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
              <button
                onClick={stopCamera}
                className="w-12 h-12 bg-red-500/80 rounded-full flex items-center justify-center text-white"
                aria-label="Parar câmera"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
        
        {/* Estado de sucesso */}
        {scanState === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-white font-medium text-lg">QR Code Detectado!</p>
            <p className="text-sm text-gray-400 mt-2 font-mono">{scannedCode}</p>
          </div>
        )}
        
        {/* Estado de requesting */}
        {scanState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <p className="text-white font-medium">Abrindo câmera...</p>
            <p className="text-sm text-gray-400 mt-2">Permita o acesso quando solicitado</p>
          </div>
        )}
        
        {/* Estado de erro */}
        {scanState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black z-10">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-white font-medium text-lg mb-2">Erro na Câmera</p>
            <p className="text-gray-400 text-center text-sm mb-6">{errorMessage}</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => void startCamera()}
                className="bg-primary text-black px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3"
              >
                <Camera className="w-6 h-6" />
                Tentar Novamente
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Enviar Imagem
              </button>
            </div>
          </div>
        )}
        
        {/* Estado idle - tela inicial */}
        {scanState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black z-10">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            <p className="text-white font-medium text-xl mb-2">Escanear QR Code</p>
            <p className="text-gray-400 text-center text-sm mb-6">
              Aponte a câmera para o QR Code do veículo
            </p>
            {mode === 'verify' && (
              <p className="text-primary/80 text-center text-xs mb-4 bg-primary/10 px-3 py-2 rounded-lg">
                🔓 Acesso público - sem necessidade de login
              </p>
            )}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => void startCamera()}
                className="bg-primary text-black px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <Camera className="w-6 h-6" />
                Abrir Câmera
              </button>
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

      {/* Input Manual */}
      <div className="bg-black border-t border-white/10 p-4">
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
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-14 py-3.5 text-white placeholder-gray-500 text-center font-mono uppercase"
          />
          <button
            onClick={handleManualSearch}
            disabled={!manualInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center disabled:opacity-50"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5 text-black" />
          </button>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processingImage}
          className="w-full bg-white/5 text-gray-300 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
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
export default ScanPage
