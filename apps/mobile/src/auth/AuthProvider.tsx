import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getSupabaseClient } from '../lib/supabase';

import type { Session, User } from '@supabase/supabase-js';

export type AuthStatus = 'disabled' | 'loading' | 'signedOut' | 'signedIn';

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /** Native Sign in with Apple. Resolves on success, throws on failure. */
  signInWithApple: () => Promise<void>;
  /** Request a 6-digit email OTP (also creates the account on first use). */
  requestEmailOtp: (email: string) => Promise<void>;
  /** Verify the 6-digit email OTP. */
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const noopAsync = async () => {
  throw new Error('Accounts are not configured.');
};

const AuthContext = createContext<AuthContextValue>({
  status: 'disabled',
  session: null,
  user: null,
  signInWithApple: noopAsync,
  requestEmailOtp: noopAsync,
  verifyEmailOtp: noopAsync,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // getSupabaseClient() is a memoized singleton; resolve it once on mount.
  const [supabase] = useState(() => getSupabaseClient());
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'disabled');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      setSession(data.session);
      setStatus(data.session ? 'signedIn' : 'signedOut');
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'signedIn' : 'signedOut');
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithApple = useCallback(async () => {
    if (!supabase) {
      return noopAsync();
    }

    // Supabase verifies the Apple identity token against a nonce: send the
    // SHA-256 hash to Apple and the raw value to Supabase.
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('Apple sign-in did not return an identity token.');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) {
      throw error;
    }
  }, [supabase]);

  const requestEmailOtp = useCallback(
    async (email: string) => {
      if (!supabase) {
        return noopAsync();
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) {
        throw error;
      }
    },
    [supabase]
  );

  const verifyEmailOtp = useCallback(
    async (email: string, token: string) => {
      if (!supabase) {
        return noopAsync();
      }
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email',
      });
      if (error) {
        throw error;
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      signInWithApple,
      requestEmailOtp,
      verifyEmailOtp,
      signOut,
    }),
    [status, session, signInWithApple, requestEmailOtp, verifyEmailOtp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
