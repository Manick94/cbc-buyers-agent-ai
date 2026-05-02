const DB_NAME = 'bac_local_models'
const DB_VERSION = 1
const STORE = 'model_files'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function storeFile(key: string, buffer: ArrayBuffer): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(buffer, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getFile(key: string): Promise<ArrayBuffer | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve((req.result as ArrayBuffer) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function listKeysWithPrefix(prefix: string): Promise<string[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAllKeys()
    req.onsuccess = () => resolve((req.result as string[]).filter(k => k.startsWith(prefix)))
    req.onerror = () => reject(req.error)
  })
}

export async function clearPrefix(prefix: string): Promise<void> {
  const db = await openDB()
  const keys = await listKeysWithPrefix(prefix)
  if (keys.length === 0) return
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    keys.forEach(k => tx.objectStore(STORE).delete(k))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function isModelStored(prefix: string): Promise<boolean> {
  const keys = await listKeysWithPrefix(prefix + '/')
  return keys.length > 0
}
