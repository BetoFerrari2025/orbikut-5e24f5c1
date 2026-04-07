import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const getUserMetadataValue = (user: User, key: string) => {
  const value = user.user_metadata?.[key];
  return typeof value === 'string' ? value.trim() : '';
};

const ensureProfileExists = async (user: User) => {
  const username = getUserMetadataValue(user, 'username') || user.email?.split('@')[0]?.trim();

  if (!username) return;

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        username,
        full_name: getUserMetadataValue(user, 'full_name') || null,
        avatar_url: getUserMetadataValue(user, 'avatar_url') || null,
      },
      {
        onConflict: 'id',
        ignoreDuplicates: true,
      }
    );

  if (error) throw error;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncSession = async (nextSession: Session | null) => {
      try {
        if (nextSession?.user) {
          await ensureProfileExists(nextSession.user);
        }
      } catch (error) {
        console.error('Failed to ensure profile exists', error);
      } finally {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    // Then check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        void syncSession(session);
      })
      .catch(() => {
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
