'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

// Instância única do cliente browser (com cookies)
const supabase = createClient();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string | null) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, captchaToken?: string | null) => Promise<{ error: string | null }>;
  /** Envia o link de redefinição de senha (a resposta é sempre a mesma, exista o e-mail ou não). */
  resetPassword: (email: string, captchaToken?: string | null) => Promise<{ error: string | null }>;
  /** Reenvia o e-mail de confirmação do cadastro. */
  resendConfirmation: (email: string, captchaToken?: string | null) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // SOMENTE app_metadata: o user_metadata pode ser alterado pelo próprio usuário (supabase.auth.updateUser),
  // então nunca deve conceder poderes de administrador.
  const isAdmin = user?.app_metadata?.role === 'admin';

  useEffect(() => {
    let mounted = true;

    // Carrega sessão inicial dos cookies
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças de autenticação (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, captchaToken?: string | null) => {
    const { error } = await supabase.auth.signInWithPassword({
      email, password, options: captchaToken ? { captchaToken } : undefined,
    });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, name: string, captchaToken?: string | null) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, ...(captchaToken ? { captchaToken } : {}) },
    });
    return { error: error?.message ?? null };
  };

  const resetPassword = async (email: string, captchaToken?: string | null) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, captchaToken ? { captchaToken } : undefined);
    return { error: error?.message ?? null };
  };

  const resendConfirmation = async (email: string, captchaToken?: string | null) => {
    const { error } = await supabase.auth.resend({
      type: 'signup', email, options: captchaToken ? { captchaToken } : undefined,
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, resetPassword, resendConfirmation, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
