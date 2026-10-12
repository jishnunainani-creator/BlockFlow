import { ScheduledBlock, Goal } from '../types/timetable';
import { ExecutionSession } from '../types/sessionLog';
import { FocusSessionLog } from './focusStorage';
import { TaskInboxItem, Assignment } from '../types/executionOS';
import { getWeekDaysWithDates, getWeekDateRangeLabel, getAdjacentWeekId, getISOWeekString } from './timeUtils';

export interface WeeklyMetricsSummary {
  weekId: string;
  startDate: string;
  endDate: string;
  dateRangeLabel: string;
  // Execution & Tasks
  totalCompletedTasks: number;
  totalIncompleteTasks: number;
  totalOverdueTasks: number;
  taskCompletionRatePct: number;
  // Focus Tracking
  totalFocusSessionsCount: number;
  totalFocusMinutes: number;
  avgFocusSessionDurationMinutes: number;
  // Planned vs Actual
  totalPlannedBlockMinutes: number;
  totalActualRecordedMinutes: number;
  timeAdherencePct: number;
  // Blocks breakdown
  completedBlocksCount: number;
  missedBlocksCount: number;
  totalScheduledBlocksCount: number;
}

export interface UnresolvedWeeklyItem {
  id: string;
  title: string;
  type: 'overdue_task' | 'missed_block' | 'pending_task';
  dateOrDeadline?: string;
  sourceId: string;
  durationMinutes?: number;
}

export interface WeeklyReviewData {
  metrics: WeeklyMetricsSummary;
  goals: {
    id: string;
    title: string;
    category?: string;
    progress: number;
    target: number;
    unit?: string;
  }[];
  upcomingAssignments: {
    id: string;
    title: string;
    course?: string;
    dueDate: string;
    status: string;
    daysRemaining: number;
  }[];
  unresolvedItems: UnresolvedWeeklyItem[];
}

export interface CalculateWeeklyReviewParams {
  weekId: string;
  scheduledBlocks: ScheduledBlock[];
  executionSessions: ExecutionSession[];
  focusHistory: FocusSessionLog[];
  tasks: TaskInboxItem[];
  assignments: Assignment[];
  goals: Goal[];
  refDate?: Date;
}

/**
 * Deterministically computes weekly review analytics and metrics
 * without fabricating placeholder sessions or fake adherence figures.
 */
