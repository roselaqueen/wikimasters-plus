import { useEffect, useState } from 'react'
import { queryCollection, queryGlobalCards } from '../services/cardsApi'
import type { Card, Rarity } from '../types/domain'

type CardsQuery = {
  collectionOnly: boolean
  page: number
  query: string
  rarity?: Rarity
  sort: string
  enabled?: boolean
}

export function useCardsQuery({
  collectionOnly,
  page,
  query,
  rarity,
  sort,
  enabled = true,
}: CardsQuery) {
  const [cards, setCards] = useState<Card[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    const request = collectionOnly ? queryCollection : queryGlobalCards

    request({ page, query, rarity, sort })
      .then((result) => {
        if (!active) return
        setCards(result.cards)
        setTotal(result.total)
        setError('')
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'Recherche impossible')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [collectionOnly, enabled, page, query, rarity, sort])

  return { cards, total, loading, error }
}
