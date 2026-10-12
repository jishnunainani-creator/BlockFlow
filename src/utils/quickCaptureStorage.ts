import { QuickCaptureItem, ConvertedEntityType } from '../types/quickCapture';
import { getUserScopedKey } from './userScope';
import { parseNaturalLanguageInput } from './naturalLanguageParser';

const QUICK_CAPTURE_STORAGE_KEY = 'blockflow_universal_inbox_v1';

export function loadQuickCaptureItems(): QuickCaptureItem[] {
  try {
    const key = getUserScopedKey(QUICK_CAPTURE_STORAGE_KEY);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load quick capture items', error);
  }
  return [];
}

export function saveQuickCaptureItems(items: QuickCaptureItem[]): void {
  try {
    const key = getUserScopedKey(QUICK_CAPTURE_STORAGE_KEY);
    localStorage.setItem(key, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('blockflow_quick_capture_changed'));
    }
  } catch (error) {
    console.error('Failed to save quick capture items', error);
  }
}

export function addQuickCaptureItem(rawText: string, notes?: string): QuickCaptureItem {
  const text = rawText.trim();
  const extracted = parseNaturalLanguageInput(text);

  const newItem: QuickCaptureItem = {
    id: `capture-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    rawText: text,
    notes: notes?.trim() || undefined,
    status: 'unprocessed',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    extracted,
  };

  const existing = loadQuickCaptureItems();
  const updated = [newItem, ...existing];
  saveQuickCaptureItems(updated);

  return newItem;
}

export function updateQuickCaptureItem(
  id: string,
  updates: Partial<Pick<QuickCaptureItem, 'rawText' | 'notes' | 'status'>>
): QuickCaptureItem | null {
  const items = loadQuickCaptureItems();
  let updatedItem: QuickCaptureItem | null = null;

  const nextItems = items.map((item) => {
    if (item.id === id) {
      const rawText = updates.rawText !== undefined ? updates.rawText.trim() : item.rawText;
      const extracted =
        updates.rawText !== undefined ? parseNaturalLanguageInput(rawText) : item.extracted;

      updatedItem = {
        ...item,
        ...updates,
        rawText,
        extracted,
        updatedAt: Date.now(),
      };
      return updatedItem;
    }
    return item;
  });

  if (updatedItem) {
    saveQuickCaptureItems(nextItems);
  }
  return updatedItem;
}

export function archiveQuickCaptureItem(id: string): void {
  updateQuickCaptureItem(id, { status: 'archived' });
}

export function restoreQuickCaptureItem(id: string): void {
  updateQuickCaptureItem(id, { status: 'unprocessed' });
}

export function deleteQuickCaptureItem(id: string): void {
  const items = loadQuickCaptureItems();
  const filtered = items.filter((item) => item.id !== id);
  saveQuickCaptureItems(filtered);
}

export function markItemConverted(
  id: string,
  convertedTo: ConvertedEntityType,
  convertedEntityId: string
): void {
  const items = loadQuickCaptureItems();
  const nextItems = items.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: 'processed' as const,
        convertedTo,
        convertedEntityId,
        convertedAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    return item;
  });
  saveQuickCaptureItems(nextItems);
}

export function getUnprocessedCount(): number {
  const items = loadQuickCaptureItems();
  return items.filter((item) => item.status === 'unprocessed').length;
}
