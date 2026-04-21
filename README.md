# VOID Esport

Site officiel, API et bot Discord du clan compétitif **VOID Esport** (Brawl Stars).
Monorepo TypeScript géré avec **pnpm workspaces**.

> « Embrace The Void »

---

## Sommaire

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Structure du monorepo](#structure-du-monorepo)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Lancer le projet](#lancer-le-projet)
- [Site VOID Esport](#site-void-esport)
- [API Server](#api-server)
- [Bot Discord](#bot-discord)
- [Base de données](#base-de-données)
- [Déploiement](#déploiement)
- [Scripts utiles](#scripts-utiles)

---

## Aperçu

Le projet regroupe trois briques principales :

1. **Site web** — vitrine, recrutement, roster, profils joueurs, panel staff, multilingue (EN / FR / ES / DE / PT).
2. **API Express** — authentification (Discord OAuth + Email/Password), gestion Matcherino, admin, cartes d'annonces générées en PNG.
3. **Bot Discord** — annonces automatiques de tournois Matcherino, commandes slash (`/event`, `/maps`), panel de contrôle depuis le site.

---

## Stack technique

| Domaine | Technos |
|---|---|
| Monorepo | pnpm workspaces, TypeScript 5.9, Node.js 24 |
| Front | React, Vite, Tailwind CSS, Framer Motion, Wouter |
| Back | Express 5, Drizzle ORM, PostgreSQL, Zod, jose (JWT HS256) |
| Auth | Discord OAuth2, Email/Password (bcryptjs), JWT 30 jours |
| Bot | discord.js v14, Components V2 (containers, galleries, select menus) |
| Images | sharp (SVG → PNG pour les cartes Matcherino) |
| Build | esbuild (bundle ESM) |
| Déploiement | Docker (API + Web), Replit Deployments |

---

## Structure du monorepo

```
.
├── artifacts/
│   ├── void-esport/         # Frontend React + Vite (site public + staff panel)
│   ├── api-server/          # API Express + bot Discord
│   └── mockup-sandbox/      # Sandbox de prototypage UI
├── lib/
│   ├── db/                  # Schéma Drizzle + client PostgreSQL
│   ├── api-spec/            # Spécifications OpenAPI partagées
│   ├── api-zod/             # Schémas Zod partagés
│   ├── api-client-react/    # Client React généré
│   └── object-storage-web/  # Helpers de stockage objet
├── docker/                  # Fichiers support Docker
├── Dockerfile.api           # Image API
├── Dockerfile.web           # Image web (nginx)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Prérequis

- **Node.js 24+**
- **pnpm** (`corepack enable` ou `npm i -g pnpm`)
- **PostgreSQL** (ou `DATABASE_URL` fourni par Replit)
- Une **application Discord** (Client ID, Client Secret, Bot Token)

---

## Installation

```bash
pnpm install
pnpm --filter @workspace/db run push
```

La seconde commande applique le schéma Drizzle à la base.

---

## Variables d'environnement

| Nom | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `DISCORD_CLIENT_ID` | OAuth2 — ID de l'application Discord |
| `DISCORD_CLIENT_SECRET` | OAuth2 — secret de l'application Discord |
| `DISCORD_BOT_TOKEN` | Token du bot VOID |
| `JWT_SECRET` | Secret de signature HS256 (≥ 32 caractères conseillés) |
| `PORT` | Port d'écoute (par défaut 8080 pour l'API) |
| `BASE_PATH` | Préfixe de chemin pour le front (par défaut `/`) |

Sur Replit, tous ces secrets se configurent dans l'onglet **Secrets**.

---

## Lancer le projet

Deux workflows sont préconfigurés :

```bash
# API (port 8080)
PORT=8080 pnpm --filter @workspace/api-server run dev

# Site (Vite)
PORT=25439 BASE_PATH=/ pnpm --filter @workspace/void-esport run dev
```

Ou bien, en une seule fois depuis la racine :

```bash
pnpm run dev          # lance tous les workflows
pnpm run typecheck    # typecheck global
pnpm run build        # typecheck + build ESM
```

---

## Site VOID Esport

Dossier : `artifacts/void-esport`.

### Pages publiques
- `/` — Home (hero, manifesto, divisions, achievements, CTA)
- `/roster` — Effectif (Alpha / Omega / Staff) avec cartes joueurs personnalisables
- `/roster/:username` — Profil joueur (fond, avatar, bannière, musique, liens sociaux, tag Brawl Stars…)
- `/join` — Recrutement, exigences, process
- `/rules` — Code de conduite + sanctions
- `/terms`, `/privacy` — Mentions légales
- `/achievements` — Palmarès (placeholder)
- `/*` — 404 animée

### Pages protégées
- `/players-login` — Portail joueur (Discord OAuth + Email/Password)
- `/staff` — Panel staff (Overview, Membres, Bot, Matcherino, Commandes)
- `/meonix`, `/meonix/db` — Zone admin réservée (Discord ID `1243206708604702791`)

### Internationalisation
- 5 langues : **EN** (défaut), **FR**, **ES**, **DE**, **PT**
- Préfixe d'URL : `/`, `/fr/`, `/es/`, `/de/`, `/pt/`
- Détection auto : URL → `localStorage` → géolocalisation IP → langue navigateur
- Switcher dans la navbar (desktop + mobile)

### SEO & UX
- Build multi-pages Vite : chaque route a son HTML dédié (meta baked in)
- Hook `usePageMeta` : titre / description / OG dynamiques + effet glitch cyberpunk
- Responsive complet, menu mobile animé, safe-area iOS

---

## API Server

Dossier : `artifacts/api-server`. Express 5, port **8080**, monté sous `/api`.

### Routes publiques / auth
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/healthz` | Healthcheck |
| GET | `/api/auth/discord/url` | URL d'autorisation OAuth |
| POST | `/api/auth/discord/exchange` | Échange code → JWT |
| POST | `/api/auth/email/signup` | Inscription email + mot de passe |
| POST | `/api/auth/email/login` | Connexion email + mot de passe |
| GET | `/api/auth/verify` | Vérifie un JWT Bearer |
| GET | `/api/brawl/player/:tag` | Proxy API Brawl Stars |

### Routes Matcherino
| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/matcherino/events` | Public |
| POST | `/api/matcherino/events/refresh` | Staff |
| GET | `/api/staff/matcherino/preview/:id` | Staff (PNG de la carte) |
| POST | `/api/staff/matcherino/announce` | Staff (envoi Discord) |
| GET/POST | `/api/staff/matcherino/auto-announce/*` | Staff (start/stop/status) |
| GET/POST | `/api/staff/matcherino/settings` | Staff |

### Routes staff / bot / admin
- `GET /api/staff/members` — liste des membres (staff)
- `GET /api/bot/status` — infos du bot
- `GET /api/bot/commands` — liste des slash commands
- `PATCH /api/bot/presence` — statut + activité (staff)
- `GET /api/admin/*` — opérations admin (Meonix uniquement)
- `GET /api/meonix/db/*` — statut, backups, migration ancienne → nouvelle DB

### Flow d'authentification
1. Front appelle `/api/auth/discord/url` → redirige l'utilisateur vers Discord
2. Retour sur `/players-login?code=...` → `/api/auth/discord/exchange`
3. L'API upsert l'utilisateur et signe un JWT HS256 valable 30 jours
4. Token stocké côté client dans `localStorage` (`void_player_session`)
5. Pages protégées envoient `Authorization: Bearer <token>` à `/api/auth/verify`

Les comptes **email** partagent la même table, le même JWT et les mêmes rôles que les comptes Discord (`discord_id` synthétique `email:<uuid>`).

---

## Bot Discord

Service `discord.js` v14 embarqué dans l'API (`src/lib/bot.ts`).

### Commandes slash
| Commande | Description |
|---|---|
| `/event` | Affiche les prochains tournois Matcherino VOID |
| `/maps` | Rotation Brawl Stars actuelle — avec option `event` autocomplétée |

La commande `/maps` :
- Sans argument → message descriptif + menu de sélection des événements actifs
- Avec `event:<id>` → détail de la map (image, mode, horaires)
- L'autocomplétion interroge l'API Brawl Stars en direct (cache 60 s)

### Annonces Matcherino
- Cartes générées par `src/lib/matcherinoCard.ts` via **sharp** (1200×630, thème cyberpunk, dates en heure de Paris)
- Envoi via **Components V2** : container + gallery + boutons lien avec emojis
- Ping automatique du rôle `1495421946832359504` lors des annonces auto
- Service `src/lib/autoAnnounce.ts` : polling toutes les **5 min**, détecte les nouveaux tournois du créateur `2423612`, état persisté en base (`settings`)

### Panel staff
- Overview, Membres, **Bot Panel** (statut + présence), **Matcherino**, **Commandes**
- Le panel Commandes liste automatiquement les slash commands enregistrées

---

## Base de données

Dossier : `lib/db`. Drizzle ORM + PostgreSQL.

### Tables principales

**`player_logins`** — tous les comptes (Discord + Email)
- `id`, `discord_id` (unique, `email:<uuid>` pour les comptes email), `username`, `avatar`, `last_login_at`
- `email`, `password_hash` (bcrypt), `auth_type` (`discord` | `email`)
- Personnalisation profil : `custom_avatar`, `banner`, `background`, `background_video`, `card_background`, `font`, `music`, `links` (JSON)
- `brawl_tag`, `roles` (`alpha` | `omega` | `staff`)

**`matcherino_events`** — événements Matcherino synchronisés
- `id`, `title`, `kind`, `start_at`, `end_at`, `total_balance`, `participants_count`
- Images : `hero_img`, `background_img`, `thumbnail_img`
- Infos jeu : `game_id`, `game_title`, `game_image`, `game_slug`
- `announced`, `announced_at`, `fetched_at`

**`settings`** — paires clé/valeur applicatives
- Clés : `matcherino.channelId`, `matcherino.autoAnnounce`, `matcherino.manualChannelId`

### Commandes
```bash
pnpm --filter @workspace/db run push         # interactif
pnpm --filter @workspace/db run push-force   # destructif, sans prompt
```

---

## Déploiement

### Docker
- `Dockerfile.api` — build esbuild + runner Node (exécute les migrations au démarrage via `docker-entrypoint.sh`)
- `Dockerfile.web` — build Vite statique servi par **nginx** (`nginx.conf`)
- `docker-compose.yml` — orchestration API + Web

### Replit
Le projet est prêt pour **Replit Deployments** : le proxy iframe, les workflows et les secrets sont déjà configurés.

---

## Scripts utiles

```bash
pnpm run typecheck                               # typecheck global
pnpm run build                                   # build ESM complet
pnpm --filter @workspace/db run push             # push schéma DB
pnpm --filter @workspace/api-server run dev      # API seule
pnpm --filter @workspace/void-esport run dev     # Site seul
```

---

## Licence

© VOID Esport — Tous droits réservés.
