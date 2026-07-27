export type Priority = 'high' | 'medium' | 'low' | 'personal' | 'meetings' | 'custom' | string;

export type Resolution = 15 | 30 | 45 | 60 | 120 | 240;

export type ThemeMode = 'dark' | 'light' | 'system';

export type CompletionStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'missed'
  | 'took_longer'
  | 'faster';

export interface STATUS_CONFIG_ITEM {
  label: string;
  badge: string;
  color: string;
  bgClass: string;
}

export const COMPLETION_STATUS_CONFIG: Record<CompletionStatus, STATUS_CONFIG_ITEM> = {
  not_started: { label: 'Not Started', badge: '⏳', color: '#94A3B8', bgClass: 'bg-slate-500/20 text-slate-300' },
  in_progress: { label: 'In Progress', badge: '▶️', color: '#3B82F6', bgClass: 'bg-blue-500/20 text-blue-300' },
  completed: { label: 'Completed', badge: '✅', color: '#10B981', bgClass: 'bg-emerald-500/20 text-emerald-300' },
  skipped: { label: 'Skipped', badge: '⏭️', color: '#64748B', bgClass: 'bg-slate-700/30 text-slate-400' },
  missed: { label: 'Missed', badge: '❌', color: '#EF4444', bgClass: 'bg-rose-500/20 text-rose-300' },
  took_longer: { label: 'Took Longer', badge: '⏱️', color: '#F59E0B', bgClass: 'bg-amber-500/20 text-amber-300' },
  faster: { label: 'Finished Faster', badge: '⚡', color: '#8B5CF6', bgClass: 'bg-purple-500/20 text-purple-300' },
};

export interface LibraryBlock {
  id: string;
  title: string;
  description?: string;
  color: string;
  priority: Priority;
  defaultDuration: number; // in minutes
  icon: string;
  lastUsedAt?: number;
  usageCount?: number;
}

export interface ScheduledBlock {
  id: string;
  blockId: string;
  title: string;
  description?: string;
  color: string;
  priority: Priority;
  icon: string;
  dayOfWeek: number; // 0 = Monday, ..., 6 = Sunday
  startMinutes: number; // minutes from 00:00
  duration: number; // in minutes
  weekId: string; // ISO week string like "2026-W31"
  reminderMinutes?: number;
  status?: CompletionStatus;
  completedAt?: number;
  actualDuration?: number;
}

export interface WeekSchedule {
  weekId: string;
  blocks: ScheduledBlock[];
}

export interface TimetableTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  blocks: Omit<ScheduledBlock, 'id' | 'weekId'>[];
}

export interface ConflictInfo {
  blockId: string;
  overlappingBlockIds: string[];
  dayOfWeek: number;
  message: string;
}

export const PRIORITY_CONFIG: Record<string, { label: string; defaultColor: string; badge: string }> = {
  high: { label: 'High Priority', defaultColor: '#EF4444', badge: '🔴' },
  medium: { label: 'Medium Priority', defaultColor: '#F97316', badge: '🟠' },
  low: { label: 'Low Priority', defaultColor: '#10B981', badge: '🟢' },
  personal: { label: 'Personal', defaultColor: '#3B82F6', badge: '🔵' },
  meetings: { label: 'Meetings', defaultColor: '#8B5CF6', badge: '🟣' },
  custom: { label: 'Custom', defaultColor: '#EC4899', badge: '✨' },
};
