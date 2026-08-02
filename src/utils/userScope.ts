import { supabase } from '../lib/supabase';

let currentUserId: string | null = null;

export function setActiveUserId(id: string | null): void {
  currentUserId = id;
  if (typeof window !== 'undefined') {
    if (id) {
      localStorage.setItem('blockflow_active_user_id', id);
    } else {
      localStorage.removeItem('blockflow_active_user_id');
    }
  }
}

export function getActiveUserId(): string | null {
  if (currentUserId) return currentUserId;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('blockflow_active_user_id');
    if (stored) {
      currentUserId = stored;
      return stored;
    }
  }
  return null;
}

/**
 * Returns a user-isolated storage key.
 * If an authenticated user is logged in, scopes the key by user ID.
 * Otherwise, scopes the key for guest local storage.
 */
export function getUserScopedKey(baseKey: string): string {
  const uid = getActiveUserId();
  if (uid) {
    return `${baseKey}_user_${uid}`;
  }
  return `${baseKey}_guest`;
}
