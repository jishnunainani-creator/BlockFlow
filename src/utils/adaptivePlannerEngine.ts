import { ScheduledBlock, Priority } from '../types/timetable';
import { TaskInboxItem, Assignment, PersonalRule } from '../types/executionOS';
import { ExecutionSession } from '../types/sessionLog';
import {
  PlanningIssue,
  PlanningIssueType,
  PlanningIssueSeverity,
  CandidateSlot,
  ProposedPlanItem,
  ProposalType,
  ScheduleConstraintConfig,
} from '../types/adaptivePlanner';
import {
  DAYS_OF_WEEK,
  getISOWeekString,
  minutesToTimeStr,
  timeStrToMinutes,
} from './timeUtils';

export const DEFAULT_CONSTRAINT_CONFIG: ScheduleConstraintConfig = {
  availabilityStartMinutes: 420, // 07:00 AM
  availabilityEndMinutes: 1320, // 10:00 PM
  minBreakBetweenBlocksMinutes: 15,
  maxDailyPlannedHours: 8,
  horizonDays: 7,
  preferredWindow: 'morning',
};

// ═════════════════════════════════════════════════════════════════════
// 1. DATE & TIME HELPER UTILITIES
// ═════════════════════════════════════════════════════════════════════

export function parseDateToMidnight(dateStr: string): number {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  const d = new Date();
  d.setFullYear(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getCurrentDayOfWeekIndex(date: Date = new Date()): number {
  // Convert JS Sunday=0..Saturday=6 to BlockFlow Monday=0..Sunday=6
  return (date.getDay() + 6) % 7;
}

export function getDaysDifference(targetDateStr: string, referenceDate: Date = new Date()): number {
  try {
    const target = new Date(targetDateStr).getTime();
    const now = referenceDate.getTime();
    return (target - now) / (1000 * 60 * 60 * 24);
  } catch {
    return 999;
  }
}

export function getHoursDifference(targetDateStr: string, referenceDate: Date = new Date()): number {
  try {
    const target = new Date(targetDateStr).getTime();
    const now = referenceDate.getTime();
    return (target - now) / (1000 * 60 * 60);
  } catch {
    return 9999;
  }
}

// ═════════════════════════════════════════════════════════════════════
// 2. DETECT ACTIONABLE PLANNING ISSUES
// ═════════════════════════════════════════════════════════════════════

export interface DetectIssuesParams {
  tasks: TaskInboxItem[];
  assignments?: Assignment[];
  scheduledBlocks: ScheduledBlock[];
  currentWeekId?: string;
  personalRules?: PersonalRule[];
  executionSessions?: ExecutionSession[];
  referenceDate?: Date;
  config?: Partial<ScheduleConstraintConfig>;
}

export function detectPlanningIssues(params: DetectIssuesParams): PlanningIssue[] {
  const {
    tasks = [],
    assignments = [],
    scheduledBlocks = [],
    currentWeekId = getISOWeekString(),
    personalRules = [],
    executionSessions = [],
    referenceDate = new Date(),
    config: userConfig,
  } = params;

  const cfg: ScheduleConstraintConfig = { ...DEFAULT_CONSTRAINT_CONFIG, ...userConfig };
  const issues: PlanningIssue[] = [];

  const nowMs = referenceDate.getTime();
  const currentDayOfWeek = getCurrentDayOfWeekIndex(referenceDate);
  const currentMins = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  // ── A. Overdue Tasks with Known Deadline ──────────────────────
  tasks.forEach((task) => {
    if (task.status === 'completed' || task.status === 'archived') return;
    if (!task.deadline) return;

    const diffHours = getHoursDifference(task.deadline, referenceDate);
    if (diffHours < 0) {
      const daysOverdue = Math.abs(Math.floor(diffHours / 24));
      issues.push({
        id: `issue-overdue-${task.id}`,
        type: 'overdue_task',
        severity: 'critical',
        title: `Overdue Task: "${task.title}"`,
        whatHappened: `The deadline passed ${daysOverdue > 0 ? `${daysOverdue} day(s) ago` : 'earlier today'} on ${new Date(task.deadline).toLocaleDateString()}, but the task remains incomplete.`,
        whyItMatters: `Unresolved overdue commitments create cognitive debt and risk cascading delays on downstream coursework or sprint goals.`,
        recommendedAction: `Schedule an immediate catch-up session in the next available free time slot.`,
        target: {
          entityType: 'task',
          entityId: task.id,
          title: task.title,
          deadline: task.deadline,
          duration: task.estimatedDuration || 60,
          priority: task.priority,
        },
        createdAt: Date.now(),
      });
    }
  });

  // Also inspect Assignments for overdue state
  assignments.forEach((assignment) => {
    if (assignment.status === 'submitted' || assignment.status === 'graded') return;
    if (!assignment.dueDate) return;

    const diffHours = getHoursDifference(assignment.dueDate, referenceDate);
    if (diffHours < 0) {
      issues.push({
        id: `issue-overdue-assignment-${assignment.id}`,
        type: 'overdue_task',
        severity: 'critical',
        title: `Overdue Assignment: "${assignment.title}"`,
        whatHappened: `Assignment due date was ${new Date(assignment.dueDate).toLocaleDateString()}, but progress is currently at ${assignment.progressPct}%.`,
        whyItMatters: `Late submissions negatively impact academic evaluations and create immediate scheduling bottlenecks.`,
        recommendedAction: `Allocate emergency focus blocks today to finalize and submit.`,
        target: {
          entityType: 'assignment',
          entityId: assignment.id,
          title: assignment.title,
          deadline: assignment.dueDate,
          duration: (assignment.estimatedHours || 1) * 60,
          priority: assignment.priority,
        },
        createdAt: Date.now(),
      });
    }
  });

  // ── B. Impending Deadlines (Approaching in ≤ 72 Hours) ────────
  tasks.forEach((task) => {
    if (task.status === 'completed' || task.status === 'archived') return;
    if (!task.deadline) return;

    const diffHours = getHoursDifference(task.deadline, referenceDate);
    if (diffHours > 0 && diffHours <= 72) {
      const isScheduled = !!task.scheduledBlockId || task.status === 'scheduled';
      const hoursLeft = Math.round(diffHours);
      issues.push({
        id: `issue-deadline-${task.id}`,
        type: 'impending_deadline',
        severity: diffHours <= 24 ? 'critical' : 'high',
        title: `Impending Deadline: "${task.title}"`,
        whatHappened: `Due in ${hoursLeft} hours (${new Date(task.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}). ${isScheduled ? 'Currently scheduled, but deadline is imminent.' : 'Has not yet been scheduled into your timetable.'}`,
        whyItMatters: `Leaving high-priority deadlines unscheduled increases rush stress and lowers output quality.`,
        recommendedAction: isScheduled
          ? `Verify you have enough uninterrupted time to finish before the cutoff.`
          : `Secure a dedicated calendar block before the deadline passes.`,
        target: {
          entityType: 'task',
          entityId: task.id,
          title: task.title,
          deadline: task.deadline,
          duration: task.estimatedDuration || 60,
          priority: task.priority,
        },
        createdAt: Date.now(),
      });
    }
  });

  // ── C. Timetable Schedule Conflicts ───────────────────────────
  // Group scheduled blocks by day and week
  const blocksByWeekAndDay: Record<string, ScheduledBlock[]> = {};
  scheduledBlocks.forEach((block) => {
    const key = `${block.weekId || currentWeekId}_${block.dayOfWeek}`;
    if (!blocksByWeekAndDay[key]) blocksByWeekAndDay[key] = [];
    blocksByWeekAndDay[key].push(block);
  });

  const reportedConflictPairs = new Set<string>();

  Object.entries(blocksByWeekAndDay).forEach(([key, dayBlocks]) => {
    const [, dayStr] = key.split('_');
    const dayOfWeek = parseInt(dayStr, 10);

    for (let i = 0; i < dayBlocks.length; i++) {
      for (let j = i + 1; j < dayBlocks.length; j++) {
        const a = dayBlocks[i];
        const b = dayBlocks[j];

        const aStart = a.startMinutes;
        const aEnd = a.startMinutes + a.duration;
        const bStart = b.startMinutes;
        const bEnd = b.startMinutes + b.duration;

        // Interval overlap: max(aStart, bStart) < min(aEnd, bEnd)
        if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
          const pairKey = [a.id, b.id].sort().join('::');
          if (reportedConflictPairs.has(pairKey)) continue;
          reportedConflictPairs.add(pairKey);

          const dayName = DAYS_OF_WEEK[dayOfWeek]?.full || `Day ${dayOfWeek + 1}`;
          const overlapMinutes = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);

          // Identify if one is fixed and the other flexible
          const isAFixed = !!a.isFixed;
          const isBFixed = !!b.isFixed;

          issues.push({
            id: `issue-conflict-${a.id}-${b.id}`,
            type: 'schedule_conflict',
            severity: isAFixed && isBFixed ? 'critical' : 'high',
            title: `Schedule Conflict: "${a.title}" vs "${b.title}"`,
            whatHappened: `Both activities overlap on ${dayName} by ${overlapMinutes} minutes (${minutesToTimeStr(Math.max(aStart, bStart))} – ${minutesToTimeStr(Math.min(aEnd, bEnd))}).`,
            whyItMatters: `You cannot be in two places at once. Double-booked slots cause missed attendance or compromised focus.`,
            recommendedAction: isAFixed && !isBFixed
              ? `Move flexible activity "${b.title}" to a free slot without touching fixed block "${a.title}".`
              : !isAFixed && isBFixed
                ? `Move flexible activity "${a.title}" to a free slot without touching fixed block "${b.title}".`
                : `Reschedule one of the conflicting blocks to the nearest available opening.`,
            target: {
              entityType: 'block',
              entityId: !isAFixed ? a.id : b.id,
              title: !isAFixed ? a.title : b.title,
              dayOfWeek,
              startMinutes: !isAFixed ? a.startMinutes : b.startMinutes,
              duration: !isAFixed ? a.duration : b.duration,
              weekId: a.weekId || currentWeekId,
              conflictingBlockIds: [a.id, b.id],
            },
            createdAt: Date.now(),
          });
        }
      }
    }
  });

  // ── D. Missed or Unfinished Planned Sessions ──────────────────
  scheduledBlocks.forEach((block) => {
    // Only current week or past weeks
    const isCurrentWeek = (block.weekId || currentWeekId) === currentWeekId;
    if (!isCurrentWeek) return;

    // Check if status is explicitly marked 'missed'
    if (block.status === 'missed') {
      issues.push({
        id: `issue-missed-${block.id}`,
        type: 'missed_session',
        severity: 'medium',
        title: `Missed Planned Session: "${block.title}"`,
        whatHappened: `This scheduled session on ${DAYS_OF_WEEK[block.dayOfWeek]?.full || 'your calendar'} was marked as missed.`,
        whyItMatters: `Dropping planned work without rescheduling leads to accumulated backlog and disrupted learning streaks.`,
        recommendedAction: `Find an open recovery slot to complete this session without disrupting other commitments.`,
        target: {
          entityType: 'block',
          entityId: block.id,
          title: block.title,
          dayOfWeek: block.dayOfWeek,
          startMinutes: block.startMinutes,
          duration: block.duration,
          weekId: block.weekId || currentWeekId,
        },
        createdAt: Date.now(),
      });
      return;
    }

    // Check reliable execution data: if block is in the past for today/earlier days and has no session completion
    const isPastDay = block.dayOfWeek < currentDayOfWeek;
    const isPastTodayTime = block.dayOfWeek === currentDayOfWeek && block.startMinutes + block.duration < currentMins;

    if (isPastDay || isPastTodayTime) {
      // Look up recorded execution sessions
      const session = executionSessions.find(
        (s) => s.scheduledBlockId === block.id || (s.plannedTitle === block.title && s.plannedStartMinutes === block.startMinutes)
      );

      const isRecordedComplete = session?.status === 'completed' || block.status === 'completed';
      const isRecordedSkipped = session?.status === 'skipped' || session?.status === 'cancelled' || block.status === 'skipped' || block.status === 'cancelled';

      if (!isRecordedComplete && (isRecordedSkipped || block.status === 'not_started' || block.status === 'scheduled')) {
        // Only report if unverified/missed
        issues.push({
          id: `issue-unfinished-${block.id}`,
          type: 'missed_session',
          severity: 'medium',
          title: `Unfinished Session: "${block.title}"`,
          whatHappened: `Scheduled for ${DAYS_OF_WEEK[block.dayOfWeek]?.full} at ${minutesToTimeStr(block.startMinutes)}, but no completion was recorded.`,
          whyItMatters: `Unrecorded sessions leave progress uncertain and may mask unfinished syllabus topics.`,
          recommendedAction: `Confirm whether you completed this session or reschedule it to an upcoming free slot.`,
          target: {
            entityType: 'block',
            entityId: block.id,
            title: block.title,
            dayOfWeek: block.dayOfWeek,
            startMinutes: block.startMinutes,
            duration: block.duration,
            weekId: block.weekId || currentWeekId,
          },
          createdAt: Date.now(),
        });
      }
    }
  });

  // ── E. Unfittable Tasks (Insufficient Capacity Before Deadline)
  tasks.forEach((task) => {
    if (task.status === 'completed' || task.status === 'archived') return;
    if (!task.deadline || !task.estimatedDuration) return;

    const diffHours = getHoursDifference(task.deadline, referenceDate);
    if (diffHours <= 0 || diffHours > 168) return; // Only test within 7-day horizon

    const remainingAvailableMins = calculateAvailableFreeMinutesBeforeDeadline(
      task.deadline,
      scheduledBlocks,
      referenceDate,
      cfg
    );

    if (task.estimatedDuration > remainingAvailableMins) {
      issues.push({
        id: `issue-unfittable-${task.id}`,
        type: 'unfittable_task',
        severity: 'critical',
        title: `Capacity Deficit: "${task.title}"`,
        whatHappened: `Requires ${task.estimatedDuration}m of focus, but only ${remainingAvailableMins}m of free time remains before the deadline on ${new Date(task.deadline).toLocaleDateString()}.`,
        whyItMatters: `Even if you utilize every available minute, this task cannot be completed without schedule adjustments or scope reduction.`,
        recommendedAction: `Shorten the session duration, split into smaller milestones, or adjust the deadline manually.`,
        target: {
          entityType: 'task',
          entityId: task.id,
          title: task.title,
          deadline: task.deadline,
          duration: task.estimatedDuration,
          priority: task.priority,
        },
        createdAt: Date.now(),
      });
    }
  });

  // ── F. Overloaded Days (Exceeds Max Daily Hours) ──────────────
  const dailyDurationMinutes: Record<number, number> = {};
  for (let i = 0; i < 7; i++) dailyDurationMinutes[i] = 0;

  scheduledBlocks.forEach((b) => {
    if ((b.weekId || currentWeekId) === currentWeekId && b.dayOfWeek >= 0 && b.dayOfWeek < 7) {
      dailyDurationMinutes[b.dayOfWeek] += b.duration || 60;
    }
  });

  // Find max daily hours rule if configured
  const maxHoursRule = personalRules.find(
    (r) => r.isActive && r.ruleType === 'max_daily_hours' && r.hoursValue
  );
  const maxAllowedHours = maxHoursRule?.hoursValue || cfg.maxDailyPlannedHours;
  const maxAllowedMins = maxAllowedHours * 60;

  Object.entries(dailyDurationMinutes).forEach(([dayStr, totalMins]) => {
    const day = parseInt(dayStr, 10);
    if (totalMins > maxAllowedMins) {
      const plannedHours = (totalMins / 60).toFixed(1);
      const dayName = DAYS_OF_WEEK[day]?.full || `Day ${day + 1}`;

      issues.push({
        id: `issue-overloaded-day-${day}`,
        type: 'overloaded_day',
        severity: totalMins > maxAllowedMins + 120 ? 'high' : 'medium',
        title: `Overloaded Day: ${dayName} (${plannedHours}h planned)`,
        whatHappened: `${dayName} contains ${plannedHours} hours of planned activities, exceeding the recommended limit of ${maxAllowedHours} hours.`,
        whyItMatters: `High daily load increases fatigue, elevates distraction risk, and causes schedule abandonment.`,
        recommendedAction: `Redistribute flexible tasks to days with lighter schedules.`,
        target: {
          entityType: 'day',
          entityId: `day-${day}`,
          title: dayName,
          dayOfWeek: day,
          duration: totalMins,
        },
        createdAt: Date.now(),
      });
    }
  });

  // Sort issues by severity
  const severityOrder: Record<PlanningIssueSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// ═════════════════════════════════════════════════════════════════════
// 3. DETERMINISTIC FREE INTERVAL & CAPACITY FINDER
// ═════════════════════════════════════════════════════════════════════

export interface FreeInterval {
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
}

/**
 * Finds all vacant, contiguous intervals on a specific day between availability bounds.
 */
export function findFreeIntervalsOnDay(
  dayOfWeek: number,
  scheduledBlocks: ScheduledBlock[],
  config: ScheduleConstraintConfig,
  minDuration: number = 15,
  excludeBlockId?: string
): FreeInterval[] {
  // Filter blocks for this day
  const dayBlocks = scheduledBlocks
    .filter((b) => b.dayOfWeek === dayOfWeek && b.id !== excludeBlockId)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const startBound = config.availabilityStartMinutes;
  const endBound = config.availabilityEndMinutes;
  const buffer = config.minBreakBetweenBlocksMinutes;

  const intervals: FreeInterval[] = [];
  let currentPointer = startBound;

  for (const block of dayBlocks) {
    const blockStart = block.startMinutes;
    const blockEnd = block.startMinutes + block.duration;

    // If block starts after pointer, check gap
    if (blockStart > currentPointer) {
      // Reserve buffer if block starts before end of day
      const gapEnd = Math.max(currentPointer, blockStart - buffer);
      if (gapEnd - currentPointer >= minDuration) {
        intervals.push({
          startMinutes: currentPointer,
          endMinutes: gapEnd,
          durationMinutes: gapEnd - currentPointer,
        });
      }
    }

    // Advance pointer to end of this block + buffer
    currentPointer = Math.max(currentPointer, blockEnd + buffer);
  }

  // Check remaining gap until end of availability
  if (currentPointer < endBound && endBound - currentPointer >= minDuration) {
    intervals.push({
      startMinutes: currentPointer,
      endMinutes: endBound,
      durationMinutes: endBound - currentPointer,
    });
  }

  return intervals;
}

/**
 * Calculates remaining available free minutes across days before a target deadline.
 */
export function calculateAvailableFreeMinutesBeforeDeadline(
  deadlineStr: string,
  scheduledBlocks: ScheduledBlock[],
  referenceDate: Date = new Date(),
  config: ScheduleConstraintConfig
): number {
  const currentDayOfWeek = getCurrentDayOfWeekIndex(referenceDate);
  const currentMins = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  let targetDate: Date;
  try {
    targetDate = new Date(deadlineStr);
  } catch {
    return 9999;
  }

  const deadlineDayOfWeek = getCurrentDayOfWeekIndex(targetDate);
  const deadlineMins = targetDate.getHours() * 60 + targetDate.getMinutes();

  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();
  const targetMidnight = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  ).getTime();
  const calendarDaysDiff = Math.max(
    0,
    Math.round((targetMidnight - refMidnight) / (1000 * 60 * 60 * 24))
  );

  let totalFreeMinutes = 0;

  for (let offset = 0; offset <= Math.min(calendarDaysDiff, 7); offset++) {
    const day = (currentDayOfWeek + offset) % 7;
    const isToday = offset === 0;
    const isDeadlineDay = offset === calendarDaysDiff;

    let dayConfig = { ...config };

    if (isToday) {
      // Don't search times in past
      dayConfig.availabilityStartMinutes = Math.max(dayConfig.availabilityStartMinutes, currentMins);
    }
    if (isDeadlineDay && deadlineMins > 0) {
      // Don't search past deadline cutoff on target day
      dayConfig.availabilityEndMinutes = Math.min(dayConfig.availabilityEndMinutes, deadlineMins);
    }

    if (dayConfig.availabilityStartMinutes >= dayConfig.availabilityEndMinutes) continue;

    const freeIntervals = findFreeIntervalsOnDay(day, scheduledBlocks, dayConfig, 15);
    freeIntervals.forEach((interval) => {
      totalFreeMinutes += interval.durationMinutes;
    });
  }

  return totalFreeMinutes;
}

