import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://eorkllalnzottuhejdrl.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcmtsbGFsbnpvdHR1aGVqZHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDQ5ODMsImV4cCI6MjA5MTg4MDk4M30.PTVfi6PNOMZQOinpLtYfDnTBMMrqCweFiWMBYZzxwDs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
