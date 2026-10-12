import { LibraryBlock, ScheduledBlock, Resolution, Goal } from '../types/timetable';
import { getISOWeekString } from './timeUtils';
import { getUserScopedKey } from './userScope';

const STORAGE_KEYS = {
  LIBRARY_BLOCKS: 'timetable_library_blocks_v1',
  SCHEDULED_BLOCKS: 'timetable_scheduled_blocks_v1',
  RESOLUTION: 'timetable_resolution_v1',
  THEME: 'timetable_theme_v1',
};

export const INITIAL_LIBRARY_BLOCKS: LibraryBlock[] = [
  {
    id: 'lib-block-study',
    title: 'Self Study',
    description: 'Focused learning, reading & research',
    priority: 'high',
    color: '#8B5CF6',
    defaultDuration: 60,
    icon: 'book',
  },
  {
    id: 'lib-block-fitness',
    title: 'Fitness & Health',
    description: 'Gym, sports, workout & exercise',
    priority: 'medium',
    color: '#10B981',
    defaultDuration: 60,
    icon: 'activity',
  },
  {
    id: 'lib-block-work',
    title: 'Work & Projects',
    description: 'Deep work, coding & assignment execution',
    priority: 'high',
    color: '#3B82F6',
    defaultDuration: 90,
    icon: 'code',
  },
  {
    id: 'lib-block-break',
    title: 'Meal / Break',
    description: 'Lunch, dinner, rest & recovery interval',
    priority: 'low',
    color: '#F59E0B',
    defaultDuration: 45,
    icon: 'coffee',
  },
];

export function getDefaultScheduledBlocks(currentWeekId: string): ScheduledBlock[] {
  return [
    {
      id: 'sched-1',
      blockId: 'block-gym',
      title: 'Gym & Workout',
      description: 'Morning workout session',
      color: '#3B82F6',
      priority: 'personal',
      icon: 'dumbbell',
      dayOfWeek: 0, // Mon
      startMinutes: 360, // 06:00
      duration: 60,
      weekId: currentWeekId,
    },
    {
      id: 'sched-2',
      blockId: 'block-dsa',
      title: 'DSA Practice',
      description: 'Graphs & Dynamic Programming',
      color: '#EF4444',
      priority: 'high',
      icon: 'code',
      dayOfWeek: 0, // Mon
      startMinutes: 480, // 08:00
      duration: 90,
      weekId: currentWeekId,
    },
    {
      id: 'sched-3',
      blockId: 'block-internship',
      title: 'Internship Work',
      description: 'Sprint tasks & API integration',
      color: '#F97316',
      priority: 'high',
      icon: 'briefcase',
      dayOfWeek: 0, // Mon
      startMinutes: 600, // 10:00
      duration: 120,
      weekId: currentWeekId,
    },
    {
      id: 'sched-4',
      blockId: 'block-cat',
      title: 'CAT Preparation',
      description: 'Mock test & QA speed drills',
      color: '#EC4899',
      priority: 'high',
      icon: 'target',
      dayOfWeek: 1, // Tue
      startMinutes: 480, // 08:00
      duration: 90,
      weekId: currentWeekId,
    },
    {
      id: 'sched-5',
      blockId: 'block-internship',
      title: 'Internship Work',
      description: 'Code review & team meeting',
      color: '#F97316',
      priority: 'high',
      icon: 'briefcase',
      dayOfWeek: 1, // Tue
      startMinutes: 600, // 10:00
      duration: 120,
      weekId: currentWeekId,
    },
    {
      id: 'sched-6',
      blockId: 'block-revision',
      title: 'Daily Revision',
      description: 'System design & operating systems',
      color: '#8B5CF6',
      priority: 'medium',
      icon: 'brain',
      dayOfWeek: 2, // Wed
      startMinutes: 480, // 08:00
      duration: 60,
      weekId: currentWeekId,
    },
    {
      id: 'sched-7',
      blockId: 'block-reading',
      title: 'Reading & Learning',
      description: 'System Architecture notes',
      color: '#10B981',
      priority: 'low',
      icon: 'book',
      dayOfWeek: 3, // Thu
      startMinutes: 540, // 09:00
      duration: 45,
      weekId: currentWeekId,
    },
  ];
}

export function loadLibraryBlocks(): LibraryBlock[] {
  try {
    const key = getUserScopedKey(STORAGE_KEYS.LIBRARY_BLOCKS);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load library blocks from storage', e);
  }
  return [];
}

export function saveLibraryBlocks(blocks: LibraryBlock[]): void {
  try {
    const key = getUserScopedKey(STORAGE_KEYS.LIBRARY_BLOCKS);
    localStorage.setItem(key, JSON.stringify(blocks));
  } catch (e) {
    console.error('Failed to save library blocks to storage', e);
  }
}

export function loadScheduledBlocks(currentWeekId: string): ScheduledBlock[] {
  try {
    const key = getUserScopedKey(STORAGE_KEYS.SCHEDULED_BLOCKS);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load scheduled blocks from storage', e);
  }
  return getDefaultScheduledBlocks(currentWeekId);
}

export function saveScheduledBlocks(blocks: ScheduledBlock[]): void {
  try {
    const key = getUserScopedKey(STORAGE_KEYS.SCHEDULED_BLOCKS);
    localStorage.setItem(key, JSON.stringify(blocks));
  } catch (e) {
    console.error('Failed to save scheduled blocks to storage', e);
  }
}

