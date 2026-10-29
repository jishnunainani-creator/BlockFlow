import { createClient } from '@supabase/supabase-js';

// Standard Vite environment variable resolution:
// Prefers VITE_SUPABASE_PUBLISHABLE_KEY, with fallback to legacy VITE_SUPABASE_ANON_KEY.
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = rawUrl ? String(rawUrl).trim().replace(/^["']|["']$/g, '') : '';
const supabaseAnonKey = rawKey ? String(rawKey).trim().replace(/^["']|["']$/g, '') : '';

// Security check: Reject secret/service-role keys in browser configuration
export const isSecretKeyProvided = Boolean(
  supabaseAnonKey && (
    supabaseAnonKey.startsWith('sb_secret_') ||
    supabaseAnonKey.includes('service_role')
  )
);

if (isSecretKeyProvided) {
  console.error(
    '[BlockFlow Security Alert] A Supabase secret/service-role key was detected in browser environment configuration. Secret keys must NEVER be exposed in client code. Please replace with your public anon/publishable key.'
  );
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !isSecretKeyProvided &&
  supabaseUrl !== 'undefined' &&
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl !== 'null' &&
  supabaseAnonKey !== 'null' &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
}

export async function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('blockflow_active_user_id');
  }
  if (!supabase) return;
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
