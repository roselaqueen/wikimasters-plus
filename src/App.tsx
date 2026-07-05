import { useEffect, useState } from 'react'
import AppShell from './components/layout/AppShell'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { useAuthSession } from './hooks/useAuthSession'
import CardsPage from './pages/CardsPage'
import LoginPage from './pages/LoginPage'
import TradesPage from './pages/TradesPage'
import WishlistsPage from './pages/WishlistsPage'
import { supabase } from './services/auth'
import { loadCards } from './services/cardsApi'
import { loadSettings, saveSettings } from './services/settingsStorage'
import type { Card, Page, Settings, TradeDraft } from './types/domain'
import { isPageRoute, pageFromHash } from './utils/routes'

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [settings] = useState<Settings>(loadSettings)
  const { session, ready: authReady } = useAuthSession()
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
    const syncRoute = () => setPage(pageFromHash())
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    const route = window.location.hash.replace(/^#\/?/, '')
    if (session && !isPageRoute(route)) {
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
    return (
      <main className="auth-loading">
        <LoadingSpinner label="Connexion à WikiMasters…" />
      </main>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  if (!cardsReady) {
    return (
      <main className="auth-loading">
        <LoadingSpinner label="Chargement des cartes…" />
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
