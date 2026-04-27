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
// respond within this window we show the login screen with an error rather
// than leaving the user staring at a spinner.
//
// Bumped from 10 s → 20 s because slow mobile networks and cold-started
// Supabase pods occasionally take 12–15 s to respond on first session load.
// The 6 s slow-boot UI in <AppLoading /> still gives the user an early
// out (Reload / Reset) well before this hard ceiling.
const AUTH_BOOT_TIMEOUT_MS = 20_000;

// Number of times to retry the public.users lookup on transient network
// errors before giving up. Each retry waits RETRY_BACKOFF_MS * attempt.
const BECS_USER_FETCH_RETRIES = 2;
const RETRY_BACKOFF_MS = 750;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
  // Retries on transient network errors with linear backoff.
  const fetchBecsUser = useCallback(async (email: string) => {
    if (lastFetchedEmailRef.current === email && becsUser) {
      setBecsUserLoaded(true);
      return becsUser;
    }
    const phaseStart = performance.now();
    let lastError: unknown = null;
    let data: any = null;
    let error: any = null;

    for (let attempt = 0; attempt <= BECS_USER_FETCH_RETRIES; attempt++) {
      try {
        // Case-insensitive email match + tolerant is_active check.
        // auth.users emails can differ in casing from public.users, and
        // is_active has historically been stored as both boolean true and
        // integer 1 across the SQLite → Supabase migration. Normalize in JS.
        const res = await supabase
          .from("users")
          .select("*")
          .ilike("email", email)
          .limit(1)
          .maybeSingle();
        data = res.data;
        error = res.error;
        if (!error) break;
        // Auth/permission errors should not be retried
        if (isStaleTokenError(error)) break;
        // Treat any other error as potentially transient — retry
        lastError = error;
        if (attempt < BECS_USER_FETCH_RETRIES) {
          console.warn(`[auth] fetchBecsUser attempt ${attempt + 1} failed, retrying:`, error.message);
          await sleep(RETRY_BACKOFF_MS * (attempt + 1));
        }
      } catch (e) {
        lastError = e;
        if (attempt < BECS_USER_FETCH_RETRIES) {
          console.warn(`[auth] fetchBecsUser attempt ${attempt + 1} threw, retrying:`, e);
          await sleep(RETRY_BACKOFF_MS * (attempt + 1));
        } else {
          throw e;
        }
      }
    }

    const elapsedMs = Math.round(performance.now() - phaseStart);
    console.log(`[auth] fetchBecsUser query took ${elapsedMs}ms`);

    try {
      if (error) {
        console.error("[auth] fetchBecsUser error after retries:", error);
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
      void lastError; // referenced for diagnostics, no-op if branches consumed it
    }
    // becsUser intentionally excluded: we only use it for the cache check,
    // re-running this callback when becsUser changes would defeat the purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSession]);

  useEffect(() => {
    let cancelled = false;
    let bootSettled = false;
    const bootStart = performance.now();

    // Hard timeout so the spinner can never hang indefinitely.
    // Covers both `loading` and `becsUserLoaded` — if either is still blocking
    // after AUTH_BOOT_TIMEOUT_MS, force them so the UI unblocks.
    //
    // CRITICAL: We MUST clear this timer the moment the boot sequence settles
    // (success or handled failure), otherwise it fires later and overwrites a
    // perfectly good auth state with a bogus "Authentication timed out" error.
    // That was the root cause of the spurious error appearing on the login
    // screen ~20 s after page load.
    const bootTimeout = setTimeout(() => {
      if (cancelled || bootSettled) return;
      const onlineHint = typeof navigator !== "undefined" && navigator.onLine === false
        ? " Your device appears to be offline — check your network and try again."
        : " Check your connection and try signing in again.";
      console.error(
        `[auth] boot timeout reached after ${Math.round(performance.now() - bootStart)}ms — forcing loading=false and becsUserLoaded=true`,
      );
      setLoading(false);
      setBecsUserLoaded(true);
      setAuthError(`Authentication timed out.${onlineHint}`);
    }, AUTH_BOOT_TIMEOUT_MS);

    const settleBoot = () => {
      if (bootSettled) return;
      bootSettled = true;
      clearTimeout(bootTimeout);
      console.log(`[auth] boot settled in ${Math.round(performance.now() - bootStart)}ms`);
    };

    // Get initial session
    const sessionStart = performance.now();
    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        const sessionMs = Math.round(performance.now() - sessionStart);
        console.log(
          `[auth] getSession resolved in ${sessionMs}ms`,
          error ? `error=${error.message}` : `session=${!!data.session}`,
        );
        if (error) {
          console.error("[auth] getSession error:", error);
          if (isStaleTokenError(error)) {
            settleBoot();
            await resetSession();
            return;
          }
          setAuthError(error.message);
          setBecsUserLoaded(true);
          setLoading(false);
          settleBoot();
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
        settleBoot();
      })
      .catch(async (err) => {
        if (cancelled) return;
        console.error("[auth] getSession threw:", err);
        if (isStaleTokenError(err)) {
          settleBoot();
          await resetSession();
          return;
        }
        setAuthError(err instanceof Error ? err.message : "Failed to load session");
        setBecsUserLoaded(true);
        setLoading(false);
        settleBoot();
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
