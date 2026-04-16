import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, toCamel } from "@/lib/supabase";
import type { User as BecsUser } from "@shared/schema";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  becsUser: BecsUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  supabaseUser: null,
  becsUser: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [becsUser, setBecsUser] = useState<BecsUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the BECS user record from our users table
  const fetchBecsUser = useCallback(async (email: string) => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .limit(1)
      .single();
    if (data) {
      setBecsUser(toCamel(data) as BecsUser);
    }
    return data;
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setSupabaseUser(s?.user ?? null);
      if (s?.user?.email) {
        fetchBecsUser(s.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setSupabaseUser(s?.user ?? null);
        if (s?.user?.email) {
          await fetchBecsUser(s.user.email);
        } else {
          setBecsUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchBecsUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSupabaseUser(null);
    setBecsUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, supabaseUser, becsUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
