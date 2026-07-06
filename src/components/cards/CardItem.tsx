import { ArrowLeftRight, CircleCheck, CircleX, UsersRound } from 'lucide-react'
import GameCard from './GameCard'
import type { Card } from '../../types/domain'

export default function CardItem({
  card,
  onClick,
  onWant,
  onExchange,
  removeAction = false,
  showOwnership = false,
}: {
  card: Card
  onClick?: () => void
  onWant?: () => void
  onExchange?: (contact: string) => void
  removeAction?: boolean
  showOwnership?: boolean
}) {
  const visibleOwners = card.contacts.slice(0, 2)
  const otherOwners = card.contacts.slice(2)
  const ownerButton = (contact: string) => (
    <button key={contact} onClick={() => onExchange?.(contact)} disabled={!onExchange}>
      <i>{contact[0]}</i>
      <span>{contact}</span>
      {onExchange ? <ArrowLeftRight /> : null}
    </button>
  )
  return (
    <div className="game-card-item">
      <GameCard
        card={card}
        onClick={onClick}
        onWant={removeAction ? onWant : undefined}
        removeAction={removeAction}
        showOwnedCount={!showOwnership}
      />
      {showOwnership ? (
        <div className={card.owned > 0 ? 'card-owned-status owned' : 'card-owned-status'}>
          {card.owned > 0 ? <CircleCheck /> : <CircleX />}
          <span>
            {card.owned > 0
              ? `Possédée · ${card.totalCopies ?? 0} dans le jeu`
              : `Non possédée · ${card.totalCopies ?? 0} dans le jeu`}
          </span>
        </div>
      ) : null}
      <div className={`card-owners ${card.contacts.length ? 'has-owners' : 'empty'}`}>
        <strong>
          <UsersRound />
          {card.contacts.length
            ? `${card.contacts.length} contact${card.contacts.length > 1 ? 's' : ''} possède${card.contacts.length > 1 ? 'nt' : ''} la carte`
            : 'Aucun contact ne la possède'}
        </strong>
        {visibleOwners.map(ownerButton)}
        {otherOwners.length ? (
          <details>
            <summary>
              + {otherOwners.length} autre{otherOwners.length > 1 ? 's' : ''}
            </summary>
            <div>{otherOwners.map(ownerButton)}</div>
          </details>
        ) : null}
      </div>
    </div>
  )
}
