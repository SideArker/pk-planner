# PK Planner

Minimalne monorepo planu zajęć, zarządzane przez pnpm workspaces.

## Struktura

- `apps/web` — React, Vite i TypeScript; gotowe do zbudowania jako statyczna strona dla Cloudflare Pages.
- `apps/mobile` — Expo, React Native i TypeScript; projekt Expo Router.
- `apps/worker` — Cloudflare Worker i Wrangler; punkt wyjścia dla proxy publicznego JSON-a uczelni.
- `packages/core` — wspólne typy, parser, filtry i narzędzia.
- `.github/workflows/ci.yml` — kontrola lint, typów i buildu web.

## Wymagania

Node.js 22.12+ i pnpm 12.9.1. Do uruchomienia mobile użyj Expo Go, emulatora albo własnego buildu Expo.

## Start

```bash
pnpm install
pnpm dev:web
pnpm dev:mobile
pnpm dev:worker
```

Każdy serwer uruchom w osobnym terminalu. Kontrole i build:

```bash
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm build:web
```

`pnpm build:web` zapisuje stronę w `apps/web/dist`. Ten katalog może być katalogiem wyjściowym Cloudflare Pages. Worker ma konfigurację wdrożenia w `apps/worker/wrangler.jsonc`. Projekt mobile pozostaje projektem Expo.

## Wspólny pakiet

Web i mobile mają zależność `@pk-planner/core: workspace:*`. Importuj typy i funkcje z `@pk-planner/core`; kod źródłowy jest współdzielony bez osobnego buildu pakietu. Dodawaj eksporty w `packages/core/src/index.ts`.

## Worker

`GET /health` zwraca stan Workera. `GET /api/schedule` pobiera JSON z `UPSTREAM_URL` i zwraca go klientowi. Lokalnie wpisz adres JSON do głównego `.env`; `pnpm dev:worker` ładuje ten plik. Wdrożony Worker wymaga ustawienia `UPSTREAM_URL` w `apps/worker/wrangler.jsonc` albo w ustawieniach Cloudflare. Bez adresu endpoint zwraca `501`. W `apps/worker/src/index.ts` są osobne miejsca na cache, CORS i kolejne endpointy.
