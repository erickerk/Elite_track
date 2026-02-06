import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock IndexedDB
const mockStore: Record<string, unknown[]> = {
  'offline-photos': [],
  'offline-data': [],
  'cached-projects': [],
}

const createMockStore = (name: string) => ({
  put: vi.fn((item: unknown) => {
    mockStore[name].push(item)
    return { onsuccess: null, onerror: null }
  }),
  get: vi.fn((key: string) => {
    const result = mockStore[name].find((i: any) => i.id === key)
    return { result, onsuccess: null, onerror: null }
  }),
  getAll: vi.fn(() => {
    const req = { result: mockStore[name], onsuccess: null as any, onerror: null as any }
    setTimeout(() => req.onsuccess?.(), 0)
    return req
  }),
  clear: vi.fn(() => { mockStore[name] = [] }),
  index: vi.fn(() => ({
    getAll: vi.fn(() => {
      const items = mockStore[name].filter((i: any) => !i.synced)
      const req = { result: items, onsuccess: null as any, onerror: null as any }
      setTimeout(() => req.onsuccess?.(), 0)
      return req
    }),
  })),
  createIndex: vi.fn(),
})

const mockTransaction = (storeName: string) => ({
  objectStore: vi.fn(() => createMockStore(storeName)),
  oncomplete: null as any,
  onerror: null as any,
})

vi.stubGlobal('indexedDB', {
  open: vi.fn(() => {
    const req = {
      result: {
        transaction: vi.fn((name: string) => {
          const tx = mockTransaction(name)
          setTimeout(() => tx.oncomplete?.(), 0)
          return tx
        }),
        objectStoreNames: { contains: vi.fn(() => true) },
        close: vi.fn(),
      },
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
    }
    setTimeout(() => req.onsuccess?.(), 0)
    return req
  }),
})

describe('offlineStorage', () => {
  beforeEach(() => {
    mockStore['offline-photos'] = []
    mockStore['offline-data'] = []
    mockStore['cached-projects'] = []
  })

  it('módulo exporta as funções esperadas', async () => {
    const mod = await import('./offlineStorage')
    expect(mod.queuePhotoForUpload).toBeDefined()
    expect(mod.getPendingPhotos).toBeDefined()
    expect(mod.markPhotoSynced).toBeDefined()
    expect(mod.cacheProjects).toBeDefined()
    expect(mod.getCachedProjects).toBeDefined()
    expect(mod.queueOfflineData).toBeDefined()
    expect(mod.getPendingCount).toBeDefined()
  })
})
