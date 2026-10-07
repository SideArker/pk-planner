# Mobile

Aplikacja Expo + React Native + TypeScript. Uruchamiaj z katalogu głównego repo:

```bash
pnpm dev:mobile
```

Otwórz projekt w Expo Go, emulatorze albo własnym buildzie Expo. Ekrany są w `src/app`. Wspólny kod importuj z `@pk-planner/core`. Komendy kontroli jakości: `pnpm lint` i `pnpm typecheck`.

## Wydanie Androida

Workflow `.github/workflows/android-release.yml` buduje podpisany APK i publikuje go po wypchnięciu taga w formacie `vMAJOR.MINOR.PATCH`, np. `v1.1.0`. Tag ustawia wersję aplikacji. Każde uruchomienie workflow zwiększa Androidowy `versionCode`.

Utwórz prywatny keystore poza repozytorium. `keytool` jest częścią JDK:

```bash
keytool -genkeypair -v \
  -keystore "$HOME/pk-planner-release.keystore" \
  -storetype PKCS12 \
  -alias pk-planner \
  -keyalg RSA -keysize 2048 -validity 10000
```

Gdy `keytool` zapyta o hasło klucza, naciśnij Enter, aby użyć hasła keystore'a.

Zachowaj kopię keystore'a i haseł. Android wymaga tego samego keystore'a przy każdej aktualizacji aplikacji. Nie commituj ani nie udostępniaj pliku.

Dodaj poniższe sekrety repozytorium w GitHub: **Settings → Secrets and variables → Actions**:

- `ANDROID_KEYSTORE_BASE64`: keystore zakodowany jako base64. Na Linuxie uruchom `base64 -w 0 "$HOME/pk-planner-release.keystore"`; na macOS `base64 < "$HOME/pk-planner-release.keystore" | tr -d '\n'`.
- `ANDROID_KEYSTORE_PASSWORD`: hasło keystore'a.
- `ANDROID_KEY_ALIAS`: `pk-planner`.
- `ANDROID_KEY_PASSWORD`: hasło klucza. Przy powyższym poleceniu naciśnij Enter, aby było takie samo jak hasło keystore'a.

Wypchnij tag wersji, aby zbudować i opublikować APK:

```bash
git tag v1.1.0
git push origin v1.1.0
```
