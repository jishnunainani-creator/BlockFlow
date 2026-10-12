const FAVORITES_KEY = 'blockflow_resource_favorites_v1';
const RECENTS_KEY = 'blockflow_resource_recents_v1';

export function getFavoriteResourceIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteResourceIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota
  }
}

export function getRecentResourceIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordRecentResourceId(id: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getRecentResourceIds().filter((existingId) => existingId !== id);
    const updated = [id, ...existing].slice(0, 6);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
