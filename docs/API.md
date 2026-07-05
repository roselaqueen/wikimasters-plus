# Cartographie de l'API WikiMasters

Observations réalisées le **5 juillet 2026** via l'interface normale de `www.wiki-masters.com`, avec un compte de test fourni. Cette documentation décrit des appels observés ; ce n'est ni une spécification officielle ni une garantie de stabilité.

## Architecture observée

- Front : Next.js avec routes React Server Components (`?_rsc=...`).
- Auth et certaines données : Supabase, projet `cyrxjeppjqsxxjayfrur.supabase.co`.
- API métier : routes `/api/*` du domaine `www.wiki-masters.com`.
- La connexion appelle Supabase `POST /auth/v1/token?grant_type=password`, puis `GET /auth/v1/user`.
- Le front officiel journalise aussi les connexions via `POST /api/auth/log-security-event`.

Les clés publiques présentes dans le JavaScript client ne doivent pas être confondues avec une autorisation à interroger arbitrairement la base. Les règles RLS de Supabase et les contrats de l'application restent obligatoires.

## Routes de lecture observées dans le périmètre

| Méthode | Route | Usage observé |
|---|---|---|
| GET | `/api/notifications` | Notifications du compte |
| GET | `/api/packs/pro-daily` | État du paquet PRO quotidien |
| GET | `/api/my-collection/stats?sort=rarity` | Statistiques de collection |
| GET | `/api/my-collection?sort=rarity&page=0&stats=0` | Collection paginée |
| GET | `/api/owned-card-ids` | Identifiants des cartes possédées |
| GET | `/api/trades` | Offres d'échange |
| GET | `/api/trades?active=1` | Échanges actifs |
| GET | `/api/marketplace?page=1&limit=50&sort=ending_soon` | Lots du marché, paginés |
| GET | `/api/marketplace/mine` | Ventes/enchères du compte |
| GET | `/api/contest` | Concours courant (hors périmètre UI) |
| GET | `/api/leaderboard?period=daily&tz=Europe/Paris&page=1` | Classement (hors périmètre UI) |

## Requêtes Supabase observées

Les requêtes REST suivantes sont générées par le client officiel et nécessitent la session et les en-têtes Supabase adéquats :

- `profiles?select=*&id=eq.<user_id>` : profil complet ;
- `profiles?select=id,is_pro,stripe_customer_id&id=eq.<user_id>` : statut PRO ;
- `profiles?select=is_pro&id=eq.<user_id>` ;
- `tags?select=*&user_id=eq.<user_id>&order=name.asc` : étiquettes personnelles ;
- `rpc/sync_profile_packs` (POST) : synchronisation des paquets ;
- `achievements?select=*` et `user_achievements?...` ont été vus mais restent hors périmètre.

## Formes de données à confirmer

La première passe a relevé les routes et statuts sans conserver de jetons ni de réponses privées. Les interfaces TypeScript définitives devront être établies par capture volontaire et minimisée des seules réponses nécessaires :

- `CollectionPage { items, page, hasMore, stats? }` ;
- `Card { id, title, description, image, rarity, attack, defense, ... }` ;
- `Trade { id, status, sender, recipient, offeredCards, requestedCards, ... }` ;
- `Friend { id, username, avatar, relationStatus, ... }` ;
- `MarketplacePage { listings, page, total, ... }`.

## Écritures repérées mais non testées

Les interactions visibles impliquent probablement l'ouverture de paquet, la création/acceptation d'échange, les enchères, les souhaits, les tags et la modification du profil. Aucune de ces opérations n'a été déclenchée pendant la cartographie. Elles doivent rester derrière une confirmation utilisateur et une validation de contrat avant intégration.

## Contraintes d'intégration

Un front servi sur `localhost` ne partage pas automatiquement les cookies du domaine officiel. Trois options propres existent :

1. API officiellement documentée avec jeton Bearer ;
2. authentification Supabase côté client puis transmission du JWT si les routes métier l'acceptent explicitement ;
3. proxy local contrôlé, avec consentement clair et protections CSRF/origine.

Le projet utilise un proxy Vite local et une authentification Supabase normale. Il ne copie pas les cookies du navigateur officiel et ne contourne pas CORS.

## Intégration réalisée

- `@supabase/ssr` crée la session sur le domaine local avec le même format de cookies segmentés que le client officiel.
- Le proxy Vite relaie `/wm-api/*` vers `/api/*` en conservant les cookies de la requête.
- `GET /api/cards?page=0&sort=rarity` alimente actuellement « Toutes les cartes » : cartes, quantités, IDs possédés, souhaits officiels et possesseurs amis.
- `GET /api/cards?page=0&q=<recherche>&sort=rarity` alimente la recherche globale des listes de souhaits.
- `GET /api/cards?page=<n>&q=<recherche>&rarity=<L|UR|SR|R|PC|C>&sort=<tri>` alimente la pagination et les filtres de « Toutes les cartes ».
- `GET /api/my-collection?sort=<tri>&q=<recherche>&rarity=<rareté>&page=<n>&stats=0` alimente la Collection.
- `GET /api/cards/<id>` résout les cartes d'une liste importée ou enregistrée qui ne figurent pas dans la première page.
- Le mode connecté est la valeur par défaut. `VITE_API_MODE=demo` coupe les appels distants.
- Les mutations (paquet, enchère, échange, modification de profil) restent volontairement non connectées jusqu'à validation individuelle de leur contrat.
