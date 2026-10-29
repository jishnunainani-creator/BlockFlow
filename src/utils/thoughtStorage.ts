/**
 * Thought Space — Storage Repository
 * Provides strict local-only persistence for Thought Space notes.
 * Scoped by active user/guest identity via getUserScopedKey.
 * Dual-persisted: synchronous local cache + durable IndexedDB store.
 * Never synced to Supabase or external servers.
 */

import { ThoughtNote, DeleteChildrenChoice } from '../types/thoughtSpace';
import { getUserScopedKey } from './userScope';
import { idbGetAll, idbPut, idbDelete, idbClear } from '../lib/indexedDbStore';
import {
  generateThoughtId,
  resolveParentDeletion,
} from './thoughtSpaceEngine';

const THOUGHTS_BASE_KEY = 'blockflow_thoughts_v1';

/**
 * Returns the user-scoped localStorage key.
 */
export function getThoughtsStorageKey(): string {
  return getUserScopedKey(THOUGHTS_BASE_KEY);
}

/**
 * Synchronously loads notes from user-scoped localStorage cache.
 */
export function loadThoughts(): ThoughtNote[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const key = getThoughtsStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[ThoughtStorage] Failed to parse local thoughts cache:', err);
    return [];
  }
}

/**
 * Saves notes to the user-scoped localStorage cache and asynchronously mirrors to IndexedDB.
 */
export function saveThoughts(notes: ThoughtNote[]): void {
  if (typeof localStorage === 'undefined') return;

  const key = getThoughtsStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(notes));
  } catch (err) {
    console.warn('[ThoughtStorage] Failed to write localStorage thoughts cache:', err);
  }

  // Notify active listeners
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('blockflow_thoughts_changed', { detail: { count: notes.length } }));
    } catch {
      // Ignore in non-browser context
    }
  }

  // Asynchronously mirror to IndexedDB for structured local durability
  syncToIndexedDB(notes).catch((e) => {
    console.warn('[ThoughtStorage] Async IndexedDB mirror warning:', e);
  });
}

/**
 * Mirrors note set into IndexedDB `'thoughts'` store.
 */
async function syncToIndexedDB(notes: ThoughtNote[]): Promise<void> {
  try {
    // Clear old items and write current user-scoped set
    await idbClear('thoughts');
    for (const note of notes) {
      await idbPut('thoughts', note);
    }
  } catch (err) {
    // Graceful fallback to localStorage
    console.warn('[ThoughtStorage] IndexedDB sync error:', err);
  }
}

/**
 * Asynchronously hydrates from IndexedDB if localStorage was empty or cleared.
 */
export async function hydrateFromIndexedDB(): Promise<ThoughtNote[]> {
  try {
    const idbNotes = await idbGetAll<ThoughtNote>('thoughts');
    if (Array.isArray(idbNotes) && idbNotes.length > 0) {
      const local = loadThoughts();
      if (local.length === 0) {
        saveThoughts(idbNotes);
        return idbNotes;
      }
    }
  } catch (err) {
    console.warn('[ThoughtStorage] Failed to hydrate from IndexedDB:', err);
  }
  return loadThoughts();
}

/**
 * Creates and persists a new thought note.
 */
export function createThought(partial: Partial<ThoughtNote>): ThoughtNote {
  const now = Date.now();
  const newNote: ThoughtNote = {
    id: partial.id || generateThoughtId(),
    parentNoteId: partial.parentNoteId || null,
    title: (partial.title || '').trim(),
    body: (partial.body || '').trim(),
    color: partial.color || 'default',
    createdAt: partial.createdAt || now,
    updatedAt: now,
    isPinned: Boolean(partial.isPinned),
    isArchived: Boolean(partial.isArchived),
  };

  const existing = loadThoughts();
  const updated = [newNote, ...existing];
  saveThoughts(updated);
  return newNote;
}

/**
 * Updates an existing thought note by ID.
 */
export function updateThought(id: string, updates: Partial<ThoughtNote>): ThoughtNote | null {
  const existing = loadThoughts();
  const index = existing.findIndex((n) => n.id === id);
  if (index === -1) return null;

  const current = existing[index];
  const updatedNote: ThoughtNote = {
    ...current,
    ...updates,
    id: current.id, // Immutable ID
    updatedAt: Date.now(),
  };

  existing[index] = updatedNote;
  saveThoughts(existing);
  return updatedNote;
}

/**
 * Deletes a note by ID with safe handling for its child subnotes.
 */
export function deleteThought(id: string, choice: DeleteChildrenChoice = 'reparent'): void {
  const existing = loadThoughts();
  const { toDeleteIds, toReparent } = resolveParentDeletion(id, choice, existing);
  const deleteSet = new Set(toDeleteIds);

  const updated = existing
    .filter((n) => !deleteSet.has(n.id))
    .map((n) => {
      const reparented = toReparent.find((r) => r.id === n.id);
      return reparented || n;
    });

  saveThoughts(updated);

  // Clean from IndexedDB
  for (const delId of toDeleteIds) {
    idbDelete('thoughts', delId).catch(() => {});
  }
}
