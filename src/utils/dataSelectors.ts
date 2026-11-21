import { ScheduledBlock, Goal } from '../types/timetable';
import { DualGoalMetrics, calculateGoalMetrics } from './goalEngine';
import { getISOWeekString } from './timeUtils';
import { ExecutionSession } from '../types/sessionLog';
import { FocusSessionLog } from './focusStorage';
import { DailyGoal, DayGoalStats } from '../types/dailyGoals';
import { computeDayScore, checkTimeBudget } from './dailyGoalsEngine';

export interface BlockCompletionStats {
  total: number;
  completed: number;
  missed: number;
  pending: number;
  inProgress: number;
  completionRatePct: number;
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
}

export interface CanonicalExecutionMetrics {
  overallScore: number; // 0 - 100
  completionPct: number; // 0 - 100
  timeAccuracyPct: number; // 0 - 100
  focusScore: number; // 0 - 100
  consistencyRating: 'Excellent' | 'Good' | 'Fair' | 'Needs Focus' | 'No Data';
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
  completedCount: number;
  totalCount: number;
}

export interface FocusDurationStats {
  totalMinutes: number;
  totalHours: number;
  count: number;
  avgDurationMinutes: number;
}

/**
 * 1. TODAY'S SCHEDULED BLOCKS SELECTOR
 * Deterministically resolves scheduled blocks for today based on current ISO week and day of week.
 * Resolves against all scheduled blocks so that navigating the Timetable grid does not distort today's list.
 * Sorts chronologically by startMinutes and handles blocks that cross midnight.
 */
