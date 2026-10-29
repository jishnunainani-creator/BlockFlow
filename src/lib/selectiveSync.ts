import { supabase, isSupabaseConfigured } from './supabase';
import {
  SyncCategory,
  SyncSummary,
  SyncSettings,
} from '../types/storageState';
import {
  loadSyncSettings,
  saveSyncSettings,
  getRecordStorageState,
  stampRecordStorageState,
  filterRecordsForCloudUpload,
  recordLocalTombstone,
  isRecordTombstoned,
  recordLocalOnlyId,
  isRecordRegisteredLocalOnly,
} from './storageRepository';
import { loadTaskInbox, saveTaskInbox } from '../utils/taskInboxStorage';
import { loadAssignments, saveAssignments } from '../utils/assignmentStorage';
import { loadGoals, saveGoals, loadScheduledBlocks, saveScheduledBlocks } from '../utils/storage';
import { ScheduledBlock } from '../types/timetable';
import { TaskInboxItem, Assignment } from '../types/executionOS';
import { Goal } from '../types/timetable';

/**
 * Performs a selective, privacy-first synchronization between local storage and Supabase.
 * Rules:
 * 1. Only uploads records explicitly marked 'cloud_synced' and belonging to enabled categories.
 * 2. Never uploads records marked 'local_only'.
 * 3. Never overwrites local-only records with incoming cloud data.
 * 4. Resolves conflicts using Last-Write-Wins timestamp comparison.
 */
