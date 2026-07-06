import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Check, Clock, Plus, RotateCcw, X } from 'lucide-react'
import { updateTrade } from '../services/tradeApi'
import TradeComposer from '../components/trades/TradeComposer'
import type { Card, Trade, TradeDraft } from '../types/domain'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useTrades } from '../hooks/useTrades'
import { useTradeCards } from '../hooks/useTradeCards'

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
  const { cards: tradeCards, loading: cardsLoading } = useTradeCards(trades)
  const { run, isPending } = useAsyncAction()
  const [tab, setTab] = useState<'received' | 'sent' | 'history'>('received')
  const [composer, setComposer] = useState(Boolean(initialDraft))
  const [draft, setDraft] = useState<TradeDraft | null>(initialDraft ?? null)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft)
      setComposer(true)
    }
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
  const counterOffer = (trade: Trade) => {
    const contact =
      trade.initiator_id === currentUserId
        ? trade.recipient?.username
        : trade.initiator?.username
    const offeredCards = trade.items
      .filter((item) => item.offered_by === currentUserId)
      .map((item) => tradeCards.get(item.card_id))
      .filter((card): card is Card => Boolean(card))
    const requestedCards = trade.items
      .filter((item) => item.offered_by !== currentUserId)
      .map((item) => tradeCards.get(item.card_id))
      .filter((card): card is Card => Boolean(card))

    setDraft({
      contact,
      offeredCards,
      requestedCards,
      offeredCredits:
        trade.initiator_id === currentUserId
          ? trade.initiator_wikibidous
          : trade.recipient_wikibidous,
      requestedCredits:
        trade.initiator_id === currentUserId
          ? trade.recipient_wikibidous
          : trade.initiator_wikibidous,
    })
    setComposer(true)
  }
  return (
    <div className="trades-page">
      <div className="trades-heading">
        <div>
          <h1>Échanges</h1>
          <p>Gérez vos offres d’échange avec vos amis.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setDraft(null)
            setComposer(true)
          }}
        >
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
            const initiatorCards = trade.items.filter(
              (item) => item.offered_by === trade.initiator_id,
            )
            const recipientCards = trade.items.filter(
              (item) => item.offered_by === trade.recipient_id,
            )
            return (
              <article key={trade.id}>
                <header>
                  <i>{trade.status === 'pending' ? <Clock /> : <Check />}</i>
                  <span>
                    <b>{other ?? 'Utilisateur'}</b>
                    <small>
                      {new Date(trade.created_at).toLocaleDateString('fr-FR')}
                    </small>
                  </span>
                </header>
                <div className="trade-card-description">
                  <section>
                    <small>{trade.initiator?.username ?? 'Initiateur'} offre</small>
                    <div className="trade-card-chips">
                      {initiatorCards.map((item) => {
                        const card = tradeCards.get(item.card_id)
                        return (
                          <span key={item.card_id} data-rarity={card?.rarity}>
                            {card ? `${card.rarity} · ${card.title}` : 'Carte'}
                          </span>
                        )
                      })}
                      {trade.initiator_wikibidous ? (
                        <span>{trade.initiator_wikibidous} WB</span>
                      ) : null}
                    </div>
                  </section>
                  <ArrowLeftRight />
                  <section>
                    <small>En échange de</small>
                    <div className="trade-card-chips">
                      {recipientCards.map((item) => {
                        const card = tradeCards.get(item.card_id)
                        return (
                          <span key={item.card_id} data-rarity={card?.rarity}>
                            {card ? `${card.rarity} · ${card.title}` : 'Carte'}
                          </span>
                        )
                      })}
                      {trade.recipient_wikibidous ? (
                        <span>{trade.recipient_wikibidous} WB</span>
                      ) : null}
                    </div>
                  </section>
                  {cardsLoading ? <LoadingSpinner label="Cartes…" /> : null}
                </div>
                {trade.status === 'pending' ? (
                  <div className="trade-actions">
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
                          className="counter-button"
                          disabled={cardsLoading}
                          onClick={() => counterOffer(trade)}
                        >
                          <RotateCcw /> Contre-offre
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
          draft={draft ?? undefined}
          onClose={() => {
            setComposer(false)
            setDraft(null)
            onDraftConsumed()
          }}
          onSent={() => {
            setComposer(false)
            setDraft(null)
            onDraftConsumed()
            setNotice('Offre envoyée.')
            void reload()
          }}
        />
      ) : null}
    </div>
  )
}
