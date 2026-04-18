import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase, toCamel } from "@/lib/supabase";
import type { User as BecsUser } from "@shared/schema";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  becsUser: BecsUser | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  supabaseUser: null,
  becsUser: null,
  loading: true,
  authError: null,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

// Safety net: never allow the spinner to hang forever. If Supabase doesn't
// respond within 10 s we show the login screen with an error rather than
// leaving the user staring at a spinner.
const AUTH_BOOT_TIMEOUT_MS = 10_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [becsUser, setBecsUser] = useState<BecsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tracks the email we've most recently fetched so we don't double-fetch
  // when both getSession() and onAuthStateChange fire on initial load.
  const lastFetchedEmailRef = useRef<string | null>(null);

  // Fetch the BECS user record from our users table.
  // Uses .maybeSingle() so zero rows returns null instead of throwing,
  // and surfaces any error via setAuthError for visibility.
  const fetchBecsUser = useCallback(async (email: string) => {
    if (lastFetchedEmailRef.current === email && becsUser) {
      return becsUser;
    }
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("[auth] fetchBecsUser error:", error);
        setAuthError(error.message);
        return null;
      }
      lastFetchedEmailRef.current = email;
      if (data) {
        const u = toCamel(data) as BecsUser;
        setBecsUser(u);
        setAuthError(null);
        return u;
      }
      // Authenticated with Supabase but no row in public.users → not authorized
      setBecsUser(null);
      setAuthError(null);
      return null;
    } catch (err) {
      console.error("[auth] fetchBecsUser threw:", err);
      setAuthError(err instanceof Error ? err.message : "Failed to load user profile");
      return null;
    }
    // becsUser intentionally excluded: we only use it for the cache check,
    // re-running this callback when becsUser changes would defeat the purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Hard timeout so the spinner can never hang indefinitely.
    const bootTimeout = setTimeout(() => {
      if (cancelled) return;
      setLoading((prev) => {
        if (!prev) return prev;
        console.warn("[auth] boot timeout reached, forcing loading=false");
        setAuthError("Authentication timed out. Please sign in again.");
        return false;
      });
    }, AUTH_BOOT_TIMEOUT_MS);

    // Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[auth] getSession error:", error);
          setAuthError(error.message);
          setLoading(false);
          return;
        }
        const s = data.session;
        setSession(s);
        setSupabaseUser(s?.user ?? null);
        if (s?.user?.email) {
          await fetchBecsUser(s.user.email);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[auth] getSession threw:", err);
        setAuthError(err instanceof Error ? err.message : "Failed to load session");
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (cancelled) return;
      setSession(s);
      setSupabaseUser(s?.user ?? null);
      if (s?.user?.email) {
        await fetchBecsUser(s.user.email);
      } else {
        setBecsUser(null);
        lastFetchedEmailRef.current = null;
      }
      // If a SIGNED_IN / TOKEN_REFRESHED event fires before getSession resolves,
      // make sure we stop showing the spinner.
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "SIGNED_OUT") {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(bootTimeout);
      subscription.unsubscribe();
    };
  }, [fetchBecsUser]);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSupabaseUser(null);
    setBecsUser(null);
    setAuthError(null);
    lastFetchedEmailRef.current = null;
  };

  return (
    <AuthContext.Provider
      value={{ session, supabaseUser, becsUser, loading, authError, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
