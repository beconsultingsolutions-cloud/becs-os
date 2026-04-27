import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase, toCamel, clearSupabaseSession } from "@/lib/supabase";
import type { User as BecsUser } from "@shared/schema";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  becsUser: BecsUser | null;
  loading: boolean;
  /** True once fetchBecsUser has resolved (success or failure) for the current session. */
  becsUserLoaded: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Nuclear option exposed to the UI: wipe local session and reload. */
  resetSession: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  supabaseUser: null,
  becsUser: null,
  loading: true,
  becsUserLoaded: false,
  authError: null,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  resetSession: async () => {},
});

// Safety net: never allow the spinner to hang forever. If Supabase doesn't
// respond within 10 s we show the login screen with an error rather than
// leaving the user staring at a spinner.
const AUTH_BOOT_TIMEOUT_MS = 10_000;

// Error messages that indicate the locally-persisted refresh token is no
// longer valid. When we see these we auto-clear storage and bounce the user
// to the login screen — no manual "clear site data" required.
const STALE_TOKEN_PATTERNS = [
  "refresh_token_not_found",
  "Invalid Refresh Token",
  "refresh token not found",
  "Refresh Token Not Found",
  "invalid refresh token",
  "JWT expired",
  "token is expired",
];

function isStaleTokenError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!msg) return false;
  return STALE_TOKEN_PATTERNS.some((p) => msg.toLowerCase().includes(p.toLowerCase()));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [becsUser, setBecsUser] = useState<BecsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [becsUserLoaded, setBecsUserLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tracks the email we've most recently fetched so we don't double-fetch
  // when both getSession() and onAuthStateChange fire on initial load.
  const lastFetchedEmailRef = useRef<string | null>(null);
  // Reentrancy guard: multiple stale-token errors firing at once (getSession +
  // onAuthStateChange) should only trigger one recovery cycle.
  const recoveringRef = useRef(false);

  /** Wipe the local session and return the user to a clean login state. */
  const resetSession = useCallback(async () => {
    // Reentrancy guard only blocks the storage wipe, never the reload.
    // User-initiated sign-out from the Unauthorized screen must always reload
    // even if a background stale-token cycle flipped the flag earlier.
    if (!recoveringRef.current) {
      recoveringRef.current = true;
      try {
        await clearSupabaseSession();
      } catch {
        // If storage is already wiped, keep going to the reload.
      }
    }
    setSession(null);
    setSupabaseUser(null);
    setBecsUser(null);
    setBecsUserLoaded(false);
    setAuthError(null);
    lastFetchedEmailRef.current = null;
    setLoading(false);
    if (typeof window !== "undefined") {
      // Navigate back to root first so the post-reload app doesn't re-render
      // the Unauthorized screen for the old hash route.
      window.location.hash = "";
      window.location.reload();
    }
  }, []);

  // Fetch the BECS user record from our users table.
  // Uses .maybeSingle() so zero rows returns null instead of throwing,
  // and surfaces any error via setAuthError for visibility.
  const fetchBecsUser = useCallback(async (email: string) => {
    if (lastFetchedEmailRef.current === email && becsUser) {
      setBecsUserLoaded(true);
      return becsUser;
    }
    try {
      // Case-insensitive email match + tolerant is_active check.
      // auth.users emails can differ in casing from public.users, and
      // is_active has historically been stored as both boolean true and
      // integer 1 across the SQLite → Supabase migration. Normalize in JS.
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("[auth] fetchBecsUser error:", error);
        if (isStaleTokenError(error)) {
          await resetSession();
          return null;
        }
        setAuthError(error.message);
        return null;
      }
      lastFetchedEmailRef.current = email;
      if (data && (data.is_active === true || data.is_active === 1 || data.is_active === "true")) {
        const u = toCamel(data) as BecsUser;
        setBecsUser(u);
        setAuthError(null);
        return u;
      }
      // Authenticated with Supabase but no active row in public.users → not authorized
      setBecsUser(null);
      setAuthError(null);
      return null;
    } catch (err) {
      console.error("[auth] fetchBecsUser threw:", err);
      if (isStaleTokenError(err)) {
        await resetSession();
        return null;
      }
      setAuthError(err instanceof Error ? err.message : "Failed to load user profile");
      return null;
    } finally {
      setBecsUserLoaded(true);
    }
    // becsUser intentionally excluded: we only use it for the cache check,
    // re-running this callback when becsUser changes would defeat the purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSession]);

  useEffect(() => {
    let cancelled = false;

    // Hard timeout so the spinner can never hang indefinitely.
    // Covers both `loading` and `becsUserLoaded` — if either is still blocking
    // after AUTH_BOOT_TIMEOUT_MS, force them so the UI unblocks.
    const bootTimeout = setTimeout(() => {
      if (cancelled) return;
      console.error("[auth] boot timeout reached — forcing loading=false and becsUserLoaded=true");
      setLoading(false);
      setBecsUserLoaded(true);
      setAuthError("Authentication timed out. Please sign in again.");
    }, AUTH_BOOT_TIMEOUT_MS);

    // Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        console.log("[auth] getSession resolved", error ? `error=${error.message}` : `session=${!!data.session}`);
        if (error) {
          console.error("[auth] getSession error:", error);
          if (isStaleTokenError(error)) {
            await resetSession();
            return;
          }
          setAuthError(error.message);
          setBecsUserLoaded(true);
          setLoading(false);
          return;
        }
        const s = data.session;
        setSession(s);
        setSupabaseUser(s?.user ?? null);
        if (s?.user?.email) {
          console.log("[auth] fetchBecsUser start (from getSession)");
          const result = await fetchBecsUser(s.user.email);
          console.log("[auth] fetchBecsUser end (from getSession) becsUser=", result?.email ?? null);
        } else {
          // No session at mount — nothing to fetch, unblock immediately
          console.log("[auth] getSession resolved with no session — setting becsUserLoaded=true");
          setBecsUserLoaded(true);
        }
        setLoading(false);
      })
      .catch(async (err) => {
        if (cancelled) return;
        console.error("[auth] getSession threw:", err);
        if (isStaleTokenError(err)) {
          await resetSession();
          return;
        }
        setAuthError(err instanceof Error ? err.message : "Failed to load session");
        setBecsUserLoaded(true);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (cancelled) return;
      console.log("[auth] event=", event, "session=", !!s);

      // TOKEN_REFRESHED with no session means the refresh call failed silently.
      // Treat it as a stale session and recover.
      if (event === "TOKEN_REFRESHED" && !s) {
        console.warn("[auth] TOKEN_REFRESHED fired with no session — resetting");
        await resetSession();
        return;
      }

      setSession(s);
      setSupabaseUser(s?.user ?? null);

      if (s?.user?.email) {
        console.log("[auth] fetchBecsUser start (from event=", event, ")");
        const result = await fetchBecsUser(s.user.email);
        console.log("[auth] fetchBecsUser end (from event=", event, ") becsUser=", result?.email ?? null);
      } else if (event === "SIGNED_OUT") {
        setBecsUser(null);
        setBecsUserLoaded(true);
        lastFetchedEmailRef.current = null;
      } else {
        // No session and not SIGNED_OUT (e.g. INITIAL_SESSION with null session)
        // Still unblock the gate so the UI doesn't hang.
        setBecsUserLoaded(true);
      }

      // Any auth event should unblock the loading spinner.
      setLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(bootTimeout);
      subscription.unsubscribe();
    };
  }, [fetchBecsUser, resetSession]);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    try {
      await clearSupabaseSession();
    } finally {
      setSession(null);
      setSupabaseUser(null);
      setBecsUser(null);
      setBecsUserLoaded(false);
      setAuthError(null);
      lastFetchedEmailRef.current = null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, supabaseUser, becsUser, loading, becsUserLoaded, authError, signIn, signOut, resetSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
