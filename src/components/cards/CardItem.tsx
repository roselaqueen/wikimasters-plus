import { ArrowLeftRight, UsersRound } from 'lucide-react'
import GameCard from './GameCard'
import type { Card } from '../../types'

export default function CardItem({
  card,
  wanted = false,
  onClick,
  onWant,
  onExchange,
  removeAction = false,
}: {
  card: Card
  wanted?: boolean
  onClick?: () => void
  onWant?: () => void
  onExchange?: (contact: string) => void
  removeAction?: boolean
}) {
  const [first, ...others] = card.contacts
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
        wanted={wanted}
        onClick={onClick}
        onWant={onWant}
        removeAction={removeAction}
      />
      <div className={`card-owners ${card.contacts.length ? 'has-owners' : 'empty'}`}>
        <strong>
          <UsersRound />
          {card.contacts.length
            ? `${card.contacts.length} contact${card.contacts.length > 1 ? 's' : ''} possède${card.contacts.length > 1 ? 'nt' : ''} la carte`
            : 'Aucun contact ne la possède'}
        </strong>
        {first ? ownerButton(first) : null}
        {others.length ? (
          <details>
            <summary>
              + {others.length} autre{others.length > 1 ? 's' : ''}
            </summary>
            <div>{others.map(ownerButton)}</div>
          </details>
        ) : null}
      </div>
    </div>
  )
}
