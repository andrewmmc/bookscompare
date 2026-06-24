# Account Sync (Supabase) — Implementation Progress

Branch: `feat/account-sync-supabase`

Living log of what is done and what remains. See the full design in
`~/notes/bookscompare-history-account-sync-plan.md`.

## Decisions (defaults chosen)

- **Service:** Supabase (managed auth + Postgres, low maintenance, RLS).
- **Auth methods:** Sign in with Apple + Email OTP (passwordless). Register == first login.
- **Sync scope:** both history and favourites.
- **Logout behavior:** keep local cache (do not wipe).
- **Cloudflare Worker:** stays stateless / out of auth; mobile talks to Supabase directly.

## Architecture

```
Expo mobile  --search/scrape-->  Cloudflare Worker API (unchanged, stateless)
Expo mobile  --auth + sync---->  Supabase (Auth + Postgres, RLS-gated, direct)
```

## Status legend

- [x] done & committed
- [~] in progress
- [ ] not started

## Phase 0 — Supabase backend setup

- [ ] Create Supabase project (manual, done by maintainer in dashboard)
- [x] SQL migration: `history_entries` + `favourites` tables
- [x] RLS policies (`user_id = auth.uid()`)
- [ ] Enable Email OTP provider (manual, dashboard — see supabase/README.md)
- [ ] Enable Apple provider (manual, dashboard — see supabase/README.md)

## Phase 1 — Client foundation

- [x] Add deps: `@supabase/supabase-js`, `react-native-url-polyfill`,
      `expo-secure-store`, `expo-apple-authentication`, `expo-web-browser`,
      `expo-auth-session`
- [x] `src/lib/supabase.ts` client (SecureStore-backed auth storage)
- [x] Env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [x] `app.config.ts`: expose extra + add secure-store/web-browser/apple plugins
- [x] `featureFlags.ts`: add `enableAccounts`
- [x] `src/auth/AuthProvider.tsx` + mount in `App.tsx` (Apple + email OTP, expo-crypto nonce)

## Phase 2 — Auth UI

- [x] `AccountScreen` sign-in view (Apple button + email OTP request)
- [x] `VerifyOtpScreen`
- [x] `AccountScreen` signed-in state (email, sync now, sign out, delete account)
- [x] Navigation wiring (Account + VerifyOtp routes; entry row in About,
      gated by `enableAccounts && isSupabaseConfigured()`)
- [x] i18n strings (zh-TW + en) under `account`

## Phase 3 — Sync layer

- [x] `src/lib/sync/historySync.ts` (pull/merge/push)
- [x] `src/lib/sync/favouritesSync.ts`
- [x] `replaceHistory` / `replaceFavourites` + `historyEntryKey` helpers
- [x] Unit tests for merge logic (`sync/merge.test.ts`, 6 tests)
- [x] Background remote write helpers + `getActiveAccount` (`sync/session.ts`,
      `remote{Upsert,Clear}History`, `remote{Upsert,Remove,Clear}Favourites`)
- [x] Wire background upsert/delete into the React Query mutation hooks
      (`api/history.ts`, `api/favourites.ts`), best-effort + analytics on error
- [x] `AccountSyncProvider`: full reconcile on login + on app foreground,
      invalidate query keys, expose `syncNow`/`syncing`/`lastSyncedAt`
- [x] Unit tests for remote write helpers (`sync/remoteWrites.test.ts`, 7 tests)

## Phase 4 — Polish & QA

- [x] Account deletion (Apple requirement): `delete_user()` RPC
      (`migrations/0002_delete_user.sql`) + `deleteAccount` in AuthProvider + UI
- [x] Analytics events (sign-in, OTP, sync success/fail, sign-out, delete), no PII
- [ ] Privacy manifest + App Store data disclosures update (now collecting email + user content) — pending
- [x] `npm run typecheck -w @bookscompare/mobile`
- [x] `npm run test -w @bookscompare/mobile` (154 passing, incl. new sync tests)
- [ ] Manual 2-device sync verification (needs a live Supabase project)

## Remaining before ship

- Provision the Supabase project and run both migrations; enable Email OTP +
  Apple providers (see `supabase/README.md`); set `EXPO_PUBLIC_SUPABASE_*`.
- Update privacy disclosures (`npm run audit:privacy`, App Store data form).
- Manual cross-device QA.

## Changelog (per commit)

- `docs(mobile)`: add account sync progress log
- `feat(mobile)`: add Supabase schema (history_entries, favourites) + RLS + setup README
- `feat(mobile)`: add Supabase client, deps, env config, and enableAccounts flag
- `feat(mobile)`: add AuthProvider (Apple + email OTP) and mount in App
- `feat(mobile)`: add history/favourites sync merge layer + unit tests
- `feat(mobile)`: wire background remote sync into mutation hooks + AccountSyncProvider
- `feat(mobile)`: add Account + VerifyOtp screens, About entry, account i18n
- `feat(mobile)`: add account deletion RPC + deleteAccount flow
