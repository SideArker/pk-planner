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

`pnpm dev:mobile` tworzy tymczasowy tunel Cloudflare przez zainstalowany w repozytorium Wrangler i wyświetla kod QR `exps://` dla Expo Go. Nie wymaga konta Cloudflare; publiczny adres zmienia się po każdym uruchomieniu. Zatrzymaj tunel klawiszami Ctrl+C. Na fizycznym iPhonie Expo CLI i Expo Go muszą być zalogowane na to samo konto Expo. Jeśli telefon ma bezpośredni dostęp do komputera w LAN, możesz uruchomić `pnpm --filter mobile exec expo start --lan --go`.

Na Androidzie Expo Go uruchamia plan i ustawienia, ale powiadomienia są wyłączone. Aby używać powiadomień, uruchom zainstalowany build aplikacji.

Każdy serwer uruchom w osobnym terminalu. Kontrole i build:

```bash
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm build:web
```

`pnpm build:web` zapisuje stronę w `apps/web/dist`. Ten katalog może być katalogiem wyjściowym Cloudflare Pages. Worker ma konfigurację wdrożenia w `apps/worker/wrangler.jsonc`. Projekt mobile pozostaje projektem Expo.

W Cloudflare Workers Builds ustaw katalog główny repozytorium i komendę deploy `pnpm build:worker`. Komenda najpierw buduje web, a potem wdraża Worker razem z plikami z `apps/web/dist`. Aplikacja jest dostępna pod `https://pkplanner.sidearker.com`, a `/api/*` obsługuje jego API. Jeśli publikujesz samą statyczną stronę przez Cloudflare Pages, użyj `pnpm build:web` i katalogu `apps/web/dist`.

Stary adres `https://pk-planner.rsowa126.workers.dev` musi nadal serwować stronę z tego buildu. Przy wejściu pod ten adres skrypt w `index.html` odczytuje konfigurację użytkownika, motyw i układ z `localStorage`, po czym przekazuje je do nowej domeny przez fragment URL. Nowa domena zapisuje dane przed uruchomieniem aplikacji i usuwa fragment z adresu. Nie ustawiaj serwerowego przekierowania 308 na starym hoście, dopóki migracja ma działać.

## Wspólny pakiet

Web i mobile mają zależność `@pk-planner/core: workspace:*`. Importuj typy i funkcje z `@pk-planner/core`; kod źródłowy jest współdzielony bez osobnego buildu pakietu. Dodawaj eksporty w `packages/core/src/index.ts`.

## Worker

`GET /health` zwraca stan Workera. `GET /api/schedule` pobiera JSON z `UPSTREAM_URL` i zwraca go klientowi. `GET /api/version` zwraca najnowszą wersję aplikacji, opcjonalny `apkUrl` oraz `changelog` w formacie Markdown pobrany z opisu wydania GitHub. Gdy wydanie jest niedostępne, zwraca wersję z `apps/mobile/app.json` i tekst z `apps/mobile/release-notes.json`. Klient mobilny może porównać tę wersję ze swoją zainstalowaną wersją. Odpowiedź ma `Cache-Control: no-store`.

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

> **Uwaga o domenie `workers.dev`**: Darmowa domena `*.workers.dev` nie obsługuje wielopoziomowych subdomen (np. `api.pk-planner...`) z powodu braku certyfikatów SSL wildcard na tym poziomie w Cloudflare. Aby korzystać z subdomeny `api.<domena>`, dodaj Custom Domain w Cloudflare Dashboard (**Workers & Pages** -> **pk-planner** -> **Settings** -> **Domains & Routes** -> **Add Custom Domain**).

Lokalnie wpisz adres JSON do głównego `.env`; `pnpm dev:worker` ładuje ten plik. Wdrożony Worker wymaga ustawienia `UPSTREAM_URL` w ustawieniach Cloudflare. Bez adresu endpoint zwraca `500`.

## Powiadomienia mobilne

W ustawieniach aplikacji można osobno włączyć powiadomienia o zmianie opublikowanego planu, przypomnienia 30 minut przed zajęciami i na ich początku oraz odliczanie czasu zajęć. Android używa FCM HTTP v1 i Workera, który co minutę sprawdza zapisane plany urządzeń oraz odcisk planu źródłowego. Powiadomienia o zmianie planu są obecnie dostępne na Androidzie. iOS używa lokalnych powiadomień; Android też przechodzi na nie, jeśli FCM nie jest skonfigurowany lub Worker jest niedostępny. Lokalny harmonogram obejmuje najbliższe 14 dni i odnawia się po otwarciu planu. Na iOS odliczanie pokazuje czas przy rozpoczęciu zajęć, bez aktualizacji w tle.

Aby uruchomić FCM na Androidzie:

1. W Firebase dodaj aplikację Android z identyfikatorem `com.sidearker.pkplanner`, pobierz `google-services.json` i ustaw w głównym `.env` zmienną `GOOGLE_SERVICES_JSON` na **ścieżkę** do tego pliku. Przy budowaniu przez EAS ustaw tę samą zmienną w środowisku budowania jako ścieżkę do przesłanego pliku.
2. W Firebase wygeneruj JSON konta usługi z uprawnieniem do FCM HTTP v1. Pełną zawartość JSON ustaw jako `FCM_SERVICE_ACCOUNT_JSON` w głównym `.env` dla lokalnego Workera, a we wdrożeniu jako sekret Cloudflare: `pnpm --filter worker exec wrangler secret put FCM_SERVICE_ACCOUNT_JSON`. Nie używaj prefiksu `EXPO_PUBLIC_` dla tego sekretu.
3. Wdróż Workera z `apps/worker/wrangler.jsonc` i zbuduj nową aplikację Android. Konfiguracja tworzy Durable Object dla rejestracji urządzeń oraz uruchamia wysyłkę co minutę. Powiadomienia push nie działają w Expo Go na Androidzie; potrzebny jest build aplikacji.

FCM wysyła odliczanie co 5 minut, aktualizując jedno powiadomienie przez ten sam `tag`. Po zakończeniu zajęć zastępuje je zwykłym powiadomieniem. Opcja `sticky` utrzymuje je na Androidzie, lecz Android 14 i nowsze pozwalają użytkownikowi usunąć większość takich powiadomień, więc nie można zagwarantować całkowitej blokady usuwania.
