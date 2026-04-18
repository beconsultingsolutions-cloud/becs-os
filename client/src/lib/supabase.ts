import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://eorkllalnzottuhejdrl.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcmtsbGFsbnpvdHR1aGVqZHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDQ5ODMsImV4cCI6MjA5MTg4MDk4M30.PTVfi6PNOMZQOinpLtYfDnTBMMrqCweFiWMBYZzxwDs";

// Explicit storage key so we can clear it deterministically when a session
// goes bad (e.g. expired refresh token, revoked user, schema drift).
export const AUTH_STORAGE_KEY = "becs-os-auth";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

/**
 * Fully clear the locally-persisted Supabase session. Use this when auth is
 * stuck on a stale/expired token so the user doesn't have to manually clear
 * site data.
 *
 * Covers: our explicit key, any legacy default keys from earlier builds, and
 * any `sb-*-auth-token` keys Supabase may have written under the default config.
 */
export async function clearSupabaseSession(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Ignore — we'll still wipe storage manually below.
  }

  if (typeof window === "undefined") return;

  const wipeFrom = (store: Storage) => {
    const toRemove: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (!k) continue;
      if (
        k === AUTH_STORAGE_KEY ||
        k.startsWith("sb-") ||
        k.startsWith("supabase.auth.") ||
        k === "becs-os-auth"
      ) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) store.removeItem(k);
  };

  try {
    wipeFrom(window.localStorage);
  } catch {
    /* ignore */
  }
  try {
    wipeFrom(window.sessionStorage);
  } catch {
    /* ignore */
  }
}

// ─── CAMEL ↔ SNAKE HELPERS ────────────────────────────────────────────────────
export function toSnake(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)] = v;
  }
  return out;
}

export function toCamel(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

export function toCamelArray<T>(rows: Record<string, any>[]): T[] {
  return rows.map((r) => toCamel(r) as T);
}
