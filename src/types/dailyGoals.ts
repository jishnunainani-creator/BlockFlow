/**
 * BlockFlow Daily Goals, Plan Periods & Day Reflections Type Definitions
 * All dates use local "YYYY-MM-DD" strings and times use "HH:mm"
 */

export type GoalMeasureType = 'check' | 'count' | 'percent' | 'minutes';
export type DailyGoalStatus = 'planned' | 'in_progress' | 'done' | 'partial' | 'skipped' | 'carried';
export type DailyGoalPriority = 'high' | 'medium' | 'low';
export type PeriodKind = 'exam' | 'sprint' | 'custom';

export type MissReasonTag =
  | 'too_big'
  | 'ran_out_of_time'
  | 'low_energy'
  | 'distracted'
  | 'blocked'
  | 'deprioritised';

export interface MissReasonConfig {
  id: MissReasonTag;
  label: string;
  icon?: string;
  description: string;
}

export const MISS_REASON_OPTIONS: MissReasonConfig[] = [
  { id: 'too_big', label: 'Too Big', description: 'Scope was larger than expected' },
  { id: 'ran_out_of_time', label: 'Ran out of time', description: 'Schedule ran late' },
  { id: 'low_energy', label: 'Low energy', description: 'Fatigue or mental block' },
  { id: 'distracted', label: 'Distracted', description: 'Interruptions or loss of focus' },
  { id: 'blocked', label: 'Blocked', description: 'Waiting on external input or dependencies' },
  { id: 'deprioritised', label: 'Deprioritised', description: 'Shifted focus to higher priority urgent matters' },
];

export interface GoalMeasure {
  type: GoalMeasureType;
  target?: number;
  current: number;
}

export interface DailyGoalPaletteOption {
  id: string;
  name: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotColor: string;
}

export const GOAL_PALETTE_OPTIONS: DailyGoalPaletteOption[] = [
  { id: 'indigo', name: 'Indigo', bgClass: 'bg-indigo-50 dark:bg-indigo-950/40', borderClass: 'border-indigo-200 dark:border-indigo-800', textClass: 'text-indigo-700 dark:text-indigo-300', dotColor: '#6366F1' },
  { id: 'emerald', name: 'Emerald', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40', borderClass: 'border-emerald-200 dark:border-emerald-800', textClass: 'text-emerald-700 dark:text-emerald-300', dotColor: '#10B981' },
  { id: 'amber', name: 'Amber', bgClass: 'bg-amber-50 dark:bg-amber-950/40', borderClass: 'border-amber-200 dark:border-amber-800', textClass: 'text-amber-700 dark:text-amber-300', dotColor: '#F59E0B' },
  { id: 'rose', name: 'Rose', bgClass: 'bg-rose-50 dark:bg-rose-950/40', borderClass: 'border-rose-200 dark:border-rose-800', textClass: 'text-rose-700 dark:text-rose-300', dotColor: '#F43F5E' },
  { id: 'cyan', name: 'Cyan', bgClass: 'bg-cyan-50 dark:bg-cyan-950/40', borderClass: 'border-cyan-200 dark:border-cyan-800', textClass: 'text-cyan-700 dark:text-cyan-300', dotColor: '#06B6D4' },
  { id: 'purple', name: 'Purple', bgClass: 'bg-purple-50 dark:bg-purple-950/40', borderClass: 'border-purple-200 dark:border-purple-800', textClass: 'text-purple-700 dark:text-purple-300', dotColor: '#A855F7' },
  { id: 'orange', name: 'Orange', bgClass: 'bg-orange-50 dark:bg-orange-950/40', borderClass: 'border-orange-200 dark:border-orange-800', textClass: 'text-orange-700 dark:text-orange-300', dotColor: '#F97316' },
  { id: 'blue', name: 'Blue', bgClass: 'bg-blue-50 dark:bg-blue-950/40', borderClass: 'border-blue-200 dark:border-blue-800', textClass: 'text-blue-700 dark:text-blue-300', dotColor: '#3B82F6' },
];

export interface DailyGoal {
  id: string;
  date: string; // local "YYYY-MM-DD"
  periodId?: string;
  title: string;
  notes?: string;
  color: string; // palette token id, e.g. 'indigo'
  priority: DailyGoalPriority;
  isMustDo: boolean; // Top 3 Must-Do flag
  startTime?: string; // "HH:mm" (15-min snap)
  endTime?: string; // "HH:mm"
  estimateMin?: number;
  actualMin?: number;
  measure: GoalMeasure;
  status: DailyGoalStatus;
  carriedFromId?: string;
  carryCount: number; // 0 for initial, increments on each carry
  linkedBlockId?: string;
  linkedAssignmentId?: string;
  linkedSmartGoalId?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface PeriodMilestone {
  date: string; // "YYYY-MM-DD"
  label: string; // e.g. "Biology Exam"
}

export interface PlanPeriod {
  id: string;
  name: string; // e.g. "Endsem 2026"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  color: string;
  kind: PeriodKind;
  milestones: PeriodMilestone[];
  createdAt: number;
  updatedAt: number;
}

export interface DayReflection {
  date: string; // "YYYY-MM-DD"
  energy: number; // 1 to 5
  reasonTags: Record<string, MissReasonTag[]>; // goalId -> tags
  win: string;
  tomorrowFirstStep: string;
  completedAt: number;
}

export interface DayGoalStats {
  totalCount: number;
  completedCount: number;
  partialCount: number;
  skippedCount: number;
  carriedCount: number;
  plannedCount: number;
  mustDoCount: number;
  mustDoCompletedCount: number;
  earnedPoints: number;
  maxPoints: number;
  scorePct: number | null; // null when no goals
  formattedScore: string; // "-" when no goals, e.g. "85%"
  plannedMinutes: number;
  freeMinutes: number;
  isOverloaded: boolean;
}
