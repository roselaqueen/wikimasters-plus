import { ArrowLeftRight, Coins, RotateCcw, X } from 'lucide-react'
import type { Card, Trade } from '../../types/domain'
import GameCard from '../cards/GameCard'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function TradeDetailModal({
  trade,
  cards,
  loading,
  canCounter,
  onClose,
  onCounter,
}: {
  trade: Trade
  cards: Map<string, Card>
  loading: boolean
  canCounter: boolean
  onClose: () => void
  onCounter: () => void
}) {
  const initiatorCards = trade.items.filter(
    (item) => item.offered_by === trade.initiator_id,
  )
  const recipientCards = trade.items.filter(
    (item) => item.offered_by === trade.recipient_id,
  )

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="trade-detail-modal" role="dialog" aria-modal="true">
        <header>
          <div>
            <h2>Détail de l’échange</h2>
            <p>
              {trade.initiator?.username ?? 'Initiateur'} →{' '}
              {trade.recipient?.username ?? 'Destinataire'}
            </p>
          </div>
          <button className="modal-x" onClick={onClose} aria-label="Fermer">
            <X />
          </button>
        </header>
        {loading ? (
          <LoadingSpinner label="Chargement des cartes…" />
        ) : (
          <div className="trade-detail-sides">
            <section>
              <h3>{trade.initiator?.username ?? 'Initiateur'} offre</h3>
              <div className="trade-detail-cards">
                {initiatorCards.map((item) => {
                  const card = cards.get(item.card_id)
                  return card ? <GameCard key={item.card_id} card={card} compact /> : null
                })}
              </div>
              {trade.initiator_wikibidous ? (
                <p>
                  <Coins /> {trade.initiator_wikibidous} WB
                </p>
              ) : null}
            </section>
            <ArrowLeftRight className="trade-detail-arrow" />
            <section>
              <h3>{trade.recipient?.username ?? 'Destinataire'} offre</h3>
              <div className="trade-detail-cards">
                {recipientCards.map((item) => {
                  const card = cards.get(item.card_id)
                  return card ? <GameCard key={item.card_id} card={card} compact /> : null
                })}
              </div>
              {trade.recipient_wikibidous ? (
                <p>
                  <Coins /> {trade.recipient_wikibidous} WB
                </p>
              ) : null}
            </section>
          </div>
        )}
        <footer>
          <button className="button" onClick={onClose}>
            Fermer
          </button>
          {canCounter ? (
            <button
              className="button counter-button"
              disabled={loading}
              onClick={onCounter}
            >
              <RotateCcw /> Préparer une contre-offre
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  )
}
