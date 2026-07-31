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
