/**
 * Privacy-First, Local-First Storage & Synchronization Models
 */

export type StorageState = 'local_only' | 'cloud_synced' | 'encrypted_cloud';

export type SyncCategory =
  | 'tasks'
  | 'assignments'
  | 'goals'
  | 'timetable'
  | 'templates'
  | 'reflections'
  | 'focus_logs';

export interface StorageClassification {
  storageState: StorageState;
  updatedAt: number;
  syncedAt?: number;
  cloudId?: string;
  isDeletedLocally?: boolean;
  syncPending?: boolean;
}

export interface SyncCategoryConfig {
  label: string;
  description: string;
  sensitiveDefault: boolean; // True means default to local_only for privacy
  recommended: 'local' | 'cloud';
}

export const SYNC_CATEGORIES_METADATA: Record<SyncCategory, SyncCategoryConfig> = {
  tasks: {
    label: 'Tasks & Inbox',
    description: 'Personal daily to-dos, backlog items, and quick captures',
    sensitiveDefault: true,
    recommended: 'local',
  },
  assignments: {
    label: 'Academic Assignments',
    description: 'Coursework milestones, deliverables, deadlines, and grade weights',
    sensitiveDefault: false,
    recommended: 'cloud',
  },
  timetable: {
    label: 'Schedule & Timetable Blocks',
    description: 'Weekly routines, lecture times, study slots, and calendar commitments',
    sensitiveDefault: false,
    recommended: 'cloud',
  },
  goals: {
    label: 'SMART Goals',
    description: 'Personal development goals, motivations, target metrics, and milestones',
    sensitiveDefault: true,
    recommended: 'local',
  },
  templates: {
    label: 'Timetable Templates',
    description: 'Reusable weekly layout presets and exam week schedules',
    sensitiveDefault: false,
    recommended: 'cloud',
  },
  reflections: {
    label: 'Reflections & Diary',
    description: 'Private weekly reflections, mood entries, and personal notes',
    sensitiveDefault: true,
    recommended: 'local',
  },
  focus_logs: {
    label: 'Focus Session Logs',
    description: 'Pomodoro logs, duration histories, and distraction records',
    sensitiveDefault: true,
    recommended: 'local',
  },
};

export interface SyncSettings {
  autoSyncEnabled: boolean;
  syncConsentGiven: boolean;
  syncConsentDate?: string;
  syncCategories: Record<SyncCategory, boolean>;
  lastSyncedAt?: number;
  deviceId: string;
}

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSyncEnabled: false, // Privacy-first default: OFF until explicitly chosen
  syncConsentGiven: false,
  syncCategories: {
    tasks: false, // private by default
    assignments: false,
    goals: false, // private by default
    timetable: false,
    templates: false,
    reflections: false, // private by default
    focus_logs: false, // private by default
  },
  deviceId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'device-' + Date.now(),
};

export interface SyncItemResult {
  id: string;
  category: SyncCategory;
  action: 'uploaded' | 'downloaded' | 'skipped_local_only' | 'deleted_remote' | 'conflict_resolved';
  success: boolean;
  error?: string;
}

export interface SyncSummary {
  timestamp: number;
  uploadedCount: number;
  downloadedCount: number;
  skippedLocalCount: number;
  errors: string[];
}
