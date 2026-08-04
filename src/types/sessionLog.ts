import { Priority } from './timetable';

export type SessionExecutionStatus =
  | 'completed'
  | 'partially_completed'
  | 'skipped'
  | 'cancelled'
  | 'replaced'
  | 'rescheduled'
  | 'in_progress';

export interface ExecutionSession {
  id: string;
  scheduledBlockId: string;
  date: string; // ISO format YYYY-MM-DD
  plannedTitle: string;
  plannedStartMinutes: number;
  plannedDuration: number;
  plannedDescription?: string;
  plannedCategory?: string;
  actualTitle: string;
  actualStartMinutes: number;
  actualDuration: number;
  actualActivityId?: string;
  actualCategory?: string;
  status: SessionExecutionStatus;
  topic?: string;
  subtopics?: string[];
  notes?: string;
  problemsCompleted?: number;
  focusRating?: number; // 1 to 5
  deviationReason?: string;
  deviationNote?: string;
  rescheduledBlockId?: string;
  createdAt: number;
}

export type DeviationType = 'replacement' | 'cancellation' | 'reschedule' | 'skip';

export interface DeviationRecord {
  id: string;
  scheduledBlockId: string;
  date: string; // ISO format YYYY-MM-DD
  plannedTitle: string;
  actualTitle: string;
  deviationType: DeviationType;
  reason: string;
  note?: string;
  rescheduledBlockId?: string;
  createdAt: number;
}

export const DEVIATION_REASONS = [
  'Higher priority came up',
  'Low energy / tired',
  'Schedule conflict',
  'Previous task overran',
  'Unexpected event',
  'Health / fitness',
  'Changed my mind',
  'Didn\'t feel prepared',
  'Other',
] as const;

export type DeviationReasonOption = (typeof DEVIATION_REASONS)[number];

export interface PlanVsRealityMetrics {
  date: string;
  planAdherencePct: number; // (completedAsPlannedCount / totalPlannedCount) * 100
  executionScore: number;
  completedAsPlannedCount: number;
  completedDifferentlyCount: number;
  rescheduledCount: number;
  skippedCount: number;
  cancelledCount: number;
  totalPlannedCount: number;
  items: {
    scheduledBlockId: string;
    plannedTitle: string;
    plannedTimeStr: string;
    actualTitle: string;
    actualTimeStr: string;
    status: SessionExecutionStatus;
    topic?: string;
    subtopics?: string[];
    deviationReason?: string;
  }[];
}

export interface DeviationAnalyticsSummary {
  hasEnoughData: boolean;
  totalDeviations: number;
  executedAsPlannedPct: number;
  rescheduledPct: number;
  replacedPct: number;
  cancelledSkippedPct: number;
  reasonBreakdown: { reason: string; count: number; percentage: number }[];
}

export interface TopicStudyItem {
  topic: string;
  totalMinutes: number;
  sessionsCount: number;
  subtopics: string[];
  lastStudiedDate: string;
}

export interface StudyHistorySummary {
  hasData: boolean;
  totalScheduledHours: number;
  totalActualHours: number;
  planAdherencePct: number;
  totalSessionsCount: number;
  subjectBreakdown: Record<string, { totalMinutes: number; topics: TopicStudyItem[] }>;
}

export interface PlanningInsightPattern {
  id: string;
  type: 'timing_recommendation' | 'replacement_rule';
  title: string;
  description: string;
  evidenceCount: number;
  suggestedActionLabel: string;
  ruleData?: {
    activityTitle: string;
    preferredWindowStart: number;
    preferredWindowEnd: number;
  };
}
