export type Priority = 'high' | 'medium' | 'low' | 'personal' | 'meetings' | 'custom' | string;

export type Resolution = 15 | 30 | 45 | 60 | 120 | 240;

export type ThemeMode = 'dark' | 'light' | 'system';

export type CompletionStatus =
  | 'not_started'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'partially_completed'
  | 'skipped'
  | 'cancelled'
  | 'replaced'
  | 'rescheduled'
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
  scheduled: { label: 'Scheduled', badge: '📅', color: '#3B82F6', bgClass: 'bg-blue-500/20 text-blue-300' },
  in_progress: { label: 'In Progress', badge: '▶️', color: '#3B82F6', bgClass: 'bg-blue-500/20 text-blue-300' },
  completed: { label: 'Completed', badge: '✅', color: '#10B981', bgClass: 'bg-emerald-500/20 text-emerald-300' },
  partially_completed: { label: 'Partially Completed', badge: '◐', color: '#F59E0B', bgClass: 'bg-amber-500/20 text-amber-300' },
  skipped: { label: 'Skipped', badge: '×', color: '#64748B', bgClass: 'bg-slate-700/30 text-slate-400' },
  cancelled: { label: 'Cancelled', badge: '🚫', color: '#EF4444', bgClass: 'bg-rose-500/20 text-rose-300' },
  replaced: { label: 'Replaced', badge: '⇄', color: '#EC4899', bgClass: 'bg-pink-500/20 text-pink-300' },
  rescheduled: { label: 'Rescheduled', badge: '↻', color: '#8B5CF6', bgClass: 'bg-purple-500/20 text-purple-300' },
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
  categoryId?: string;
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
  categoryId?: string;
  icon: string;
  dayOfWeek: number; // 0 = Monday, ..., 6 = Sunday
  startMinutes: number; // minutes from 00:00
  duration: number; // in minutes
  weekId: string; // ISO week string like "2026-W31"
  reminderMinutes?: number;
  status?: CompletionStatus;
  completedAt?: number;
  actualDuration?: number;

  // Goal & Task Linking Fields
  goalId?: string;
  goalTitle?: string;
  goalComponentId?: string;
  isFixed?: boolean;
  taskId?: string;
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

export type CategoryName = 'Study' | 'Work' | 'Personal' | 'Meeting' | 'Health' | 'Entertainment' | string;

export interface CATEGORY_CONFIG_ITEM {
  name: string;
  color: string;
  badge: string;
  icon: string;
}

export const CATEGORY_PALETTE: Record<string, CATEGORY_CONFIG_ITEM> = {
  Study: { name: 'Study', color: '#6366F1', badge: '📚', icon: 'book-open' },
  Work: { name: 'Work', color: '#10B981', badge: '💼', icon: 'briefcase' },
  Personal: { name: 'Personal', color: '#F59E0B', badge: '🟡', icon: 'user' },
  Meeting: { name: 'Meeting', color: '#0EA5E9', badge: '☁️', icon: 'users' },
  Health: { name: 'Health', color: '#F43F5E', badge: '🌹', icon: 'heart' },
  Entertainment: { name: 'Entertainment', color: '#8B5CF6', badge: '🟣', icon: 'film' },
};

export const PRIORITY_CONFIG: Record<string, { label: string; defaultColor: string; badge: string }> = {
  high: { label: 'High Priority', defaultColor: '#EF4444', badge: '🔴' },
  medium: { label: 'Medium Priority', defaultColor: '#F97316', badge: '🟠' },
  low: { label: 'Low Priority', defaultColor: '#10B981', badge: '🟢' },
  personal: { label: 'Personal', defaultColor: '#F59E0B', badge: '🟡' },
  meetings: { label: 'Meeting', defaultColor: '#0EA5E9', badge: '☁️' },
  custom: { label: 'Custom', defaultColor: '#8B5CF6', badge: '✨' },
};

// ── BLOCKFLOW EXECUTION OPERATING SYSTEM MODELS ──

export interface GoalComponent {
  id: string;
  title: string;
  targetHours: number;
  completedHours: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetDate: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  weightPct: number; // e.g. 25
}

export interface Goal {
  id: string;
  title: string;
  category: string; // e.g. "Career", "Academics", "Fitness", "Skill Development", "Financial", "Personal Growth"
  description?: string;
  purpose?: string; // Step 2: Why this matters
  derailObstacle?: string; // Step 2: What could derail
  targetDate?: string; // Step 3: ISO date or formatted date
  targetWeeklyHours?: number; // Step 4: Weekly hours commitment
  preferredSessionMinutes?: number; // Step 4: e.g. 60, 90, 120
  preferredEnergyWindow?: 'morning' | 'afternoon' | 'evening';
  totalRequiredHours?: number;
  color: string;
  createdAt?: number;

  components?: GoalComponent[];
  milestones?: GoalMilestone[];

  // Compatibility fields
  deadline?: string;
  targetHoursPerDay?: number;
  progressPct?: number;
}

export interface DailyMissionItem {
  id: string;
  title: string;
  goalId?: string;
  duration: number; // in minutes
  completionProbability: number; // e.g. 89
  completed: boolean;
}

export interface ExecutionScore {
  score: number; // 0 - 100
  consistencyRating: 'Excellent' | 'Good' | 'Fair' | 'Needs Focus';
  focusRating: 'Excellent' | 'Good' | 'Fair';
  timeAccuracyPct: number;
  goalProgressPct: number;
}

export interface ProductivityDNA {
  peakFocusWindow: string;
  preferredSessionMinutes: number;
  maxEffectiveDailyHours: number;
  mostProductiveDay: string;
  leastProductiveTime: string;
}
