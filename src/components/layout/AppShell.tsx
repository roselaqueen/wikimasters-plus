import type { ReactNode } from 'react'
import {
  Archive,
  ArrowLeftRight,
  ChevronRight,
  Heart,
  LayoutGrid,
  Menu,
} from 'lucide-react'
import type { Page } from '../../types'

type AppShellProps = {
  page: Page
  username: string
  apiError: string
  mobileNavigationOpen: boolean
  onToggleMobileNavigation: () => void
  onNavigate: (page: Page) => void
  onLogout: () => void
  children: ReactNode
}

const navigation = [
  { id: 'collection', label: 'Collection', icon: Archive },
  { id: 'wishlists', label: 'Listes de souhaits', icon: Heart },
  { id: 'cards', label: 'Toutes les cartes', icon: LayoutGrid },
  { id: 'trades', label: 'Échanges', icon: ArrowLeftRight },
] satisfies Array<{ id: Page; label: string; icon: typeof Archive }>

export default function AppShell({
  page,
  username,
  apiError,
  mobileNavigationOpen,
  onToggleMobileNavigation,
  onNavigate,
  onLogout,
  children,
}: AppShellProps) {
  const activeItem = navigation.find((item) => item.id === page)

  return (
    <div className="app">
      <aside className={mobileNavigationOpen ? 'open' : ''}>
        <button className="brand" onClick={() => onNavigate('collection')}>
          <span>W</span>
          WikiMasters<em>+</em>
        </button>
        <nav>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? 'active' : ''}
              onClick={() => onNavigate(item.id)}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <span className="mode-dot live" />
          <div>
            <strong>API connectée</strong>
            <small>Données WikiMasters</small>
          </div>
        </div>
      </aside>

      <div className="shell">
        <header>
          <button
            className="mobile-menu"
            aria-label={mobileNavigationOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={onToggleMobileNavigation}
          >
            <Menu />
          </button>
          <div className="crumb">
            Bibliothèque <ChevronRight size={14} />
            <strong>{activeItem?.label}</strong>
            {apiError ? <span className="api-warning">{apiError}</span> : null}
          </div>
          <div className="utilities">
            <button className="avatar">{username.slice(0, 2).toUpperCase()}</button>
            <span className="username">{username}</span>
            <button className="logout" onClick={onLogout}>
              Déconnexion
            </button>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
