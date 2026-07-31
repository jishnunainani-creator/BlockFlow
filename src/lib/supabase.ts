import { createClient } from '@supabase/supabase-js';

// Safe global reference check for client-side Vite and SSR
const globalProc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;

// Explicit literal dot-notation access for static replacement by Vite bundler
const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (globalProc && globalProc.env && globalProc.env.VITE_SUPABASE_URL) ||
  '';

const rawKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (globalProc && globalProc.env && globalProc.env.VITE_SUPABASE_ANON_KEY) ||
  '';

const cleanUrl = String(rawUrl || '').trim().replace(/^["']|["']$/g, '');
const cleanKey = String(rawKey || '').trim().replace(/^["']|["']$/g, '');

export const isSupabaseConfigured = Boolean(
  cleanUrl &&
  cleanKey &&
  cleanUrl !== 'undefined' &&
  cleanKey !== 'undefined' &&
  cleanUrl !== 'null' &&
  cleanKey !== 'null' &&
  cleanUrl.startsWith('http')
);

export const supabaseUrl = cleanUrl;
export const supabaseAnonKey = cleanKey;

export const supabase = isSupabaseConfigured
  ? createClient(cleanUrl, cleanKey, {
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
  if (!supabase) return;
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
