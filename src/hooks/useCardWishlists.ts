import { useCallback, useEffect, useMemo, useState } from 'react'
import { getWishlists, putWishlist } from '../services/wishlistRepository'
import type { Wishlist } from '../types/domain'
import { makeWishlist } from '../utils/wishlist'

export function useCardWishlists(ownerId: string, cardId: string) {
  const [lists, setLists] = useState<Wishlist[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setLists(await getWishlists(ownerId))
    } finally {
      setLoading(false)
    }
  }, [ownerId])

  useEffect(() => {
    void reload()
  }, [reload])

  const editableLists = useMemo(() => lists.filter((list) => !list.readOnly), [lists])

  const toggle = async (list: Wishlist) => {
    setSavingId(list.id)
    try {
      const containsCard = list.cardIds.includes(cardId)
      const next = {
        ...list,
        cardIds: containsCard
          ? list.cardIds.filter((id) => id !== cardId)
          : [...list.cardIds, cardId],
        updatedAt: Date.now(),
      }
      await putWishlist(next)
      setLists((current) => current.map((item) => (item.id === next.id ? next : item)))
    } finally {
      setSavingId('')
    }
  }

  const create = async (name: string) => {
    setSavingId('new')
    try {
      const next = makeWishlist(ownerId, name, [cardId])
      await putWishlist(next)
      setLists((current) => [next, ...current])
    } finally {
      setSavingId('')
    }
  }

  return { lists: editableLists, loading, savingId, toggle, create }
}
