import { supabase } from './supabase';
import { LibraryBlock, ScheduledBlock, TimetableTemplate } from '../types/timetable';

export async function syncLocalStateToSupabase(
  userId: string,
  libraryBlocks: LibraryBlock[],
  scheduledBlocksByWeek: Record<string, ScheduledBlock[]>,
  templates: TimetableTemplate[]
) {
  if (!supabase) return { success: false, reason: 'Supabase not configured' };

  try {
    // 1. Sync Activity Library Blocks
    if (libraryBlocks.length > 0) {
      const libraryPayload = libraryBlocks.map((b) => ({
        user_id: userId,
        block_id: b.id,
        title: b.title,
        description: b.description || '',
        color: b.color,
        priority: b.priority,
        default_duration: b.defaultDuration,
        icon: b.icon,
        usage_count: b.usageCount || 0,
      }));

      await supabase.from('activity_library').upsert(libraryPayload, { onConflict: 'user_id,block_id' });
    }

    // 2. Sync Scheduled Blocks across all weeks
    const allBlocks: ScheduledBlock[] = [];
    Object.values(scheduledBlocksByWeek).forEach((blocks) => {
      allBlocks.push(...blocks);
    });

    if (allBlocks.length > 0) {
      const blocksPayload = allBlocks.map((b) => ({
        user_id: userId,
        scheduled_id: b.id,
        title: b.title,
        description: b.description || '',
        color: b.color,
        priority: b.priority,
        day_of_week: b.dayOfWeek,
        start_minutes: b.startMinutes,
        duration: b.duration,
        week_id: b.weekId,
        reminder_minutes: b.reminderMinutes || 0,
        status: b.status || 'not_started',
      }));

      await supabase.from('scheduled_blocks').upsert(blocksPayload, { onConflict: 'user_id,scheduled_id' });
    }

    return { success: true, count: allBlocks.length };
  } catch (err) {
    console.warn('Supabase sync warning:', err);
    return { success: false, err };
  }
}
