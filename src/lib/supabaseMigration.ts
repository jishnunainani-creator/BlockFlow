import { supabase } from './supabase';
import { LibraryBlock, ScheduledBlock, TimetableTemplate } from '../types/timetable';
import { loadSyncSettings, filterRecordsForCloudUpload } from './storageRepository';

export async function syncLocalStateToSupabase(
  userId: string,
  libraryBlocks: LibraryBlock[],
  scheduledBlocksByWeek: Record<string, ScheduledBlock[]>,
  templates: TimetableTemplate[]
) {
  const settings = loadSyncSettings();
  if (!settings.syncConsentGiven || !settings.autoSyncEnabled) {
    return { success: false, reason: 'Sync consent not granted: operation aborted for privacy' };
  }

  if (!supabase) return { success: false, reason: 'Supabase not configured' };

  try {
    // 1. Sync Reusable Library Blocks (only if consented and cloud_synced)
    const uploadableLibrary = filterRecordsForCloudUpload(libraryBlocks, 'timetable', settings);
    if (uploadableLibrary.length > 0) {
      const libraryPayload = uploadableLibrary.map((b) => ({
        user_id: userId,
        id: b.id,
        title: b.title,
        description: b.description || '',
        color: b.color,
        priority: b.priority,
        default_duration: b.defaultDuration,
        icon: b.icon,
        usage_count: b.usageCount || 0,
        storage_state: 'cloud_synced',
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('reusable_blocks').upsert(libraryPayload, { onConflict: 'user_id,id' });
    }

    // 2. Sync Scheduled Blocks across all weeks
    const allBlocks: ScheduledBlock[] = [];
    Object.values(scheduledBlocksByWeek).forEach((blocks) => {
      allBlocks.push(...blocks);
    });

    const uploadableBlocks = filterRecordsForCloudUpload(allBlocks, 'timetable', settings);

    if (uploadableBlocks.length > 0) {
      const blocksPayload = uploadableBlocks.map((b) => ({
        user_id: userId,
        id: b.id,
        title: b.title,
        description: b.description || '',
        color: b.color,
        priority: b.priority,
        day_of_week: b.dayOfWeek,
        start_minutes: b.startMinutes,
        duration: b.duration,
        week_id: b.weekId,
        status: b.status || 'not_started',
        storage_state: 'cloud_synced',
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('scheduled_blocks').upsert(blocksPayload, { onConflict: 'user_id,id' });
    }

    return { success: true, count: uploadableBlocks.length + uploadableLibrary.length };
  } catch (err) {
    console.warn('Supabase sync warning:', err);
    return { success: false, err };
  }
}
