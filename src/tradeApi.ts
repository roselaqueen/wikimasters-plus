import { apiGet, apiRequest } from './api'
import type { Friend, Trade } from './types'

type Friendship = {
  requester_id: string
  addressee_id: string
  status: string
  requester: { id: string; username: string; avatar_url: string | null }
  addressee: { id: string; username: string; avatar_url: string | null }
}

export async function getFriends(currentUserId: string): Promise<Friend[]> {
  const data = await apiGet<{ friendships: Friendship[] }>('/friends')
  return (data.friendships ?? [])
    .filter((item) => item.status === 'accepted')
    .map((item) => {
      const profile =
        item.requester_id === currentUserId ? item.addressee : item.requester
      return { id: profile.id, username: profile.username, avatarUrl: profile.avatar_url }
    })
}
export async function getTrades(): Promise<Trade[]> {
  return (await apiGet<{ trades: Trade[] }>('/trades')).trades ?? []
}
export async function createTrade(input: {
  recipientId: string
  currentUserId: string
  offeredCardIds: string[]
  requestedCardIds: string[]
  offeredCredits: number
  requestedCredits: number
}) {
  return apiRequest<{ trade: Trade }>('/trades', {
    method: 'POST',
    body: JSON.stringify({
      recipient_id: input.recipientId,
      items: [
        ...input.offeredCardIds.map((card_id) => ({
          card_id,
          offered_by: input.currentUserId,
        })),
        ...input.requestedCardIds.map((card_id) => ({
          card_id,
          offered_by: input.recipientId,
        })),
      ],
      initiator_wikibidous: input.offeredCredits,
      recipient_wikibidous: input.requestedCredits,
    }),
  })
}
export async function updateTrade(id: string, action: 'accept' | 'decline' | 'cancel') {
  return apiRequest(`/trades/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  })
}