export function selectTodayBlocks(
  allScheduledBlocks: ScheduledBlock[],
  refDate: Date = new Date()
): ScheduledBlock[] {
  if (!allScheduledBlocks || allScheduledBlocks.length === 0) return [];

  const currentISOWeek = getISOWeekString(refDate);
  const dayOfWeek = (refDate.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  return allScheduledBlocks
    .filter((b) => b && b.weekId === currentISOWeek && b.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startMinutes - b.startMinutes);
}

/**
 * Detects if a scheduled block spans midnight into the next day (e.g., 23:00 to 01:00).
 */
export function isBlockSpanningMidnight(block: ScheduledBlock): boolean {
  if (!block || typeof block.startMinutes !== 'number' || typeof block.duration !== 'number') {
    return false;
  }
  return block.startMinutes + block.duration > 1440;
}

/**
 * Returns normalized start and end minutes for a block, noting midnight crossover.
 */
export function getBlockInterval(block: ScheduledBlock): {
  startMinutes: number;
  endMinutes: number;
  spansMidnight: boolean;
  minutesNextDay: number;
} {
  const startMinutes = block.startMinutes || 0;
  const duration = block.duration || 0;
  const endMinutesRaw = startMinutes + duration;
  const spansMidnight = endMinutesRaw > 1440;
  return {
    startMinutes,
    endMinutes: spansMidnight ? endMinutesRaw % 1440 : endMinutesRaw,
    spansMidnight,
    minutesNextDay: spansMidnight ? endMinutesRaw - 1440 : 0,
  };
}

/**
 * 2. WEEKLY PLANNED DURATION SELECTOR
 * Aggregates duration across blocks with safe floating-point rounding.
 */
export function selectWeeklyPlannedDuration(blocks: ScheduledBlock[]): {
  totalMinutes: number;
  totalHours: number;
} {
  if (!blocks || blocks.length === 0) {
    return { totalMinutes: 0, totalHours: 0 };
  }

  const totalMinutes = blocks.reduce((acc, b) => acc + (b?.duration || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  return { totalMinutes, totalHours };
}

/**
 * 3. COMPLETED & PENDING BLOCKS SELECTOR
 * Unifies completion rules across Timetable, My Day, Dashboard, and Analytics.
 */
export function selectBlockCounts(blocks: ScheduledBlock[]): BlockCompletionStats {
  if (!blocks || blocks.length === 0) {
    return {
      total: 0,
      completed: 0,
      missed: 0,
      pending: 0,
      inProgress: 0,
      completionRatePct: 0,
      totalPlannedMinutes: 0,
      totalCompletedMinutes: 0,
    };
  }

  let completed = 0;
  let missed = 0;
  let inProgress = 0;
  let pending = 0;
  let totalPlannedMinutes = 0;
  let totalCompletedMinutes = 0;

  for (const b of blocks) {
    if (!b) continue;
    const dur = b.duration || 0;
    totalPlannedMinutes += dur;

    const status = b.status || 'not_started';
    const isCompleted =
      status === 'completed' ||
      status === 'faster' ||
      status === 'took_longer' ||
      (b as any).completed === true;

    if (isCompleted) {
      completed++;
      totalCompletedMinutes += b.actualDuration || dur;
    } else if (status === 'missed' || status === 'skipped') {
      missed++;
    } else if (status === 'in_progress') {
      inProgress++;
    } else {
      pending++;
    }
  }

  const total = blocks.length;
  const completionRatePct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    missed,
    pending,
    inProgress,
    completionRatePct,
    totalPlannedMinutes,
    totalCompletedMinutes,
  };
}

/**
 * 4. CANONICAL GOAL PROGRESS SELECTOR
 * Single source of truth for goal progress across Dashboard, Goals, Reminders, and My Day.
 * Always resolves against the full schedule repository to avoid 1-week truncation discrepancies.
 */
export function selectCanonicalGoalProgress(
  goal: Goal,
  allBlocks: ScheduledBlock[]
): DualGoalMetrics {
  // If goal is already completed or 100%
  if (goal.status === 'completed' || goal.progressPct === 100) {
    const base = calculateGoalMetrics(goal, allBlocks);
    return {
      ...base,
      progressPct: 100,
      planProgressPct: 100,
      remainingHours: 0,
      isOverdue: false,
      naturalProgressSummary: `Goal completed! 🎯 All target milestones achieved.`,
    };
  }

  // Ensure both goal.smart and legacy smartData / smart_data are supported
  const normalizedGoal: Goal = {
    ...goal,
    smart: goal.smart || (goal as any).smartData || (goal as any).smart_data,
  };

  const metrics = calculateGoalMetrics(normalizedGoal, allBlocks);

  // If goal has an explicit progressPct and computed progressPct is 0, respect goal.progressPct
  if (metrics.progressPct === 0 && typeof goal.progressPct === 'number' && goal.progressPct > 0) {
    return {
      ...metrics,
      progressPct: Math.min(100, Math.max(0, goal.progressPct)),
      planProgressPct: Math.min(100, Math.max(0, goal.progressPct)),
    };
  }

  return metrics;
}

/**
 * Aggregates overall goal progress across multiple active goals deterministically.
 */
export function selectAggregateGoalProgress(
  goals: Goal[],
  allBlocks: ScheduledBlock[]
): { avgProgressPct: number; activeGoalsCount: number; completedGoalsCount: number } {
  if (!goals || goals.length === 0) {
    return { avgProgressPct: 0, activeGoalsCount: 0, completedGoalsCount: 0 };
  }

  let totalPct = 0;
  let activeCount = 0;
  let completedCount = 0;

  for (const g of goals) {
    if (!g) continue;
    if (g.status === 'completed' || g.progressPct === 100) {
      completedCount++;
      totalPct += 100;
    } else {
      activeCount++;
      const metrics = selectCanonicalGoalProgress(g, allBlocks);
      totalPct += metrics.progressPct;
    }
  }

  const totalGoals = activeCount + completedCount;
  const avgProgressPct = totalGoals > 0 ? Math.round(totalPct / totalGoals) : 0;

  return { avgProgressPct, activeGoalsCount: activeCount, completedGoalsCount: completedCount };
}

/**
 * 5. CANONICAL EXECUTION SCORE SELECTOR
 * Unified scoring calculation shared identically between Dashboard, Execution, Analytics, and Focus views.
 * Eliminates ad-hoc heuristic formulas and artificial percentage synthesis.
 */
export function selectCanonicalExecutionScore(params: {
  blocks: ScheduledBlock[];
  focusMinutes?: number;
  focusSessionsCount?: number;
  dailyMissionCompleted?: boolean;
}): CanonicalExecutionMetrics {
  const { blocks, focusMinutes = 0, focusSessionsCount = 0 } = params;

  if (!blocks || blocks.length === 0) {
    return {
      overallScore: 0,
      completionPct: 0,
      timeAccuracyPct: 0,
      focusScore: 0,
      consistencyRating: 'No Data',
      totalPlannedMinutes: 0,
      totalCompletedMinutes: 0,
      completedCount: 0,
      totalCount: 0,
    };
  }

  const stats = selectBlockCounts(blocks);
  const completionPct = stats.completionRatePct;

  // Time Accuracy: for completed blocks, how close was actual duration to planned duration?
  let accuracySum = 0;
  let evaluatedCompletedCount = 0;

  for (const b of blocks) {
    const isCompleted =
      b.status === 'completed' ||
      b.status === 'faster' ||
      b.status === 'took_longer' ||
      (b as any).completed === true;

    if (isCompleted && b.duration > 0) {
      evaluatedCompletedCount++;
      const actual = b.actualDuration || b.duration;
      const deviation = Math.abs(actual - b.duration) / b.duration;
      const accuracy = Math.max(0, 1 - deviation);
      accuracySum += accuracy;
    }
  }

  const timeAccuracyPct =
    evaluatedCompletedCount > 0
      ? Math.round((accuracySum / evaluatedCompletedCount) * 100)
      : completionPct > 0
      ? 100
      : 0;

  // Focus score derived from recorded focus sessions / minutes (target 90 mins or 3 sessions/day)
  const sessionFocusScore = Math.min(100, Math.round((focusSessionsCount / 3) * 100));
  const minuteFocusScore = Math.min(100, Math.round((focusMinutes / 90) * 100));
  const focusScore = Math.max(sessionFocusScore, minuteFocusScore);

  // Consolidated Overall Score:
  // 60% completion adherence + 25% duration accuracy + 15% dedicated focus
  const weightedScore = Math.round(
    completionPct * 0.6 + timeAccuracyPct * 0.25 + focusScore * 0.15
  );
  const overallScore = Math.min(100, Math.max(0, weightedScore));

  let consistencyRating: 'Excellent' | 'Good' | 'Fair' | 'Needs Focus' | 'No Data' = 'No Data';
  if (stats.completed > 0) {
    if (overallScore >= 85) consistencyRating = 'Excellent';
    else if (overallScore >= 70) consistencyRating = 'Good';
    else if (overallScore >= 50) consistencyRating = 'Fair';
    else consistencyRating = 'Needs Focus';
  } else if (stats.total > 0) {
    consistencyRating = 'Needs Focus';
  }

  return {
    overallScore,
    completionPct,
    timeAccuracyPct,
    focusScore,
    consistencyRating,
    totalPlannedMinutes: stats.totalPlannedMinutes,
    totalCompletedMinutes: stats.totalCompletedMinutes,
    completedCount: stats.completed,
    totalCount: stats.total,
  };
}

/**
 * 6. FOCUS DURATION SELECTOR
 * Aggregates actual focus session duration with floating-point safety.
 */
export function selectFocusDuration(
  sessions: (FocusSessionLog | ExecutionSession | { durationMinutes?: number; actualMinutes?: number; actualDuration?: number })[]
): FocusDurationStats {
  if (!sessions || sessions.length === 0) {
    return { totalMinutes: 0, totalHours: 0, count: 0, avgDurationMinutes: 0 };
  }

  let totalMinutes = 0;
  let validCount = 0;

  for (const s of sessions) {
    if (!s) continue;
    validCount++;
    const mins =
      (s as any).actualMinutes ||
      (s as any).actualDuration ||
      (s as any).durationMinutes ||
      (s as any).plannedMinutes ||
      0;
    totalMinutes += mins;
  }

  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const avgDurationMinutes = validCount > 0 ? Math.round(totalMinutes / validCount) : 0;

  return {
    totalMinutes,
    totalHours,
    count: validCount,
    avgDurationMinutes,
  };
}

/**
 * 7. DAILY GOAL STATS SELECTOR
 * Canonical selector for daily goals across My Day, Dashboard, Analytics, and Execution Intelligence.
 * Returns honest numbers with no invented defaults ("-" if no goals exist).
 */
export function selectDayGoalStats(params: {
  dateStr: string;
  goals: DailyGoal[];
  scheduledBlocks?: ScheduledBlock[];
}): DayGoalStats {
  const { dateStr, goals, scheduledBlocks = [] } = params;
  const dayGoals = (goals || []).filter((g) => g && g.date === dateStr);

  const totalCount = dayGoals.length;
  const completedCount = dayGoals.filter((g) => g.status === 'done').length;
  const partialCount = dayGoals.filter((g) => g.status === 'partial').length;
  const skippedCount = dayGoals.filter((g) => g.status === 'skipped').length;
  const carriedCount = dayGoals.filter((g) => g.status === 'carried').length;
  const plannedCount = dayGoals.filter((g) => g.status === 'planned' || g.status === 'in_progress').length;

  const mustDoGoals = dayGoals.filter((g) => g.isMustDo);
  const mustDoCount = mustDoGoals.length;
  const mustDoCompletedCount = mustDoGoals.filter((g) => g.status === 'done').length;

  const scoreResult = computeDayScore(dayGoals);
  const budgetResult = checkTimeBudget({
    goals: dayGoals,
    scheduledBlocks,
    dateStr,
  });

  return {
    totalCount,
    completedCount,
    partialCount,
    skippedCount,
    carriedCount,
    plannedCount,
    mustDoCount,
    mustDoCompletedCount,
    earnedPoints: scoreResult.earnedPoints,
    maxPoints: scoreResult.maxPoints,
    scorePct: scoreResult.scorePct,
    formattedScore: scoreResult.formattedScore,
    plannedMinutes: budgetResult.plannedMinutes,
    freeMinutes: budgetResult.freeMinutes,
    isOverloaded: budgetResult.isOverloaded,
  };
}
