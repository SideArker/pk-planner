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

W Cloudflare Workers Builds ustaw katalog główny repozytorium i komendę deploy `pnpm build:worker`. Komenda najpierw buduje web, a potem wdraża Worker razem z plikami z `apps/web/dist`. Aplikacja jest dostępna pod adresem Workera, a `/api/*` obsługuje jego API. Jeśli publikujesz samą statyczną stronę przez Cloudflare Pages, użyj `pnpm build:web` i katalogu `apps/web/dist`.

## Wspólny pakiet

Web i mobile mają zależność `@pk-planner/core: workspace:*`. Importuj typy i funkcje z `@pk-planner/core`; kod źródłowy jest współdzielony bez osobnego buildu pakietu. Dodawaj eksporty w `packages/core/src/index.ts`.

## Worker

`GET /health` zwraca stan Workera. `GET /api/schedule` pobiera JSON z `UPSTREAM_URL` i zwraca go klientowi. `GET /api/version` zwraca wersję aplikacji mobilnej z `apps/mobile/app.json`, np. `{ "version": "1.0.0" }`; klient mobilny może porównać ją ze swoją zainstalowaną wersją. Odpowiedź ma `Cache-Control: no-store`.

### Routing API i obsługa subdomeny (`api.*`)

Worker obsługuje zapytania API w dwóch wariantach:
1. **Ścieżka na głównej domenie**:
   - `GET /api/schedule` - zwraca plan zajęć,
   - `GET /api/health` lub `GET /health` - stan workera,
   - `GET /api/version` - aktualna wersja aplikacji,
   - `GET /api` - katalog endpointów API.
2. **Subdomena z prefiksem `api.`** (np. `api.twojadomena.pl` po podpięciu Custom Domain w Cloudflare):
   - `GET /schedule` oraz `GET /api/schedule` - zwraca plan zajęć,
   - `GET /version` - aktualna wersja aplikacji,
   - `GET /health` oraz `GET /api/health` - stan workera,
   - `GET /` oraz `GET /api` - katalog endpointów API.

> **Uwaga o domenie `workers.dev`**: Darmowa domena `*.workers.dev` (np. `pk-planner.rsowa126.workers.dev`) nie obsługuje wielopoziomowych subdomen (np. `api.pk-planner...`) z powodu braku certyfikatów SSL wildcard na tym poziomie w Cloudflare. Aby korzystać z subdomeny `api.<domena>`, dodaj Custom Domain w Cloudflare Dashboard (**Workers & Pages** -> **pk-planner** -> **Settings** -> **Domains & Routes** -> **Add Custom Domain**).

Lokalnie wpisz adres JSON do głównego `.env`; `pnpm dev:worker` ładuje ten plik. Wdrożony Worker wymaga ustawienia `UPSTREAM_URL` w `apps/worker/wrangler.jsonc` albo w ustawieniach Cloudflare. Bez adresu endpoint zwraca `501`. W `apps/worker/src/index.ts` są osobne miejsca na cache, CORS i kolejne endpointy.
