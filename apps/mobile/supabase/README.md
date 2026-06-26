# Supabase setup (account sync)

This folder holds the database schema and setup notes for cross-device sync of
search history and favourites. The mobile app talks to Supabase **directly**;
the Cloudflare Worker API stays stateless and is not involved in auth.

## 1. Create the project

1. Create a project at https://supabase.com.
2. Copy the **Project URL** and **anon public key** from
   _Project Settings → API_.
3. Put them in `apps/mobile/.env`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
   ```

   The anon key is safe to ship in the client — Row Level Security (RLS) is what
   protects user data.

## 2. Apply the schema

Run `migrations/0001_account_sync.sql` in the Supabase SQL editor, or with the
Supabase CLI:

```bash
supabase db push
```

This creates `history_entries` and `favourites`, each with RLS policies that
restrict every row to its owner (`auth.uid() = user_id`).

## 3. Enable auth providers

In _Authentication → Providers_:

- **Email** — enable, and turn on email OTP (passwordless). No password flows to
  maintain.
- **Apple** — enable, set the Services ID, Team ID, Key ID, and private key.
  Add the app's redirect/bundle as required. Used via native Sign in with Apple
  (`expo-apple-authentication` → `supabase.auth.signInWithIdToken`).

## 4. Account deletion

Apple requires in-app account deletion. Run `migrations/0002_delete_user.sql`,
which creates a `security definer` `public.delete_user()` RPC that deletes the
caller's `auth.users` row. The `on delete cascade` foreign keys on
`history_entries` and `favourites` clear the synced data automatically.

The mobile app calls this via `supabase.rpc('delete_user')` from the Account
screen (see `src/auth/AuthProvider.tsx`). Local AsyncStorage data on the device
is intentionally kept.
