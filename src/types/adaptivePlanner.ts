import { Priority, ScheduledBlock } from './timetable';
import { TaskInboxItem, Assignment, PersonalRule } from './executionOS';

export type PlanningIssueType =
  | 'overdue_task'
  | 'impending_deadline'
  | 'schedule_conflict'
  | 'missed_session'
  | 'unfittable_task'
  | 'overloaded_day';

export type PlanningIssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface PlanningIssueTarget {
  entityType: 'task' | 'block' | 'assignment' | 'day';
  entityId: string;
  title: string;
  deadline?: string;
  duration?: number;
  priority?: Priority;
  dayOfWeek?: number;
  startMinutes?: number;
  weekId?: string;
  conflictingBlockIds?: string[];
}

export interface PlanningIssue {
  id: string;
  type: PlanningIssueType;
  severity: PlanningIssueSeverity;
  title: string;
  whatHappened: string;
  whyItMatters: string;
  recommendedAction: string;
  target: PlanningIssueTarget;
  createdAt: number;
}

export type ProposalType =
  | 'schedule_task'
  | 'reschedule_session'
  | 'resolve_conflict'
  | 'split_task'
  | 'shorten_session';

export interface CandidateSlot {
  dateLabel: string; // e.g. "Tomorrow (Tuesday)", "Today (Monday)"
  dayOfWeek: number; // 0 = Mon, ..., 6 = Sun
  weekId: string;
  startMinutes: number;
  endMinutes: number;
  duration: number;
  rankingScore: number;
  rankingReasons: string[];
  tradeOffs?: string[];
  isRecommended: boolean;
}

export interface ProposedPlanItem {
  id: string;
  issueId: string;
  proposalType: ProposalType;
  title: string;
  entityType: 'task' | 'block' | 'assignment';
  entityId: string;
  originalDuration: number;
  proposedDuration: number;
  currentSlot?: {
    dayOfWeek: number;
    startMinutes: number;
    duration: number;
    weekId: string;
  };
  selectedSlot: CandidateSlot;
  alternativeSlots: CandidateSlot[];
  reason: string;
  tradeOffs?: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  splitPart?: {
    partNumber: number;
    totalParts: number;
    companionSlot?: CandidateSlot;
  };
  appliedAt?: number;
}

export interface ScheduleConstraintConfig {
  availabilityStartMinutes: number; // default 420 (07:00 AM)
  availabilityEndMinutes: number; // default 1320 (10:00 PM)
  minBreakBetweenBlocksMinutes: number; // default 15
  maxDailyPlannedHours: number; // default 8
  horizonDays: number; // default 7
  preferredWindow?: 'morning' | 'afternoon' | 'evening';
}
