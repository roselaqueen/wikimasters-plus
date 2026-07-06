import { ArrowLeftRight, ExternalLink, Shield, Swords, X } from 'lucide-react'
import GameCard from './GameCard'
import CardWishlistPicker from '../wishlists/CardWishlistPicker'
import type { Card, Rarity } from '../../types/domain'

const rarityLabels: Record<Rarity, string> = {
  L: 'Légendaire',
  UR: 'Ultra Rare',
  SR: 'Super Rare',
  R: 'Rare',
  PC: 'Peu Commun',
  C: 'Commun',
}

export default function CardDetailModal({
  card,
  ownerId,
  onClose,
  onWishlistChange,
  onExchange,
}: {
  card: Card
  ownerId: string
  onClose: () => void
  onWishlistChange?: (wanted: boolean) => void
  onExchange: (contact: string) => void
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="card-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-detail-title"
      >
        <button className="modal-x" onClick={onClose} aria-label="Fermer">
          <X />
        </button>
        <GameCard card={card} />
        <div className="card-detail-content">
          <div className="modal-title-line">
            <h2 id="card-detail-title">{card.title}</h2>
            <span data-rarity={card.rarity}>{rarityLabels[card.rarity]}</span>
          </div>
          <p title={card.description}>{card.description}</p>
          <div className="modal-stats">
            <div>
              <Swords />
              <b>{card.atk.toLocaleString('fr-FR')}</b>
              <span>ATK</span>
            </div>
            <div>
              <Shield />
              <b>{card.def.toLocaleString('fr-FR')}</b>
              <span>DEF</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>Dans le jeu</dt>
              <dd>{card.totalCopies ?? '—'}</dd>
            </div>
            <div>
              <dt>Ma collection</dt>
              <dd>{card.owned > 0 ? 'Possédée' : 'Non possédée'}</dd>
            </div>
            <div>
              <dt>Catégorie</dt>
              <dd>{card.category}</dd>
            </div>
          </dl>
          {card.contacts.length ? (
            <div className="modal-owners">
              <h3>Possédée par vos contacts</h3>
              {card.contacts.map((contact) => (
                <button key={contact} onClick={() => onExchange(contact)}>
                  <i>{contact[0]}</i>
                  <span>{contact}</span>
                  <ArrowLeftRight size={16} />
                </button>
              ))}
            </div>
          ) : null}
          <a
            href={`https://fr.wikipedia.org/wiki/${encodeURIComponent(card.title)}`}
            target="_blank"
            rel="noreferrer"
          >
            Voir l’article sur Wikipédia <ExternalLink size={14} />
          </a>
          <div className="card-detail-actions">
            <CardWishlistPicker
              ownerId={ownerId}
              cardId={card.id}
              onChange={onWishlistChange}
            />
            {card.contacts.length ? (
              <button className="primary" onClick={() => onExchange(card.contacts[0])}>
                <ArrowLeftRight size={17} />
                Proposer un échange
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
