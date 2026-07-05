# Architecture

## Organisation du front

```text
src/
├── components/
│   ├── cards/       Composants visuels partagés par les catalogues et wishlists
│   ├── layout/      Navigation et structure générale de l’application
│   └── trades/      Compositeur d’échange
├── pages/           Un composant par route active
├── App.tsx          Authentification, routage et composition des pages
├── *Api.ts          Adaptateurs de l’API WikiMasters
└── wishlistDb.ts    Persistance des wishlists et formats de partage
```

Les seules routes actives sont `collection`, `cards`, `wishlists` et `trades`. Le dépôt
ne contient plus d’écran métier fictif ni de jeu de données de démonstration.

## Choix techniques

- Vite, React et TypeScript pour l’application GitHub Pages.
- CSS natif pour conserver un contrôle précis sur le rendu des cartes.
- Supabase Auth pour la session WikiMasters.
- Une Edge Function Supabase comme proxy restreint et backend des wishlists.
- `localStorage` uniquement pour les préférences d’affichage non sensibles.
- IndexedDB comme repli local lorsque le backend de wishlist n’est pas configuré.

## Flux de données

`App.tsx` charge la session et les premières données nécessaires, puis transmet des
propriétés typées aux pages. Chaque page réalise ses propres requêtes paginées via les
adaptateurs API. Les composants visuels n’effectuent aucune requête réseau.

Les recherches sont temporisées et les requêtes indépendantes sont lancées en parallèle.
Les cartes de wishlists sont mises en cache pour éviter les appels répétés.

## Sécurité

Le proxy n’autorise que les routes nécessaires. Les mutations d’échange demandent une
confirmation dans l’interface. Les wishlists dynamiques sont résolues côté serveur et
restent en lecture seule pour les utilisateurs qui les suivent.

## Formats de partage

- `WML1` contient une copie indépendante du nom et des identifiants de cartes.
- `WMD1` contient une référence vers une wishlist source et reste synchronisé avec elle.
