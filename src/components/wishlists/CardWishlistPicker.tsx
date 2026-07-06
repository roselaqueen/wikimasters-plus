import { Check, Heart, Plus } from 'lucide-react'
import { useState } from 'react'
import { useCardWishlists } from '../../hooks/useCardWishlists'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function CardWishlistPicker({
  ownerId,
  cardId,
  onChange,
}: {
  ownerId: string
  cardId: string
  onChange?: (wanted: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const { lists, loading, savingId, toggle, create } = useCardWishlists(ownerId, cardId)
  const wanted = lists.some((list) => list.cardIds.includes(cardId))

  const createList = async () => {
    const name = prompt('Nom de la nouvelle liste')?.trim()
    if (!name) return
    await create(name.slice(0, 80))
    onChange?.(true)
  }

  return (
    <div className="card-wishlist-picker">
      <button
        className={wanted ? 'wanted' : ''}
        onClick={() => setOpen((value) => !value)}
      >
        <Heart size={17} fill={wanted ? 'currentColor' : 'none'} />
        {wanted ? 'Gérer les listes' : 'Ajouter à une liste'}
      </button>
      {open ? (
        <div className="wishlist-picker-menu">
          <strong>Listes de souhaits</strong>
          {loading ? (
            <LoadingSpinner label="Chargement…" />
          ) : !lists.length ? (
            <p className="wishlist-picker-empty">Aucune liste modifiable.</p>
          ) : (
            lists.map((list) => {
              const selected = list.cardIds.includes(cardId)
              return (
                <button
                  key={list.id}
                  disabled={Boolean(savingId)}
                  onClick={async () => {
                    await toggle(list)
                    onChange?.(
                      !selected ||
                        lists.some(
                          (item) => item.id !== list.id && item.cardIds.includes(cardId),
                        ),
                    )
                  }}
                >
                  {savingId === list.id ? (
                    <LoadingSpinner label="" />
                  ) : selected ? (
                    <Check size={16} />
                  ) : (
                    <span className="empty-check" />
                  )}
                  {list.name}
                </button>
              )
            })
          )}
          <button
            className="create-wishlist"
            disabled={Boolean(savingId)}
            onClick={createList}
          >
            {savingId === 'new' ? (
              <LoadingSpinner label="Création…" />
            ) : (
              <>
                <Plus size={16} /> Nouvelle liste
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  )
}
