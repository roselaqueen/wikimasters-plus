import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import AppShell from './components/layout/AppShell'
import type { TradeDraft } from './components/trades/TradeComposer'
import CardsPage from './pages/CardsPage'
import LoginPage from './pages/LoginPage'
import TradesPage from './pages/TradesPage'
import WishlistsPage from './pages/WishlistsPage'
import { supabase } from './auth'
import { loadCards } from './cardsApi'
import { loadSettings, saveSettings } from './storage'
import type { Card, Page, Settings } from './types'

const pageRoutes: Record<string, Page> = {
  collection: 'collection',
  wishlists: 'wishlists',
  cards: 'cards',
  trades: 'trades',
}

const pageFromHash = (): Page =>
  pageRoutes[window.location.hash.replace(/^#\/?/, '')] ?? 'collection'

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [settings] = useState<Settings>(loadSettings)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [initialCards, setInitialCards] = useState<Card[]>([])
  const [initialTotal, setInitialTotal] = useState(0)
  const [cardsReady, setCardsReady] = useState(false)
  const [apiError, setApiError] = useState('')
  const [tradeDraft, setTradeDraft] = useState<TradeDraft | null>(null)

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.dataset.theme = settings.theme
    document.documentElement.style.setProperty('--accent', settings.accent)
  }, [settings])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const syncRoute = () => setPage(pageFromHash())
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    const route = window.location.hash.replace(/^#\/?/, '')
    if (session && !pageRoutes[route]) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#/collection`,
      )
    }
  }, [session])

  useEffect(() => {
    if (!session) {
      setCardsReady(false)
      setInitialCards([])
      setInitialTotal(0)
      return
    }

    let active = true
    setCardsReady(false)
    localStorage.setItem('wm_account_id', session.user.id)

    loadCards()
      .then((data) => {
        if (!active) return
        setInitialCards(data.cards)
        setInitialTotal(data.total)
        setApiError('')
      })
      .catch((error: unknown) => {
        if (!active) return
        setApiError(error instanceof Error ? error.message : 'API inaccessible')
      })
      .finally(() => {
        if (active) setCardsReady(true)
      })

    return () => {
      active = false
    }
  }, [session])

  if (!authReady) {
    return <main className="auth-loading">Connexion à WikiMasters…</main>
  }

  if (!session) {
    return <LoginPage />
  }

  if (!cardsReady) {
    return (
      <main className="auth-loading">
        <div className="loader-ring" />
        <span>Chargement des cartes…</span>
      </main>
    )
  }

  const ownerId = session.user.id
  const username =
    (session.user.user_metadata.username as string | undefined) ??
    session.user.email?.split('@')[0] ??
    'Utilisateur'

  const navigate = (nextPage: Page) => {
    setPage(nextPage)
    setMobileNavigationOpen(false)
    window.location.hash = `/${nextPage}`
  }

  const openTrade = (draft: TradeDraft) => {
    setTradeDraft(draft)
    navigate('trades')
  }

  const content = (() => {
    if (page === 'collection' || page === 'cards') {
      return (
        <CardsPage
          collectionOnly={page === 'collection'}
          initialCards={initialCards}
          initialTotal={initialTotal}
          ownerId={ownerId}
          onTrade={openTrade}
        />
      )
    }

    if (page === 'wishlists') {
      return (
        <WishlistsPage
          ownerId={ownerId}
          username={username}
          cards={initialCards}
          onTrade={openTrade}
        />
      )
    }

    return (
      <TradesPage
        currentUserId={ownerId}
        initialDraft={tradeDraft}
        onDraftConsumed={() => setTradeDraft(null)}
      />
    )
  })()

  return (
    <div className={`density-${settings.density}`}>
      <AppShell
        page={page}
        username={username}
        apiError={apiError}
        mobileNavigationOpen={mobileNavigationOpen}
        onToggleMobileNavigation={() => setMobileNavigationOpen((open) => !open)}
        onNavigate={navigate}
        onLogout={() => supabase.auth.signOut()}
      >
        {content}
      </AppShell>
    </div>
  )
}
