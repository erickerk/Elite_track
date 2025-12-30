import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, X, QrCode, Search, Flashlight, SwitchCamera } from 'lucide-react'
import { cn } from '../../lib/utils'
import jsQR from 'jsqr'

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string) => void
  projectSuggestions?: { id: string; plate: string; model: string }[]
}

export function QRScanner({ isOpen, onClose, onScan, projectSuggestions = [] }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [flashOn, setFlashOn] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [scanning, setScanning] = useState(false)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Função para parar o scan
  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setScanning(false)
  }, [])

  const stopCamera = useCallback(() => {
    stopScanning()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [stopScanning])

  // Função para escanear frame do vídeo
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code && code.data) {
      // Evitar scan duplicado do mesmo código
      if (code.data !== lastScannedCode) {
        console.log('[QRScanner] QR Code detectado:', code.data)
        setLastScannedCode(code.data)
        stopScanning()
        
        // Extrair ID do projeto da URL se for uma URL de verificação
        let projectCode = code.data
        if (code.data.includes('/verify/')) {
          const parts = code.data.split('/verify/')
          projectCode = parts[1] || code.data
        } else if (code.data.includes('/card/')) {
          const parts = code.data.split('/card/')
          projectCode = parts[1] || code.data
        }
        
        onScan(projectCode)
        // Fechar após scan bem-sucedido
        stopCamera()
        setManualInput('')
        onClose()
      }
    }
  }, [lastScannedCode, onScan, stopScanning, onClose, stopCamera])

  // Iniciar scan contínuo quando câmera ativa
  useEffect(() => {
    if (cameraActive && !scanning) {
      setScanning(true)
      setLastScannedCode(null)
      scanIntervalRef.current = setInterval(scanFrame, 200) // Scan a cada 200ms
    }
    return () => stopScanning()
  }, [cameraActive, scanning, scanFrame, stopScanning])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões.')
      setCameraActive(false)
    }
  }, [facingMode])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleClose = () => {
    stopCamera()
    setManualInput('')
    onClose()
  }

  const handleManualSearch = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      handleClose()
    }
  }

  const toggleFlash = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn } as MediaTrackConstraintSet]
        })
        setFlashOn(!flashOn)
      }
    }
  }

  const switchCamera = () => {
    stopCamera()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
    setTimeout(() => startCamera(), 100)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Canvas oculto para processamento do QR Code */}
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="relative w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Scanner QR</h2>
              <p className="text-sm text-gray-400">Escaneie ou digite o código</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Fechar scanner"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative aspect-square bg-carbon-900 rounded-3xl overflow-hidden mb-4">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary rounded-3xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                  {/* Scanning line animation */}
                  <div className="absolute inset-x-4 h-0.5 bg-primary/80 animate-pulse top-1/2" />
                </div>
              </div>
              {/* Camera controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-4">
                <button
                  onClick={toggleFlash}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                    flashOn ? "bg-primary text-black" : "bg-white/20 text-white"
                  )}
                  aria-label="Toggle flash"
                >
                  <Flashlight className="w-5 h-5" />
                </button>
                <button
                  onClick={switchCamera}
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  aria-label="Switch camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : cameraError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Camera className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="bg-primary text-black px-6 py-3 rounded-xl font-semibold"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Camera className="w-20 h-20 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-6 text-center">Clique para ativar a câmera ou use a busca manual abaixo</p>
              <button
                onClick={startCamera}
                className="bg-primary text-black px-8 py-4 rounded-xl font-semibold flex items-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Ativar Câmera</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="bg-carbon-800 rounded-2xl p-4 space-y-4">
          <p className="text-sm text-gray-400 text-center">
            Ou digite manualmente o código do projeto ou placa
          </p>
          <div className="relative">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="PRJ-2025-001 ou ABC-1D23"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-4 text-white placeholder-gray-500 text-center text-lg font-mono uppercase"
              aria-label="Código do projeto ou placa"
            />
            <button
              onClick={handleManualSearch}
              disabled={!manualInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Quick suggestions */}
          {projectSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Projetos recentes:</p>
              <div className="grid grid-cols-2 gap-2">
                {projectSuggestions.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onScan(p.id)
                      handleClose()
                    }}
                    className="bg-white/5 rounded-xl p-3 text-left hover:bg-white/10 transition-colors"
                  >
                    <p className="text-xs font-mono text-primary truncate">{p.id}</p>
                    <p className="text-xs text-gray-400 truncate">{p.plate} • {p.model}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
