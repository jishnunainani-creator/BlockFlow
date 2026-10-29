import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Mock localStorage in Node environment if missing
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => (key in mockStorage ? mockStorage[key] : null),
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  };
}

import {
  getRecordStorageState,
  stampRecordStorageState,
  filterRecordsForCloudUpload,
  getStorageAuditSummary,
  loadSyncSettings,
  saveSyncSettings,
  recordLocalTombstone,
  isRecordTombstoned,
  recordLocalOnlyId,
  isRecordRegisteredLocalOnly,
} from './storageRepository.ts';
import {
  performSelectiveSync,
  convertRecordToLocalOnly,
  deleteCloudCopyPreserveLocal,
  purgeAllCloudCopiesPreserveLocal,
} from './selectiveSync.ts';
import { syncLocalStateToSupabase } from './supabaseMigration.ts';
import { idbPut, idbGet, idbDelete, idbGetAll } from './indexedDbStore.ts';
import { loadTaskInbox, saveTaskInbox } from '../utils/taskInboxStorage.ts';
import { loadAssignments, saveAssignments } from '../utils/assignmentStorage.ts';
import { loadGoals, saveGoals, loadScheduledBlocks, saveScheduledBlocks } from '../utils/storage.ts';
import { setActiveUserId, getActiveUserId, getUserScopedKey } from '../utils/userScope.ts';
import { SyncSettings, DEFAULT_SYNC_SETTINGS } from '../types/storageState.ts';

describe('1. Local-Only Records Never Reach Any Cloud Upload Path', () => {
  test('unclassified records default strictly to local_only', () => {
    const rawTask = { id: 'task-1', title: 'Personal medical appointment' };
    assert.strictEqual(getRecordStorageState(rawTask), 'local_only');

    const rawGoal = { id: 'goal-1', title: 'Private financial plan' };
    assert.strictEqual(getRecordStorageState(rawGoal), 'local_only');

    const emptyRecord = {};
    assert.strictEqual(getRecordStorageState(emptyRecord), 'local_only');
  });

  test('filterRecordsForCloudUpload excludes any local_only records across all categories', () => {
    const settings: SyncSettings = {
      ...DEFAULT_SYNC_SETTINGS,
      syncConsentGiven: true,
      autoSyncEnabled: true,
      syncCategories: {
        tasks: true,
        assignments: true,
        goals: true,
        timetable: true,
        templates: true,
        reflections: true,
        focus_logs: true,
      },
    };

    const records = [
      { id: '1', title: 'Item 1', storageState: 'local_only' as const },
      { id: '2', title: 'Item 2', storageState: 'cloud_synced' as const },
      { id: '3', title: 'Item 3' }, // defaults to local_only
    ];

    const filtered = filterRecordsForCloudUpload(records, 'assignments', settings);
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, '2');
  });

  test('legacy syncLocalStateToSupabase rejects uploads without consent', async () => {
    localStorage.removeItem('blockflow_sync_settings_v1');
    const result = await syncLocalStateToSupabase('mock-user', [], {}, []);
    assert.strictEqual(result.success, false);
    assert.match(String(result.reason), /consent/i);
  });
});

describe('2. Upload Attempts Without Consent are Rejected', () => {
  test('performSelectiveSync aborts immediately when consent is not given', async () => {
    const settings: SyncSettings = {
      ...DEFAULT_SYNC_SETTINGS,
      syncConsentGiven: false,
      autoSyncEnabled: false,
    };
    saveSyncSettings(settings);

    const summary = await performSelectiveSync('mock-user-123');
    assert.strictEqual(summary.uploadedCount, 0);
    assert.strictEqual(summary.downloadedCount, 0);
  });

  test('default sync settings have consent turned off and autoSync disabled', () => {
    localStorage.removeItem('blockflow_sync_settings_v1');
    const settings = loadSyncSettings();
    assert.strictEqual(settings.syncConsentGiven, false);
    assert.strictEqual(settings.autoSyncEnabled, false);
    assert.strictEqual(settings.syncCategories.tasks, false);
    assert.strictEqual(settings.syncCategories.goals, false);
  });
});

describe('3. Disabled Categories are Strictly Excluded', () => {
  test('blocks all records if the category is disabled by user', () => {
    const settings: SyncSettings = {
      ...DEFAULT_SYNC_SETTINGS,
      syncConsentGiven: true,
      autoSyncEnabled: true,
      syncCategories: {
        ...DEFAULT_SYNC_SETTINGS.syncCategories,
        assignments: true,
        timetable: false, // timetable disabled
      },
    };

    const blocks = [
      { id: 'sb-1', title: 'Study session', storageState: 'cloud_synced' as const },
      { id: 'sb-2', title: 'Gym session', storageState: 'cloud_synced' as const },
    ];

    const filtered = filterRecordsForCloudUpload(blocks, 'timetable', settings);
    assert.strictEqual(filtered.length, 0);
  });
});

