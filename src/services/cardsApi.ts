import { apiGet } from './api'
import type { Card, Rarity } from '../types/domain'

const noImagePath = `${import.meta.env.BASE_URL}cards/no-image.svg`

type ApiCard = {
  id: string
  atk: number
  def: number
  rarity: Rarity
  summary: string | null
  category: string | null
  image_url: string | null
  wikipedia_title: string
  wikipedia_url: string
}
type CardsResponse = {
  cards: ApiCard[]
  total: number | null
  searchHasMore?: boolean
  quantities: Record<string, number>
  ownedCardIds: string[]
  wishlistCardIds: string[]
  friendOwners: Record<string, unknown>
}
type CollectionResponse = {
  collection: unknown[]
  total: number | null
  rarityCounts?: Record<string, number>
}
type CollectionStatsResponse = { total: number; rarityCounts: Record<string, number> }
export type CardQuery = { page?: number; query?: string; rarity?: Rarity; sort?: string }

function ownerNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item]
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>
      const name = record.username ?? record.display_name ?? record.name
      return typeof name === 'string' ? [name] : []
    }
    return []
  })
}

function mapResponse(data: CardsResponse, page = 0): { cards: Card[]; total: number } {
  const wanted = new Set(data.wishlistCardIds ?? [])
  const owned = new Set(data.ownedCardIds ?? [])
  const minimumTotal = page * 50 + data.cards.length + (data.searchHasMore ? 1 : 0)
  return {
    total: typeof data.total === 'number' ? data.total : minimumTotal,
    cards: data.cards.map((card) => ({
      id: card.id,
      title: card.wikipedia_title,
      description: card.summary ?? card.category ?? 'Article Wikipédia',
      image: card.image_url ?? noImagePath,
      rarity: card.rarity,
      atk: card.atk,
      def: card.def,
      owned: owned.has(card.id) ? 1 : 0,
      totalCopies: data.quantities?.[card.id] ?? 0,
      wanted: wanted.has(card.id),
      contacts: ownerNames(data.friendOwners?.[card.id]),
      category: card.category ?? 'Wikipédia',
    })),
  }
}

export async function loadCards(): Promise<{ cards: Card[]; total: number }> {
  return mapResponse(await apiGet<CardsResponse>('/cards?page=0&sort=rarity'))
}

export async function queryGlobalCards({
  page = 0,
  query = '',
  rarity,
  sort = 'rarity',
}: CardQuery): Promise<{ cards: Card[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), sort })
  if (query.trim()) params.set('q', query.trim())
  if (rarity) params.set('rarity', rarity)
  return mapResponse(await apiGet<CardsResponse>(`/cards?${params}`), page)
}

export async function searchCards(query: string, rarity?: Rarity): Promise<Card[]> {
  return (await queryGlobalCards({ query, rarity })).cards
}

export async function loadOfficialWishlistCardIds(): Promise<string[]> {
  const cards = await apiGet<ApiCard[]>('/cards?page=0&sort=rarity&wishlist=1')
  return [...new Set(cards.map((card) => card.id))]
}

export function mapCollectionItem(value: unknown): Card | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const raw = (
    row.card && typeof row.card === 'object' ? row.card : row
  ) as Partial<ApiCard> & Record<string, unknown>
  if (typeof raw.id !== 'string' || typeof raw.wikipedia_title !== 'string') return null
  const quantity = Number(row.quantity ?? row.count ?? row.qty ?? 1)
  return {
    id: raw.id,
    title: raw.wikipedia_title,
    description: raw.summary ?? raw.category ?? 'Article Wikipédia',
    image: raw.image_url ?? noImagePath,
    rarity: (raw.rarity ?? 'C') as Rarity,
    atk: Number(raw.atk ?? 0),
    def: Number(raw.def ?? 0),
    owned: Number.isFinite(quantity) ? quantity : 1,
    totalCopies: undefined,
    wanted: false,
    contacts: [],
    category: raw.category ?? 'Wikipédia',
  }
}

export async function queryFriendCollection(
  username: string,
  { page = 0, query = '', rarity, sort = 'rarity' }: CardQuery = {},
): Promise<{ cards: Card[]; total: number }> {
  const params = new URLSearchParams({
    page: String(page),
    sort,
    stats: page === 0 ? '1' : '0',
    pending: '1',
  })
  if (query.trim()) params.set('q', query.trim())
  if (rarity) params.set('rarity', rarity)
  const data = await apiGet<CollectionResponse>(
    `/profile/${encodeURIComponent(username)}/collection?${params}`,
  )
  return {
    cards: data.collection
      .map(mapCollectionItem)
      .filter((card): card is Card => Boolean(card)),
    total: typeof data.total === 'number' ? data.total : 0,
  }
}

export async function queryCollection({
  page = 0,
  query = '',
  rarity,
  sort = 'rarity',
}: CardQuery): Promise<{ cards: Card[]; total: number }> {
  const params = new URLSearchParams({ sort, page: String(page), stats: '0' })
  if (query.trim()) params.set('q', query.trim())
  if (rarity) params.set('rarity', rarity)
  const statsParams = new URLSearchParams({ sort })
  if (query.trim()) statsParams.set('q', query.trim())
  if (rarity) statsParams.set('rarity', rarity)
  const [data, stats] = await Promise.all([
    apiGet<CollectionResponse>(`/my-collection?${params}`),
    apiGet<CollectionStatsResponse>(`/my-collection/stats?${statsParams}`),
  ])
  const mapped = data.collection
    .map(mapCollectionItem)
    .filter((card): card is Card => Boolean(card))
  return {
    cards: mapped,
    total: typeof data.total === 'number' ? data.total : stats.total,
  }
}

const wishlistCardCache = new Map<string, Card>()
const wishlistCardPending = new Map<string, Promise<Card>>()

export async function loadWishlistCard(id: string, accountId: string): Promise<Card> {
  const cacheKey = `${accountId}:${id}`
  const cached = wishlistCardCache.get(cacheKey)
  if (cached) return cached
  const pending = wishlistCardPending.get(cacheKey)
  if (pending) return pending
  const request = (async () => {
    const detail = await apiGet<ApiCard>(`/cards/${encodeURIComponent(id)}`)
    const exact = (await searchCards(detail.wikipedia_title)).find(
      (card) => card.id === id,
    )
    const card = exact ?? {
      id: detail.id,
      title: detail.wikipedia_title,
      description: detail.summary ?? detail.category ?? 'Article Wikipédia',
      image: detail.image_url ?? noImagePath,
      rarity: detail.rarity,
      atk: detail.atk,
      def: detail.def,
      owned: 0,
      totalCopies: 0,
      wanted: false,
      contacts: [],
      category: detail.category ?? 'Wikipédia',
    }
    wishlistCardCache.set(cacheKey, card)
    return card
  })()
  wishlistCardPending.set(cacheKey, request)
  try {
    return await request
  } finally {
    wishlistCardPending.delete(cacheKey)
  }
}

export async function loadWishlistCards(
  ids: string[],
  accountId: string,
  concurrency = 4,
): Promise<Card[]> {
  const results = new Array<Card>(ids.length)
  let nextIndex = 0

  const worker = async () => {
    while (nextIndex < ids.length) {
      const index = nextIndex++
      results[index] = await loadWishlistCard(ids[index], accountId)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, ids.length) }, () => worker()),
  )
  return results
}
