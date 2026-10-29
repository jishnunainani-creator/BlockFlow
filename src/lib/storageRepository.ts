import {
  StorageState,
  SyncCategory,
  SyncSettings,
  DEFAULT_SYNC_SETTINGS,
} from '../types/storageState';
import { idbGet, idbPut } from './indexedDbStore';
import { loadTaskInbox } from '../utils/taskInboxStorage';
import { loadAssignments } from '../utils/assignmentStorage';
import { loadGoals, loadScheduledBlocks } from '../utils/storage';

const SYNC_SETTINGS_STORAGE_KEY = 'blockflow_sync_settings_v1';

/**
 * Returns the storage state of a record.
 * Privacy-first rule: Any record without an explicit state defaults to 'local_only'.
 */
export function getRecordStorageState(record: any): StorageState {
  if (!record || typeof record !== 'object') return 'local_only';
  if (record.storageState === 'cloud_synced' || record.storageState === 'encrypted_cloud') {
    return record.storageState;
  }
  return 'local_only';
}

/**
 * Stamps a record with a storage state and updated timestamp.
 */
export function stampRecordStorageState<T extends Record<string, any>>(
  record: T,
  state: StorageState
): T & { storageState: StorageState; updatedAt: number } {
  return {
    ...record,
    storageState: state,
    updatedAt: Date.now(),
  };
}

/**
 * Loads current sync settings.
 * Defaults to privacy-first settings (cloud sync OFF, all categories local).
 */
export function loadSyncSettings(): SyncSettings {
  if (typeof window === 'undefined') return DEFAULT_SYNC_SETTINGS;

  try {
    const raw = localStorage.getItem(SYNC_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SYNC_SETTINGS,
        ...parsed,
        syncCategories: {
          ...DEFAULT_SYNC_SETTINGS.syncCategories,
          ...(parsed.syncCategories || {}),
        },
      };
    }
  } catch (e) {
    console.warn('[StorageRepository] Failed to read sync settings, using defaults', e);
  }

  return DEFAULT_SYNC_SETTINGS;
}

/**
 * Persists sync settings to local storage and IndexedDB.
 */
export function saveSyncSettings(settings: SyncSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SYNC_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    idbPut('sync_settings', { key: 'current', ...settings }).catch(() => {
      // non-blocking
    });
    window.dispatchEvent(new CustomEvent('blockflow_sync_settings_changed', { detail: settings }));
  } catch (e) {
    console.error('[StorageRepository] Failed to save sync settings', e);
  }
}

/**
 * Checks whether synchronization is actively permitted for a given category.
 */
export function isCategorySyncActive(category: SyncCategory): boolean {
  const settings = loadSyncSettings();
  return Boolean(
    settings.autoSyncEnabled &&
    settings.syncConsentGiven &&
    settings.syncCategories[category]
  );
}

/**
 * Filters records strictly eligible for cloud upload.
 * GUARANTEE: Any record marked 'local_only' is NEVER eligible.
 * GUARANTEE: If the category is not consented/enabled, NO records from it are eligible.
 */
export function filterRecordsForCloudUpload<T extends Record<string, any>>(
  records: T[],
  category: SyncCategory,
  settings: SyncSettings = loadSyncSettings()
): T[] {
  // If sync is not globally enabled or category is disabled, return empty array
  if (!settings.autoSyncEnabled || !settings.syncConsentGiven || !settings.syncCategories[category]) {
    return [];
  }

  return records.filter((item) => {
    // Strictly exclude local-only records
    if (getRecordStorageState(item) !== 'cloud_synced') {
      return false;
    }
    // Exclude locally deleted items without pending deletion sync
    if (item.isDeletedLocally && !item.syncPending) {
      return false;
    }
    return true;
  });
}

export interface CategoryDataStats {
  category: SyncCategory;
  totalCount: number;
  localOnlyCount: number;
  cloudSyncedCount: number;
  syncActive: boolean;
}

