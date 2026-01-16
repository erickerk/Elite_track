// =====================================================
// ELITE TRACK - UTILITÁRIO DE COMPRESSÃO DE IMAGENS
// Otimiza imagens antes do upload para economizar espaço
// =====================================================

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputFormat?: 'jpeg' | 'webp' | 'png'
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.7,
  outputFormat: 'jpeg'
}

/**
 * Comprime uma imagem redimensionando e reduzindo qualidade
 * Reduz significativamente o tamanho do arquivo mantendo qualidade visual aceitável
 * 
 * @param file - Arquivo de imagem original
 * @param options - Opções de compressão
 * @returns Promise<File> - Arquivo comprimido
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Se não for imagem, retorna o arquivo original
  if (!file.type.startsWith('image/')) {
    console.log('[ImageCompressor] Arquivo não é imagem, retornando original')
    return file
  }

  // Se for GIF ou SVG, não comprimir (perda de qualidade/animação)
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    console.log('[ImageCompressor] GIF/SVG não suportado para compressão')
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        try {
          // Calcular novas dimensões mantendo proporção
          let { width, height } = img
          const maxW = opts.maxWidth!
          const maxH = opts.maxHeight!

          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          // Criar canvas para redimensionar
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            console.error('[ImageCompressor] Falha ao criar contexto canvas')
            resolve(file)
            return
          }

          // Configurar qualidade de renderização
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height)

          // Converter para blob comprimido
          const mimeType = opts.outputFormat === 'webp' 
            ? 'image/webp' 
            : opts.outputFormat === 'png' 
              ? 'image/png' 
              : 'image/jpeg'

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error('[ImageCompressor] Falha ao criar blob')
                resolve(file)
                return
              }

              // Gerar nome do arquivo comprimido
              const extension = opts.outputFormat === 'webp' ? 'webp' : opts.outputFormat === 'png' ? 'png' : 'jpg'
              const baseName = file.name.replace(/\.[^/.]+$/, '')
              const newName = `${baseName}_compressed.${extension}`

              const compressedFile = new File([blob], newName, { type: mimeType })

              // Log de economia
              const originalSize = file.size
              const compressedSize = compressedFile.size
              const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
              
              console.log(`[ImageCompressor] Comprimido: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${savings}% economia)`)

              resolve(compressedFile)
            },
            mimeType,
            opts.quality
          )
        } catch (error) {
          console.error('[ImageCompressor] Erro na compressão:', error)
          resolve(file) // Fallback para original em caso de erro
        }
      }

      img.onerror = () => {
        console.error('[ImageCompressor] Erro ao carregar imagem')
        resolve(file)
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      console.error('[ImageCompressor] Erro ao ler arquivo')
      resolve(file)
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file, options)))
}

/**
 * Comprime uma imagem especificamente para fotos de timeline/etapas
 * Usa configurações otimizadas para qualidade vs tamanho
 */
export async function compressStepPhoto(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.75,
    outputFormat: 'jpeg'
  })
}

/**
 * Comprime uma imagem para anexos de chat (menor qualidade, mais rápido)
 */
export async function compressChatImage(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.65,
    outputFormat: 'jpeg'
  })
}

/**
 * Comprime uma imagem de veículo (maior qualidade para destaque)
 */
export async function compressVehicleImage(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 0.8,
    outputFormat: 'jpeg'
  })
}

/**
 * Comprime uma imagem para thumbnail (miniatura)
 */
export async function compressThumbnail(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.6,
    outputFormat: 'jpeg'
  })
}

/**
 * Verifica se a imagem precisa de compressão
 * Retorna true se o arquivo for maior que o limite
 */
export function needsCompression(file: File, maxSizeKB: number = 500): boolean {
  return file.size > maxSizeKB * 1024
}

/**
 * Formata tamanho de arquivo para exibição
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Obtém dimensões de uma imagem a partir de um File
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Estima o tamanho final após compressão
 * Útil para mostrar preview ao usuário
 */
export async function estimateCompressedSize(file: File, options: CompressionOptions = {}): Promise<number> {
  const compressed = await compressImage(file, options)
  return compressed.size
}