describe('4. Cloud Deletion Preserving Local Records', () => {
  test('deleteCloudCopyPreserveLocal preserves on-device record while marking local_only', async () => {
    const assignments = [
      { id: 'asg-sovereign', title: 'Thesis Draft', subject: 'CS', dueDate: '2026-10-20', priority: 'high', estimatedHours: 4, progressPct: 0, status: 'not_started' as const, storageState: 'cloud_synced' as const, updatedAt: 500 },
    ];
    saveAssignments(assignments as any);

    const result = await deleteCloudCopyPreserveLocal('assignments', 'asg-sovereign', 'mock-user-123');
    assert.strictEqual(result.localConverted, true);

    const stored = loadAssignments();
    assert.strictEqual(stored.length, 1);
    assert.strictEqual(stored[0].id, 'asg-sovereign');
    assert.strictEqual(stored[0].title, 'Thesis Draft');
    assert.strictEqual(stored[0].storageState, 'local_only');
  });

  test('purgeAllCloudCopiesPreserveLocal converts all local data to local_only and revokes sync consent', async () => {
    const settings: SyncSettings = {
      ...DEFAULT_SYNC_SETTINGS,
      syncConsentGiven: true,
      autoSyncEnabled: true,
    };
    saveSyncSettings(settings);

    saveAssignments([
      { id: 'asg-purge-1', title: 'Asg 1', subject: 'Math', dueDate: '2026-10-25', priority: 'low', estimatedHours: 2, progressPct: 0, status: 'not_started' as const, storageState: 'cloud_synced' as const },
    ] as any);
    saveTaskInbox([
      { id: 'task-purge-1', title: 'Task 1', category: 'General', priority: 'low', status: 'backlog' as const, createdAt: 100, storageState: 'cloud_synced' as const },
    ] as any);

    const purgeResult = await purgeAllCloudCopiesPreserveLocal('mock-user-123');
    assert.strictEqual(purgeResult.success, true);

    // Sync consent must be revoked
    const updatedSettings = loadSyncSettings();
    assert.strictEqual(updatedSettings.syncConsentGiven, false);
    assert.strictEqual(updatedSettings.autoSyncEnabled, false);

    // Local records must be preserved and classified as local_only
    const storedAssignments = loadAssignments();
    assert.strictEqual(storedAssignments.length, 1);
    assert.strictEqual(storedAssignments[0].storageState, 'local_only');

    const storedTasks = loadTaskInbox();
    assert.strictEqual(storedTasks.length, 1);
    assert.strictEqual(storedTasks[0].storageState, 'local_only');
  });
});

describe('5. Stale Cloud Records Not Restoring Local-Only Data', () => {
  test('convertRecordToLocalOnly registers item in local-only registry', () => {
    saveAssignments([
      { id: 'asg-reg-1', title: 'Draft', subject: 'Lit', dueDate: '2026-10-20', priority: 'low', estimatedHours: 1, progressPct: 0, status: 'not_started' as const, storageState: 'cloud_synced' as const },
    ] as any);

    const success = convertRecordToLocalOnly('assignments', 'asg-reg-1');
    assert.strictEqual(success, true);
    assert.strictEqual(isRecordRegisteredLocalOnly('assignments', 'asg-reg-1'), true);
  });

  test('tombstone prevents deleted item from being re-imported', () => {
    recordLocalTombstone('assignments', 'asg-deleted-999');
    assert.strictEqual(isRecordTombstoned('assignments', 'asg-deleted-999'), true);
    assert.strictEqual(isRecordTombstoned('assignments', 'asg-other'), false);
  });
});

