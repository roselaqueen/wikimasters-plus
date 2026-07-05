import type { Page } from '../types/domain'

const pageRoutes: Record<string, Page> = {
  collection: 'collection',
  wishlists: 'wishlists',
  cards: 'cards',
  trades: 'trades',
}

export function pageFromHash(): Page {
  return pageRoutes[window.location.hash.replace(/^#\/?/, '')] ?? 'collection'
}

export function isPageRoute(route: string): boolean {
  return route in pageRoutes
}
