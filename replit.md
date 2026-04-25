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
- `/staff` — Staff Panel (Discord OAuth requis + rôle `staff`), sous-routes : Overview / Liste staff / Bot Panel / Commandes / Matcherino
- `/meonix` — Zone restreinte accessible uniquement à l'ID Discord `1243206708604702791` (sinon 404)
- `/meonix/db` — Admin DB (statut, backups JSON, migration ancienne→nouvelle DB) — Meonix uniquement
- `/meonix/tips` — Admin Dons (toggle activation, URL PayPalMe, objectif, affichage donateurs, CRUD dons, sync API PayPal officielle Live/Sandbox) — Meonix uniquement
- `/donate` — Page Dons publique (404 si désactivée). Affiche total, objectif, derniers donateurs, lien PayPal.Me
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
- `src/pages/staff.tsx` — Panel staff complet (Overview, Members, Bot, Commandes, Matcherino)
  - La page **Commandes** (`/staff/bot/commandes`) liste automatiquement les slash commands via `GET /api/bot/commands`
  - Route imbriquée `/staff/:section/:sub` définie dans `App.tsx`
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
- `GET /api/bot/commands` — liste des slash commands enregistrées (staff)
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
- `GET /api/tips/public` — public, retourne `{enabled, paypalUrl, totalCents, count, recent[]}` ou 404 si désactivé. Déclenche un sync auto PayPal throttlé (5 min).
- `GET /api/tips/enabled` — public léger, `{enabled}` (utilisé par la navbar)
- `GET /api/tips` — liste complète des dons (Meonix)
- `GET /api/tips/settings` — settings + statut PayPal `{configured, environment, lastSync, lastError}` (Meonix)
- `POST /api/tips/settings` — modifie `enabled`, `paypalUrl`, `goalAmountCents`, `goalLabel`, `showDonors` (Meonix)
- `POST /api/tips/paypal-env` — bascule l'environnement PayPal entre `live` et `sandbox`, persisté dans `settings.tips.paypal_env` (Meonix)
- `POST /api/tips` — ajoute un don manuel local (Meonix)
- `PATCH /api/tips/:id` — modifie un don local (montant, devise, donateur, message, date) (Meonix)
- `DELETE /api/tips/:id` — supprime un don local (Meonix)
- `POST /api/tips/sync` — déclenche manuellement la sync PayPal Transactions API (dédoublonnage par `external_id`) (Meonix)

### Discord Bot — Slash commands
- **`/event`** — Liste les prochains tournois Matcherino VOID (5 max). Boutons liens : *View on VOID* + *View on Matcherino* avec emoji `<:matcherino5e:1494738441349632050>`.
- **`/maps`** — Rotation Brawl Stars via `https://api.meonix.me/api/events/rotation` (cache 60 s dans `src/lib/brawlEvents.ts`).
  - Sans argument : message descriptif + **StringSelect** listant les événements actifs
  - `event:<id>` : détail de la map (image via gallery, mode, horaires start/end)
  - **Autocomplete** en direct sur le nom du mode et de la map (aucune mise à jour manuelle nécessaire)
- **Modération** (Discord natif, options USER/CHANNEL/STRING/INTEGER, `default_member_permissions` par permission Discord adaptée) :
  - **`/ban`** — `user`, `reason?`, `delete_days?` (0-7). DM au membre, PUT `/guilds/{id}/bans/{user}`.
  - **`/unban`** — `user_id` (string), `reason?`. DELETE `/guilds/{id}/bans/{user}`. Pas de DM (utilisateur absent).
  - **`/kick`** — `user`, `reason?`. DM puis DELETE `/guilds/{id}/members/{user}`.
  - **`/mute`** — `user`, `duration`, `unit` (m/h/d), `reason?`. DM puis PATCH `communication_disabled_until` (timeout Discord, cappé à 28 jours).
  - **`/demute`** — `user`, `reason?`. DM puis PATCH `communication_disabled_until: null`.
  - **`/move`** — `user`, `channel` (voice/stage), `reason?`. DM puis PATCH `channel_id`.
  - Toutes les réponses utilisent **cv2** (`replySuccess`/`replyError`). Le résultat indique si le MP a bien été délivré.
  - Toutes les actions (succès et échecs) sont **loguées** dans `moderation_logs` puis affichées sur `/staff/moderation/logs`.