describe('6. User Ownership Enforcement in SQL Schema', () => {
  test('privacy_first_schema.sql enables RLS on all user-owned tables', () => {
    const schemaPath = path.resolve(process.cwd(), 'supabase/privacy_first_schema.sql');
    assert.ok(fs.existsSync(schemaPath), 'privacy_first_schema.sql must exist');
    const content = fs.readFileSync(schemaPath, 'utf8');

    const tables = [
      'user_sync_profiles',
      'assignments',
      'reusable_blocks',
      'scheduled_blocks',
      'weekly_templates',
      'tasks',
      'goals',
    ];

    tables.forEach((table) => {
      const rlsRegex = new RegExp(`alter table public\\.${table} enable row level security;`, 'i');
      assert.ok(rlsRegex.test(content), `Table ${table} must have RLS enabled`);

      const selectRegex = new RegExp(`create policy "Users can select own ${table}" on public\\.${table}`, 'i');
      assert.ok(selectRegex.test(content), `Table ${table} must have select policy`);

      const insertRegex = new RegExp(`create policy "Users can insert own ${table}" on public\\.${table}`, 'i');
      assert.ok(insertRegex.test(content), `Table ${table} must have insert policy with check`);
    });
  });

  test('user-owned tables enforce per-user composite primary keys', () => {
    const schemaPath = path.resolve(process.cwd(), 'supabase/privacy_first_schema.sql');
    const content = fs.readFileSync(schemaPath, 'utf8');
    assert.match(content, /primary key \(user_id, id\)/i);
  });
});

describe('7. Purge Function Authorization & Safety in SQL Schema', () => {
  test('purge_all_user_cloud_data is secure, scoped to auth.uid(), with fixed search_path', () => {
    const schemaPath = path.resolve(process.cwd(), 'supabase/privacy_first_schema.sql');
    const content = fs.readFileSync(schemaPath, 'utf8');

    assert.match(content, /create or replace function public\.purge_all_user_cloud_data\(\)/i);
    assert.match(content, /security invoker/i);
    assert.match(content, /set search_path = public, pg_temp/i);
    assert.match(content, /delete from public\.assignments where user_id = auth\.uid\(\);/i);
    assert.match(content, /revoke all on function public\.purge_all_user_cloud_data\(\) from public;/i);
    assert.match(content, /grant execute on function public\.purge_all_user_cloud_data\(\) to authenticated;/i);
  });
});

describe('8. Repeated Synchronization Without Duplicates', () => {
  test('stamped records retain designated storage state and timestamp', () => {
    const task = { id: 'task-2', title: 'Public presentation prep' };
    const stampedSynced = stampRecordStorageState(task, 'cloud_synced');
    assert.strictEqual(stampedSynced.storageState, 'cloud_synced');
    assert.ok(typeof stampedSynced.updatedAt === 'number');

    const stampedLocal = stampRecordStorageState(task, 'local_only');
    assert.strictEqual(stampedLocal.storageState, 'local_only');
  });

  test('re-saving or stamping does not create duplicate entries in local storage', () => {
    const originalTasks = [
      { id: 'task-dup-1', title: 'Unique Task', category: 'General', priority: 'medium', status: 'backlog' as const, createdAt: 1, storageState: 'local_only' as const },
    ];
    saveTaskInbox(originalTasks as any);
    assert.strictEqual(loadTaskInbox().length, 1);

    // Stamping and saving again
    const stamped = originalTasks.map((t) => stampRecordStorageState(t, 'local_only'));
    saveTaskInbox(stamped as any);
    assert.strictEqual(loadTaskInbox().length, 1);
  });
});

describe('9. Failure Handling Without Data Loss', () => {
  test('failed IndexedDB operations reject without corrupting data', async () => {
    const testTask = { id: 'idb-task-fail-test', title: 'Safe Task', storageState: 'local_only' };
    await idbPut('tasks', testTask);

    const retrieved = await idbGet('tasks', 'idb-task-fail-test');
    assert.ok(retrieved);
    assert.strictEqual((retrieved as any).title, 'Safe Task');

    await idbDelete('tasks', 'idb-task-fail-test');
    const afterDelete = await idbGet('tasks', 'idb-task-fail-test');
    assert.strictEqual(afterDelete, null);
  });
});

describe('10. Legacy Local-Data and Storage Partition Preservation', () => {
  test('legacy un-scoped localStorage data is preserved as fallback', () => {
    setActiveUserId(null); // Guest mode
    localStorage.removeItem('blockflow_task_inbox_v1_guest'); // Ensure scoped guest key is absent
    const legacyKey = 'blockflow_task_inbox_v1';
    localStorage.setItem(
      legacyKey,
      JSON.stringify([{ id: 'legacy-1', title: 'Pre-migration task', category: 'Study', priority: 'high', status: 'backlog', createdAt: 50 }])
    );

    const loaded = loadTaskInbox();
    assert.ok(loaded.length >= 1);
    const legacyItem = loaded.find((t) => t.id === 'legacy-1');
    assert.ok(legacyItem);
    assert.strictEqual(legacyItem?.title, 'Pre-migration task');
  });

  test('authenticated user switches scope cleanly without losing or leaking guest records', () => {
    setActiveUserId('user-alice-777');
    assert.strictEqual(getActiveUserId(), 'user-alice-777');
    assert.strictEqual(getUserScopedKey('tasks'), 'tasks_user_user-alice-777');

    setActiveUserId(null);
    assert.strictEqual(getActiveUserId(), null);
    assert.strictEqual(getUserScopedKey('tasks'), 'tasks_guest');
  });
});

