import { useEffect, useState } from 'react'
import { loadWishlistCard, mapCollectionItem } from '../services/cardsApi'
import type { Card, Trade } from '../types/domain'

export function useTradeCards(trades: Trade[], accountId: string) {
  const [cards, setCards] = useState<Map<string, Card>>(() => new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const items = trades.flatMap((trade) => trade.items)
    if (!items.length) return
    let active = true
    setLoading(true)

    Promise.all(
      items.map(async (item) => {
        const embedded = mapCollectionItem(item.card)
        try {
          return [
            item.card_id,
            embedded ?? (await loadWishlistCard(item.card_id, accountId)),
          ] as const
        } catch {
          return null
        }
      }),
    )
      .then((entries) => {
        if (active) {
          setCards(
            new Map(
              entries.filter((entry): entry is readonly [string, Card] => entry !== null),
            ),
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [accountId, trades])

  return { cards, loading }
}
