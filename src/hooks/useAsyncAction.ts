import { useCallback, useState } from 'react'

export function useAsyncAction() {
  const [pendingActions, setPendingActions] = useState<Set<string>>(() => new Set())

  const run = useCallback(async <T>(key: string, action: () => Promise<T>) => {
    setPendingActions((current) => new Set(current).add(key))
    try {
      return await action()
    } finally {
      setPendingActions((current) => {
        const next = new Set(current)
        next.delete(key)
        return next
      })
    }
  }, [])

  const isPending = useCallback(
    (key?: string) => (key ? pendingActions.has(key) : pendingActions.size > 0),
    [pendingActions],
  )

  return { run, isPending }
}
