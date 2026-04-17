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
- **Auth**: Discord OAuth2 + JWT (jose, HS256, 30 days)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
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
- `/players-login` — Player Portal (Discord OAuth login, noindex, hidden from nav)
- `/meonix` — Zone restreinte accessible uniquement à l'ID Discord `1243206708604702791` (sinon 404)
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
- `src/pages/meonix.tsx` — Protected page (server-side JWT verification)
- `src/hooks/usePageMeta.ts` — Dynamic title/meta + glitch effect
- `vite.config.ts` — Multi-page build config + dev routing middleware
- `.replit-artifact/artifact.toml` — Production rewrites per route

---

## API Server (`artifacts/api-server`)

Express 5 server on port 8080, paths proxied at `/api`.

### Routes
- `GET /api/healthz` — health check
- `GET /api/auth/discord/url?redirectUri=...` — returns Discord OAuth authorization URL
- `POST /api/auth/discord/exchange` — exchanges OAuth code for Discord user info + signed JWT
- `GET /api/auth/verify` — validates JWT (Bearer token), returns Discord ID and user info

### Auth Flow
1. Frontend calls `/api/auth/discord/url` → gets OAuth URL with `client_id` from env
2. User authorizes on Discord → redirected to `/players-login?code=...`
3. Frontend POSTs code to `/api/auth/discord/exchange`
4. API exchanges code with Discord, upserts user in DB, signs a HS256 JWT (30d expiry)
5. JWT stored in `localStorage` under `void_player_session`
6. Protected pages send `Authorization: Bearer <token>` to `/api/auth/verify`
7. Server verifies signature → returns Discord ID from token payload (unforgeable)

### Environment Variables / Secrets
- `DISCORD_CLIENT_ID` — Discord app OAuth client ID
- `DISCORD_CLIENT_SECRET` — Discord app OAuth client secret
- `JWT_SECRET` — HS256 signing secret (shared env var, server-generated)
- `DATABASE_URL` — PostgreSQL connection string (Replit-managed)

### Key Files
- `src/routes/discord-auth.ts` — Discord OAuth + JWT routes
- `src/routes/health.ts` — health check

---

## Database (`lib/db`)

Drizzle ORM + PostgreSQL.

### Schema
- **`player_logins`** — Discord users who logged in via OAuth
  - `id` serial PK
  - `discord_id` text — Discord user ID (unique per user)
  - `username` text — display name (global_name ?? username#discriminator)
  - `discriminator` text — legacy `#0000` tag
  - `avatar` text — avatar hash (for CDN URL construction)
  - `last_login_at` timestamp
  - `custom_avatar`, `banner`, `background`, `background_video` — profile customization
  - `card_background` — card background shown on roster page (color/gradient/image URL)
  - `font`, `music`, `links` (JSON), `brawl_tag` — profile extras
  - `role` text — member role (alpha/omega/staff)

### Commands
- `pnpm --filter @workspace/db run push` — push schema (interactive)
- `pnpm --filter @workspace/db run push-force` — force push (destructive, skips prompts)
