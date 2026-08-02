import { Priority } from './timetable';

export interface Assignment {
  id: string;
  subject: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: Priority;
  estimatedHours: number;
  progressPct: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'graded';
  studyPlan?: { date: string; durationMinutes: number; title: string }[];
}

export interface TimeBudgetItem {
  category: string;
  hours: number;
  color: string;
  icon: string;
}

export interface EnergyProfile {
  morning: 'high' | 'medium' | 'low';
  afternoon: 'high' | 'medium' | 'low';
  evening: 'high' | 'medium' | 'low';
}

export type DistractionReason =
  | 'phone'
  | 'social_media'
  | 'youtube'
  | 'friend'
  | 'fatigue'
  | 'meeting'
  | 'other';

export interface DistractionLog {
  id: string;
  timestamp: number;
  reason: DistractionReason;
  taskTitle: string;
  sessionMinutes: number;
}

export interface FutureMeMessage {
  id: string;
  createdDate: string;
  unsealDate: string;
  text: string;
  goalTarget: string;
  initialProgressPct: number;
  isUnsealed: boolean;
}

export interface ProfessionalMilestone {
  id: string;
  title: string;
  description: string;
  earnedAt?: number;
  category: 'completion' | 'hours' | 'streak' | 'focus';
  progressCurrent: number;
  progressTarget: number;
  isUnlocked: boolean;
}

export interface ScheduleOptimization {
  id: string;
  title: string;
  description: string;
  impact: string;
  type: 'break' | 'shift' | 'reduce';
}

export interface CustomMilestone {
  id: string;
  title: string;
  description: string;
  category: 'focus' | 'consistency' | 'career' | 'learning' | 'personal';
  measurementType: 'hours' | 'days' | 'score' | 'count';
  targetValue: number;
  currentValue: number;
  targetDate?: string;
  earnedDate?: string;
  isUnlocked: boolean;
  isArchived?: boolean;
  isCustom?: boolean;
}

// ── PHASE 2 ADAPTIVE EXECUTION OPERATING SYSTEM MODELS ──

export type TaskStatus = 'backlog' | 'scheduled' | 'in_progress' | 'completed' | 'archived';

export interface TaskInboxItem {
  id: string;
  title: string;
  description?: string;
  estimatedDuration: number; // in minutes
  priority: Priority;
  deadline?: string;
  category: string;
  goalId?: string;
  goalTitle?: string;
  goalComponentId?: string;
  goalMilestoneId?: string;
  assignmentId?: string;
  isFixed?: boolean;
  status: TaskStatus;
  scheduledBlockId?: string;
  scheduledDayOfWeek?: number;
  scheduledStartMinutes?: number;
  createdAt: number;
}

export type PersonalRuleType =
  | 'no_work_after_time'
  | 'no_work_before_time'
  | 'max_daily_hours'
  | 'min_break_between_blocks'
  | 'protect_workout_slot'
  | 'custom_constraint';

export interface PersonalRule {
  id: string;
  title: string;
  ruleType: PersonalRuleType;
  priority: 'strict' | 'preference';
  timeValue?: number; // e.g. 1320 (22:00 / 10 PM)
  durationValue?: number; // e.g. 15 (minutes)
  hoursValue?: number; // e.g. 6 (hours)
  dayOfWeek?: number;
  description: string;
  isActive: boolean;
}

export interface PlanVsRealityMetrics {
  plannedHoursTotal: number;
  actualHoursTotal: number;
  plannedSessionsCount: number;
  completedSessionsCount: number;
  adherencePct: number;
  categoryBreakdown: { category: string; plannedHours: number; actualHours: number }[];
  timeWindowAdherence: { window: string; plannedHours: number; actualHours: number }[];
}