export function calculateWeeklyReviewData(params: CalculateWeeklyReviewParams): WeeklyReviewData {
  const {
    weekId,
    scheduledBlocks,
    executionSessions,
    focusHistory,
    tasks,
    assignments,
    goals,
    refDate = new Date(),
  } = params;

  const days = getWeekDaysWithDates(weekId);
  const startDate = days.length > 0 ? days[0].dateFormatted : '';
  const startYMD = days.length > 0 ? `${days[0].index === 0 ? '' : ''}` : '';

  const mondayYMD = days[0]
    ? `${days[0].isToday ? '' : ''}${new Date(days[0].dateFormatted).getFullYear() || refDate.getFullYear()}-${days[0].monthShort}-${days[0].dateNum}`
    : '';

  // Get exact start and end YYYY-MM-DD
  const parts = weekId.split('-W');
  const year = parseInt(parts[0], 10) || refDate.getFullYear();
  const weekNum = parseInt(parts[1], 10) || 1;

  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7;
  const mondayOfWeek1 = new Date(year, 0, 4 - dayOfWeek);
  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setDate(mondayOfWeek1.getDate() + (weekNum - 1) * 7);

  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);

  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const startYMDString = toYMD(targetMonday);
  const endYMDString = toYMD(targetSunday);
  const dateRangeLabel = getWeekDateRangeLabel(weekId);

  // 1. Scheduled blocks for this week
  const weekBlocks = scheduledBlocks.filter((b) => b && b.weekId === weekId);
  const totalPlannedBlockMinutes = weekBlocks.reduce((acc, b) => acc + (b.duration || 0), 0);
  const completedBlocks = weekBlocks.filter(
    (b) => b.status === 'completed' || b.status === 'faster' || b.status === 'took_longer'
  );
  const missedBlocks = weekBlocks.filter((b) => b.status === 'missed' || b.status === 'skipped');

  // 2. Focus and Execution Sessions within this week's date bounds
  const sessionsInWeek = executionSessions.filter(
    (s) => s.date >= startYMDString && s.date <= endYMDString && s.status !== 'cancelled'
  );

  const focusLogsInWeek = focusHistory.filter((log) => {
    if (!log.startedAt) return false;
    const logYMD = toYMD(new Date(log.startedAt));
    return logYMD >= startYMDString && logYMD <= endYMDString && log.status !== 'cancelled';
  });

  // Calculate actual focus minutes
  // Prefer executionSessions, fallback to focusLogs if none
  let totalFocusMinutes = 0;
  let totalFocusSessionsCount = 0;

  if (sessionsInWeek.length > 0) {
    totalFocusSessionsCount = sessionsInWeek.length;
    totalFocusMinutes = sessionsInWeek.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
  } else {
    totalFocusSessionsCount = focusLogsInWeek.length;
    totalFocusMinutes = focusLogsInWeek.reduce((acc, l) => acc + (l.actualMinutes || 0), 0);
  }

  const avgFocusSessionDurationMinutes =
    totalFocusSessionsCount > 0 ? Math.round(totalFocusMinutes / totalFocusSessionsCount) : 0;

  // Actual recorded minutes: combine recorded focus time and any completed blocks
  const completedBlockMinutes = completedBlocks.reduce(
    (acc, b) => acc + (b.actualDuration || b.duration || 0),
    0
  );
  const totalActualRecordedMinutes = Math.max(totalFocusMinutes, completedBlockMinutes);

  // Planned vs actual adherence calculation: strictly zero if no planned minutes
  const timeAdherencePct =
    totalPlannedBlockMinutes > 0
      ? Math.min(100, Math.round((totalActualRecordedMinutes / totalPlannedBlockMinutes) * 100))
      : 0;

  // 3. Tasks Metrics for this week
  // Completed tasks: completed tasks with completedAt or deadline in this week
  const completedTasks = tasks.filter((t) => {
    if (t.status !== 'completed') return false;
    if (t.completedAt) {
      const compYMD = toYMD(new Date(t.completedAt));
      return compYMD >= startYMDString && compYMD <= endYMDString;
    }
    return t.deadline ? t.deadline >= startYMDString && t.deadline <= endYMDString : true;
  });

  // Incomplete tasks relevant to this week (deadline <= endYMDString or backlog)
  const incompleteTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'archived' &&
      t.deadline &&
      t.deadline <= endYMDString
  );

  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'archived' &&
      t.deadline &&
      t.deadline < startYMDString
  );

  const totalRelevantTasks = completedTasks.length + incompleteTasks.length;
  const taskCompletionRatePct =
    totalRelevantTasks > 0 ? Math.round((completedTasks.length / totalRelevantTasks) * 100) : 0;

  // 4. SMART Goals Summary
  const goalsSummary = goals.map((g) => ({
    id: g.id,
    title: g.title,
    category: g.category,
    progress: g.progressPct ?? 0,
    target: 100,
    unit: '%',
  }));

  // 5. Approaching Assignment Deadlines
  const nowMs = refDate.getTime();
  const upcomingAssignments = assignments
    .filter((a) => a.status !== 'submitted' && a.status !== 'graded')
    .map((a) => {
      const dueMs = new Date(a.dueDate).getTime();
      const daysRemaining = Math.ceil((dueMs - nowMs) / (1000 * 60 * 60 * 24));
      return {
        id: a.id,
        title: a.title,
        course: a.subject || 'Course',
        dueDate: a.dueDate,
        status: a.status,
        daysRemaining,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // 6. Unresolved Items for Next-Week Transition
  const unresolvedItems: UnresolvedWeeklyItem[] = [];

  overdueTasks.forEach((t) => {
    unresolvedItems.push({
      id: `unres-task-${t.id}`,
      title: t.title,
      type: 'overdue_task',
      dateOrDeadline: t.deadline,
      sourceId: t.id,
      durationMinutes: t.estimatedDuration ?? t.estimatedMinutes,
    });
  });

  incompleteTasks
    .filter((t) => !overdueTasks.some((ot) => ot.id === t.id))
    .forEach((t) => {
      unresolvedItems.push({
        id: `unres-task-${t.id}`,
        title: t.title,
        type: 'pending_task',
        dateOrDeadline: t.deadline,
        sourceId: t.id,
        durationMinutes: t.estimatedDuration ?? t.estimatedMinutes,
      });
    });

  missedBlocks.forEach((b) => {
    unresolvedItems.push({
      id: `unres-block-${b.id}`,
      title: b.title,
      type: 'missed_block',
      dateOrDeadline: `${b.weekId}-Day${b.dayOfWeek}`,
      sourceId: b.id,
      durationMinutes: b.duration,
    });
  });

  return {
    metrics: {
      weekId,
      startDate: startYMDString,
      endDate: endYMDString,
      dateRangeLabel,
      totalCompletedTasks: completedTasks.length,
      totalIncompleteTasks: incompleteTasks.length,
      totalOverdueTasks: overdueTasks.length,
      taskCompletionRatePct,
      totalFocusSessionsCount,
      totalFocusMinutes,
      avgFocusSessionDurationMinutes,
      totalPlannedBlockMinutes,
      totalActualRecordedMinutes,
      timeAdherencePct,
      completedBlocksCount: completedBlocks.length,
      missedBlocksCount: missedBlocks.length,
      totalScheduledBlocksCount: weekBlocks.length,
    },
    goals: goalsSummary,
    upcomingAssignments,
    unresolvedItems,
  };
}
