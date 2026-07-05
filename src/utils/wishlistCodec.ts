import type { Wishlist } from '../types/domain'

function encodePayload(payload: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function decodePayload<T>(value: string): T {
  const encoded = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as T
}

export function encodeWishlist(list: Wishlist): string {
  return `WML1.${encodePayload({ v: 1, n: list.name, c: list.cardIds })}`
}

export function encodeDynamicWishlist(list: Wishlist, username: string): string {
  return `WMD1.${encodePayload({
    v: 1,
    o: list.sourceOwnerId ?? list.ownerId,
    l: list.sourceListId ?? list.id,
    u: list.sourceUsername ?? username,
  })}`
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
    const data = decodePayload<{ v?: number; o?: unknown; l?: unknown; u?: unknown }>(
      compact.slice(5),
    )
    if (
      data.v !== 1 ||
      typeof data.o !== 'string' ||
      typeof data.l !== 'string' ||
      typeof data.u !== 'string'
    ) {
      throw new Error('Lien dynamique invalide ou incompatible.')
    }
    return {
      kind: 'dynamic',
      sourceOwnerId: data.o,
      sourceListId: data.l,
      sourceUsername: data.u.slice(0, 80),
    }
  }

  if (!compact.startsWith('WML1.')) throw new Error('Format de liste non reconnu.')
  const data = decodePayload<{ v?: number; n?: unknown; c?: unknown }>(compact.slice(5))
  if (
    data.v !== 1 ||
    typeof data.n !== 'string' ||
    !Array.isArray(data.c) ||
    !data.c.every((id) => typeof id === 'string')
  ) {
    throw new Error('Liste invalide ou incompatible.')
  }
  return { kind: 'static', name: data.n.slice(0, 80), cardIds: [...new Set(data.c)] }
}