// ═════════════════════════════════════════════════════════════════════
// 4. FIND & RANK FEASIBLE CANDIDATE SLOTS
// ═════════════════════════════════════════════════════════════════════

export interface FindCandidateSlotsParams {
  durationMinutes: number;
  deadline?: string;
  priority?: Priority;
  scheduledBlocks: ScheduledBlock[];
  personalRules?: PersonalRule[];
  excludeBlockId?: string;
  referenceDate?: Date;
  currentWeekId?: string;
  maxCandidates?: number;
  config?: Partial<ScheduleConstraintConfig>;
}

export function findFeasibleCandidateSlots(params: FindCandidateSlotsParams): CandidateSlot[] {
  const {
    durationMinutes,
    deadline,
    priority = 'medium',
    scheduledBlocks = [],
    personalRules = [],
    excludeBlockId,
    referenceDate = new Date(),
    currentWeekId = getISOWeekString(),
    maxCandidates = 3,
    config: userConfig,
  } = params;

  const cfg: ScheduleConstraintConfig = { ...DEFAULT_CONSTRAINT_CONFIG, ...userConfig };

  if (durationMinutes <= 0) return [];

  const currentDayOfWeek = getCurrentDayOfWeekIndex(referenceDate);
  const currentMins = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  let maxAllowedDayOffset = cfg.horizonDays - 1;
  let deadlineDate: Date | null = null;
  let deadlineHoursRemaining = 9999;

  if (deadline) {
    try {
      deadlineDate = new Date(deadline);
      deadlineHoursRemaining = getHoursDifference(deadline, referenceDate);
      if (deadlineHoursRemaining > 0) {
        const deadlineDayDiff = Math.floor(deadlineHoursRemaining / 24);
        maxAllowedDayOffset = Math.min(maxAllowedDayOffset, deadlineDayDiff);
      }
    } catch {
      // fallback to horizon
    }
  }

  const rawCandidates: CandidateSlot[] = [];

  // Enforce personal rules on availability bounds (e.g. strict no work after 10 PM)
  const noWorkAfterRule = personalRules.find(
    (r) => r.isActive && r.ruleType === 'no_work_after_time' && r.priority === 'strict' && r.timeValue
  );
  if (noWorkAfterRule?.timeValue) {
    cfg.availabilityEndMinutes = Math.min(cfg.availabilityEndMinutes, noWorkAfterRule.timeValue);
  }

  const noWorkBeforeRule = personalRules.find(
    (r) => r.isActive && r.ruleType === 'no_work_before_time' && r.priority === 'strict' && r.timeValue
  );
  if (noWorkBeforeRule?.timeValue) {
    cfg.availabilityStartMinutes = Math.max(cfg.availabilityStartMinutes, noWorkBeforeRule.timeValue);
  }

  // Search day by day
  for (let offset = 0; offset <= Math.max(0, maxAllowedDayOffset); offset++) {
    const day = (currentDayOfWeek + offset) % 7;
    const isToday = offset === 0;

    let dayStartBound = cfg.availabilityStartMinutes;
    let dayEndBound = cfg.availabilityEndMinutes;

    if (isToday) {
      // Add 15 mins buffer to now
      dayStartBound = Math.max(dayStartBound, currentMins + 15);
    }

    // If day is deadline day, never schedule past deadline time
    if (deadlineDate && offset === Math.floor(deadlineHoursRemaining / 24)) {
      const deadlineMins = deadlineDate.getHours() * 60 + deadlineDate.getMinutes();
      if (deadlineMins > 0) {
        dayEndBound = Math.min(dayEndBound, deadlineMins);
      }
    }

    if (dayStartBound + durationMinutes > dayEndBound) continue;

    const dayConfig: ScheduleConstraintConfig = {
      ...cfg,
      availabilityStartMinutes: dayStartBound,
      availabilityEndMinutes: dayEndBound,
    };

    const freeIntervals = findFreeIntervalsOnDay(
      day,
      scheduledBlocks,
      dayConfig,
      durationMinutes,
      excludeBlockId
    );

    // Calculate existing planned workload for this day
    const dayExistingMins = scheduledBlocks
      .filter((b) => b.dayOfWeek === day && b.id !== excludeBlockId)
      .reduce((sum, b) => sum + (b.duration || 60), 0);

    let dateLabel = 'Today';
    if (offset === 1) dateLabel = 'Tomorrow';
    else if (offset > 1) {
      const dayName = DAYS_OF_WEEK[day]?.full || `Day ${day + 1}`;
      dateLabel = offset <= 6 ? dayName : `Next ${dayName}`;
    }

    for (const interval of freeIntervals) {
      // Propose slot aligning to standard 15-minute or 30-minute boundaries
      const startCandidate = Math.ceil(interval.startMinutes / 15) * 15;
      const endCandidate = startCandidate + durationMinutes;

      if (endCandidate <= interval.endMinutes) {
        // Evaluate ranking score & explainable criteria
        const { score, reasons, tradeOffs } = scoreCandidateSlot({
          startMinutes: startCandidate,
          duration: durationMinutes,
          dayOfWeek: day,
          offsetDays: offset,
          dayExistingMinutes: dayExistingMins,
          deadlineHoursRemaining,
          preferredWindow: cfg.preferredWindow,
        });

        rawCandidates.push({
          dateLabel,
          dayOfWeek: day,
          weekId: currentWeekId,
          startMinutes: startCandidate,
          endMinutes: endCandidate,
          duration: durationMinutes,
          rankingScore: score,
          rankingReasons: reasons,
          tradeOffs,
          isRecommended: false,
        });

        // Limit to 2 per day to ensure diversity across days
        const countThisDay = rawCandidates.filter((c) => c.dayOfWeek === day).length;
        if (countThisDay >= 2) break;
      }
    }
  }

  // Sort by rankingScore descending
  rawCandidates.sort((a, b) => b.rankingScore - a.rankingScore);

  const selected = rawCandidates.slice(0, maxCandidates);
  if (selected.length > 0) {
    selected[0].isRecommended = true;
  }

  return selected;
}

