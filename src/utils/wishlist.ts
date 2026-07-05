import type { Card, Wishlist } from '../types/domain'

export function makeWishlist(
  ownerId: string,
  name: string,
  cardIds: string[] = [],
): Wishlist {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    ownerId,
    name,
    cardIds,
    createdAt: now,
    updatedAt: now,
  }
}

export function groupCardsByOwner(cards: Card[]): Array<[string, string[]]> {
  const cardsByOwner = new Map<string, string[]>()

  cards.forEach((card) => {
    card.contacts.forEach((contact) => {
      cardsByOwner.set(contact, [...(cardsByOwner.get(contact) ?? []), card.title])
    })
  })

  return [...cardsByOwner.entries()].sort((a, b) => b[1].length - a[1].length)
}

export function formatOwnersText(owners: Array<[string, string[]]>): string {
  return owners.map(([owner, cards]) => `${owner} : ${cards.join(', ')}`).join('\n')
}
