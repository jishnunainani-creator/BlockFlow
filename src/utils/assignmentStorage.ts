import {
  Assignment,
  FutureMeMessage,
  DistractionLog,
  EnergyProfile,
  CustomMilestone,
} from '../types/executionOS';

const ASSIGNMENTS_KEY = 'blockflow_assignments_v1';
const FUTURE_ME_KEY = 'blockflow_future_me_v1';
const DISTRACTIONS_KEY = 'blockflow_distractions_v1';
const ENERGY_PROFILE_KEY = 'blockflow_energy_profile_v1';
const MILESTONES_KEY = 'blockflow_custom_milestones_v1';

// Default system milestone definitions starting cleanly at 0 progress
export const SYSTEM_MILESTONE_DEFINITIONS: CustomMilestone[] = [
  {
    id: 'sys-m-1',
    title: 'First Step',
    description: 'Complete your first scheduled activity block in BlockFlow',
    category: 'focus',
    measurementType: 'count',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-2',
    title: '10 Activities Completed',
    description: 'Complete 10 scheduled activity blocks',
    category: 'focus',
    measurementType: 'count',
    targetValue: 10,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-3',
    title: '50 Activities Completed',
    description: 'Complete 50 scheduled activity blocks',
    category: 'focus',
    measurementType: 'count',
    targetValue: 50,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-4',
    title: 'Century Club (100 Activities)',
    description: 'Complete 100 scheduled activity blocks',
    category: 'focus',
    measurementType: 'count',
    targetValue: 100,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-5',
    title: '10 Hours Deep Work',
    description: 'Log 10 total hours of completed focus activities',
    category: 'focus',
    measurementType: 'hours',
    targetValue: 10,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-6',
    title: '50 Hours Deep Work',
    description: 'Log 50 total hours of completed focus activities',
    category: 'focus',
    measurementType: 'hours',
    targetValue: 50,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-7',
    title: '100 Hours Deep Work',
    description: 'Log 100 total hours of completed focus activities',
    category: 'focus',
    measurementType: 'hours',
    targetValue: 100,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-8',
    title: 'Excellence Standard',
    description: 'Achieve a 90%+ daily execution score',
    category: 'consistency',
    measurementType: 'score',
    targetValue: 90,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-9',
    title: '7-Day Streak Master',
    description: 'Maintain a 7-day consistency streak',
    category: 'consistency',
    measurementType: 'days',
    targetValue: 7,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-10',
    title: 'Self-Aware Journaler',
    description: 'Submit your first daily reflection entry',
    category: 'personal',
    measurementType: 'count',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-11',
    title: '30 Reflection Entries',
    description: 'Submit 30 daily reflection entries',
    category: 'personal',
    measurementType: 'count',
    targetValue: 30,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-12',
    title: 'Assignment Conqueror',
    description: 'Complete 5 academic or project assignments',
    category: 'learning',
    measurementType: 'count',
    targetValue: 5,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'sys-m-13',
    title: 'Goal Crusher',
    description: 'Reach 100% progress on a BlockFlow goal',
    category: 'career',
    measurementType: 'count',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
  },
];

import { getUserScopedKey } from './userScope';

export function loadAssignments(): Assignment[] {
  try {
    const key = getUserScopedKey(ASSIGNMENTS_KEY);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load assignments', error);
    return [];
  }
}

export function saveAssignments(assignments: Assignment[]): void {
  try {
    const key = getUserScopedKey(ASSIGNMENTS_KEY);
    localStorage.setItem(key, JSON.stringify(assignments));
  } catch (error) {
    console.error('Failed to save assignments', error);
  }
}

export function loadFutureMeMessages(): FutureMeMessage[] {
  try {
    const key = getUserScopedKey(FUTURE_ME_KEY);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load future me messages', error);
    return [];
  }
}

export function saveFutureMeMessages(messages: FutureMeMessage[]): void {
  try {
    const key = getUserScopedKey(FUTURE_ME_KEY);
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save future me messages', error);
  }
}

export function loadDistractionLogs(): DistractionLog[] {
  try {
    const key = getUserScopedKey(DISTRACTIONS_KEY);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load distraction logs', error);
    return [];
  }
}

export function saveDistractionLogs(logs: DistractionLog[]): void {
  try {
    const key = getUserScopedKey(DISTRACTIONS_KEY);
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save distraction logs', error);
  }
}

export function loadEnergyProfile(): EnergyProfile {
  try {
    const key = getUserScopedKey(ENERGY_PROFILE_KEY);
    const data = localStorage.getItem(key);
    return data
      ? JSON.parse(data)
      : { morning: 'high', afternoon: 'medium', evening: 'low' };
  } catch (error) {
    console.error('Failed to load energy profile', error);
    return { morning: 'high', afternoon: 'medium', evening: 'low' };
  }
}

export function saveEnergyProfile(profile: EnergyProfile): void {
  try {
    const key = getUserScopedKey(ENERGY_PROFILE_KEY);
    localStorage.setItem(key, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save energy profile', error);
  }
}

export function loadCustomMilestones(): CustomMilestone[] {
  try {
    const key = getUserScopedKey(MILESTONES_KEY);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load custom milestones', error);
    return [];
  }
}

export function saveCustomMilestones(milestones: CustomMilestone[]): void {
  try {
    const key = getUserScopedKey(MILESTONES_KEY);
    localStorage.setItem(key, JSON.stringify(milestones));
  } catch (error) {
    console.error('Failed to save custom milestones', error);
  }
}
