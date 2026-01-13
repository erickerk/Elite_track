import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, X, QrCode, Search, Flashlight, SwitchCamera, Upload, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import jsQR from 'jsqr'

type CameraState = 'idle' | 'requesting' | 'active' | 'error'
type ErrorType = 'permission' | 'https' | 'no-camera' | 'in-use' | 'unknown'

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string) => void
  projectSuggestions?: { id: string; plate: string; model: string }[]
  autoStart?: boolean
}

const ERROR_MESSAGES: Record<ErrorType, { title: string; message: string }> = {
  permission: {
    title: 'Permissão Negada',
    message: 'Permita o acesso à câmera nas configurações do navegador para escanear QR codes.'
  },
  https: {
    title: 'Conexão Não Segura',
    message: 'O scanner requer HTTPS. Use a busca manual ou envie uma imagem do QR code.'
  },
  'no-camera': {
    title: 'Câmera Não Encontrada',
    message: 'Nenhuma câmera disponível. Use a busca manual ou envie uma imagem.'
  },
  'in-use': {
    title: 'Câmera em Uso',
    message: 'A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.'
  },
  unknown: {
    title: 'Erro ao Acessar Câmera',
    message: 'Não foi possível acessar a câmera. Use a busca manual ou envie uma imagem.'
  }
}