export async function performSelectiveSync(userId: string): Promise<SyncSummary> {
  const summary: SyncSummary = {
    timestamp: Date.now(),
    uploadedCount: 0,
    downloadedCount: 0,
    skippedLocalCount: 0,
    errors: [],
  };

  const settings: SyncSettings = loadSyncSettings();

  // If user hasn't explicitly consented or autoSync is disabled, abort immediately
  if (!settings.syncConsentGiven || !settings.autoSyncEnabled) {
    return summary;
  }

  if (!isSupabaseConfigured || !supabase) {
    summary.errors.push('Supabase is not configured or unavailable');
    return summary;
  }

  try {
    // ── 1. SYNC ASSIGNMENTS (If enabled) ──
    if (settings.syncCategories.assignments) {
      try {
        const localAssignments = loadAssignments();
        const uploadable = filterRecordsForCloudUpload(localAssignments, 'assignments', settings);
        summary.skippedLocalCount += localAssignments.length - uploadable.length;

        if (uploadable.length > 0) {
          const payload = uploadable.map((a) => ({
            user_id: userId,
            id: a.id,
            title: a.title,
            subject: a.subject,
            description: a.description || '',
            due_date: a.dueDate,
            priority: a.priority,
            estimated_hours: a.estimatedHours || 0,
            progress_pct: a.progressPct || 0,
            status: a.status,
            study_plan: a.studyPlan || [],
            storage_state: 'cloud_synced',
            updated_at: new Date(a.updatedAt || Date.now()).toISOString(),
          }));

          const { error } = await supabase
            .from('assignments')
            .upsert(payload, { onConflict: 'user_id,id' });

          if (error) {
            summary.errors.push(`Assignments upload error: ${error.message}`);
          } else {
            summary.uploadedCount += uploadable.length;
          }
        }

        // Pull remote assignments
        const { data: remoteData, error: pullError } = await supabase
          .from('assignments')
          .select('*')
          .eq('user_id', userId);

        if (!pullError && Array.isArray(remoteData)) {
          let updatedList = [...localAssignments];
          let pullCount = 0;

          for (const remote of remoteData) {
            const recordId = remote.id || remote.assignment_id;
            if (!recordId) continue;

            // Guard: If this record was deleted locally, do not resurrect it! Purge remote copy instead.
            if (isRecordTombstoned('assignments', recordId)) {
              if (supabase) {
                supabase.from('assignments').delete().eq('user_id', userId).eq('id', recordId).then();
              }
              continue;
            }

            // Guard: If this record is registered as local-only, do not resurrect as cloud-synced
            if (isRecordRegisteredLocalOnly('assignments', recordId)) {
              continue;
            }

            const existingIndex = updatedList.findIndex((a) => a.id === recordId);
            const remoteUpdatedAt = remote.updated_at ? new Date(remote.updated_at).getTime() : 0;

            if (existingIndex >= 0) {
              const local = updatedList[existingIndex];
              // Never overwrite a local-only record with cloud data
              if (getRecordStorageState(local) === 'local_only') {
                continue;
              }
              // Last-write-wins: compare against reliable local timestamp
              const localUpdatedAt = local.updatedAt || local.createdAt || Date.now();
              if (remoteUpdatedAt > localUpdatedAt) {
                updatedList[existingIndex] = {
                  ...local,
                  title: remote.title,
                  subject: remote.subject,
                  description: remote.description,
                  dueDate: remote.due_date,
                  priority: remote.priority,
                  estimatedHours: remote.estimated_hours,
                  progressPct: remote.progress_pct,
                  status: remote.status,
                  storageState: 'cloud_synced',
                  updatedAt: remoteUpdatedAt,
                  syncedAt: Date.now(),
                };
                pullCount++;
              }
            } else {
              // New record from another device (only if not tombstoned or local-only)
              updatedList.push({
                id: recordId,
                title: remote.title,
                subject: remote.subject,
                description: remote.description,
                dueDate: remote.due_date,
                priority: remote.priority,
                estimatedHours: remote.estimated_hours,
                progressPct: remote.progress_pct,
                status: remote.status,
                storageState: 'cloud_synced',
                updatedAt: remoteUpdatedAt,
                syncedAt: Date.now(),
              });
              pullCount++;
            }
          }

          if (pullCount > 0) {
            saveAssignments(updatedList);
            summary.downloadedCount += pullCount;
          }
        }
      } catch (err: any) {
        summary.errors.push(`Assignments sync exception: ${err.message || err}`);
      }
    }

    // ── 2. SYNC SCHEDULED BLOCKS (If enabled) ──
    if (settings.syncCategories.timetable) {
      try {
        const localBlocks = loadScheduledBlocks();
        const uploadable = filterRecordsForCloudUpload(localBlocks, 'timetable', settings);
        summary.skippedLocalCount += localBlocks.length - uploadable.length;

        if (uploadable.length > 0) {
          const payload = uploadable.map((b) => ({
            user_id: userId,
            id: b.id,
            block_id: b.blockId,
            title: b.title,
            description: b.description || '',
            color: b.color,
            priority: b.priority,
            icon: b.icon || 'sparkles',
            day_of_week: b.dayOfWeek,
            start_minutes: b.startMinutes,
            duration: b.duration,
            week_id: b.weekId,
            status: b.status || 'not_started',
            completed_at: b.completedAt || null,
            actual_duration: b.actualDuration || null,
            storage_state: 'cloud_synced',
            updated_at: new Date(b.updatedAt || Date.now()).toISOString(),
          }));

          const { error } = await supabase
            .from('scheduled_blocks')
            .upsert(payload, { onConflict: 'user_id,id' });

          if (error) {
            summary.errors.push(`Timetable upload error: ${error.message}`);
          } else {
            summary.uploadedCount += uploadable.length;
          }
        }

        // 2B. Pull remote scheduled blocks if category is enabled
        const { data: remoteBlocks, error: pullError } = await supabase
          .from('scheduled_blocks')
          .select('*')
          .eq('user_id', userId);

        if (pullError) {
          summary.errors.push(`Timetable pull error: ${pullError.message}`);
        } else if (remoteBlocks && Array.isArray(remoteBlocks)) {
          let updatedList = [...loadScheduledBlocks()];
          let pullCount = 0;

          for (const remote of remoteBlocks) {
            const recordId = remote.id;

            // Guard: If this record was explicitly deleted locally, do not resurrect it
            if (isRecordTombstoned('timetable', recordId)) {
              await supabase
                .from('scheduled_blocks')
                .delete()
                .eq('user_id', userId)
                .eq('id', recordId);
              continue;
            }

            // Guard: If this record is registered as local-only, do not resurrect as cloud-synced
            if (isRecordRegisteredLocalOnly('timetable', recordId)) {
              continue;
            }

            const existingIndex = updatedList.findIndex((b) => b.id === recordId);
            const remoteUpdatedAt = remote.updated_at ? new Date(remote.updated_at).getTime() : 0;

            if (existingIndex >= 0) {
              const local = updatedList[existingIndex];
              // Never overwrite a local-only record with cloud data
              if (getRecordStorageState(local) === 'local_only') {
                continue;
              }
              // Last-write-wins: compare against reliable local timestamp
              const localUpdatedAt = local.updatedAt || Date.now();
              if (remoteUpdatedAt > localUpdatedAt) {
                updatedList[existingIndex] = {
                  ...local,
                  blockId: remote.block_id || local.blockId,
                  title: remote.title,
                  description: remote.description || '',
                  color: remote.color,
                  priority: remote.priority,
                  icon: remote.icon || 'sparkles',
                  dayOfWeek: remote.day_of_week,
                  startMinutes: remote.start_minutes,
                  duration: remote.duration,
                  weekId: remote.week_id,
                  status: remote.status,
                  completedAt: remote.completed_at ? Number(remote.completed_at) : undefined,
                  actualDuration: remote.actual_duration || undefined,
                  storageState: 'cloud_synced',
                  updatedAt: remoteUpdatedAt,
                  syncedAt: Date.now(),
                };
                pullCount++;
              }
            } else {
              // New record from another device
              updatedList.push({
                id: recordId,
                blockId: remote.block_id || 'block-remote',
                title: remote.title,
                description: remote.description || '',
                color: remote.color || '#3B82F6',
                priority: remote.priority || 'medium',
                icon: remote.icon || 'sparkles',
                dayOfWeek: remote.day_of_week,
                startMinutes: remote.start_minutes,
                duration: remote.duration,
                weekId: remote.week_id,
                status: remote.status || 'not_started',
                completedAt: remote.completed_at ? Number(remote.completed_at) : undefined,
                actualDuration: remote.actual_duration || undefined,
                storageState: 'cloud_synced',
                updatedAt: remoteUpdatedAt,
                syncedAt: Date.now(),
              });
              pullCount++;
            }
          }

          if (pullCount > 0) {
            saveScheduledBlocks(updatedList);
            summary.downloadedCount += pullCount;
          }
        }
      } catch (err: any) {
        summary.errors.push(`Timetable sync exception: ${err.message || err}`);
      }
    }

    // ── 3. SYNC TASKS (Only if explicitly enabled, strictly excluding local_only) ──
    if (settings.syncCategories.tasks) {
      try {
        const localTasks = loadTaskInbox();
        const uploadable = filterRecordsForCloudUpload(localTasks, 'tasks', settings);
        summary.skippedLocalCount += localTasks.length - uploadable.length;

        if (uploadable.length > 0) {
          const payload = uploadable.map((t) => ({
            user_id: userId,
            id: t.id,
            title: t.title,
            description: t.description || '',
            category: t.category,
            priority: t.priority,
            deadline: t.deadline || null,
            status: t.status,
            estimated_duration: t.estimatedDuration || 30,
            completed_at: t.completedAt || null,
            scheduled_block_id: t.scheduledBlockId || null,
            storage_state: 'cloud_synced',
            updated_at: new Date(t.updatedAt || Date.now()).toISOString(),
          }));

          const { error } = await supabase
            .from('tasks')
            .upsert(payload, { onConflict: 'user_id,id' });

          if (error) {
            summary.errors.push(`Tasks upload error: ${error.message}`);
          } else {
            summary.uploadedCount += uploadable.length;
          }
        }

        // 3B. Pull remote tasks if category is enabled
        const { data: remoteTasks, error: pullError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);

        if (pullError) {
          summary.errors.push(`Tasks pull error: ${pullError.message}`);
        } else if (remoteTasks && Array.isArray(remoteTasks)) {
          let updatedList = [...loadTaskInbox()];
          let pullCount = 0;

          for (const remote of remoteTasks) {
            const recordId = remote.id;

            // Guard: If this record was explicitly deleted locally, do not resurrect it
            if (isRecordTombstoned('tasks', recordId)) {
              await supabase
                .from('tasks')
                .delete()
                .eq('user_id', userId)
                .eq('id', recordId);
              continue;
            }

            // Guard: If this record is registered as local-only, do not resurrect as cloud-synced
            if (isRecordRegisteredLocalOnly('tasks', recordId)) {
              continue;
            }

            const existingIndex = updatedList.findIndex((t) => t.id === recordId);
            const remoteUpdatedAt = remote.updated_at ? new Date(remote.updated_at).getTime() : 0;

            if (existingIndex >= 0) {
              const local = updatedList[existingIndex];
              // Never overwrite a local-only record with cloud data
              if (getRecordStorageState(local) === 'local_only') {
                continue;
              }
              // Last-write-wins: compare against reliable local timestamp
              const localUpdatedAt = local.updatedAt || local.createdAt || Date.now();
              if (remoteUpdatedAt > localUpdatedAt) {
                updatedList[existingIndex] = {
                  ...local,
                  title: remote.title,
                  description: remote.description || '',
                  category: remote.category,
                  priority: remote.priority,
                  deadline: remote.deadline || undefined,
                  status: remote.status,
                  estimatedDuration: remote.estimated_duration || 30,
                  completedAt: remote.completed_at ? Number(remote.completed_at) : undefined,
                  scheduledBlockId: remote.scheduled_block_id || undefined,
                  storageState: 'cloud_synced',
                  updatedAt: remoteUpdatedAt,
                  syncedAt: Date.now(),
                };
                pullCount++;
              }
            } else {
              // New record from another device
              updatedList.push({
                id: recordId,
                title: remote.title,
                description: remote.description || '',
                category: remote.category || 'General',
                priority: remote.priority || 'medium',
                deadline: remote.deadline || undefined,
                status: remote.status || 'backlog',
                estimatedDuration: remote.estimated_duration || 30,
                completedAt: remote.completed_at ? Number(remote.completed_at) : undefined,
                scheduledBlockId: remote.scheduled_block_id || undefined,
                createdAt: remoteUpdatedAt || Date.now(),
                storageState: 'cloud_synced',
                updatedAt: remoteUpdatedAt,
                syncedAt: Date.now(),
              });
              pullCount++;
            }
          }

          if (pullCount > 0) {
            saveTaskInbox(updatedList);
            summary.downloadedCount += pullCount;
          }
        }
      } catch (err: any) {
        summary.errors.push(`Tasks sync exception: ${err.message || err}`);
      }
    }

    // ── 4. SYNC GOALS (Only if explicitly enabled) ──
    if (settings.syncCategories.goals) {
      try {
        const localGoals = loadGoals();
        const uploadable = filterRecordsForCloudUpload(localGoals, 'goals', settings);
        summary.skippedLocalCount += localGoals.length - uploadable.length;

        if (uploadable.length > 0) {
          const payload = uploadable.map((g) => ({
            user_id: userId,
            id: g.id,
            title: g.title,
            description: g.description || '',
            category: g.category,
            color: g.color || '#3B82F6',
            status: g.status || 'active',
            target_date: g.targetDate || g.deadline || null,
            progress_pct: g.progressPct || 0,
            smart_data: g.smart || {},
            milestones: g.milestones || [],
            components: g.components || [],
            storage_state: 'cloud_synced',
            updated_at: new Date(g.updatedAt || Date.now()).toISOString(),
          }));

          const { error } = await supabase
            .from('goals')
            .upsert(payload, { onConflict: 'user_id,id' });

          if (error) {
            summary.errors.push(`Goals upload error: ${error.message}`);
          } else {
            summary.uploadedCount += uploadable.length;
          }
        }

        // 4B. Pull remote goals if category is enabled
        const { data: remoteGoals, error: pullError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId);

        if (pullError) {
          summary.errors.push(`Goals pull error: ${pullError.message}`);
        } else if (remoteGoals && Array.isArray(remoteGoals)) {
          let updatedList = [...loadGoals()];
          let pullCount = 0;

          for (const remote of remoteGoals) {
            const recordId = remote.id;

            // Guard: If this record was explicitly deleted locally, do not resurrect it
            if (isRecordTombstoned('goals', recordId)) {
              await supabase
                .from('goals')
                .delete()
                .eq('user_id', userId)
                .eq('id', recordId);
              continue;
            }

            // Guard: If this record is registered as local-only, do not resurrect as cloud-synced
            if (isRecordRegisteredLocalOnly('goals', recordId)) {
              continue;
            }

            const existingIndex = updatedList.findIndex((g) => g.id === recordId);
            const remoteUpdatedAt = remote.updated_at ? new Date(remote.updated_at).getTime() : 0;

            if (existingIndex >= 0) {
              const local = updatedList[existingIndex];
              // Never overwrite a local-only record with cloud data
              if (getRecordStorageState(local) === 'local_only') {
                continue;
              }
              // Last-write-wins: compare against reliable local timestamp
              const localUpdatedAt = local.updatedAt || local.createdAt || Date.now();
              if (remoteUpdatedAt > localUpdatedAt) {
                updatedList[existingIndex] = {
                  ...local,
                  title: remote.title,
                  description: remote.description || '',
                  category: remote.category,
                  color: remote.color || '#3B82F6',
                  status: remote.status || 'active',
                  targetDate: remote.target_date || undefined,
                  progressPct: remote.progress_pct !== undefined ? Number(remote.progress_pct) : 0,
                  smart: remote.smart_data || local.smart,
                  milestones: remote.milestones || local.milestones,
                  components: remote.components || local.components,
                  storageState: 'cloud_synced',
                  updatedAt: remoteUpdatedAt,
                  syncedAt: Date.now(),
                };
                pullCount++;
              }
            } else {
              // New record from another device
              updatedList.push({
                id: recordId,
                title: remote.title,
                description: remote.description || '',
                category: remote.category || 'General',
                color: remote.color || '#3B82F6',
                status: remote.status || 'active',
                targetDate: remote.target_date || undefined,
                progressPct: remote.progress_pct !== undefined ? Number(remote.progress_pct) : 0,
                smart: remote.smart_data || undefined,
                milestones: remote.milestones || [],
                components: remote.components || [],
                createdAt: remoteUpdatedAt || Date.now(),
                storageState: 'cloud_synced',
                updatedAt: remoteUpdatedAt,
                syncedAt: Date.now(),
              });
              pullCount++;
            }
          }

          if (pullCount > 0) {
            saveGoals(updatedList);
            summary.downloadedCount += pullCount;
          }
        }
      } catch (err: any) {
        summary.errors.push(`Goals sync exception: ${err.message || err}`);
      }
    }

    // Update lastSyncedAt timestamp in local settings
    saveSyncSettings({
      ...settings,
      lastSyncedAt: Date.now(),
    });
  } catch (globalErr: any) {
    summary.errors.push(`Global sync failure: ${globalErr.message || globalErr}`);
  }

  return summary;
}

