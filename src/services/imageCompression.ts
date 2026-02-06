/**
 * Serviço de compressão de imagens para o Elite Track.
 * Comprime fotos antes do upload para Supabase Storage,
 * reduzindo consumo de bandwidth e melhorando performance mobile.
 *
 * Target: < 500KB por foto | Qualidade: 80% | Max: 1920px
 */

interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
  outputType?: 'image/jpeg' | 'image/webp'
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeKB: 500,
  outputType: 'image/jpeg',
}

/**
 * Comprime uma imagem File para menos de maxSizeKB.
 * Retorna um novo File comprimido.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Se já está abaixo do limite, retorna direto
  if (file.size <= opts.maxSizeKB * 1024) {
    console.log(`[ImageCompression] Arquivo já está dentro do limite: ${(file.size / 1024).toFixed(1)}KB`)
    return file
  }

  console.log(`[ImageCompression] Comprimindo: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`)

  const bitmap = await createImageBitmap(file)
  const { width, height } = calculateDimensions(
    bitmap.width,
    bitmap.height,
    opts.maxWidth,
    opts.maxHeight
  )

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível criar contexto 2D')

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Compressão iterativa: reduz qualidade até ficar abaixo do limite
  let quality = opts.quality
  let blob: Blob

  do {
    blob = await canvas.convertToBlob({
      type: opts.outputType,
      quality,
    })

    if (blob.size <= opts.maxSizeKB * 1024) break

    quality -= 0.05
    if (quality < 0.3) break // Qualidade mínima
  } while (blob.size > opts.maxSizeKB * 1024)

  const compressedFile = new File([blob], sanitizeFileName(file.name, opts.outputType), {
    type: opts.outputType,
    lastModified: Date.now(),
  })

  const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
  console.log(
    `[ImageCompression] Resultado: ${(compressedFile.size / 1024).toFixed(1)}KB ` +
    `(redução de ${reduction}%, qualidade: ${(quality * 100).toFixed(0)}%)`
  )

  return compressedFile
}

/**
 * Comprime e retorna uma Data URL para preview rápido.
 */
export async function compressImageToDataURL(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const compressed = await compressImage(file, { ...options, maxSizeKB: 200, maxWidth: 800, maxHeight: 800 })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(compressed)
  })
}

/**
 * Calcula dimensões mantendo aspect ratio.
 */
function calculateDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (srcWidth <= maxWidth && srcHeight <= maxHeight) {
    return { width: srcWidth, height: srcHeight }
  }

  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
  }
}

/**
 * Sanitiza nome do arquivo para o formato de saída.
 */
function sanitizeFileName(originalName: string, outputType: string): string {
  const ext = outputType === 'image/webp' ? '.webp' : '.jpg'
  const baseName = originalName.replace(/\.[^.]+$/, '')
  return `${baseName}${ext}`
}
