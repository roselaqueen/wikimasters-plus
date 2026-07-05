import type { Wishlist } from '../types/domain'
import { BACKEND_URL, backendRequest } from './api'

const DB_NAME = 'wikimasters-plus'
const DB_VERSION = 1
const STORE = 'wishlists'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' })
        store.createIndex('ownerId', 'ownerId')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

type StoredWishlist = Wishlist & { key: string }
const withKey = (list: Wishlist): StoredWishlist => ({
  ...list,
  key: `${list.ownerId}:${list.id}`,
})

export async function getWishlists(ownerId: string): Promise<Wishlist[]> {
  if (BACKEND_URL) return backendRequest<Wishlist[]>('/wishlists')
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE)
      .objectStore(STORE)
      .index('ownerId')
      .getAll(ownerId)
    request.onsuccess = () =>
      resolve(
        (request.result as StoredWishlist[])
          .map(({ key: _key, ...list }) => list)
          .sort((a, b) => b.updatedAt - a.updatedAt),
      )
    request.onerror = () => reject(request.error)
  })
}

export async function putWishlist(list: Wishlist): Promise<void> {
  if (BACKEND_URL) {
    await backendRequest('/wishlists', { method: 'PUT', body: JSON.stringify(list) })
    return
  }
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE, 'readwrite')
      .objectStore(STORE)
      .put(withKey(list))
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteWishlist(ownerId: string, id: string): Promise<void> {
  if (BACKEND_URL) {
    await backendRequest(`/wishlists/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return
  }
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE, 'readwrite')
      .objectStore(STORE)
      .delete(`${ownerId}:${id}`)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
