import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Clipboard,
  Copy,
  DownloadCloud,
  Download,
  Heart,
  Link2,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  Upload,
  UsersRound,
} from 'lucide-react'
import { deleteWishlist, getWishlists, putWishlist } from '../services/wishlistRepository'
import {
  loadOfficialWishlistCardIds,
  loadWishlistCards,
  searchCards,
} from '../services/cardsApi'
import type { Card, Rarity, TradeDraft, Wishlist } from '../types/domain'
import CardItem from '../components/cards/CardItem'
import CardDetailModal from '../components/cards/CardDetailModal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { formatOwnersText, groupCardsByOwner, makeWishlist } from '../utils/wishlist'
import {
  decodeWishlist,
  encodeDynamicWishlist,
  encodeWishlist,
} from '../utils/wishlistCodec'

export default function WishlistsPage({
  ownerId,
  username,
  cards,
  onTrade,
}: {
  ownerId: string
  username: string
  cards: Card[]
  onTrade: (draft: TradeDraft) => void
}) {
  const [lists, setLists] = useState<Wishlist[]>([])
  const [listsLoading, setListsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query.trim(), 700)
  const [searchResults, setSearchResults] = useState<Card[]>([])
  const [resolved, setResolved] = useState<Card[]>(cards)
  const [searching, setSearching] = useState(false)
  const [searchRarity, setSearchRarity] = useState<Rarity>()
  const [share, setShare] = useState('')
  const [dynamicShare, setDynamicShare] = useState(false)
  const [importValue, setImportValue] = useState('')
  const [notice, setNotice] = useState('')
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const [tab, setTab] = useState<'cards' | 'share' | 'contacts'>('cards')
  const initializedOwner = useRef('')
  const searchSequence = useRef(0)
  const { run, isPending } = useAsyncAction()

  useEffect(() => {
    setResolved(cards)
    setLists([])
    setSelectedId('')
    setSearchResults([])
    setQuery('')
  }, [cards, ownerId])

  useEffect(
    () =>
      setResolved((prev) => [
        ...new Map([...prev, ...cards].map((card) => [card.id, card])).values(),
      ]),
    [cards],
  )
  useEffect(() => {
    if (initializedOwner.current === ownerId) return
    initializedOwner.current = ownerId
    setListsLoading(true)
    getWishlists(ownerId)
      .then(async (found) => {
        const unique = [
          ...new Map(
            found.map((list) => [list.name.trim().toLocaleLowerCase('fr'), list]),
          ).values(),
        ]
        if (!unique.length) {
          const first = makeWishlist(ownerId, 'Mes recherches')
          await putWishlist(first)
          unique.push(first)
        }
        setLists(unique)
        setSelectedId(unique[0].id)
      })
      .finally(() => setListsLoading(false))
  }, [ownerId])

  const selected = lists.find((list) => list.id === selectedId) ?? lists[0]
  const selectedCards = useMemo(
    () =>
      selected
        ? selected.cardIds
            .map((id) => resolved.find((card) => card.id === id))
            .filter((card): card is Card => Boolean(card))
        : [],
    [selected, resolved],
  )
  const suggestions = useMemo(
    () => searchResults.filter((card) => !selected?.cardIds.includes(card.id)),
    [searchResults, selected],
  )

  useEffect(() => {
    const value = debouncedQuery
    const sequence = ++searchSequence.current
    if (value.length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    searchCards(value, searchRarity)
      .then((results) => {
        if (sequence === searchSequence.current) setSearchResults(results)
      })
      .catch(() => {
        if (sequence === searchSequence.current) setSearchResults([])
      })
      .finally(() => {
        if (sequence === searchSequence.current) setSearching(false)
      })
  }, [debouncedQuery, searchRarity])
  useEffect(() => {
    if (!selected) return
    const missing = selected.cardIds.filter(
      (id) => !resolved.some((card) => card.id === id),
    )
    if (!missing.length) return
    loadWishlistCards(missing, ownerId).then((found) =>
      setResolved((prev) => [
        ...new Map([...prev, ...found].map((card) => [card.id, card])).values(),
      ]),
    )
  }, [ownerId, selected, resolved])

  const persist = async (next: Wishlist) => {
    if (next.readOnly) throw new Error('Cette liste liée est en lecture seule.')
    await putWishlist(next)
    setLists((prev) =>
      prev
        .map((list) => (list.id === next.id ? next : list))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    )
    setSelectedId(next.id)
  }
  const addList = () =>
    run('add-list', async () => {
      const next = makeWishlist(ownerId, `Nouvelle liste ${lists.length + 1}`)
      await putWishlist(next)
      setLists((prev) => [next, ...prev])
      setSelectedId(next.id)
    })
  const rename = () => {
    if (!selected || selected.readOnly) return
    const name = prompt('Nouveau nom de la liste', selected.name)?.trim()
    if (name)
      return run('rename-list', () =>
        persist({ ...selected, name: name.slice(0, 80), updatedAt: Date.now() }),
      )
  }
  const removeList = () => {
    if (!selected || !confirm(`Supprimer « ${selected.name} » ?`)) return
    return run('remove-list', async () => {
      await deleteWishlist(ownerId, selected.id)
      const next = lists.filter((list) => list.id !== selected.id)
      setLists(next)
      setSelectedId(next[0]?.id ?? '')
    })
  }
  const toggleCard = (card: Card) => {
    if (!selected || selected.readOnly) return
    return run(`card-${card.id}`, async () => {
      setResolved((prev) => [
        ...new Map([...prev, card].map((item) => [item.id, item])).values(),
      ])
      const cardIds = selected.cardIds.includes(card.id)
        ? selected.cardIds.filter((id) => id !== card.id)
        : [...selected.cardIds, card.id]
      await persist({ ...selected, cardIds, updatedAt: Date.now() })
    })
  }
  const copy = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value)
    setNotice(message)
    setTimeout(() => setNotice(''), 1800)
  }
  const exportList = () => {
    if (!selected) return
    setShare(
      dynamicShare ? encodeDynamicWishlist(selected, username) : encodeWishlist(selected),
    )
    setTab('share')
  }
  const importList = () =>
    run('import-list', async () => {
      try {
        const parsed = decodeWishlist(importValue)
        const next: Wishlist =
          parsed.kind === 'static'
            ? makeWishlist(ownerId, parsed.name, parsed.cardIds)
            : {
                ...makeWishlist(ownerId, `${parsed.sourceUsername} - Liste liée`),
                sourceOwnerId: parsed.sourceOwnerId,
                sourceListId: parsed.sourceListId,
                sourceUsername: parsed.sourceUsername,
                readOnly: true,
              }
        await putWishlist(next)
        const refreshed = await getWishlists(ownerId)
        setLists(refreshed)
        setSelectedId(next.id)
        setImportValue('')
        setNotice(
          parsed.kind === 'dynamic'
            ? 'Liste dynamique liée en lecture seule.'
            : 'Liste ajoutée à votre compte.',
        )
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Import impossible.')
      }
    })
  const importOfficialWishlist = () =>
    run('import-official-wishlist', async () => {
      try {
        const cardIds = await loadOfficialWishlistCardIds()
        const existing = lists.find(
          (list) => !list.readOnly && list.name === 'Wishlist WikiMasters',
        )
        const next: Wishlist = existing
          ? { ...existing, cardIds, updatedAt: Date.now() }
          : makeWishlist(ownerId, 'Wishlist WikiMasters', cardIds)

        await putWishlist(next)
        const refreshed = await getWishlists(ownerId)
        setLists(refreshed)
        setSelectedId(next.id)
        setTab('cards')
        setNotice(
          `${cardIds.length} carte${cardIds.length > 1 ? 's' : ''} importée${cardIds.length > 1 ? 's' : ''} depuis WikiMasters.`,
        )
      } catch (error) {
        setNotice(
          error instanceof Error ? error.message : 'Import WikiMasters impossible.',
        )
      }
    })
  const owners = useMemo(() => groupCardsByOwner(selectedCards), [selectedCards])
  const missing = selectedCards.filter((card) => !card.contacts.length)
  const contactText = formatOwnersText(owners)

  return (
    <div className="wishlists-page">
      <div className="wishlist-heading">
        <div>
          <h1>Listes de souhaits</h1>
          <p>Organisez vos recherches, partagez-les et trouvez qui contacter.</p>
        </div>
        <button
          className="button primary small"
          disabled={isPending('add-list')}
          onClick={addList}
        >
          {isPending('add-list') ? (
            <LoadingSpinner label="Création…" />
          ) : (
            <>
              <Plus size={17} /> Nouvelle liste
            </>
          )}
        </button>
      </div>
      {isPending() ? (
        <div className="action-loading">
          <LoadingSpinner label="Enregistrement…" />
        </div>
      ) : null}
      <div className="wishlist-layout">
        <aside className="wishlist-sidebar">
          <strong>MES LISTES</strong>
          {lists.map((list) => (
            <button
              key={list.id}
              className={list.id === selected?.id ? 'active' : ''}
              onClick={() => setSelectedId(list.id)}
            >
              {list.readOnly ? <Link2 size={16} /> : <Heart size={16} />}
              <span>
                {list.name}
                <small>
                  {list.cardIds.length} carte{list.cardIds.length > 1 ? 's' : ''}
                  {list.readOnly ? ' · liée' : ''}
                </small>
              </span>
            </button>
          ))}
        </aside>
        {listsLoading ? (
          <div className="page-loading">
            <LoadingSpinner label="Chargement des listes…" />
          </div>
        ) : selected ? (
          <section className="wishlist-workspace">
            <header>
              <div>
                <h2>{selected.name}</h2>
                <span>
                  {selected.readOnly && (
                    <>
                      {' '}
                      <LockKeyhole size={11} /> Liste dynamique en lecture seule{' '}
                    </>
                  )}
                </span>
              </div>
              {!selected.readOnly ? (
                <button
                  disabled={isPending('rename-list')}
                  onClick={rename}
                  title="Renommer"
                >
                  {isPending('rename-list') ? (
                    <LoadingSpinner label="" />
                  ) : (
                    <Pencil size={17} />
                  )}
                </button>
              ) : null}
              <button
                disabled={isPending('remove-list')}
                onClick={removeList}
                title={selected.readOnly ? 'Retirer le lien' : 'Supprimer'}
              >
                {isPending('remove-list') ? (
                  <LoadingSpinner label="" />
                ) : (
                  <Trash2 size={17} />
                )}
              </button>
            </header>
            <nav className="wishlist-tabs">
              <button
                className={tab === 'cards' ? 'active' : ''}
                onClick={() => setTab('cards')}
              >
                <Heart size={16} />
                Cartes
              </button>
              <button
                className={tab === 'share' ? 'active' : ''}
                onClick={() => setTab('share')}
              >
                <Share2 size={16} />
                Partager / importer
              </button>
              <button
                className={tab === 'contacts' ? 'active' : ''}
                onClick={() => setTab('contacts')}
              >
                <UsersRound size={16} />
                Possesseurs <b>{owners.length}</b>
              </button>
            </nav>
            {tab === 'cards' ? (
              <div className="wishlist-cards-tab">
                {selected.readOnly ? (
                  <div className="linked-notice">
                    <LockKeyhole />
                    Cette liste suit automatiquement les modifications de son créateur.
                  </div>
                ) : (
                  <div className="wishlist-search-tools">
                    <label className="search">
                      <Search size={18} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher dans toutes les cartes…"
                      />
                      {searching ? <LoadingSpinner label="Recherche…" /> : null}
                    </label>
                    <select
                      aria-label="Filtrer la recherche par rareté"
                      value={searchRarity ?? ''}
                      onChange={(event) =>
                        setSearchRarity(
                          (event.target.value || undefined) as Rarity | undefined,
                        )
                      }
                    >
                      <option value="">Toutes les raretés</option>
                      <option value="L">Légendaire</option>
                      <option value="UR">Ultra rare</option>
                      <option value="SR">Super rare</option>
                      <option value="R">Rare</option>
                      <option value="PC">Peu commun</option>
                      <option value="C">Commun</option>
                    </select>
                  </div>
                )}
                {!selected.readOnly && query ? (
                  <div className="wishlist-suggestions">
                    {suggestions.slice(0, 8).map((card) => (
                      <button
                        key={card.id}
                        onClick={() => {
                          toggleCard(card)
                          setQuery('')
                        }}
                      >
                        <img src={card.image} />
                        <span>
                          {card.title}
                          <small>
                            {card.rarity} · {card.category}
                          </small>
                        </span>
                        <Plus size={17} />
                      </button>
                    ))}
                    {!searching && !suggestions.length ? (
                      <p>Aucune carte trouvée.</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="wishlist-card-list">
                  {selectedCards.map((card) => (
                    <CardItem
                      key={card.id}
                      card={card}
                      removeAction={!selected.readOnly}
                      showOwnership
                      onClick={() => setDetailCard(card)}
                      onWant={selected.readOnly ? undefined : () => toggleCard(card)}
                      onExchange={(contact) =>
                        onTrade({
                          contact,
                          requestedCards: selectedCards.filter((item) =>
                            item.contacts.includes(contact),
                          ),
                        })
                      }
                    />
                  ))}
                  {selectedCards.length < selected.cardIds.length ? (
                    <div className="wishlist-loading">
                      <LoadingSpinner label="Chargement des cartes…" />
                    </div>
                  ) : null}
                  {!selected.cardIds.length ? (
                    <div className="wishlist-empty">
                      <Heart />
                      <h3>Cette liste est vide</h3>
                      <p>
                        {selected.readOnly
                          ? 'Le créateur n’a encore ajouté aucune carte.'
                          : 'Recherchez une carte ci-dessus pour l’ajouter.'}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {tab === 'share' ? (
              <div className="share-panel">
                <div className="share-block official-wishlist-import">
                  <DownloadCloud />
                  <div>
                    <h3>Importer la wishlist WikiMasters</h3>
                    <p>
                      Crée ou synchronise une liste avec les souhaits de votre compte sur
                      le site original.
                    </p>
                  </div>
                  <button
                    className="button primary small"
                    disabled={isPending('import-official-wishlist')}
                    onClick={importOfficialWishlist}
                  >
                    {isPending('import-official-wishlist') ? (
                      <LoadingSpinner label="Import…" />
                    ) : (
                      <>
                        <DownloadCloud size={16} /> Importer
                      </>
                    )}
                  </button>
                </div>
                <div className="share-block">
                  <Share2 />
                  <div>
                    <h3>Partager cette liste</h3>
                    <p>
                      {dynamicShare
                        ? 'Le lien suit automatiquement les cartes et le nom choisis par le créateur.'
                        : 'La chaîne contient une copie indépendante des cartes actuelles.'}
                    </p>
                  </div>
                  <button className="primary small" onClick={exportList}>
                    <Download size={16} />
                    Générer
                  </button>
                  <label className="dynamic-option">
                    <input
                      type="checkbox"
                      checked={dynamicShare}
                      onChange={(event) => {
                        setDynamicShare(event.target.checked)
                        setShare('')
                      }}
                    />
                    <Link2 />
                    Lien dynamique{' '}
                    <small>Lecture seule pour les personnes qui l’ajoutent</small>
                  </label>
                  {share ? (
                    <div className="encoded">
                      <textarea readOnly value={share} />
                      <button onClick={() => copy(share, 'Chaîne copiée.')}>
                        <Copy size={17} />
                        Copier
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="share-block">
                  <Upload />
                  <div>
                    <h3>Importer une chaîne ou un lien</h3>
                    <p>
                      Les liens dynamiques restent synchronisés et apparaissent sous la
                      forme « pseudo - nom ».
                    </p>
                  </div>
                  <div className="encoded">
                    <textarea
                      value={importValue}
                      onChange={(e) => setImportValue(e.target.value)}
                      placeholder="Collez une chaîne WML1.… ou un lien WMD1.…"
                    />
                    <button
                      disabled={!importValue.trim() || isPending('import-list')}
                      onClick={importList}
                    >
                      {isPending('import-list') ? (
                        <LoadingSpinner label="Ajout…" />
                      ) : (
                        <>
                          <Plus size={17} /> Ajouter la liste
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {tab === 'contacts' ? (
              <div className="owners-panel">
                <div className="owners-summary">
                  <UsersRound />
                  <div>
                    <h3>
                      {owners.length} contact{owners.length > 1 ? 's' : ''} ont au moins
                      une carte
                    </h3>
                    <p>
                      {selectedCards.length - missing.length} carte
                      {selectedCards.length - missing.length > 1 ? 's' : ''} trouvée
                      {selectedCards.length - missing.length > 1 ? 's' : ''} dans votre
                      réseau.
                    </p>
                  </div>
                  <button onClick={() => copy(contactText, 'Texte copié.')}>
                    <Clipboard size={17} />
                    Copier le texte
                  </button>
                </div>
                <div className="owner-groups">
                  {owners.map(([name, names]) => (
                    <article
                      key={name}
                      onClick={() =>
                        onTrade({
                          contact: name,
                          requestedCards: selectedCards.filter((item) =>
                            item.contacts.includes(name),
                          ),
                        })
                      }
                    >
                      <i>{name[0]}</i>
                      <div>
                        <h3>{name}</h3>
                        <p>{names.join(' · ')}</p>
                      </div>
                      <b>{names.length}</b>
                      <button>Préparer l’échange</button>
                    </article>
                  ))}
                </div>
                <label>
                  Texte prêt à envoyer
                  <textarea value={contactText} readOnly />
                </label>
              </div>
            ) : null}
          </section>
        ) : (
          <div className="wishlist-no-list">
            <Heart />
            <h2>Créez votre première liste</h2>
            <button onClick={addList}>Nouvelle liste</button>
          </div>
        )}
      </div>
      {notice ? (
        <div className="toast">
          <Check size={17} />
          {notice}
        </div>
      ) : null}
      {detailCard ? (
        <CardDetailModal
          card={detailCard}
          ownerId={ownerId}
          onClose={() => setDetailCard(null)}
          onWishlistChange={() => {
            void getWishlists(ownerId).then(setLists)
          }}
          onExchange={(contact) =>
            onTrade({
              contact,
              requestedCards: selectedCards.filter((item) =>
                item.contacts.includes(contact),
              ),
            })
          }
        />
      ) : null}
    </div>
  )
}
