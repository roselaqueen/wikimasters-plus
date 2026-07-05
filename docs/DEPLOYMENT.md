# Déploiement GitHub Pages + Supabase

GitHub Pages héberge uniquement le front statique. La fonction Supabase `wm-backend` fournit le proxy authentifié vers WikiMasters et le stockage distant des wishlists.

## 1. Créer un projet Supabase personnel

Ne pas utiliser le projet Supabase de WikiMasters. Relever le `project ref`, l'URL et les clés du nouveau projet.

## 2. Appliquer la migration et déployer la fonction

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set WIKIMASTERS_ANON_KEY=... ALLOWED_ORIGIN=https://benjaminbriere.github.io
supabase functions deploy wm-backend --no-verify-jwt
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement par Supabase dans la fonction.

## 3. Configurer GitHub

Créer le secret Actions suivant :

- `VITE_BACKEND_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/wm-backend`

Activer ensuite Pages avec la source **GitHub Actions**. Tout push sur `main` reconstruit et publie le site.

## Modèle de sécurité

- Le JWT WikiMasters est vérifié par l'endpoint officiel Supabase avant chaque opération.
- Le client n'obtient jamais la clé `service_role` du nouveau projet.
- La table `wishlists` a RLS forcée et aucun privilège direct pour `anon` ou `authenticated`.
- Toutes les requêtes sont limitées au `owner_id` extrait du JWT vérifié.
