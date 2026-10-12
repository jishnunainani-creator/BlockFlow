import { getUserScopedKey } from './userScope';

export interface WeeklyReflectionRecord {
  weekId: string;
  whatWentWell: string;
  whatDidntGetFinished: string;
  whatToChangeNextWeek: string;
  rating?: number; // 1-5 rating of the week
  updatedAt: number;
}

const STORAGE_KEY_BASE = 'blockflow_weekly_reflections_v1';

export function loadAllWeeklyReflections(): Record<string, WeeklyReflectionRecord> {
  try {
    const key = getUserScopedKey(STORAGE_KEY_BASE);
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load weekly reflections:', err);
    return {};
  }
}

export function loadWeeklyReflection(weekId: string): WeeklyReflectionRecord | null {
  const all = loadAllWeeklyReflections();
  return all[weekId] || null;
}

export function saveWeeklyReflection(record: WeeklyReflectionRecord): void {
  try {
    const key = getUserScopedKey(STORAGE_KEY_BASE);
    const all = loadAllWeeklyReflections();
    all[record.weekId] = {
      ...record,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save weekly reflection:', err);
  }
}