export interface StorageAuditSummary {
  categories: CategoryDataStats[];
  totalRecords: number;
  totalLocalOnly: number;
  totalCloudSynced: number;
  isSyncConsented: boolean;
  isAutoSyncEnabled: boolean;
  lastSyncedAt?: number;
}

/**
 * Generates an audit summary of current storage distribution.
 */
export function getStorageAuditSummary(): StorageAuditSummary {
  const settings = loadSyncSettings();

  // Load records from local stores
  const tasks = loadTaskInbox();
  const assignments = loadAssignments();
  const goals = loadGoals();
  const timetable = loadScheduledBlocks();

  const countCategory = (records: any[], cat: SyncCategory): CategoryDataStats => {
    let localOnly = 0;
    let cloudSynced = 0;

    records.forEach((r) => {
      if (getRecordStorageState(r) === 'cloud_synced') {
        cloudSynced++;
      } else {
        localOnly++;
      }
    });

    return {
      category: cat,
      totalCount: records.length,
      localOnlyCount: localOnly,
      cloudSyncedCount: cloudSynced,
      syncActive: isCategorySyncActive(cat),
    };
  };

  const categories: CategoryDataStats[] = [
    countCategory(tasks, 'tasks'),
    countCategory(assignments, 'assignments'),
    countCategory(goals, 'goals'),
    countCategory(timetable, 'timetable'),
  ];

  const totalRecords = categories.reduce((sum, c) => sum + c.totalCount, 0);
  const totalLocalOnly = categories.reduce((sum, c) => sum + c.localOnlyCount, 0);
  const totalCloudSynced = categories.reduce((sum, c) => sum + c.cloudSyncedCount, 0);

  return {
    categories,
    totalRecords,
    totalLocalOnly,
    totalCloudSynced,
    isSyncConsented: settings.syncConsentGiven,
    isAutoSyncEnabled: settings.autoSyncEnabled,
    lastSyncedAt: settings.lastSyncedAt,
  };
}

const TOMBSTONES_STORAGE_KEY = 'blockflow_sync_tombstones_v1';
const LOCAL_ONLY_REGISTRY_KEY = 'blockflow_local_only_registry_v1';

/**
 * Records a local deletion tombstone so remote sync never restores deleted items.
 */
export function recordLocalTombstone(category: SyncCategory, id: string): void {
  try {
    const raw = localStorage.getItem(TOMBSTONES_STORAGE_KEY);
    const list: Array<{ id: string; category: SyncCategory; timestamp: number }> = raw ? JSON.parse(raw) : [];
    if (!list.some((t) => t.id === id && t.category === category)) {
      list.push({ id, category, timestamp: Date.now() });
      localStorage.setItem(TOMBSTONES_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to record tombstone', e);
  }
}

/**
 * Returns true if an item was deleted locally.
 */
export function isRecordTombstoned(category: SyncCategory, id: string): boolean {
  try {
    const raw = localStorage.getItem(TOMBSTONES_STORAGE_KEY);
    if (!raw) return false;
    const list: Array<{ id: string; category: SyncCategory }> = JSON.parse(raw);
    return list.some((t) => t.id === id && t.category === category);
  } catch {
    return false;
  }
}

/**
 * Registers an item as explicitly local-only to prevent stale cloud responses from re-importing it.
 */
export function recordLocalOnlyId(category: SyncCategory, id: string): void {
  try {
    const raw = localStorage.getItem(LOCAL_ONLY_REGISTRY_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    const entry = `${category}:${id}`;
    if (!set.includes(entry)) {
      set.push(entry);
      localStorage.setItem(LOCAL_ONLY_REGISTRY_KEY, JSON.stringify(set));
    }
  } catch (e) {
    console.warn('Failed to record local-only ID', e);
  }
}

/**
 * Checks whether an item was registered as local-only.
 */
export function isRecordRegisteredLocalOnly(category: SyncCategory, id: string): boolean {
  try {
    const raw = localStorage.getItem(LOCAL_ONLY_REGISTRY_KEY);
    if (!raw) return false;
    const set: string[] = JSON.parse(raw);
    return set.includes(`${category}:${id}`);
  } catch {
    return false;
  }
}

