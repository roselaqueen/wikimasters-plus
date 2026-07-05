import { useCallback, useEffect, useState } from 'react'
import { getTrades } from '../services/tradeApi'
import type { Trade } from '../types/domain'

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setTrades(await getTrades())
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { trades, loading, error, reload }
}
