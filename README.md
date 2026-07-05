# WikiMasters+

Un front alternatif, local-first et non intrusif pour WikiMasters. Cette version privilégie la recherche, les filtres combinables, les souhaits, la comparaison avec les contacts et la personnalisation du profil.

## Démarrage

```bash
pnpm install
pnpm dev
```

L'application démarre en **mode connecté** et affiche un écran de connexion WikiMasters. L'authentification est réalisée directement avec Supabase ; le mot de passe n'est jamais conservé par l'application. Les préférences visuelles sont enregistrées sous la clé versionnée `wikimasters-plus:v1` de `localStorage`.

## Connexion API

Le proxy Vite envoie `/wm-api/*` vers `https://www.wiki-masters.com/api/*`. Les cookies de session Supabase créés sur `localhost` sont transmis aux routes métier existantes.

Pour revenir au jeu de données local :

```bash
VITE_API_MODE=demo pnpm dev
```

Un déploiement statique devra fournir un proxy ou une réécriture équivalente pour `/wm-api`. Ne jamais stocker de mot de passe dans le dépôt ou dans `localStorage`.

## Périmètre actuel

- Bibliothèque « Toutes les cartes » avec recherche différée, raretés, possession, souhaits et filtre contacts.
- Collection et doublons.
- Inspecteur de carte, lien Wikipédia et amorce d'échange.
- Personnalisation du profil inspirée du POC fourni.
- Listes de souhaits multiples stockées dans IndexedDB par identifiant de compte.
- Export/import portable au format texte `WML1` sans donnée personnelle.
- Analyse des cartes possédées par les contacts et message prêt à copier.
- Amis, Paquets, Échanges, Marché, Messages et Paramètres.
- Responsive mobile et thème sombre par défaut, proche du site d’origine.

Hors périmètre demandé : Bataille, Succès, Concours, Classement et Guilde.

Voir [docs/API.md](docs/API.md) et [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
