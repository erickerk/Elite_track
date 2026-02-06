/**
 * Serviço de armazenamento offline usando IndexedDB.
 * Permite que o app funcione sem internet, sincronizando dados quando voltar online.
 */

const DB_NAME = 'elitetrack-offline'
const DB_VERSION = 1

interface OfflinePhoto {
  id: string
  projectId: string
  stepId: string
  category: string
  description: string
  fileData: ArrayBuffer
  fileName: string
  fileType: string
  createdAt: string
  synced: boolean
}

interface OfflineData {
  id: string
  type: string
  data: unknown
  createdAt: string
  synced: boolean
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('offline-photos')) {
        const photoStore = db.createObjectStore('offline-photos', { keyPath: 'id' })
        photoStore.createIndex('projectId', 'projectId', { unique: false })
        photoStore.createIndex('synced', 'synced', { unique: false })
      }

      if (!db.objectStoreNames.contains('offline-data')) {
        const dataStore = db.createObjectStore('offline-data', { keyPath: 'id' })
        dataStore.createIndex('type', 'type', { unique: false })
        dataStore.createIndex('synced', 'synced', { unique: false })
      }

      if (!db.objectStoreNames.contains('cached-projects')) {
        db.createObjectStore('cached-projects', { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Salva uma foto na fila de upload offline.
 */
export async function queuePhotoForUpload(photo: Omit<OfflinePhoto, 'synced'>): Promise<void> {
  const db = await openDB()
  const tx = db.transaction('offline-photos', 'readwrite')
  const store = tx.objectStore('offline-photos')
  store.put({ ...photo, synced: false })
  await txComplete(tx)
  db.close()

  // Tentar sincronizar via Background Sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready
    try {
      await (reg as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-photos')
    } catch {
      console.warn('[OfflineStorage] Background Sync não disponível')
    }
  }
}

/**
 * Retorna fotos pendentes de upload.
 */
export async function getPendingPhotos(): Promise<OfflinePhoto[]> {
  const db = await openDB()
  const tx = db.transaction('offline-photos', 'readonly')
  const store = tx.objectStore('offline-photos')
  const index = store.index('synced')
  const request = index.getAll(IDBKeyRange.only(false))

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close()
      resolve(request.result)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

/**
 * Marca uma foto como sincronizada.
 */
export async function markPhotoSynced(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction('offline-photos', 'readwrite')
  const store = tx.objectStore('offline-photos')
  const photo = await getRecord<OfflinePhoto>(store, id)
  if (photo) {
    store.put({ ...photo, synced: true })
  }
  await txComplete(tx)
  db.close()
}

/**
 * Salva dados de projetos no cache local para uso offline.
 */
export async function cacheProjects(projects: unknown[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction('cached-projects', 'readwrite')
  const store = tx.objectStore('cached-projects')
  store.clear()
  for (const project of projects) {
    store.put(project)
  }
  await txComplete(tx)
  db.close()
}

/**
 * Retorna projetos do cache local.
 */
export async function getCachedProjects<T>(): Promise<T[]> {
  const db = await openDB()
  const tx = db.transaction('cached-projects', 'readonly')
  const store = tx.objectStore('cached-projects')
  const request = store.getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close()
      resolve(request.result as T[])
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

/**
 * Salva dado genérico na fila offline.
 */
export async function queueOfflineData(data: Omit<OfflineData, 'synced'>): Promise<void> {
  const db = await openDB()
  const tx = db.transaction('offline-data', 'readwrite')
  tx.objectStore('offline-data').put({ ...data, synced: false })
  await txComplete(tx)
  db.close()
}

/**
 * Retorna total de itens pendentes de sincronização.
 */
export async function getPendingCount(): Promise<number> {
  const photos = await getPendingPhotos()
  return photos.length
}

// --- Helpers ---

function getRecord<T>(store: IDBObjectStore, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
