import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Check, Clock, Plus, X } from 'lucide-react'
import { updateTrade } from '../services/tradeApi'
import TradeComposer from '../components/trades/TradeComposer'
import type { Trade, TradeDraft } from '../types/domain'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useTrades } from '../hooks/useTrades'

export default function TradesPage({
  currentUserId,
  initialDraft,
  onDraftConsumed,
}: {
  currentUserId: string
  initialDraft?: TradeDraft | null
  onDraftConsumed: () => void
}) {
  const { trades, loading, error, reload } = useTrades()
  const { run, isPending } = useAsyncAction()
  const [tab, setTab] = useState<'received' | 'sent' | 'history'>('received')
  const [composer, setComposer] = useState(Boolean(initialDraft))
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (initialDraft) setComposer(true)
  }, [initialDraft])
  const filtered = useMemo(
    () =>
      trades.filter((trade) =>
        tab === 'history'
          ? trade.status !== 'pending'
          : trade.status === 'pending' &&
            (tab === 'received'
              ? trade.recipient_id === currentUserId
              : trade.initiator_id === currentUserId),
      ),
    [trades, tab, currentUserId],
  )
  const act = async (trade: Trade, action: 'accept' | 'decline' | 'cancel') => {
    if (
      !confirm(
        `${action === 'accept' ? 'Accepter' : action === 'decline' ? 'Refuser' : 'Annuler'} cet échange ?`,
      )
    )
      return
    await run(`trade-${trade.id}`, async () => {
      await updateTrade(trade.id, action)
      setNotice('Échange mis à jour.')
      await reload()
    })
  }
  return (
    <div className="trades-page">
      <div className="trades-heading">
        <div>
          <h1>Échanges</h1>
          <p>Gérez vos offres d’échange avec vos amis.</p>
        </div>
        <button className="button primary" onClick={() => setComposer(true)}>
          <Plus />
          Proposer un échange
        </button>
      </div>
      <nav className="trade-page-tabs">
        <button
          className={tab === 'received' ? 'active' : ''}
          onClick={() => setTab('received')}
        >
          Reçues
        </button>
        <button className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')}>
          Envoyées
        </button>
        <button
          className={tab === 'history' ? 'active' : ''}
          onClick={() => setTab('history')}
        >
          Historique
        </button>
      </nav>
      {error ? <div className="api-error">{error}</div> : null}
      <div className="trade-list page-panel">
        {loading ? (
          <LoadingSpinner label="Chargement des échanges…" />
        ) : filtered.length ? (
          filtered.map((trade) => {
            const other =
              trade.initiator_id === currentUserId
                ? trade.recipient?.username
                : trade.initiator?.username
            const mine = trade.items.filter(
              (item) => item.offered_by === currentUserId,
            ).length
            const theirs = trade.items.length - mine
            return (
              <article key={trade.id}>
                <div>
                  <i>{trade.status === 'pending' ? <Clock /> : <Check />}</i>
                  <span>
                    <b>{other ?? 'Utilisateur'}</b>
                    <small>
                      {new Date(trade.created_at).toLocaleDateString('fr-FR')}
                    </small>
                  </span>
                </div>
                <p>
                  Vous offrez{' '}
                  <b>
                    {mine} carte{mine !== 1 ? 's' : ''}
                  </b>
                  <ArrowLeftRight />
                  Vous recevez{' '}
                  <b>
                    {theirs} carte{theirs !== 1 ? 's' : ''}
                  </b>
                </p>
                {trade.status === 'pending' ? (
                  <div>
                    {trade.recipient_id === currentUserId ? (
                      <>
                        <button
                          disabled={isPending(`trade-${trade.id}`)}
                          onClick={() => act(trade, 'decline')}
                        >
                          <X />
                          Refuser
                        </button>
                        <button
                          className="button primary"
                          disabled={isPending(`trade-${trade.id}`)}
                          onClick={() => act(trade, 'accept')}
                        >
                          {isPending(`trade-${trade.id}`) ? (
                            <LoadingSpinner label="Traitement…" />
                          ) : (
                            <>
                              <Check /> Accepter
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        disabled={isPending(`trade-${trade.id}`)}
                        onClick={() => act(trade, 'cancel')}
                      >
                        {isPending(`trade-${trade.id}`) ? (
                          <LoadingSpinner label="Annulation…" />
                        ) : (
                          'Annuler l’offre'
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <strong>{trade.status}</strong>
                )}
              </article>
            )
          })
        ) : (
          <div className="trade-empty">
            <ArrowLeftRight />
            <h2>
              Aucune offre{' '}
              {tab === 'received'
                ? 'reçue'
                : tab === 'sent'
                  ? 'envoyée'
                  : 'dans l’historique'}
            </h2>
          </div>
        )}
      </div>
      {notice ? (
        <div className="toast">
          <Check />
          {notice}
        </div>
      ) : null}
      {composer ? (
        <TradeComposer
          currentUserId={currentUserId}
          draft={initialDraft ?? undefined}
          onClose={() => {
            setComposer(false)
            onDraftConsumed()
          }}
          onSent={() => {
            setComposer(false)
            onDraftConsumed()
            setNotice('Offre envoyée.')
            void reload()
          }}
        />
      ) : null}
    </div>
  )
}