### Système de recrutement (tickets Discord)
- **Lib** : `artifacts/api-server/src/lib/recruitment.ts` — flow complet
- **Routes** : `artifacts/api-server/src/routes/recruitment.ts`
  - `POST /api/staff/recruitment/panel { channelId }` — poste le panel CV2 dans un salon
  - `GET /api/staff/recruitment/applications?status=` — liste filtrée
  - `PATCH /api/staff/recruitment/applications/:id { status, staffNote }` — change statut + envoie un MP au candidat
- **Bot** : intents `Guilds`, `GuildMessages`, `MessageContent` (à activer dans Developer Portal)
  - Catégorie tickets : `1496764571086622811` · Rôle staff : `1243206708604702791` (constants `TICKET_CATEGORY_ID`, `STAFF_ROLE_ID`)
  - Panel : sélecteur 3 divisions (Alpha=Master, Omega=Légendaire 2, Nexus=Mythique 2)
  - Choix div → bot crée un salon privé sous la catégorie (deny @everyone, allow user + rôle staff)
  - Flow question/réponse : tag (vérifié via Meonix avec boutons "Oui c'est moi"/"Non, retaper") → trophées → ranked → ambitions → pourquoi lui ; à chaque étape le bot supprime la question précédente et la réponse de l'utilisateur
  - Soumission → salon verrouillé en écriture, statut `pending`, visible sur `/staff/recrutements/candidatures`
  - Staff change statut depuis le site → MP automatique envoyé au candidat (CV2 avec note staff)
- Handler d'interaction dispatche sur 3 types : `ApplicationCommand`, `ApplicationCommandAutocomplete`, `MessageComponent` (pour le select `maps_select`).
- Helpers `cv2.ts` : `stringSelect()`, `respondAutocomplete()`, `actionRow()` accepte boutons **ou** select menus.
- Helpers `moderation.ts` : `banUser/unbanUser/kickUser/timeoutUser/moveUser`, `sendDM()`, `logModeration()`, templates DM (`dmBan`/`dmKick`/`dmMute`/`dmUnmute`/`dmMove`).

### Matcherino Card
- Générée par `src/lib/matcherinoCard.ts` via sharp (SVG → PNG 1200×630)
- Style cyberpunk : fond sombre `#0a0a0e`, accent violet `#8b5cf6`, grille, dégradé latéral
- Dates affichées en heure de Paris (`Europe/Paris`)
- Ping automatique du rôle `1495421946832359504` lors des annonces auto