/**
 * Changes a record from cloud-synced to local-only.
 * Stops future uploads and downloads without touching the remote copy.
 */
export function convertRecordToLocalOnly(category: SyncCategory, recordId: string): boolean {
  recordLocalOnlyId(category, recordId);
  if (category === 'assignments') {
    const list = loadAssignments();
    const item = list.find((a) => a.id === recordId);
    if (!item) return false;
    const updated = list.map((a) => (a.id === recordId ? stampRecordStorageState(a, 'local_only') : a));
    saveAssignments(updated);
    return true;
  }

  if (category === 'tasks') {
    const list = loadTaskInbox();
    const item = list.find((t) => t.id === recordId);
    if (!item) return false;
    const updated = list.map((t) => (t.id === recordId ? stampRecordStorageState(t, 'local_only') : t));
    saveTaskInbox(updated);
    return true;
  }

  if (category === 'timetable') {
    const list = loadScheduledBlocks();
    const item = list.find((b) => b.id === recordId);
    if (!item) return false;
    const updated = list.map((b) => (b.id === recordId ? stampRecordStorageState(b, 'local_only') : b));
    saveScheduledBlocks(updated);
    return true;
  }

  if (category === 'goals') {
    const list = loadGoals();
    const item = list.find((g) => g.id === recordId);
    if (!item) return false;
    const updated = list.map((g) => (g.id === recordId ? stampRecordStorageState(g, 'local_only') : g));
    saveGoals(updated);
    return true;
  }

  return false;
}

