import type { Tool } from './catalog'
export type Values = Record<string, string>
export function newId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
export interface Draft {
  id: string
  version: 1
  tool: Tool
  name: string
  values: Values
  updated: number
  needsFiles: boolean
}
export interface DraftStore {
  list(): Promise<Draft[]>
  get(id: string): Promise<Draft | undefined>
  put(draft: Draft): Promise<void>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}
function request<T>(
  mode: IDBTransactionMode,
  action: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open('professora-facil', 1)
    opening.onupgradeneeded = () =>
      opening.result.createObjectStore('drafts', { keyPath: 'id' })
    opening.onerror = () => reject(opening.error)
    opening.onblocked = () => reject(new Error('Armazenamento local ocupado.'))
    opening.onsuccess = () => {
      const db = opening.result
      const transaction = db.transaction('drafts', mode)
      const result = action(transaction.objectStore('drafts'))
      transaction.oncomplete = () => {
        db.close()
        resolve(result.result)
      }
      transaction.onabort = () => {
        db.close()
        reject(transaction.error)
      }
    }
  })
}
export const drafts: DraftStore = {
  list: async () =>
    ((await request('readonly', (store) => store.getAll())) as Draft[]).sort(
      (a, b) => b.updated - a.updated,
    ),
  get: (id) => request('readonly', (store) => store.get(id)),
  put: async (draft) => {
    await request('readwrite', (store) => store.put(draft))
  },
  remove: async (id) => {
    await request('readwrite', (store) => store.delete(id))
  },
  clear: async () => {
    await request('readwrite', (store) => store.clear())
  },
}
