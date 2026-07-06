import { Layers3, Shield, Swords, X } from 'lucide-react'
import type { Card } from '../../types/domain'

export default function GameCard({
  card,
  onClick,
  onWant,
  compact = false,
  removeAction = false,
  showOwnedCount = true,
}: {
  card: Card
  onClick?: () => void
  onWant?: () => void
  compact?: boolean
  removeAction?: boolean
  showOwnedCount?: boolean
}) {
  return (
    <article
      className={`game-card rarity-${card.rarity.toLowerCase()} ${compact ? 'compact' : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) onClick()
      }}
      tabIndex={onClick ? 0 : undefined}
    >
      <img
        className="game-frame"
        src={`${import.meta.env.BASE_URL}card-frames/${frameName[card.rarity]}.png`}
        alt=""
      />
      <div className="game-art">
        <img src={card.image} alt={card.title} loading="lazy" />
        <span className="rarity-badge">{card.rarity}</span>
        {removeAction && onWant ? (
          <button
            className="remove-card"
            onClick={(event) => {
              event.stopPropagation()
              onWant()
            }}
            aria-label={`Retirer ${card.title}`}
          >
            <X size={16} />
          </button>
        ) : showOwnedCount && card.owned > 0 ? (
          <span
            className="owned-count"
            title={`${card.owned} exemplaire${card.owned > 1 ? 's' : ''}`}
          >
            <Layers3 /> {card.owned}
          </span>
        ) : null}
      </div>
      <div className="game-copy">
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        <div className="game-stats">
          <b>
            <Swords /> {card.atk.toLocaleString('fr-FR')}
          </b>
          <b>
            <Shield /> {card.def.toLocaleString('fr-FR')}
          </b>
        </div>
      </div>
    </article>
  )
}

const frameName = {
  L: 'legendary',
  UR: 'ultra_rare',
  SR: 'super_rare',
  R: 'rare',
  PC: 'uncommon',
  C: 'common',
} as const
