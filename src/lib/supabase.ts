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
  const redirectTo = typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/`
    : undefined;
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
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

/**
 * Safely formats raw Supabase and browser network errors into actionable,
 * human-readable diagnostics without exposing internal tokens or keys.
 */
export function formatAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred during authentication.';

  const raw = typeof err === 'string' ? err : err.message || err.error_description || String(err);
  const code = (err.code || '').toLowerCase();
  const status = Number(err.status) || 0;

  // 1. Browser fetch failures (DNS, CORS, network offline, ad-blockers, invalid URL)
  if (
    raw.includes('Failed to fetch') ||
    raw.includes('NetworkError') ||
    raw.includes('fetch failed') ||
    raw.includes('Load failed') ||
    err.name === 'AuthRetryableFetchError' ||
    (err.name === 'TypeError' && raw.includes('fetch'))
  ) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'You appear to be offline. Please check your internet connection.';
    }

    return (
      'Unable to connect to Supabase Auth ("Failed to fetch"). Possible causes:\n' +
      '• A browser ad-blocker or privacy shield (e.g., Brave Shields) is blocking requests to supabase.co. Try pausing shields for this site.\n' +
      '• In Vercel, verify VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are configured in Project Settings, and redeploy to apply them.\n' +
      '• Ensure your Supabase project is active and URL Configuration allows this domain.'
    );
  }

  // 2. Email send rate limit
  if (code === 'over_email_send_rate_limit' || raw.includes('rate limit') || status === 429) {
    return 'Email rate limit reached for Supabase free tier. Please wait a few minutes, or disable "Confirm email" in Supabase Auth > Providers > Email for testing.';
  }

  // 3. User already registered
  if (
    code === 'user_already_exists' ||
    raw.toLowerCase().includes('already registered') ||
    raw.toLowerCase().includes('already exists')
  ) {
    return 'An account with this email already exists. Please switch to "Sign in" instead.';
  }

  // 4. Invalid login credentials
  if (code === 'invalid_credentials' || raw.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password. Please verify your credentials or create a new account.';
  }

  // 5. Invalid email format
  if (code === 'email_address_invalid' || (raw.toLowerCase().includes('email address') && raw.toLowerCase().includes('invalid'))) {
    return 'Please enter a valid email address.';
  }

  // 6. Password constraints
  if (raw.toLowerCase().includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  return raw;
}
