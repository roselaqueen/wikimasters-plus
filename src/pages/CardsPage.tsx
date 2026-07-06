import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react'
import CardDetailModal from '../components/cards/CardDetailModal'
import CardItem from '../components/cards/CardItem'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useCardsQuery } from '../hooks/useCardsQuery'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { loadWishlistCard } from '../services/cardsApi'
import type { Card, Rarity, TradeDraft } from '../types/domain'
import { getWishlists } from '../services/wishlistRepository'

type CardsPageProps = {
  collectionOnly: boolean
  initialCards: Card[]
  initialTotal: number
  ownerId: string
  onTrade: (draft: TradeDraft) => void
}

const rarities: Rarity[] = ['L', 'UR', 'SR', 'R', 'PC', 'C']

export default function CardsPage({
  collectionOnly,
  initialCards,
  initialTotal,
  ownerId,
  onTrade,
}: CardsPageProps) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query.trim())
  const [rarity, setRarity] = useState<Rarity>()
  const [sort, setSort] = useState('rarity')
  const [page, setPage] = useState(0)
  const [ownership, setOwnership] = useState<'all' | 'wanted'>('all')
  const [wishlistCards, setWishlistCards] = useState<Card[]>([])
  const [contactsOnly, setContactsOnly] = useState(false)
  const [selected, setSelected] = useState<Card | null>(null)
  const [listView, setListView] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const wishlistEligible = useMemo(
    () =>
      collectionOnly ? wishlistCards.filter((card) => card.owned > 0) : wishlistCards,
    [collectionOnly, wishlistCards],
  )

  useEffect(() => {
    let active = true

    getWishlists(ownerId)
      .then((lists) => [...new Set(lists.flatMap((list) => list.cardIds))])
      .then((ids) => Promise.all(ids.map((id) => loadWishlistCard(id, ownerId))))
      .then((cards) => {
        if (!active) return
        setWishlistCards(cards)
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [ownerId])

  useEffect(() => {
    setPage(0)
  }, [debouncedQuery, rarity, sort, collectionOnly])

  const {
    cards: queriedCards,
    total: queriedTotal,
    loading,
    error: loadError,
  } = useCardsQuery({
    collectionOnly,
    page,
    query: debouncedQuery,
    rarity,
    sort,
    enabled: ownership === 'all',
  })

  const result = queriedCards.length || collectionOnly ? queriedCards : initialCards
  const resultTotal = queriedTotal || (collectionOnly ? 0 : initialTotal)

  const filtered = useMemo(() => {
    const source = ownership === 'wanted' ? wishlistEligible : result
    const text = debouncedQuery.toLocaleLowerCase('fr')

    return source.filter((card) => {
      const matchesText =
        ownership !== 'wanted' ||
        !text ||
        `${card.title} ${card.description} ${card.category}`
          .toLocaleLowerCase('fr')
          .includes(text)
      const matchesRarity = ownership !== 'wanted' || !rarity || card.rarity === rarity
      const matchesContacts = !contactsOnly || card.contacts.length > 0
      return matchesText && matchesRarity && matchesContacts
    })
  }, [result, wishlistEligible, ownership, debouncedQuery, rarity, contactsOnly])

  return (
    <div className="cards-page">
      <section className="catalog">
        <div className="title-row">
          <div>
            <h1>{collectionOnly ? 'Ma collection' : 'Toutes les cartes'}</h1>
            <p>
              {collectionOnly
                ? 'Recherche et filtres appliqués à votre collection réelle.'
                : 'Recherche et filtres appliqués au catalogue global.'}
            </p>
          </div>
          <strong className="count">
            {(ownership === 'wanted' ? filtered.length : resultTotal).toLocaleString(
              'fr-FR',
            )}{' '}
            <small>résultats</small>
          </strong>
        </div>

        <div className="search-row">
          <label className="search">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un article, une catégorie…"
            />
            {loading ? (
              <small>Recherche…</small>
            ) : query ? (
              <button onClick={() => setQuery('')} aria-label="Effacer">
                <X size={16} />
              </button>
            ) : null}
          </label>
          <button
            className="filter-button"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal size={18} />
            Filtres
          </button>
          <div className="view-toggle">
            <button
              className={!listView ? 'selected' : ''}
              onClick={() => setListView(false)}
              aria-label="Vue grille"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={listView ? 'selected' : ''}
              onClick={() => setListView(true)}
              aria-label="Vue liste"
            >
              <List size={18} />
            </button>
          </div>
          <select
            aria-label="Trier"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="rarity">Rareté</option>
            <option value="atk">Attaque</option>
            <option value="def">Défense</option>
            <option value="alpha">Alphabétique</option>
          </select>
        </div>

        <div className={`filters ${filtersOpen ? 'shown' : ''}`}>
          <fieldset>
            <legend>Rareté</legend>
            {rarities.map((value) => (
              <button
                key={value}
                data-rarity={value}
                className={rarity === value ? 'on' : ''}
                onClick={() =>
                  setRarity((current) => (current === value ? undefined : value))
                }
              >
                {value}
              </button>
            ))}
          </fieldset>
          <fieldset>
            <legend>Listes</legend>
            <button
              className={ownership === 'all' ? 'on' : ''}
              onClick={() => setOwnership('all')}
            >
              Toutes
            </button>
            <button
              className={ownership === 'wanted' ? 'on' : ''}
              onClick={() => {
                setOwnership('wanted')
                setPage(0)
              }}
            >
              Souhaitées ({wishlistEligible.length})
            </button>
          </fieldset>
          {!collectionOnly ? (
            <fieldset className="contact-filter">
              <legend>Contacts</legend>
              <button
                className={contactsOnly ? 'switch on' : 'switch'}
                onClick={() => setContactsOnly((value) => !value)}
              >
                <span />
                <b>Possédées par mes contacts</b>
              </button>
            </fieldset>
          ) : null}
        </div>

        {rarity || ownership !== 'all' || (!collectionOnly && contactsOnly) ? (
          <div className="active-filters">
            <span>Filtres actifs</span>
            {rarity ? (
              <button onClick={() => setRarity(undefined)}>
                Rareté : {rarity} <X size={13} />
              </button>
            ) : null}
            {ownership === 'wanted' ? (
              <button onClick={() => setOwnership('all')}>
                Toutes mes listes de souhaits <X size={13} />
              </button>
            ) : null}
            {!collectionOnly && contactsOnly ? (
              <button onClick={() => setContactsOnly(false)}>
                Contacts seulement <X size={13} />
              </button>
            ) : null}
          </div>
        ) : null}

        {loadError ? <div className="api-error">{loadError}</div> : null}
        {loading ? <LoadingSpinner label="Chargement des cartes…" /> : null}
        {filtered.length ? (
          <div className={listView ? 'card-list' : 'card-grid'}>
            {filtered.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onClick={() => setSelected(card)}
                onExchange={(contact) => onTrade({ contact, requestedCards: [card] })}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="empty">
            <Search />
            <h2>Aucune carte trouvée</h2>
            <p>Modifiez la recherche ou les filtres.</p>
          </div>
        ) : null}

        {ownership === 'all' ? (
          <div className="pagination">
            <button
              disabled={page === 0 || loading}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              ← Précédent
            </button>
            <span>Page {page + 1}</span>
            <button
              disabled={loading || (page + 1) * 50 >= resultTotal}
              onClick={() => setPage((value) => value + 1)}
            >
              Suivant →
            </button>
          </div>
        ) : null}
      </section>

      {selected ? (
        <CardDetailModal
          card={selected}
          ownerId={ownerId}
          onClose={() => setSelected(null)}
          onExchange={(contact) => onTrade({ contact, requestedCards: [selected] })}
        />
      ) : null}
    </div>
  )
}
