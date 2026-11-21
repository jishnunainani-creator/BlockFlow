/**
 * BlockFlow Daily Goals & Plan Periods Pure Engine
 * Zero side-effects, deterministic math, fully testable with node:test
 */

import {
  DailyGoal,
  DailyGoalPriority,
  DayGoalStats,
  PlanPeriod,
  DayReflection,
  MissReasonTag,
} from '../types/dailyGoals';
import { ScheduledBlock } from '../types/timetable';
import { isNonWorkActivity, isFixedCommitment } from './adaptivePlannerEngine';
import { timeStrToMinutes } from './timeUtils';

export const PRIORITY_WEIGHTS: Record<DailyGoalPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Calculates completion fraction for a single goal (0.0 to 1.0).
 */
export function getGoalCompletionFraction(goal: DailyGoal): number {
  if (goal.status === 'done') {
    return 1.0;
  }
  if (goal.status === 'partial') {
    if (goal.measure.type === 'check') {
      return 0.5;
    }
    if (goal.measure.type === 'percent') {
      return Math.min(1, Math.max(0, (goal.measure.current || 0) / 100));
    }
    const target = goal.measure.target || 1;
    return target > 0 ? Math.min(1, Math.max(0, (goal.measure.current || 0) / target)) : 0.5;
  }
  if (goal.status === 'in_progress') {
    if (goal.measure.type === 'percent' && goal.measure.current > 0) {
      return Math.min(1, Math.max(0, goal.measure.current / 100));
    }
    if ((goal.measure.type === 'count' || goal.measure.type === 'minutes') && (goal.measure.target || 0) > 0 && goal.measure.current > 0) {
      return Math.min(1, Math.max(0, goal.measure.current / (goal.measure.target || 1)));
    }
    return 0.0;
  }
  return 0.0;
}

/**
 * Computes weighted score for a collection of daily goals on a date.
 * High: 3, Medium: 2, Low: 1. Partial credit = fraction complete.
 * If 0 goals, returns scorePct: null and formattedScore: "-"
 */
export function computeDayScore(goals: DailyGoal[]): {
  earnedPoints: number;
  maxPoints: number;
  scorePct: number | null;
  formattedScore: string;
} {
  if (!goals || goals.length === 0) {
    return {
      earnedPoints: 0,
      maxPoints: 0,
      scorePct: null,
      formattedScore: '-',
    };
  }

  let earnedPoints = 0;
  let maxPoints = 0;

  for (const goal of goals) {
    const weight = PRIORITY_WEIGHTS[goal.priority] || 1;
    maxPoints += weight;
    const fraction = getGoalCompletionFraction(goal);
    earnedPoints += weight * fraction;
  }

  if (maxPoints === 0) {
    return {
      earnedPoints: 0,
      maxPoints: 0,
      scorePct: null,
      formattedScore: '-',
    };
  }

  const scorePct = Math.round((earnedPoints / maxPoints) * 100);
  return {
    earnedPoints: Math.round(earnedPoints * 10) / 10,
    maxPoints,
    scorePct,
    formattedScore: `${scorePct}%`,
  };
}

/**
 * Evaluates the time budget for daily goals against available free time.
 * EXCLUDES sleep, meals, and fixed commitments from available capacity.
 */
export function checkTimeBudget(params: {
  goals: DailyGoal[];
  scheduledBlocks: ScheduledBlock[];
  dateStr: string; // "YYYY-MM-DD"
}): {
  plannedMinutes: number;
  freeMinutes: number;
  nonWorkMinutes: number;
  fixedCommitmentMinutes: number;
  isOverloaded: boolean;
  overloadDeltaMinutes: number;
} {
  const { goals, scheduledBlocks, dateStr } = params;

  // 1. Calculate non-work (sleep, meals, routines) and fixed block load
  let nonWorkMinutes = 0;
  let fixedCommitmentMinutes = 0;

  for (const block of scheduledBlocks) {
    const duration = block.duration || 0;
    if (isNonWorkActivity(block)) {
      nonWorkMinutes += duration;
    } else if (isFixedCommitment(block)) {
      fixedCommitmentMinutes += duration;
    }
  }

  // 2. Day total is 1440 minutes (24h)
  const freeMinutes = Math.max(0, 1440 - nonWorkMinutes - fixedCommitmentMinutes);

  // 3. Calculate planned minutes for all goals of this date
  let plannedMinutes = 0;
  for (const goal of goals) {
    if (goal.date !== dateStr) continue;
    if (goal.status === 'skipped') continue;

    if (goal.estimateMin && goal.estimateMin > 0) {
      plannedMinutes += goal.estimateMin;
    } else if (goal.startTime && goal.endTime) {
      const start = timeStrToMinutes(goal.startTime);
      const end = timeStrToMinutes(goal.endTime);
      const dur = end >= start ? end - start : 1440 - start + end;
      plannedMinutes += dur;
    } else if (goal.measure.type === 'minutes' && goal.measure.target) {
      plannedMinutes += goal.measure.target;
    }
  }

  const isOverloaded = plannedMinutes > freeMinutes;
  const overloadDeltaMinutes = isOverloaded ? plannedMinutes - freeMinutes : 0;

  return {
    plannedMinutes,
    freeMinutes,
    nonWorkMinutes,
    fixedCommitmentMinutes,
    isOverloaded,
    overloadDeltaMinutes,
  };
}

