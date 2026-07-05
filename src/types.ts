export type Rarity = 'L' | 'UR' | 'SR' | 'R' | 'PC' | 'C'
export type Card = {
  id: string
  title: string
  description: string
  image: string
  rarity: Rarity
  atk: number
  def: number
  owned: number
  wanted: boolean
  contacts: string[]
  category: string
}
export type Page = 'cards' | 'collection' | 'wishlists' | 'trades'
export type Settings = {
  theme: 'light' | 'dark'
  density: 'comfortable' | 'compact'
  cardStyle: 'editorial' | 'classic'
  accent: string
  banner: string
  background: boolean
}
export type Wishlist = {
  id: string
  ownerId: string
  name: string
  cardIds: string[]
  createdAt: number
  updatedAt: number
  sourceOwnerId?: string
  sourceListId?: string
  sourceUsername?: string
  readOnly?: boolean
}
export type Friend = { id: string; username: string; avatarUrl: string | null }
export type TradeItem = { card_id: string; offered_by: string; card?: unknown }
export type Trade = {
  id: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'countered' | 'expired'
  initiator_id: string
  recipient_id: string
  initiator?: { username: string }
  recipient?: { username: string }
  initiator_wikibidous: number
  recipient_wikibidous: number
  items: TradeItem[]
  created_at: string
}
