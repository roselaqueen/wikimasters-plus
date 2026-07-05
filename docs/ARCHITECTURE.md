# Architecture

## Choix techniques

- **Vite + React + TypeScript** : application statique rapide, adaptée à un usage local et à un hébergement GitHub Pages.
- **CSS natif** : pas de framework de styles ni de runtime supplémentaire.
- **État local React** pour les filtres et interactions éphémères.
- **localStorage versionné** uniquement pour les préférences non sensibles.
- **IndexedDB** pour les listes de souhaits, partitionnées par identifiant de compte.
- **Authentification Supabase SSR côté navigateur** : elle reproduit le stockage cookie utilisé par le site officiel.
- **Adaptateur API isolé** dans `src/api.ts`. Le mode connecté est la valeur par défaut, avec repli `VITE_API_MODE=demo`.

## Sécurité fonctionnelle

Le projet ne réalise ni scan, ni fuzzing, ni tentative de contournement. L'exploration documentée dans `API.md` provient uniquement des requêtes normales émises par le site après une connexion utilisateur. L'intégration actuelle est en lecture seule ; les opérations mutantes ne sont pas branchées.

Avant une connexion réelle :

1. confirmer les conditions d'utilisation et l'autorisation de réutilisation du service ;
2. définir une authentification officielle ou un proxy local explicite ;
3. protéger les jetons en mémoire, jamais dans le dépôt ;
4. ajouter une confirmation pour chaque action mutante ;
5. limiter les appels, annuler les recherches obsolètes et respecter les réponses `429`.

## Prochaines étapes proposées

1. Import en lecture seule de la collection et des contacts.
2. Index local (Web Worker + IndexedDB) pour plusieurs dizaines de milliers de cartes.
3. Vue « mes souhaits chez mes contacts » classée par proximité d'échange.
4. Constructeur d'échange avec équilibre par rareté et détection des doublons.
5. Historique local des prix et alertes de marché sans polling agressif.

## Format de partage des souhaits

Le format `WML1.<base64url>` encode un JSON minimal `{ v, n, c }` : version, nom de liste et identifiants de cartes. Il ne contient ni identifiant de compte, ni nom de contact, ni jeton. L’import crée toujours une nouvelle liste indépendante afin de ne pas écraser une liste existante.