### Matcherino Announce (Components V2)
- Annonce envoyée comme **attachment** `card.png` (sharp) au lieu de l'image `heroImg`
- Mentions gérées via un `text()` à l'intérieur du container + `allowed_mentions` (Components V2 n'autorise pas `content`)
- Liens présentés en **boutons** (pas de markdown) : *View on VOID* + *View on Matcherino* (emoji `<:matcherino5e:1494738441349632050>`)
- Même layout pour les annonces auto, manuelles et la commande `/event`

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
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` — credentials de l'app PayPal Business (Live ou Sandbox selon `tips.paypal_env`). Permission *Transaction Search* requise.
- `PAYPAL_ENV` *(optionnel)* — `live` (défaut) ou `sandbox`. Surchargé par le setting DB `tips.paypal_env` modifiable depuis `/meonix/tips`.
- `PAYPAL_MEONIX_TOKEN` *(legacy/optionnel)* — token Bearer pour l'API perso `paypal.meonix.me` (conservée dans `src/lib/paypalMeonix.ts` au cas où)

### Key Files
- `src/routes/discord-auth.ts` — Discord OAuth + JWT
- `src/routes/email-auth.ts` — Email/Password signup/login (bcryptjs) + JWT
- `src/routes/db-admin.ts` — DB status, backups JSON, migration old→new (Meonix only)
- `src/routes/matcherino.ts` — toutes les routes Matcherino (public + staff)
- `src/routes/staff.ts` — liste des membres
- `src/routes/bot.ts` — status + presence
- `src/routes/admin.ts` — routes admin
- `src/lib/bot.ts` — service discord.js + handlers `/event`, `/maps`, `/ban`, `/unban`, `/kick`, `/mute`, `/demute`, `/move`
- `src/lib/moderation.ts` — actions REST Discord (ban/unban/kick/timeout/move), `sendDM()`, `logModeration()`, templates DM cv2
- `src/lib/brawlEvents.ts` — client API Brawl Stars (rotation + cache + parsing timestamps non-ISO)
- `src/lib/matcherinoCard.ts` — génération PNG des cartes tournoi
- `src/lib/autoAnnounce.ts` — service d'annonce automatique (exporte `PING_ID`)
- `src/lib/paypal.ts` — client OAuth2 + Transactions Reporting API PayPal officiel (live/sandbox bascule via DB), dédoublonnage par `external_id`, sync auto throttlé (`maybeBackgroundSync`)
- `src/lib/paypalMeonix.ts` — *(legacy/optionnel)* client de l'API perso `paypal.meonix.me` (POST/GET/DELETE `/dons`) + miroir local
- `src/routes/tips.ts` — toutes les routes `/api/tips/*` (public + Meonix), branchées sur `paypal.ts`
- `src/utils/cv2.ts` — helpers Components V2 (text/sep/gallery/container/linkButton/actionRow/stringSelect, replyInteraction, respondAutocomplete, sendCv2Message, registerSlashCommands)

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

- **`recruitment_applications`** — Candidatures du système de recrutement par tickets Discord
  - `id` serial PK, `discord_id`, `discord_username`, `guild_id`, `channel_id` (unique — salon ticket)
  - `division` (`alpha`/`omega`/`nexus`), `step` (étape du flow : tag/tag_confirm/trophies/ranked/ambitions/motivation/done)
  - `last_bot_message_id` — pour supprimer la question précédente après chaque réponse
  - `brawl_tag`, `brawl_name`, `brawl_icon_id`, `brawl_trophies` — profil BS vérifié via Meonix
  - `trophies`, `ranked`, `ambitions`, `motivation` — réponses textuelles
  - `status` (`draft`/`pending`/`accepted`/`refused`/`on_hold`), `staff_note`
  - `reviewed_by`, `reviewed_by_username`, `reviewed_at`, `submitted_at`, `created_at`, `updated_at`

- **`settings`** — Paramètres applicatifs clé/valeur
  - `key` text PK, `value` text, `updated_at` timestamp
  - Clés Matcherino : `matcherino.channelId`, `matcherino.autoAnnounce`, `matcherino.manualChannelId`
  - Clés Tips/Dons : `tips.enabled`, `tips.paypal_url`, `tips.goal_amount`, `tips.goal_label`, `tips.show_donors`, `tips.paypal_env` (`live`/`sandbox`), `tips.paypal_last_sync`, `tips.paypal_last_error`

- **`tips`** — Dons reçus (sync depuis l'API PayPal Transactions)
  - `id` serial PK, `amount_cents` integer, `currency` (défaut `EUR`)
  - `donor_name`, `message` — métadonnées (extraites de PayPal pour les dons synchronisés, saisies à la main pour les `manual`)
  - `source` (`paypal` pour les transactions importées via l'API PayPal officielle, `manual` pour les ajouts manuels Meonix)
  - `external_id` — `transaction_id` PayPal, utilisé pour dédoublonnage lors de la sync
  - `received_at`, `created_at`

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
