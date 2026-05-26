import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  profile: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue>({
  session: null,
  supabaseUser: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as User);
    }
  };

  const refreshProfile = async () => {
    if (supabaseUser?.id) {
      await fetchProfile(supabaseUser.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setSupabaseUser(null);
  };

  useEffect(() => {
    // Grab the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    // We only fetch/update profile on real sign-in events (after OTP verification),
    // not on PASSWORD_RECOVERY, TOKEN_REFRESHED, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          fetchProfile(session.user.id);
        } else if (!session) {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, supabaseUser, profile, isLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
