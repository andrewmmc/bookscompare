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

- [ ] Add deps: `@supabase/supabase-js`, `react-native-url-polyfill`,
      `expo-secure-store`, `expo-apple-authentication`, `expo-web-browser`,
      `expo-auth-session`
- [ ] `src/lib/supabase.ts` client (SecureStore-backed auth storage)
- [ ] Env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `app.config.ts`: expose extra + add `expo-apple-authentication` plugin
- [ ] `featureFlags.ts`: add `enableAccounts`
- [ ] `src/auth/AuthProvider.tsx` + mount in `App.tsx`

## Phase 2 — Auth UI

- [ ] `SignInScreen` (Apple button + email OTP request)
- [ ] `VerifyOtpScreen`
- [ ] `AccountScreen` (signed-in state + sign out + sync now)
- [ ] Navigation wiring (entry from About/Settings)
- [ ] i18n strings (zh-TW + en)

## Phase 3 — Sync layer

- [ ] `src/lib/sync/historySync.ts` (pull/merge/push)
- [ ] `src/lib/sync/favouritesSync.ts`
- [ ] Refactor `history.ts` / `favourites.ts` write paths for background upsert
- [ ] React Query hooks: merge on login, invalidate after sync
- [ ] Unit tests for merge logic

## Phase 4 — Polish & QA

- [ ] Account deletion (Apple requirement) via Supabase Edge Function/RPC
- [ ] Analytics events (sign-in, sync success/fail), no PII
- [ ] Privacy manifest + App Store data disclosures update
- [ ] `npm run typecheck -w @bookscompare/mobile`
- [ ] `npm run test -w @bookscompare/mobile`
- [ ] Manual 2-device sync verification

## Changelog (per commit)

- `docs(mobile)`: add account sync progress log
- `feat(mobile)`: add Supabase schema (history_entries, favourites) + RLS + setup README