export function loadResolution(): Resolution {
  try {
    const key = getUserScopedKey(STORAGE_KEYS.RESOLUTION);
    const res = localStorage.getItem(key);
    if (res && [15, 30, 45, 60].includes(Number(res))) {
      return Number(res) as Resolution;
    }
  } catch (e) {
    console.error('Failed to load resolution', e);
  }
  return 60;
}

export function saveResolution(resolution: Resolution): void {
  try {
    const key = getUserScopedKey(STORAGE_KEYS.RESOLUTION);
    localStorage.setItem(key, resolution.toString());
  } catch (e) {
    console.error('Failed to save resolution', e);
  }
}

const GOALS_STORAGE_KEY = 'blockflow_goals_v1';

export const DEFAULT_SMART_GOALS: Goal[] = [
  {
    id: 'goal-default-dsa',
    title: 'Complete First Six Chapters of Data Structures',
    category: 'Academics',
    description: 'Master Arrays, Linked Lists, Stacks, Queues, Trees, and Graph algorithms with practice problems.',
    color: '#3659C9',
    status: 'active',
    createdAt: Date.now() - 86400000 * 5,
    smart: {
      specificDetails: 'Read theoretical foundations and solve LeetCode practice problems for chapters 1 through 6.',
      measurableType: 'quantity',
      targetValue: 6,
      currentValue: 2,
      unit: 'chapters',
      estimatedTotalHours: 12,
      dailyAvailableHours: 1,
      weeklyAvailableHours: 6,
      preferredDays: [0, 2, 4], // Mon, Wed, Fri
      preferredSessionMinutes: 60,
      preferredEnergyWindow: 'morning',
      feasibilityNote: 'Estimated 12 total hours at 1 hour/day requires ~12 study days. With 20 days until deadline, this target is realistic.',
      motivation: 'Core requirement for technical internship interviews and semester end-term exams.',
      startDate: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
      deadline: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
    },
    targetDate: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
    targetWeeklyHours: 6,
    preferredSessionMinutes: 60,
    preferredEnergyWindow: 'morning',
    totalRequiredHours: 12,
  },
];

export function normalizeGoal(g: any): Goal {
  const deadline =
    g.smart?.deadline ||
    g.targetDate ||
    g.deadline ||
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
  const startDate =
    g.smart?.startDate ||
    new Date(g.createdAt || Date.now()).toISOString().split('T')[0];
  const targetVal =
    g.smart?.targetValue ??
    g.totalRequiredHours ??
    (g.targetWeeklyHours ? g.targetWeeklyHours * 2 : 10);
  const currentVal = g.smart?.currentValue ?? 0;
  const unit = g.smart?.unit || (g.smart?.measurableType === 'effort' ? 'hours' : 'chapters');
  const estHours = g.smart?.estimatedTotalHours ?? g.totalRequiredHours ?? 12;

  return {
    ...g,
    id: g.id || `goal-${Date.now()}`,
    title: g.title || 'Untitled Goal',
    category: g.category || 'Academics',
    color: g.color || '#3659C9',
    status: g.status || 'active',
    createdAt: g.createdAt || Date.now(),
    smart: {
      specificDetails: g.smart?.specificDetails || g.description || '',
      measurableType: g.smart?.measurableType || (unit === 'hours' ? 'effort' : 'quantity'),
      targetValue: targetVal,
      currentValue: currentVal,
      unit: unit,
      estimatedTotalHours: estHours,
      dailyAvailableHours:
        g.smart?.dailyAvailableHours ||
        (g.targetWeeklyHours ? Math.round((g.targetWeeklyHours / 7) * 10) / 10 : 1),
      weeklyAvailableHours: g.smart?.weeklyAvailableHours || g.targetWeeklyHours || 6,
      preferredDays: g.smart?.preferredDays || [0, 2, 4],
      preferredSessionMinutes: g.smart?.preferredSessionMinutes || g.preferredSessionMinutes || 60,
      preferredEnergyWindow: g.smart?.preferredEnergyWindow || g.preferredEnergyWindow || 'morning',
      feasibilityNote: g.smart?.feasibilityNote,
      motivation: g.smart?.motivation || g.purpose || '',
      startDate,
      deadline,
    },
    targetDate: deadline,
    deadline,
  };
}

export function loadGoals(): Goal[] {
  try {
    const key = getUserScopedKey(GOALS_STORAGE_KEY);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((g: any) => normalizeGoal(g));
      }
    }
  } catch (e) {
    console.error('Failed to load goals from storage', e);
  }
  return DEFAULT_SMART_GOALS;
}

export function saveGoals(goals: Goal[]): void {
  try {
    const key = getUserScopedKey(GOALS_STORAGE_KEY);
    localStorage.setItem(key, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save goals to storage', e);
  }
}

const SMART_ONBOARDING_KEY = 'blockflow_smart_onboarding_seen_v1';

export function isSmartOnboardingSeen(): boolean {
  try {
    const key = getUserScopedKey(SMART_ONBOARDING_KEY);
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function setSmartOnboardingSeen(seen: boolean = true): void {
  try {
    const key = getUserScopedKey(SMART_ONBOARDING_KEY);
    localStorage.setItem(key, seen ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save onboarding preference', e);
  }
}