/**
 * Deterministic scoring function for ranking candidate slots.
 */
function scoreCandidateSlot(params: {
  startMinutes: number;
  duration: number;
  dayOfWeek: number;
  offsetDays: number;
  dayExistingMinutes: number;
  deadlineHoursRemaining: number;
  preferredWindow?: 'morning' | 'afternoon' | 'evening';
}): { score: number; reasons: string[]; tradeOffs: string[] } {
  const {
    startMinutes,
    duration,
    dayOfWeek,
    offsetDays,
    dayExistingMinutes,
    deadlineHoursRemaining,
    preferredWindow = 'morning',
  } = params;

  let score = 50;
  const reasons: string[] = [];
  const tradeOffs: string[] = [];

  // 1. Urgency / Deadline alignment
  if (deadlineHoursRemaining < 9999) {
    const slotHoursFromNow = offsetDays * 24 + (startMinutes / 60);
    const bufferBeforeDeadlineHours = deadlineHoursRemaining - slotHoursFromNow;

    if (bufferBeforeDeadlineHours >= 24) {
      score += 35;
      reasons.push('Safely completes with >24h buffer before deadline.');
    } else if (bufferBeforeDeadlineHours > 6) {
      score += 20;
      reasons.push('Completes comfortably before deadline cutoff.');
    } else if (bufferBeforeDeadlineHours >= 0) {
      score += 10;
      tradeOffs.push('Tight buffer: concludes close to deadline cutoff.');
    }
  } else {
    // No deadline: favor prompt execution (earlier days)
    if (offsetDays === 0) {
      score += 20;
      reasons.push('Enables immediate execution today.');
    } else if (offsetDays === 1) {
      score += 15;
      reasons.push('Scheduled tomorrow for early momentum.');
    }
  }

  // 2. Circadian & Energy Window Match
  const hour = startMinutes / 60;
  const isMorning = hour >= 8 && hour < 12;
  const isAfternoon = hour >= 13 && hour < 17;
  const isEvening = hour >= 18 && hour < 21;

  if (
    (preferredWindow === 'morning' && isMorning) ||
    (preferredWindow === 'afternoon' && isAfternoon) ||
    (preferredWindow === 'evening' && isEvening)
  ) {
    score += 25;
    reasons.push(`Aligns with your peak ${preferredWindow} focus window (${minutesToTimeStr(startMinutes)}).`);
  } else if (isMorning || isAfternoon) {
    score += 15;
    reasons.push(`Clean daytime focus slot (${minutesToTimeStr(startMinutes)}).`);
  } else if (hour >= 21) {
    score -= 15;
    tradeOffs.push('Late evening slot: higher fatigue risk.');
  }

  // 3. Day Workload Distribution
  const totalProjectedHours = (dayExistingMinutes + duration) / 60;
  if (totalProjectedHours <= 4) {
    score += 15;
    reasons.push(`Light daily schedule (${totalProjectedHours.toFixed(1)}h total projected load).`);
  } else if (totalProjectedHours >= 7) {
    score -= 20;
    tradeOffs.push(`High daily load (${totalProjectedHours.toFixed(1)}h total planned on this day).`);
  }

  // 4. Zero collisions with fixed commitments
  reasons.push('0 collisions with fixed timetable commitments (🔒 Fixed).');

  return { score: Math.max(0, Math.min(100, score)), reasons, tradeOffs };
}

