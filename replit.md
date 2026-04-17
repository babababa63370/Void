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
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## VOID Esport Website (`artifacts/void-esport`)

Competitive Brawl Stars esport clan site with cyberpunk/esports aesthetic.

### Stack
- React + Vite + TypeScript
- Tailwind CSS (custom theme: `primary` = purple, `accent` = cyan)
- Framer Motion animations
- Wouter routing
- Orbitron font (Google Fonts)
- No backend — static site

### Pages
- `/` — Home (hero, manifesto, divisions, achievements, join CTA)
- `/roster` — Roster page with Alpha/Omega/Staff tabs and player cards
- `/join` — Recruitment page with division tiers, requirements, process
- `/rules` — Code of conduct with sanction levels
- `/terms` — Terms of service
- `/privacy` — Privacy policy
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
- **Multi-page Vite build**: each route has its own HTML file (`index.html`, `roster.html`, `join.html`, `rules.html`, `terms.html`, `privacy.html`) with static OG/Twitter meta tags baked in — readable by bots without JavaScript
- **Dev server**: inline Vite plugin (`per-page-html`) maps routes to correct HTML files (e.g. `/roster` → `roster.html`)
- **Production**: `artifact.toml` rewrites serve the correct HTML per route before the `/*` catch-all
- **`usePageMeta` hook** (`src/hooks/usePageMeta.ts`): updates `document.title`, description, og:title/description/url dynamically at runtime + glitch effect every 5s (briefly replaces 2–4 chars with cyberpunk symbols for 120ms)

### Mobile Design
- Responsive navbar with animated hamburger menu (Framer Motion), body scroll lock when open, 44px touch targets
- Hero section: fluid logo sizing (`w-36 sm:w-48 md:w-64`), progressive font scaling (`text-4xl sm:text-6xl md:text-8xl`)
- Footer: 2-column grid on mobile, iOS safe-area padding
- All sections use responsive Tailwind variants for padding, font size, and grid columns

### Key Files
- `src/App.tsx` — Router + I18nProvider + `getRouterBase()`
- `src/i18n/context.tsx` — I18nProvider, useI18n, switchLang, IP detection
- `src/i18n/locales/en.ts` — Canonical locale + `Translations` type
- `src/i18n/locales/{fr,es,de,pt}.ts` — Full translations
- `src/pages/roster.tsx` — Roster with PlayerCard + OpenSlotCard
- `src/components/layout/navbar.tsx` — Responsive navbar + lang switcher
- `src/hooks/usePageMeta.ts` — Dynamic title/meta + glitch effect
- `index.html`, `roster.html`, `join.html`, `rules.html`, `terms.html`, `privacy.html` — Static HTML entry points per route
- `vite.config.ts` — Multi-page build config + dev routing middleware
- `public/logo.png` — Brand logo (apple-touch-icon, OG image)