export function QRScanner({ isOpen, onClose, onScan, projectSuggestions = [], autoStart = true }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  
  const [manualInput, setManualInput] = useState('')
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [flashOn, setFlashOn] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [scanning, setScanning] = useState(false)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [processingImage, setProcessingImage] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  // Função para extrair código do projeto de uma URL
  const extractProjectCode = useCallback((data: string): string => {
    if (data.includes('/verify/')) {
      const parts = data.split('/verify/')
      return parts[1]?.split('?')[0] || data
    } else if (data.includes('/card/')) {
      const parts = data.split('/card/')
      return parts[1]?.split('?')[0] || data
    } else if (data.includes('/qr/')) {
      const parts = data.split('/qr/')
      return parts[1]?.split('?')[0] || data
    }
    return data
  }, [])

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
    setCameraState('idle')
  }, [stopScanning])

  // Função para escanear frame do vídeo
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !mountedRef.current) return

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
      if (code.data !== lastScannedCode) {
        console.log('[QRScanner] QR Code detectado:', code.data)
        setLastScannedCode(code.data)
        stopScanning()
        
        const projectCode = extractProjectCode(code.data)
        onScan(projectCode)
        stopCamera()
        setManualInput('')
        onClose()
      }
    }
  }, [lastScannedCode, onScan, stopScanning, onClose, stopCamera, extractProjectCode])

  // Iniciar scan contínuo quando câmera ativa
  useEffect(() => {
    if (cameraState === 'active' && !scanning) {
      setScanning(true)
      setLastScannedCode(null)
      scanIntervalRef.current = setInterval(scanFrame, 150)
    }
    return () => stopScanning()
  }, [cameraState, scanning, scanFrame, stopScanning])

  // Determinar tipo de erro baseado na exceção
  const getErrorType = (err: unknown): ErrorType => {
    if (err instanceof Error) {
      const message = err.message.toLowerCase()
      const name = err.name.toLowerCase()
      
      if (name === 'notallowederror' || message.includes('permission')) {
        return 'permission'
      }
      if (name === 'notfounderror' || message.includes('not found')) {
        return 'no-camera'
      }
      if (name === 'notreadableerror' || message.includes('in use') || message.includes('could not start')) {
        return 'in-use'
      }
      if (message.includes('secure') || message.includes('https')) {
        return 'https'
      }
    }
    
    // Verificar se está em contexto seguro
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return 'https'
    }
    
    return 'unknown'
  }

  // Tentar obter câmera traseira primeiro, depois qualquer câmera
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error')
      setErrorType('https')
      return
    }

    setCameraState('requesting')
    setErrorType(null)
    
    try {
      // Primeira tentativa: câmera traseira com facingMode
      let stream: MediaStream | null = null
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      } catch {
        // Segunda tentativa: enumerar devices e escolher câmera traseira
        console.log('[QRScanner] Fallback: enumerando dispositivos...')
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(d => d.kind === 'videoinput')
        
        if (cameras.length === 0) {
          throw new Error('No camera found')
        }
        
        // Procurar câmera traseira pelo label
        const backCamera = cameras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('traseira') ||
          c.label.toLowerCase().includes('environment')
        )
        
        const deviceId = backCamera?.deviceId || cameras[0].deviceId
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      }
      
      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Aguardar vídeo carregar e iniciar (crítico para iOS Safari)
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) return reject(new Error('Video element not found'))
          
          const video = videoRef.current
          
          video.onloadedmetadata = async () => {
            try {
              await video.play()
              resolve()
            } catch (playErr) {
              reject(playErr)
            }
          }
          
          video.onerror = () => reject(new Error('Video load error'))
          
          // Timeout de segurança
          setTimeout(() => reject(new Error('Video load timeout')), 5000)
        })
        
        if (mountedRef.current) {
          setCameraState('active')
        }
      }
    } catch (err) {
      console.error('[QRScanner] Erro ao acessar câmera:', err)
      if (mountedRef.current) {
        setCameraState('error')
        setErrorType(getErrorType(err))
      }
    }
  }, [facingMode])

  // Auto-iniciar câmera quando scanner abre
  useEffect(() => {
    mountedRef.current = true
    
    if (isOpen && autoStart && cameraState === 'idle') {
      // Pequeno delay para garantir que o componente está montado
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          startCamera()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
    
    return () => {
      mountedRef.current = false
      stopCamera()
    }
  }, [isOpen, autoStart, cameraState, startCamera, stopCamera])

  // Processar imagem de QR code (fallback)
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setProcessingImage(true)
    
    try {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Falha ao carregar imagem'))
        img.src = URL.createObjectURL(file)
      })
      
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      if (!imageData) throw new Error('Falha ao processar imagem')
      
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })
      
      if (code && code.data) {
        const projectCode = extractProjectCode(code.data)
        onScan(projectCode)
        handleClose()
      } else {
        alert('Nenhum QR code encontrado na imagem. Tente outra imagem ou use a busca manual.')
      }
    } catch (err) {
      console.error('[QRScanner] Erro ao processar imagem:', err)
      alert('Erro ao processar imagem. Tente novamente.')
    } finally {
      setProcessingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClose = () => {
    stopCamera()
    setManualInput('')
    setCameraState('idle')
    setErrorType(null)
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
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashOn } as MediaTrackConstraintSet]
          })
          setFlashOn(!flashOn)
        } catch (err) {
          console.error('[QRScanner] Erro ao alternar flash:', err)
        }
      }
    }
  }

  const switchCamera = () => {
    stopCamera()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
    setTimeout(() => startCamera(), 100)
  }

  if (!isOpen) return null

  const errorInfo = errorType ? ERROR_MESSAGES[errorType] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      {/* Input oculto para upload de imagem */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        aria-label="Enviar imagem do QR Code"
      />
      
      {/* Canvas oculto para processamento do QR Code */}
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Scanner QR</h2>
              <p className="text-xs text-gray-400">Escaneie ou digite o código</p>
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
        <div className="relative aspect-square bg-carbon-900 rounded-2xl overflow-hidden mb-4">
          {cameraState === 'active' ? (
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
                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-primary rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />
                  {/* Scanning line animation */}
                  <div className="absolute inset-x-4 h-0.5 bg-primary animate-pulse top-1/2" />
                </div>
              </div>
              {/* Camera controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3">
                <button
                  onClick={toggleFlash}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
                    flashOn ? "bg-primary text-black" : "bg-white/20 text-white"
                  )}
                  aria-label="Alternar flash"
                >
                  <Flashlight className="w-5 h-5" />
                </button>
                <button
                  onClick={switchCamera}
                  className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  aria-label="Trocar câmera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : cameraState === 'requesting' ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-white font-medium">Solicitando permissão...</p>
              <p className="text-sm text-gray-400 mt-2">Permita o acesso à câmera quando solicitado</p>
            </div>
          ) : cameraState === 'error' && errorInfo ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
              <p className="text-white font-medium mb-2">{errorInfo.title}</p>
              <p className="text-sm text-gray-400 mb-4">{errorInfo.message}</p>
              <div className="flex flex-col gap-2 w-full max-w-[200px]">
                <button
                  onClick={startCamera}
                  className="bg-primary text-black px-4 py-2.5 rounded-xl font-semibold text-sm"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/10 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Enviar Imagem
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <Camera className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4 text-center text-sm">Clique para ativar a câmera</p>
              <button
                onClick={startCamera}
                className="bg-primary text-black px-6 py-3 rounded-xl font-semibold flex items-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Ativar Câmera</span>
              </button>
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="bg-carbon-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-400 text-center">
            Ou digite o código do projeto / placa
          </p>
          <div className="relative">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="PRJ-2025-001 ou ABC-1D23"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-500 text-center text-base font-mono uppercase"
              aria-label="Código do projeto ou placa"
            />
            <button
              onClick={handleManualSearch}
              disabled={!manualInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Buscar"
            >
              <Search className="w-4 h-4 text-black" />
            </button>
          </div>

          {/* Upload fallback button (sempre visível) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processingImage}
            className="w-full bg-white/5 text-gray-300 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
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

          {/* Quick suggestions */}
          {projectSuggestions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-xs text-gray-500">Projetos recentes:</p>
              <div className="grid grid-cols-2 gap-2">
                {projectSuggestions.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onScan(p.id)
                      handleClose()
                    }}
                    className="bg-white/5 rounded-lg p-2.5 text-left hover:bg-white/10 transition-colors"
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
