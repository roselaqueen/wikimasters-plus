import type { Wishlist } from './types'
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

export function encodeWishlist(list: Wishlist): string {
  const payload = JSON.stringify({ v: 1, n: list.name, c: list.cardIds })
  const bytes = new TextEncoder().encode(payload)
  let binary = ''
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return `WML1.${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`
}

export function encodeDynamicWishlist(list: Wishlist, username: string): string {
  const payload = JSON.stringify({
    v: 1,
    o: list.sourceOwnerId ?? list.ownerId,
    l: list.sourceListId ?? list.id,
    u: list.sourceUsername ?? username,
  })
  const bytes = new TextEncoder().encode(payload)
  let binary = ''
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return `WMD1.${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`
}

export function decodeWishlist(value: string):
  | { kind: 'static'; name: string; cardIds: string[] }
  | {
      kind: 'dynamic'
      sourceOwnerId: string
      sourceListId: string
      sourceUsername: string
    } {
  const compact = value.trim()
  if (compact.startsWith('WMD1.')) {
    const encoded = compact.slice(5).replaceAll('-', '+').replaceAll('_', '/')
    const binary = atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const data = JSON.parse(new TextDecoder().decode(bytes)) as {
      v?: number
      o?: unknown
      l?: unknown
      u?: unknown
    }
    if (
      data.v !== 1 ||
      typeof data.o !== 'string' ||
      typeof data.l !== 'string' ||
      typeof data.u !== 'string'
    )
      throw new Error('Lien dynamique invalide ou incompatible.')
    return {
      kind: 'dynamic',
      sourceOwnerId: data.o,
      sourceListId: data.l,
      sourceUsername: data.u.slice(0, 80),
    }
  }
  if (!compact.startsWith('WML1.')) throw new Error('Format de liste non reconnu.')
  const encoded = compact.slice(5).replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  const data = JSON.parse(new TextDecoder().decode(bytes)) as {
    v?: number
    n?: unknown
    c?: unknown
  }
  if (
    data.v !== 1 ||
    typeof data.n !== 'string' ||
    !Array.isArray(data.c) ||
    !data.c.every((id) => typeof id === 'string')
  )
    throw new Error('Liste invalide ou incompatible.')
  return { kind: 'static', name: data.n.slice(0, 80), cardIds: [...new Set(data.c)] }
}
