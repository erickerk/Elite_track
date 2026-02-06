import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compressImage } from './imageCompression'

// Mock createImageBitmap
const mockBitmap = {
  width: 3000,
  height: 2000,
  close: vi.fn(),
}

// Mock OffscreenCanvas
const mockConvertToBlob = vi.fn()
const mockDrawImage = vi.fn()
const mockGetContext = vi.fn(() => ({ drawImage: mockDrawImage }))

vi.stubGlobal('createImageBitmap', vi.fn(() => Promise.resolve(mockBitmap)))

class MockOffscreenCanvas {
  width: number
  height: number
  constructor(w: number, h: number) {
    this.width = w
    this.height = h
  }
  getContext() { return mockGetContext() }
  convertToBlob(opts?: any) { return mockConvertToBlob(opts) }
}
vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas)

describe('imageCompression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna o arquivo original se já estiver abaixo do limite', async () => {
    const smallFile = new File(['x'.repeat(100)], 'small.jpg', { type: 'image/jpeg' })
    // 100 bytes < 500KB, deve retornar direto
    const result = await compressImage(smallFile, { maxSizeKB: 500 })
    expect(result).toBe(smallFile)
  })

  it('comprime arquivo acima do limite', async () => {
    // Criar arquivo de 1MB
    const largeContent = new Uint8Array(1024 * 1024)
    const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })

    // Mock convertToBlob retornando blob menor
    const compressedBlob = new Blob(['compressed'], { type: 'image/jpeg' })
    mockConvertToBlob.mockResolvedValue(compressedBlob)

    const result = await compressImage(largeFile, { maxSizeKB: 500 })

    expect(result.size).toBeLessThan(largeFile.size)
    expect(result.name).toMatch(/\.jpg$/)
    expect(mockDrawImage).toHaveBeenCalled()
    expect(mockBitmap.close).toHaveBeenCalled()
  })

  it('calcula dimensões corretas mantendo aspect ratio', async () => {
    const largeContent = new Uint8Array(1024 * 1024)
    const largeFile = new File([largeContent], 'wide.png', { type: 'image/png' })

    const compressedBlob = new Blob(['x'], { type: 'image/jpeg' })
    mockConvertToBlob.mockResolvedValue(compressedBlob)

    // Verificar que drawImage foi chamado (indica que o canvas foi criado e usado)
    await compressImage(largeFile, { maxWidth: 1920, maxHeight: 1920 })

    // O bitmap 3000x2000 com max 1920 deve ser escalado para 1920x1280
    // drawImage é chamado com (bitmap, 0, 0, width, height)
    expect(mockDrawImage).toHaveBeenCalledWith(mockBitmap, 0, 0, 1920, 1280)
  })

  it('usa qualidade mínima de 0.3 se o arquivo não comprimir o suficiente', async () => {
    const largeContent = new Uint8Array(2 * 1024 * 1024)
    const largeFile = new File([largeContent], 'huge.jpg', { type: 'image/jpeg' })

    // Sempre retorna blob grande (nunca atinge o limite)
    const bigBlob = new Blob([new Uint8Array(600 * 1024)], { type: 'image/jpeg' })
    mockConvertToBlob.mockResolvedValue(bigBlob)

    await compressImage(largeFile, { maxSizeKB: 100 })

    // Deve ter sido chamado múltiplas vezes (reduzindo qualidade iterativamente)
    expect(mockConvertToBlob.mock.calls.length).toBeGreaterThan(1)
  })
})
