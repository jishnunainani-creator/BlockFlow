import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Auth helper functions
export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  return await supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  if (!supabase) throw new Error('Supabase is not configured.');
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  });
}

export async function signOut() {
  if (!supabase) return;
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