/**
 * Checks if a goal's time window overlaps any fixed commitment.
 */
export function checkGoalWindowOverlap(
  goal: { startTime?: string; endTime?: string },
  scheduledBlocks: ScheduledBlock[]
): {
  hasOverlap: boolean;
  conflictingBlockTitle?: string;
} {
  if (!goal.startTime || !goal.endTime) {
    return { hasOverlap: false };
  }

  const goalStart = timeStrToMinutes(goal.startTime);
  const goalEnd = timeStrToMinutes(goal.endTime);

  for (const block of scheduledBlocks) {
    if (!isFixedCommitment(block)) continue;
    const blockStart = block.startMinutes;
    const blockEnd = blockStart + block.duration;

    // Overlap condition
    if (goalStart < blockEnd && goalEnd > blockStart) {
      return {
        hasOverlap: true,
        conflictingBlockTitle: block.title,
      };
    }
  }

  return { hasOverlap: false };
}

/**
 * Pure carry-over operation.
 * Updates source goal to 'carried' and creates next-day clone with incremented carryCount.
 */
export function createCarriedGoal(
  sourceGoal: DailyGoal,
  targetDateStr: string,
  nextOrder: number = 0
): { updatedSource: DailyGoal; carriedGoal: DailyGoal } {
  const updatedSource: DailyGoal = {
    ...sourceGoal,
    status: 'carried',
    updatedAt: Date.now(),
  };

  const carriedGoal: DailyGoal = {
    ...sourceGoal,
    id: `dg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: targetDateStr,
    carriedFromId: sourceGoal.id,
    carryCount: (sourceGoal.carryCount || 0) + 1,
    status: 'planned',
    measure: {
      ...sourceGoal.measure,
      current: 0,
    },
    order: nextOrder,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: undefined,
  };

  return { updatedSource, carriedGoal };
}

/**
 * Reorders goals immutably and re-indexes the order property.
 */
export function reorderGoals(goals: DailyGoal[], startIndex: number, endIndex: number): DailyGoal[] {
  const result = [...goals];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((g, index) => ({
    ...g,
    order: index,
  }));
}

/**
 * Generates an array of all local "YYYY-MM-DD" dates between start and end date (inclusive).
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const [sY, sM, sD] = startDate.split('-').map(Number);
  const [eY, eM, eD] = endDate.split('-').map(Number);

  const current = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Returns Day X of N for a date inside a plan period.
 */
export function getPeriodDayProgress(period: PlanPeriod, dateStr: string): {
  dayNumber: number;
  totalDays: number;
  isWithin: boolean;
  isPast: boolean;
  isFuture: boolean;
} {
  const allDates = getDatesBetween(period.startDate, period.endDate);
  const totalDays = allDates.length;
  const index = allDates.indexOf(dateStr);

  if (index === -1) {
    const isPast = dateStr > period.endDate;
    const isFuture = dateStr < period.startDate;
    return {
      dayNumber: isPast ? totalDays : 1,
      totalDays,
      isWithin: false,
      isPast,
      isFuture,
    };
  }

  return {
    dayNumber: index + 1,
    totalDays,
    isWithin: true,
    isPast: false,
    isFuture: false,
  };
}

/**
 * Calculates countdown to milestones within a plan period.
 */
export function getMilestoneCountdowns(
  milestones: PlanPeriod['milestones'],
  refDateStr: string
): Array<{ label: string; date: string; daysRemaining: number; isToday: boolean; isPast: boolean }> {
  const [rY, rM, rD] = refDateStr.split('-').map(Number);
  const refDate = new Date(rY, rM - 1, rD);

  return (milestones || []).map((m) => {
    const [mY, mM, mD] = m.date.split('-').map(Number);
    const mDate = new Date(mY, mM - 1, mD);
    const diffTime = mDate.getTime() - refDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return {
      label: m.label,
      date: m.date,
      daysRemaining: diffDays,
      isToday: diffDays === 0,
      isPast: diffDays < 0,
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Aggregates summary statistics for a plan period.
 */
export function computePeriodSummary(
  period: PlanPeriod,
  periodGoals: DailyGoal[],
  reflections: DayReflection[] = []
): {
  totalGoals: number;
  completedGoals: number;
  completionRatePct: number;
  carriedCount: number;
  missReasonsBreakdown: Record<MissReasonTag, number>;
} {
  const totalGoals = periodGoals.length;
  const completedGoals = periodGoals.filter((g) => g.status === 'done').length;
  const carriedCount = periodGoals.reduce((sum, g) => sum + (g.carryCount || 0), 0);
  const completionRatePct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const missReasonsBreakdown: Record<MissReasonTag, number> = {
    too_big: 0,
    ran_out_of_time: 0,
    low_energy: 0,
    distracted: 0,
    blocked: 0,
    deprioritised: 0,
  };

  for (const r of reflections) {
    if (r.reasonTags) {
      for (const tags of Object.values(r.reasonTags)) {
        for (const tag of tags) {
          if (tag in missReasonsBreakdown) {
            missReasonsBreakdown[tag]++;
          }
        }
      }
    }
  }

  return {
    totalGoals,
    completedGoals,
    completionRatePct,
    carriedCount,
    missReasonsBreakdown,
  };
}
