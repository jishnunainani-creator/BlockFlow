import { LibraryBlock, ScheduledBlock, Resolution } from '../types/timetable';
import { getISOWeekString } from './timeUtils';

const STORAGE_KEYS = {
  LIBRARY_BLOCKS: 'timetable_library_blocks_v1',
  SCHEDULED_BLOCKS: 'timetable_scheduled_blocks_v1',
  RESOLUTION: 'timetable_resolution_v1',
  THEME: 'timetable_theme_v1',
};

export const INITIAL_LIBRARY_BLOCKS: LibraryBlock[] = [
  {
    id: 'block-1785181271512',
    title: 'Fitness',
    description: 'Gym, Cricket, Pickleball, TT',
    priority: 'Fitness',
    color: '#64748B',
    defaultDuration: 90,
    icon: 'code',
  },
  {
    id: 'block-1785180693019',
    title: 'Self Study',
    description: 'Self Study',
    priority: 'high',
    color: '#EC4899',
    defaultDuration: 60,
    icon: 'code',
  },
  {
    id: 'block-1785180426499',
    title: 'WAKE UP',
    description: 'WAKE UP',
    priority: 'high',
    color: '#EC4899',
    defaultDuration: 30,
    icon: 'code',
  },
  {
    id: 'block-1785180327130',
    title: 'LUNCH BREAK',
    description: 'Lunch',
    priority: 'medium',
    color: '#EF4444',
    defaultDuration: 30,
    icon: 'coffee',
  },
  {
    id: 'block-1785180171203',
    title: 'ENR215 SEC-2',
    description: 'ENR215 SEC-2',
    priority: 'medium',
    color: '#F97316',
    defaultDuration: 240,
    icon: 'code',
  },
  {
    id: 'block-1785179966798',
    title: 'ENR207 SEC-2',
    description: 'ENR207 SEC-2',
    priority: 'medium',
    color: '#10B981',
    defaultDuration: 90,
    icon: 'brain',
  },
  {
    id: 'block-1785179761029',
    title: 'MGT111 SEC-2',
    description: 'SEC-2 Identity and Behaviour',
    priority: 'medium',
    color: '#F97316',
    defaultDuration: 90,
    icon: 'brain',
  },
  {
    id: 'block-1785179503902',
    title: 'CSE305 SEC-1',
    description: 'CSE305 SEC-1(Data Structure and Algorithms)',
    priority: 'medium',
    color: '#8B5CF6',
    defaultDuration: 90,
    icon: 'code',
  },
  {
    id: 'block-1785179085804',
    title: 'ENR209 SEC-2',
    description: 'ENR209 SEC-2',
    priority: 'medium',
    color: '#F97316',
    defaultDuration: 90,
    icon: 'brain',
  },
  {
    id: 'block-1785178924907',
    title: 'ENR211 SEC-2',
    description: 'ENR211 SEC-2',
    priority: 'medium',
    color: '#10B981',
    defaultDuration: 90,
    icon: 'brain',
  },
  {
    id: 'block-1785178488270',
    title: 'CSE 213 SEC-1',
    description: 'CSE 213 SEC-1',
    priority: 'medium',
    color: '#06B6D4',
    defaultDuration: 90,
    icon: 'code',
  },
  {
    id: 'block-dsa',
    title: 'DSA Practice',
    description: 'LeetCode, Data Structures & Algorithms problem solving',
    color: '#EF4444',
    priority: 'high',
    defaultDuration: 90,
    icon: 'code',
  },
  {
    id: 'block-internship',
    title: 'Internship Work',
    description: 'Feature development, standups, and codebase tasks',
    color: '#F97316',
    priority: 'high',
    defaultDuration: 120,
    icon: 'briefcase',
  },
  {
    id: 'block-gym',
    title: 'Gym & Workout',
    description: 'Weightlifting and fitness training session',
    color: '#3B82F6',
    priority: 'personal',
    defaultDuration: 60,
    icon: 'dumbbell',
  },
  {
    id: 'block-cat',
    title: 'CAT Preparation',
    description: 'Quantitative Aptitude, DILR & VARC mock tests',
    color: '#EC4899',
    priority: 'high',
    defaultDuration: 60,
    icon: 'target',
  },
  {
    id: 'block-revision',
    title: 'Daily Revision',
    description: 'Reviewing key concepts, notes, and active recall',
    color: '#8B5CF6',
    priority: 'medium',
    defaultDuration: 60,
    icon: 'brain',
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
    const data = localStorage.getItem(STORAGE_KEYS.LIBRARY_BLOCKS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge: add any INITIAL_LIBRARY_BLOCKS not already in stored list (by id)
        const storedIds = new Set(parsed.map((b: LibraryBlock) => b.id));
        const missingDefaults = INITIAL_LIBRARY_BLOCKS.filter(b => !storedIds.has(b.id));
        return [...missingDefaults, ...parsed];
      }
    }
  } catch (e) {
    console.error('Failed to load library blocks from storage', e);
  }
  return INITIAL_LIBRARY_BLOCKS;
}

export function saveLibraryBlocks(blocks: LibraryBlock[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LIBRARY_BLOCKS, JSON.stringify(blocks));
  } catch (e) {
    console.error('Failed to save library blocks to storage', e);
  }
}

export function loadScheduledBlocks(currentWeekId: string): ScheduledBlock[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULED_BLOCKS);
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
    localStorage.setItem(STORAGE_KEYS.SCHEDULED_BLOCKS, JSON.stringify(blocks));
  } catch (e) {
    console.error('Failed to save scheduled blocks to storage', e);
  }
}

export function loadResolution(): Resolution {
  try {
    const res = localStorage.getItem(STORAGE_KEYS.RESOLUTION);
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
    localStorage.setItem(STORAGE_KEYS.RESOLUTION, resolution.toString());
  } catch (e) {
    console.error('Failed to save resolution', e);
  }
}