// ═════════════════════════════════════════════════════════════════════
// 5. PROPOSED PLAN GENERATION
// ═════════════════════════════════════════════════════════════════════

export interface GenerateProposalParams {
  issue: PlanningIssue;
  scheduledBlocks: ScheduledBlock[];
  personalRules?: PersonalRule[];
  referenceDate?: Date;
  currentWeekId?: string;
  config?: Partial<ScheduleConstraintConfig>;
}

export function generateProposalForIssue(params: GenerateProposalParams): ProposedPlanItem | null {
  const {
    issue,
    scheduledBlocks,
    personalRules = [],
    referenceDate = new Date(),
    currentWeekId = getISOWeekString(),
    config,
  } = params;

  const target = issue.target;
  let duration = target.duration || 60;
  const deadline = target.deadline;

  // Decide proposal type
  let proposalType: ProposalType = 'schedule_task';
  if (issue.type === 'schedule_conflict') {
    proposalType = 'resolve_conflict';
  } else if (issue.type === 'missed_session') {
    proposalType = 'reschedule_session';
  } else if (issue.type === 'unfittable_task') {
    // If task is over 90m, try splitting
    if (duration >= 90) {
      proposalType = 'split_task';
    } else {
      proposalType = 'shorten_session';
    }
  }

  // ── Split Task Proposal Handler ──
  if (proposalType === 'split_task') {
    const halfDuration = Math.round(duration / 2);
    const candidatesPart1 = findFeasibleCandidateSlots({
      durationMinutes: halfDuration,
      deadline,
      priority: target.priority,
      scheduledBlocks,
      personalRules,
      referenceDate,
      currentWeekId,
      maxCandidates: 3,
      config,
    });

    if (candidatesPart1.length > 0) {
      const selectedSlot1 = candidatesPart1[0];

      // Temporarily simulate part 1 placed to search for part 2
      const simulatedBlocks: ScheduledBlock[] = [
        ...scheduledBlocks,
        {
          id: 'simulated-part-1',
          blockId: 'simulated-part-1',
          title: `${target.title} (Part 1)`,
          color: '#3B82F6',
          priority: target.priority || 'medium',
          icon: 'target',
          dayOfWeek: selectedSlot1.dayOfWeek,
          startMinutes: selectedSlot1.startMinutes,
          duration: halfDuration,
          weekId: currentWeekId,
        },
      ];

      const candidatesPart2 = findFeasibleCandidateSlots({
        durationMinutes: halfDuration,
        deadline,
        priority: target.priority,
        scheduledBlocks: simulatedBlocks,
        personalRules,
        referenceDate,
        currentWeekId,
        maxCandidates: 3,
        config,
      });

      const companionSlot = candidatesPart2.find((c) => c.dayOfWeek !== selectedSlot1.dayOfWeek) || candidatesPart2[0];

      return {
        id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        issueId: issue.id,
        proposalType: 'split_task',
        title: target.title,
        entityType: target.entityType === 'assignment' ? 'assignment' : 'task',
        entityId: target.entityId,
        originalDuration: duration,
        proposedDuration: halfDuration,
        selectedSlot: selectedSlot1,
        alternativeSlots: candidatesPart1.slice(1),
        reason: `Split ${duration}m task into two manageable ${halfDuration}m focus sessions to fit available openings before the deadline.`,
        tradeOffs: companionSlot
          ? `Part 2 recommended for ${companionSlot.dateLabel} at ${minutesToTimeStr(companionSlot.startMinutes)}.`
          : undefined,
        status: 'pending',
        splitPart: {
          partNumber: 1,
          totalParts: 2,
          companionSlot,
        },
      };
    }
  }

  // ── Shorten Session Handler ──
  if (proposalType === 'shorten_session') {
    const shortenedDuration = Math.max(30, Math.round(duration * 0.75));
    const candidates = findFeasibleCandidateSlots({
      durationMinutes: shortenedDuration,
      deadline,
      priority: target.priority,
      scheduledBlocks,
      personalRules,
      referenceDate,
      currentWeekId,
      maxCandidates: 3,
      config,
    });

    if (candidates.length > 0) {
      return {
        id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        issueId: issue.id,
        proposalType: 'shorten_session',
        title: target.title,
        entityType: target.entityType === 'assignment' ? 'assignment' : 'task',
        entityId: target.entityId,
        originalDuration: duration,
        proposedDuration: shortenedDuration,
        selectedSlot: candidates[0],
        alternativeSlots: candidates.slice(1),
        reason: `Condensed session from ${duration}m to ${shortenedDuration}m to fit strictly within remaining pre-deadline capacity.`,
        tradeOffs: 'Focus on core essentials to respect the condensed timeframe.',
        status: 'pending',
      };
    }
  }

  // ── Standard Schedule / Reschedule Handler ──
  const candidates = findFeasibleCandidateSlots({
    durationMinutes: duration,
    deadline,
    priority: target.priority,
    scheduledBlocks,
    personalRules,
    excludeBlockId: target.entityType === 'block' ? target.entityId : undefined,
    referenceDate,
    currentWeekId,
    maxCandidates: 3,
    config,
  });

  if (candidates.length === 0) {
    // If no candidate slot found, try proposing a slot past deadline with clear warning or shorter session
    return null;
  }

  const selectedSlot = candidates[0];

  return {
    id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    issueId: issue.id,
    proposalType,
    title: target.title,
    entityType: target.entityType === 'block' ? 'block' : target.entityType === 'assignment' ? 'assignment' : 'task',
    entityId: target.entityId,
    originalDuration: duration,
    proposedDuration: duration,
    currentSlot:
      target.dayOfWeek !== undefined && target.startMinutes !== undefined
        ? {
            dayOfWeek: target.dayOfWeek,
            startMinutes: target.startMinutes,
            duration,
            weekId: target.weekId || currentWeekId,
          }
        : undefined,
    selectedSlot,
    alternativeSlots: candidates.slice(1),
    reason: selectedSlot.rankingReasons[0] || `Feasible non-conflicting slot found on ${selectedSlot.dateLabel}.`,
    tradeOffs: selectedSlot.tradeOffs?.join(' · '),
    status: 'pending',
  };
}

// ═════════════════════════════════════════════════════════════════════
// 6. PRE-APPLICATION VERIFICATION
// ═════════════════════════════════════════════════════════════════════

export interface ProposalValidationResult {
  isValid: boolean;
  conflictMessage?: string;
}

export function validateProposalSlot(
  slot: CandidateSlot,
  currentBlocks: ScheduledBlock[],
  excludeBlockId?: string
): ProposalValidationResult {
  const dayBlocks = currentBlocks.filter(
    (b) =>
      b.dayOfWeek === slot.dayOfWeek &&
      (b.weekId || getISOWeekString()) === slot.weekId &&
      b.id !== excludeBlockId
  );

  for (const block of dayBlocks) {
    const bStart = block.startMinutes;
    const bEnd = block.startMinutes + block.duration;
    const slotStart = slot.startMinutes;
    const slotEnd = slot.endMinutes;

    if (Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd)) {
      return {
        isValid: false,
        conflictMessage: `Slot collision: "${block.title}" is already scheduled at ${minutesToTimeStr(bStart)}–${minutesToTimeStr(bEnd)}.`,
      };
    }
  }

  return { isValid: true };
}