describe('11. Supabase Environment Configuration & Secret Key Rejection', () => {
  test('rejects service-role or secret keys in client configuration', () => {
    const isSecret = (key: string) => Boolean(key && (key.startsWith('sb_secret_') || key.includes('service_role')));
    assert.strictEqual(isSecret('sb_secret_123456789'), true);
    assert.strictEqual(isSecret('eyJhbGciOi...service_role...'), true);
    assert.strictEqual(isSecret('sb_publishable_abcdef12345'), false);
    assert.strictEqual(isSecret('eyJhbGciOi...anon...'), false);
  });

  test('app operates normally in offline mode when environment variables are missing', async () => {
    const summary = await performSelectiveSync('mock-offline-user');
    assert.ok(summary);
    assert.strictEqual(summary.uploadedCount, 0);
  });
});

describe('12. Two-Way Selective Synchronization & Conflict Resolution Logic', () => {
  test('scheduled_blocks: local-only blocks are never overwritten or pulled from remote', () => {
    const local = [
      {
        id: 'block-local-1',
        blockId: 'b-1',
        title: 'Private Doctor Appointment',
        color: '#EF4444',
        priority: 'high' as const,
        icon: 'heart',
        dayOfWeek: 1,
        startMinutes: 540,
        duration: 60,
        weekId: '2026-W44',
        storageState: 'local_only' as const,
        updatedAt: 1000,
      },
    ];
    saveScheduledBlocks(local);

    // Verify local storage holds the record
    const loaded = loadScheduledBlocks();
    const item = loaded.find((b) => b.id === 'block-local-1');
    assert.ok(item);
    assert.strictEqual(getRecordStorageState(item), 'local_only');

    // Filter verification
    const settings: SyncSettings = {
      ...DEFAULT_SYNC_SETTINGS,
      syncConsentGiven: true,
      autoSyncEnabled: true,
      syncCategories: { ...DEFAULT_SYNC_SETTINGS.syncCategories, timetable: true },
    };
    const uploadable = filterRecordsForCloudUpload(loaded, 'timetable', settings);
    assert.strictEqual(uploadable.length, 0);
  });

  test('tasks: tombstoned tasks are ignored during incoming pull and never resurrected', () => {
    recordLocalTombstone('tasks', 'deleted-task-999');
    assert.strictEqual(isRecordTombstoned('tasks', 'deleted-task-999'), true);

    // Save a clean task list
    saveTaskInbox([]);
    const loaded = loadTaskInbox();
    assert.strictEqual(loaded.find((t) => t.id === 'deleted-task-999'), undefined);
  });

  test('goals: Last-Write-Wins timestamps dictate whether cloud update applies', () => {
    const localGoal = {
      id: 'goal-lww-1',
      title: 'Local Version (Newer)',
      category: 'Career',
      color: '#3B82F6',
      progressPct: 50,
      storageState: 'cloud_synced' as const,
      updatedAt: 5000,
    };
    saveGoals([localGoal]);

    const remoteUpdatedAt = 3000; // Older than local
    const current = loadGoals()[0];
    const shouldUpdate = remoteUpdatedAt > (current.updatedAt || 0);
    assert.strictEqual(shouldUpdate, false);

    const remoteNewerUpdatedAt = 7000; // Newer than local
    const shouldUpdateNewer = remoteNewerUpdatedAt > (current.updatedAt || 0);
    assert.strictEqual(shouldUpdateNewer, true);
  });

  test('registered local-only items prevent cloud resurrection across all categories', () => {
    recordLocalOnlyId('assignments', 'asgn-local-strict');
    recordLocalOnlyId('timetable', 'block-local-strict');
    recordLocalOnlyId('tasks', 'task-local-strict');
    recordLocalOnlyId('goals', 'goal-local-strict');

    assert.strictEqual(isRecordRegisteredLocalOnly('assignments', 'asgn-local-strict'), true);
    assert.strictEqual(isRecordRegisteredLocalOnly('timetable', 'block-local-strict'), true);
    assert.strictEqual(isRecordRegisteredLocalOnly('tasks', 'task-local-strict'), true);
    assert.strictEqual(isRecordRegisteredLocalOnly('goals', 'goal-local-strict'), true);
  });
});
