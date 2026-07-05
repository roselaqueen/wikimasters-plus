# WikiMasters+

Front alternatif pour WikiMasters, centré sur la collection, la recherche, les listes de
souhaits et les échanges.

## Démarrage

```bash
pnpm install
pnpm dev
```

L’application utilise une vraie session WikiMasters. Aucun mot de passe n’est enregistré
par le projet.

## Configuration

En production, définir l’URL de la fonction Supabase :

```bash
VITE_BACKEND_URL=https://PROJECT.supabase.co/functions/v1/wm-backend
```

Le serveur Vite relaie `/wm-api/*` vers les routes officielles pendant le développement.

## Commandes

```bash
pnpm build
pnpm format
pnpm format:check
pnpm test:e2e
```

## Fonctionnalités actives

- Collection et catalogue global avec recherche, filtres et pagination.
- Wishlists multiples, partage statique `WML1` et liens dynamiques `WMD1`.
- Recherche des cartes possédées par les contacts.
- Création, consultation et gestion des échanges.
- Interface responsive et thème sombre.

Voir [la cartographie API](docs/API.md) et [l’architecture](docs/ARCHITECTURE.md).
