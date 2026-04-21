# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Auth**: Discord OAuth2 **+ Email/Password (bcryptjs)** + JWT (jose, HS256, 30 days)
- **Build**: esbuild (ESM bundle via `build.mjs`)
- **Image generation**: sharp (SVG → PNG pour les cartes Matcherino)
- **Discord bot**: discord.js v14

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (interactive)
- `pnpm --filter @workspace/db run push-force` — force push (destructive, skips prompts)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

---

## VOID Esport Website (`artifacts/void-esport`)

Competitive Brawl Stars esport clan site with cyberpunk/esports aesthetic.

### Stack
- React + Vite + TypeScript
- Tailwind CSS (custom theme: `primary` = purple, `accent` = cyan)
- Framer Motion animations
- Wouter routing
- Orbitron font (Google Fonts)

### Pages
- `/` — Home (hero, manifesto, divisions, achievements, join CTA)
- `/roster` — Roster with Alpha/Omega/Staff tabs and player cards
- `/join` — Recruitment page with division tiers, requirements, process
- `/rules` — Code of conduct with sanction levels
- `/terms` — Terms of service
- `/privacy` — Privacy policy
- `/achievements` — Palmarès / Legacy (page vide pour l'instant : "Rien encore pour l'instant")
- `/players-login` — Player Portal (Discord OAuth **+ Email/Password signup/login**, noindex, hidden from nav)
- `/staff` — Staff Panel (Discord OAuth requis + rôle `staff`), sous-routes : Overview / Liste staff / Bot Panel / Matcherino
- `/meonix` — Zone restreinte accessible uniquement à l'ID Discord `1243206708604702791` (sinon 404)
- `/meonix/db` — Admin DB (statut, backups JSON, migration ancienne→nouvelle DB) — Meonix uniquement
- `/*` — Animated 404 page

### i18n System (`src/i18n/`)
- Custom lightweight i18n (no external lib), zero runtime deps
- 5 languages: English (default), French, Spanish, German, Portuguese
- URL prefix routing: `/` = EN, `/fr/` `/es/` `/de/` `/pt/` = others
- Auto-detection: URL prefix → localStorage `void_lang` → ipapi.co geolocation → browser lang
- WouterRouter base computed from URL before React render
- Language switcher: desktop dropdown + mobile grid (5 flags)
- All text uses `useI18n()` hook with `t('key')` — ~150 translation keys
- Brand taglines ("Embrace The Void", "VOID") kept untranslated

### SEO & Meta Tags
- **Multi-page Vite build**: each route has its own HTML file (`index.html`, `roster.html`, `join.html`, `rules.html`, `terms.html`, `privacy.html`, `players-login.html`, `meonix.html`) with static meta baked in
- **Dev server**: inline Vite plugin (`per-page-html`) maps routes to correct HTML files
- **Production**: `artifact.toml` rewrites serve the correct HTML per route before the `/*` catch-all
- **`usePageMeta` hook** (`src/hooks/usePageMeta.ts`): updates `document.title`, description, og tags dynamically + cyberpunk glitch effect every 5s

### Mobile Design
- Responsive navbar with animated hamburger menu (Framer Motion), body scroll lock when open, 44px touch targets
- Hero section: fluid logo sizing, progressive font scaling
- Footer: 2-column grid on mobile, iOS safe-area padding

### Player Profiles (`/roster/:username`)
- Full-page profile editor at `src/pages/roster-player.tsx`
- Customizable: page background (color/gradient/video), card background (color/gradient/image), avatar, banner, font, music, social links, Brawl Stars tag
- `cardBackground` stored in `player_logins` table, applied to player cards on the roster page
- All UI strings fully translated (EN/FR/ES/DE/PT): ~30 `player_*` keys

### Key Files
- `src/App.tsx` — Router + I18nProvider + `getRouterBase()`
- `src/i18n/context.tsx` — I18nProvider, useI18n, switchLang, IP detection
- `src/pages/players-login.tsx` — Discord OAuth login page (Player Portal)
- `src/pages/roster-player.tsx` — Player profile page + edit panel
- `src/pages/roster.tsx` — Roster page with PlayerCard (uses cardBackground)
- `src/pages/staff.tsx` — Panel staff complet (Overview, Members, Bot, Matcherino)
- `src/pages/meonix.tsx` — Protected page (server-side JWT verification)
- `src/hooks/usePageMeta.ts` — Dynamic title/meta + glitch effect
- `vite.config.ts` — Multi-page build config + dev routing middleware
- `.replit-artifact/artifact.toml` — Production rewrites per route

---

## API Server (`artifacts/api-server`)

Express 5 server sur le port 8080, chemins proxifiés via `/api`.

### Routes
- `GET /api/healthz` — health check
- `GET /api/auth/discord/url?redirectUri=...` — returns Discord OAuth authorization URL
- `POST /api/auth/discord/exchange` — exchanges OAuth code for Discord user info + signed JWT
- `POST /api/auth/email/signup` — `{ email, password (>=8), username }` → crée un compte email + JWT
- `POST /api/auth/email/login` — `{ email, password }` → vérifie bcrypt + retourne JWT
- `GET /api/auth/verify` — validates JWT (Bearer token), returns Discord ID, user info + roles
- `GET /api/meonix/db/*` & `POST/DELETE` — admin DB (status, backups JSON, migration old→new) — Meonix uniquement
- `GET /api/brawl/player/:tag` — proxy vers l'API Brawl Stars
- `GET /api/staff/members` — liste des membres (staff uniquement)
- `GET /api/bot/status` — infos du bot Discord
- `PATCH /api/bot/presence` — met à jour statut + activité du bot (staff uniquement)
- `GET /api/admin/*` — routes admin (ID Discord `1243206708604702791` uniquement)
- `GET /api/matcherino/events` — liste des événements Matcherino (public)
- `POST /api/matcherino/events/refresh` — sync depuis l'API Matcherino
- `GET /api/staff/matcherino/preview/:id` — PNG de la carte pour un événement (staff)
- `POST /api/staff/matcherino/announce` — envoie une carte sur Discord (staff)
- `GET /api/staff/matcherino/auto-announce/status` — état de l'auto-announce (staff)
- `POST /api/staff/matcherino/auto-announce/start` — démarre l'auto-announce (staff)
- `POST /api/staff/matcherino/auto-announce/stop` — arrête l'auto-announce (staff)
- `GET /api/staff/matcherino/settings` — lit les paramètres depuis la DB (staff)
- `POST /api/staff/matcherino/settings` — sauvegarde un paramètre en DB (staff)

### Matcherino Card
- Générée par `src/lib/matcherinoCard.ts` via sharp (SVG → PNG 1200×630)
- Style cyberpunk : fond sombre `#0a0a0e`, accent violet `#8b5cf6`, grille, dégradé latéral
- Dates affichées en heure de Paris (`Europe/Paris`)
- Ping automatique du rôle `1495421946832359504` lors des annonces auto

### Auto-announce
- Service `src/lib/autoAnnounce.ts` : polling toutes les 5 min sur l'API Matcherino
- Détecte les nouveaux tournois du créateur `2423612` et les annonce automatiquement
- État (channelId, enabled) persisté en DB dans la table `settings`
- Se réactive automatiquement au redémarrage du serveur si `matcherino.autoAnnounce = true`

### Auth Flow

**Discord OAuth :**
1. Frontend calls `/api/auth/discord/url` → gets OAuth URL
2. User authorizes on Discord → redirected to `/players-login?code=...`
3. Frontend POSTs code to `/api/auth/discord/exchange`
4. API exchanges code with Discord, upserts user in DB, signs a HS256 JWT (30d expiry)
5. JWT stored in `localStorage` under `void_player_session`
6. Protected pages send `Authorization: Bearer <token>` to `/api/auth/verify`
7. Server verifies signature → returns Discord ID from token payload

**Email/Password :**
- Signup : email (unique), pseudo (unique, 2-32), mot de passe (>=8 chars) → bcrypt hash, ID synthétique `email:<uuid>` stocké comme `discord_id`, `auth_type = "email"`, JWT signé identique au flow Discord
- Login : vérification bcrypt → JWT
- Une fois connectés, les comptes email partagent **exactement** le même système que les Discord : même JWT, même `payload.sub`, même table, mêmes routes admin/staff/players. Meonix peut leur attribuer les rôles `alpha`/`omega`/`staff` via `/meonix`.
- Les helpers `avatarUrl` détectent les IDs non-numériques (`email:xxx`) et affichent l'avatar Discord par défaut #0.

### Middleware
- `requireStaff` — vérifie JWT + requête DB pour rôle `staff`
- Admin check — compare `discord_id` avec `ADMIN_DISCORD_ID` hardcodé (`1243206708604702791`)

### Environment Variables / Secrets
- `DISCORD_CLIENT_ID` — Discord app OAuth client ID
- `DISCORD_CLIENT_SECRET` — Discord app OAuth client secret
- `JWT_SECRET` — HS256 signing secret
- `DISCORD_BOT_TOKEN` — token du bot Discord VOID
- `DATABASE_URL` — PostgreSQL connection string (Replit-managed)

### Key Files
- `src/routes/discord-auth.ts` — Discord OAuth + JWT
- `src/routes/email-auth.ts` — Email/Password signup/login (bcryptjs) + JWT
- `src/routes/db-admin.ts` — DB status, backups JSON, migration old→new (Meonix only)
- `src/routes/matcherino.ts` — toutes les routes Matcherino (public + staff)
- `src/routes/staff.ts` — liste des membres
- `src/routes/bot.ts` — status + presence
- `src/routes/admin.ts` — routes admin
- `src/lib/bot.ts` — service discord.js
- `src/lib/matcherinoCard.ts` — génération PNG des cartes tournoi
- `src/lib/autoAnnounce.ts` — service d'annonce automatique

---

## Database (`lib/db`)

Drizzle ORM + PostgreSQL.

### Schema
- **`player_logins`** — Tous les comptes (Discord OAuth **et** Email/Password)
  - `id` serial PK, `discord_id` (unique — pour comptes email : `email:<uuid>`), `username`, `discriminator`, `avatar`, `last_login_at`
  - `email` (unique nullable), `password_hash` (bcrypt, nullable), `auth_type` (`discord` | `email`, default `discord`)
  - `custom_avatar`, `banner`, `background`, `background_video`, `card_background` — personnalisation profil
  - `font`, `music`, `links` (JSON), `brawl_tag`, `roles` text[] (alpha/omega/staff)

- **`matcherino_events`** — Événements Matcherino synchronisés depuis l'API
  - `id` integer PK, `title`, `kind`, `start_at`, `end_at`, `total_balance`, `participants_count`
  - `hero_img`, `background_img`, `thumbnail_img` — images
  - `game_id`, `game_title`, `game_image`, `game_slug` — infos jeu
  - `fetched_at` — date de dernière synchro
  - `announced` boolean, `announced_at` — suivi des annonces Discord

- **`settings`** — Paramètres applicatifs clé/valeur
  - `key` text PK, `value` text, `updated_at` timestamp
  - Clés utilisées : `matcherino.channelId`, `matcherino.autoAnnounce`, `matcherino.manualChannelId`

### Commands
- `pnpm --filter @workspace/db run push` — push schema (interactive)
- `pnpm --filter @workspace/db run push-force` — force push (destructive, skips prompts)

---

## Docker

### Fichiers
- `Dockerfile.api` — Build + runner pour l'API Express
- `Dockerfile.web` — Build + runner nginx pour le frontend
- `docker-entrypoint.sh` — Entrypoint de l'API : applique les migrations DB puis démarre le serveur
- `.dockerignore` — Fichiers exclus du build context

### Fonctionnement
- **Dockerfile.api** : stage builder (pnpm install + esbuild), stage runner (pnpm + lib/db pour migrations + dist)
- Au démarrage du container API, `docker-entrypoint.sh` exécute `pnpm --filter @workspace/db run push-force` puis lance `node dist/index.mjs`
- **Dockerfile.web** : build Vite statique, servi par nginx avec `nginx.conf`