/**
 * Deletes the cloud copy in Supabase while preserving the record on the local device.
 * Stamped as 'local_only' locally.
 */
export async function deleteCloudCopyPreserveLocal(
  category: SyncCategory,
  recordId: string,
  userId: string
): Promise<{ success: boolean; localConverted: boolean; error?: string }> {
  // First convert locally to local_only
  const localConverted = convertRecordToLocalOnly(category, recordId);

  if (!isSupabaseConfigured || !supabase) {
    return { success: true, localConverted };
  }

  try {
    const tableName =
      category === 'assignments'
        ? 'assignments'
        : category === 'timetable'
        ? 'scheduled_blocks'
        : category === 'tasks'
        ? 'tasks'
        : 'goals';

    const idColumn = 'id';

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('user_id', userId)
      .eq(idColumn, recordId);

    if (error) {
      return { success: false, localConverted, error: error.message };
    }

    return { success: true, localConverted };
  } catch (err: any) {
    return { success: false, localConverted, error: err.message || String(err) };
  }
}

/**
 * Purges ALL remote cloud records for this user across all categories,
 * while leaving every local record intact on this device and switching settings to local-only.
 */
export async function purgeAllCloudCopiesPreserveLocal(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const currentSettings = loadSyncSettings();

  // 1. Convert all local records to local_only
  const assignments = loadAssignments().map((a) => stampRecordStorageState(a, 'local_only'));
  saveAssignments(assignments);

  const tasks = loadTaskInbox().map((t) => stampRecordStorageState(t, 'local_only'));
  saveTaskInbox(tasks);

  const blocks = loadScheduledBlocks().map((b) => stampRecordStorageState(b, 'local_only'));
  saveScheduledBlocks(blocks);

  const goals = loadGoals().map((g) => stampRecordStorageState(g, 'local_only'));
  saveGoals(goals);

  // 2. Disable sync in settings
  saveSyncSettings({
    ...currentSettings,
    autoSyncEnabled: false,
    syncConsentGiven: false,
    syncCategories: {
      tasks: false,
      assignments: false,
      goals: false,
      timetable: false,
      templates: false,
      reflections: false,
      focus_logs: false,
    },
  });

  // 3. Delete cloud data if Supabase is connected
  if (isSupabaseConfigured && supabase) {
    try {
      // First try invoking the atomic, secure RPC purge function
      const { error: rpcErr } = await supabase.rpc('purge_all_user_cloud_data');
      if (rpcErr) {
        // Fallback to direct table deletes scoped to user_id
        await Promise.allSettled([
          supabase.from('assignments').delete().eq('user_id', userId),
          supabase.from('scheduled_blocks').delete().eq('user_id', userId),
          supabase.from('reusable_blocks').delete().eq('user_id', userId),
          supabase.from('weekly_templates').delete().eq('user_id', userId),
          supabase.from('tasks').delete().eq('user_id', userId),
          supabase.from('goals').delete().eq('user_id', userId),
          supabase.from('user_sync_profiles').delete().eq('user_id', userId),
        ]);
      }
    } catch (e: any) {
      console.warn('[SelectiveSync] Warning during cloud purge:', e);
    }
  }

  return { success: true };
}
