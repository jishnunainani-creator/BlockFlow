import { LibraryBlock, ScheduledBlock, TimetableTemplate } from '../../types/timetable';

export interface MigrationReport {
  libraryCount: number;
  activitiesCount: number;
  weeksCount: number;
  templatesCount: number;
  remindersCount: number;
  conflictsCount: number;
  initialExecutionScore: number;
}

export interface MigrationResult {
  libraryBlocks: LibraryBlock[];
  scheduledBlocksByWeek: Record<string, ScheduledBlock[]>;
  templates: TimetableTemplate[];
  customCategories: string[];
  report: MigrationReport;
}

export function migrateBlockFlowJSON(rawJson: string | object): MigrationResult {
  let parsed: any;
  if (typeof rawJson === 'string') {
    parsed = JSON.parse(rawJson);
  } else {
    parsed = rawJson;
  }

  // 1. Extract Library Blocks
  const rawLibrary = parsed.libraryBlocks || parsed.library || parsed.blocks || [];
  const libraryBlocks: LibraryBlock[] = rawLibrary.map((b: any, idx: number) => ({
    id: b.id || `lib-${idx}-${Date.now()}`,
    title: b.title || 'Untitled Activity',
    description: b.description || '',
    color: b.color || '#6366F1',
    priority: b.priority || 'medium',
    defaultDuration: b.defaultDuration || b.duration || 60,
    icon: b.icon || 'sparkles',
    usageCount: b.usageCount || 0,
    lastUsedAt: b.lastUsedAt || Date.now(),
  }));

  // 2. Extract Scheduled Blocks across ALL Historical Weeks
  const scheduledBlocksByWeek: Record<string, ScheduledBlock[]> = {};
  let totalScheduledCount = 0;
  let totalRemindersCount = 0;
  let completedCount = 0;

  const rawWeeks = parsed.scheduledBlocksByWeek || parsed.weeks || {};

  if (typeof rawWeeks === 'object') {
    Object.entries(rawWeeks).forEach(([weekId, blocks]: [string, any]) => {
      if (Array.isArray(blocks)) {
        const sanitized: ScheduledBlock[] = blocks.map((b: any, idx: number) => {
          totalScheduledCount++;
          if (b.reminderMinutes && b.reminderMinutes > 0) totalRemindersCount++;
          if (b.status === 'completed' || b.status === 'faster') completedCount++;

          return {
            id: b.id || `sched-${weekId}-${idx}-${Date.now()}`,
            blockId: b.blockId || b.id || `lib-${idx}`,
            title: b.title || 'Scheduled Activity',
            description: b.description || '',
            color: b.color || '#6366F1',
            priority: b.priority || 'medium',
            icon: b.icon || 'sparkles',
            dayOfWeek: typeof b.dayOfWeek === 'number' ? b.dayOfWeek : 0,
            startMinutes: typeof b.startMinutes === 'number' ? b.startMinutes : 540,
            duration: b.duration || 60,
            weekId,
            reminderMinutes: b.reminderMinutes || 0,
            status: b.status || 'not_started',
            actualDuration: b.actualDuration,
            completedAt: b.completedAt,
          };
        });

        scheduledBlocksByWeek[weekId] = sanitized;
      }
    });
  }

  // 3. Extract Templates
  const rawTemplates = parsed.templates || [];
  const templates: TimetableTemplate[] = rawTemplates.map((t: any, idx: number) => ({
    id: t.id || `tmpl-${idx}-${Date.now()}`,
    name: t.name || 'Custom Routine Template',
    description: t.description || '',
    createdAt: t.createdAt || Date.now(),
    blocks: t.blocks || [],
  }));

  // 4. Extract Custom Categories
  const customCategories = parsed.customCategories || ['DSA', 'Exams', 'Internship', 'Fitness'];

  // 5. Calculate Initial Execution Score from historical completions
  const initialScore = totalScheduledCount > 0
    ? Math.min(100, Math.max(50, Math.round((completedCount / totalScheduledCount) * 100)))
    : 92;

  const weeksCount = Object.keys(scheduledBlocksByWeek).length;

  return {
    libraryBlocks,
    scheduledBlocksByWeek,
    templates,
    customCategories,
    report: {
      libraryCount: libraryBlocks.length,
      activitiesCount: totalScheduledCount,
      weeksCount,
      templatesCount: templates.length,
      remindersCount: totalRemindersCount,
      conflictsCount: 0,
      initialExecutionScore: initialScore,
    },
  };
}
