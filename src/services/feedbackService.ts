import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CreateFeedbackInput,
  FeedbackItem,
  FeedbackStatus,
} from '../types/feedback';
import { getUserScopedKey } from '../utils/userScope';

const BASE_FEEDBACK_KEY = 'blockflow_user_feedback';

function getStorageKey(): string {
  return getUserScopedKey(BASE_FEEDBACK_KEY);
}

export function loadLocalFeedback(): FeedbackItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalFeedback(items: FeedbackItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save local feedback:', err);
  }
}

function mapRowToFeedbackItem(row: any): FeedbackItem {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    userEmail: row.user_email || 'Anonymous',
    category: row.category || 'general',
    rating: Number(row.rating) || 5,
    title: row.title || '',
    message: row.message || '',
    pageContext: row.page_context || undefined,
    status: (row.status as FeedbackStatus) || 'open',
    adminNote: row.admin_note || undefined,
    syncState: 'synced',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Checks whether the current user email is configured as a Feedback Admin
 * via VITE_ADMIN_EMAILS or the `public.feedback_admins` Supabase table.
 */
export async function checkIsFeedbackAdmin(userEmail?: string | null): Promise<boolean> {
  if (!userEmail) return false;
  const normalized = userEmail.trim().toLowerCase();

  // 1. Check client-side env override (e.g. VITE_ADMIN_EMAILS=you@gmail.com)
  const envAdmins = (import.meta.env?.VITE_ADMIN_EMAILS || '') as string;
  if (envAdmins) {
    const allowed = envAdmins
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.includes(normalized)) return true;
  }

  // 2. Check Supabase feedback_admins table
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('feedback_admins')
        .select('email')
        .ilike('email', normalized)
        .maybeSingle();

      if (!error && data) {
        return true;
      }
    } catch {
      // Table may not be migrated yet — fail gracefully
    }
  }

  return false;
}

/**
 * Submits new feedback locally and syncs to Supabase `user_feedback` when signed in.
 */
export async function submitFeedback(
  input: CreateFeedbackInput,
  userEmail?: string | null,
  userId?: string | null
): Promise<{ item: FeedbackItem; syncedToCloud: boolean; errorMessage?: string }> {
  const now = new Date().toISOString();
  const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const item: FeedbackItem = {
    id,
    userId: userId || null,
    userEmail: userEmail || 'Guest (Local)',
    category: input.category,
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    title: input.title.trim(),
    message: input.message.trim(),
    pageContext: input.pageContext,
    status: 'open',
    syncState: userId && isSupabaseConfigured ? 'pending_sync' : 'local_only',
    createdAt: now,
    updatedAt: now,
  };

  const existing = loadLocalFeedback();
  saveLocalFeedback([item, ...existing]);

  if (supabase && isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .insert({
          id: item.id,
          user_id: userId,
          user_email: item.userEmail,
          category: item.category,
          rating: item.rating,
          title: item.title,
          message: item.message,
          page_context: item.pageContext || null,
          status: item.status,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        })
        .select()
        .single();

      if (error) {
        return { item, syncedToCloud: false, errorMessage: error.message };
      }

      const syncedItem = mapRowToFeedbackItem(data);
      const updatedList = loadLocalFeedback().map((f) => (f.id === id ? syncedItem : f));
      saveLocalFeedback(updatedList);
      return { item: syncedItem, syncedToCloud: true };
    } catch (err: any) {
      return { item, syncedToCloud: false, errorMessage: err?.message || 'Cloud sync failed' };
    }
  }

  return { item, syncedToCloud: false };
}

/**
 * Fetches feedback from Supabase (RLS returns user's own items, or ALL items for admins)
 * and merges with any local pending items.
 */
export async function fetchFeedbackList(
  userId?: string | null
): Promise<{ items: FeedbackItem[]; cloudAvailable: boolean; errorMessage?: string }> {
  const localItems = loadLocalFeedback();

  if (!supabase || !isSupabaseConfigured || !userId) {
    return { items: localItems, cloudAvailable: false };
  }

  try {
    // First push any pending local feedback items
    const pendingItems = localItems.filter((f) => f.syncState === 'pending_sync');
    for (const pending of pendingItems) {
      await supabase.from('user_feedback').upsert({
        id: pending.id,
        user_id: userId,
        user_email: pending.userEmail,
        category: pending.category,
        rating: pending.rating,
        title: pending.title,
        message: pending.message,
        page_context: pending.pageContext || null,
        status: pending.status,
        created_at: pending.createdAt,
        updated_at: pending.updatedAt,
      });
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return { items: localItems, cloudAvailable: false, errorMessage: error.message };
    }

    const cloudItems = (data || []).map(mapRowToFeedbackItem);
    const cloudIds = new Set(cloudItems.map((c) => c.id));
    const localOnly = localItems.filter(
      (l) => l.syncState === 'local_only' && !cloudIds.has(l.id)
    );

    const merged = [...cloudItems, ...localOnly].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    saveLocalFeedback(merged);

    return { items: merged, cloudAvailable: true };
  } catch (err: any) {
    return {
      items: localItems,
      cloudAvailable: false,
      errorMessage: err?.message || 'Failed to fetch cloud feedback',
    };
  }
}

/**
 * Updates feedback status and optional admin reply note (requires Admin RLS or local state).
 */
export async function updateFeedbackStatusAndNote(
  feedbackId: string,
  status: FeedbackStatus,
  adminNote?: string
): Promise<{ success: boolean; errorMessage?: string }> {
  const now = new Date().toISOString();

  // Optimistically update local cache
  const local = loadLocalFeedback();
  const updatedLocal = local.map((item) =>
    item.id === feedbackId
      ? {
          ...item,
          status,
          adminNote: adminNote !== undefined ? adminNote : item.adminNote,
          updatedAt: now,
        }
      : item
  );
  saveLocalFeedback(updatedLocal);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('user_feedback')
        .update({
          status,
          admin_note: adminNote ?? null,
          updated_at: now,
        })
        .eq('id', feedbackId);

      if (error) {
        return { success: false, errorMessage: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, errorMessage: err?.message || 'Update failed' };
    }
  }

  return { success: true };
}
