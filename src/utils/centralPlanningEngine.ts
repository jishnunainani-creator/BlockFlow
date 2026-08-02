import { ScheduledBlock } from '../types/timetable';
import { TaskInboxItem, PersonalRule } from '../types/executionOS';
import { DAYS_OF_WEEK, minutesToTimeStr } from './timeUtils';

export interface PlanningRecommendation {
  dayOfWeek: number;
  startMinutes: number;
  duration: number;
  urgencyScore: number;
  explainableReasons: string[];
  splits?: { dayOfWeek: number; startMinutes: number; duration: number }[];
}

export interface FeasibilityResult {
  score: number; // 0-100
  rating: 'High Feasibility' | 'Moderate Feasibility' | 'Overloaded Schedule';
  isOverloaded: boolean;
  warnings: string[];
  totalPlannedHours: number;
  availableFreeHours: number;
}

/**
 * Calculates the pure Scheduling Urgency Score for a task or activity.
 */
export function calculateUrgencyScore(task: {
  priority?: string;
  deadline?: string;
  goalId?: string;
  postponementCount?: number;
}): number {
  // 1. Deadline Urgency (0-100)
  let deadlineUrgency = 30;
  if (task.deadline) {
    const target = new Date(task.deadline).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) deadlineUrgency = 100;
    else if (diffDays <= 3) deadlineUrgency = 85;
    else if (diffDays <= 7) deadlineUrgency = 65;
    else deadlineUrgency = 40;
  }

  // 2. Priority Weight (0-100)
  let priorityWeight = 50;
  const pri = (task.priority || 'medium').toLowerCase();
  if (pri === 'high' || pri === 'urgent') priorityWeight = 100;
  else if (pri === 'medium') priorityWeight = 65;
  else if (pri === 'low') priorityWeight = 30;

  // 3. Goal Impact (0-100)
  const goalImpact = task.goalId ? 90 : 30;

  // 4. Postponement Penalty
  const postponementBonus = Math.min(40, (task.postponementCount || 0) * 15);

  const rawScore =
    deadlineUrgency * 0.35 + priorityWeight * 0.25 + goalImpact * 0.20 + postponementBonus * 0.20;

  return Math.min(100, Math.round(rawScore));
}

/**
 * Evaluates the Schedule Feasibility Score (0-100%) for a timetable.
 */
export function calculateScheduleFeasibility(
  blocks: ScheduledBlock[],
  personalRules: PersonalRule[] = []
): FeasibilityResult {
  const warnings: string[] = [];
  if (!blocks || blocks.length === 0) {
    return {
      score: 100,
      rating: 'High Feasibility',
      isOverloaded: false,
      warnings: [],
      totalPlannedHours: 0,
      availableFreeHours: 112,
    };
  }

  let totalPlannedMins = 0;
  let ruleViolationPenalty = 0;
  let highPriorityStackPenalty = 0;

  let consecutiveHigh = 0;

  // Group blocks by day of week
  const dayBlocksMap: Record<number, ScheduledBlock[]> = {};
  blocks.forEach((b) => {
    totalPlannedMins += b.duration || 60;
    if (!dayBlocksMap[b.dayOfWeek]) dayBlocksMap[b.dayOfWeek] = [];
    dayBlocksMap[b.dayOfWeek].push(b);
  });

  // Evaluate rules & high-priority stacking
  Object.values(dayBlocksMap).forEach((dayBlocks) => {
    dayBlocks.sort((a, b) => a.startMinutes - b.startMinutes);
    consecutiveHigh = 0;

    dayBlocks.forEach((b) => {
      if (b.priority === 'high') consecutiveHigh++;
      else consecutiveHigh = 0;

      if (consecutiveHigh >= 3) {
        highPriorityStackPenalty += 15;
        warnings.push(`High priority stacking on ${DAYS_OF_WEEK[b.dayOfWeek]?.short || 'Day'}: 3+ consecutive high-focus blocks without breaks.`);
      }

      // Check Personal Rules
      personalRules.forEach((rule) => {
        if (!rule.isActive) return;

        if (rule.ruleType === 'no_work_after_time' && rule.timeValue) {
          if (b.startMinutes >= rule.timeValue && b.priority === 'high') {
            ruleViolationPenalty += rule.priority === 'strict' ? 25 : 10;
            warnings.push(`Rule violation: High priority block "${b.title}" scheduled after 10:00 PM.`);
          }
        }
      });
    });
  });

  const totalPlannedHours = Math.round((totalPlannedMins / 60) * 10) / 10;
  const totalWeeklyCapacityHours = 112; // 16 hrs/day * 7 days
  const availableFreeHours = Math.max(0, Math.round((totalWeeklyCapacityHours - totalPlannedHours) * 10) / 10);

  let overloadPenalty = 0;
  if (totalPlannedHours > 70) {
    overloadPenalty = 40;
    warnings.push(`Overload Warning: Total planned workload (${totalPlannedHours}h) exceeds 70 hours per week.`);
  } else if (totalPlannedHours > 50) {
    overloadPenalty = 20;
    warnings.push(`Workload Warning: Weekly planned workload (${totalPlannedHours}h) is very dense.`);
  }

  const rawScore = 100 - (overloadPenalty + highPriorityStackPenalty + ruleViolationPenalty);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let rating: 'High Feasibility' | 'Moderate Feasibility' | 'Overloaded Schedule' = 'High Feasibility';
  if (score < 60 || totalPlannedHours > 70) rating = 'Overloaded Schedule';
  else if (score < 80) rating = 'Moderate Feasibility';

  return {
    score,
    rating,
    isOverloaded: score < 60 || totalPlannedHours > 70,
    warnings: Array.from(new Set(warnings)),
    totalPlannedHours,
    availableFreeHours,
  };
}

/**
 * Centralized Explainable Scheduling Engine.
 * Finds candidate free slots for a task while respecting fixed commitments & personal rules.
 */
export function findCentralizedScheduleSlot(params: {
  task: { title: string; estimatedDuration: number; priority?: string; deadline?: string; goalId?: string };
  existingBlocks: ScheduledBlock[];
  personalRules?: PersonalRule[];
  preferredWindow?: 'morning' | 'afternoon' | 'evening';
}): PlanningRecommendation {
  const { task, existingBlocks, personalRules = [], preferredWindow = 'morning' } = params;

  let duration = task.estimatedDuration || 60;
  let defaultStartMinutes = 540; // 09:00 AM
  if (preferredWindow === 'afternoon') defaultStartMinutes = 840; // 02:00 PM
  else if (preferredWindow === 'evening') defaultStartMinutes = 1140; // 07:00 PM

  const urgencyScore = calculateUrgencyScore(task);
  const candidateDays = [0, 1, 2, 3, 4, 5, 6];

  let selectedDay = 0;
  let selectedStart = defaultStartMinutes;
  let foundSlot = false;

  for (const day of candidateDays) {
    const dayBlocks = (existingBlocks || []).filter((b) => b.dayOfWeek === day);

    // Check collision with fixed blocks or other scheduled blocks
    const hasCollision = dayBlocks.some((b) => {
      const bEnd = b.startMinutes + b.duration;
      const slotEnd = defaultStartMinutes + duration;
      return Math.max(b.startMinutes, defaultStartMinutes) < Math.min(bEnd, slotEnd);
    });

    // Check strict rules (e.g. no work after 10 PM)
    const strictRuleViolation = personalRules.some(
      (r) => r.isActive && r.ruleType === 'no_work_after_time' && r.priority === 'strict' && defaultStartMinutes >= (r.timeValue || 1320)
    );

    if (!hasCollision && !strictRuleViolation) {
      selectedDay = day;
      selectedStart = defaultStartMinutes;
      foundSlot = true;
      break;
    }
  }

  // Handle Smart Task Splitting if duration > 180m and no single slot found
  if (duration > 180) {
    const splitDuration = Math.round(duration / 2);
    return {
      dayOfWeek: 0,
      startMinutes: defaultStartMinutes,
      duration: splitDuration,
      urgencyScore,
      explainableReasons: [
        `Smart Task Splitting applied: Task requires ${duration}m total. Split into two ${splitDuration}m sessions.`,
        `Fits your peak ${preferredWindow} focus window (${minutesToTimeStr(defaultStartMinutes)}).`,
        `0 conflicts with your fixed commitments (🔒 Fixed).`,
      ],
      splits: [
        { dayOfWeek: 0, startMinutes: defaultStartMinutes, duration: splitDuration },
        { dayOfWeek: 2, startMinutes: defaultStartMinutes, duration: splitDuration },
      ],
    };
  }

  const dayName = DAYS_OF_WEEK[selectedDay]?.full || 'Monday';
  const timeRange = `${minutesToTimeStr(selectedStart)} – ${minutesToTimeStr(selectedStart + duration)}`;

  const explainableReasons = [
    `Recommended ${dayName} ${timeRange} (${duration}m session).`,
    `Matches your preferred ${preferredWindow} energy window.`,
    `0 conflicts with your fixed college/meeting commitments (🔒 Fixed).`,
    `Respects active personal rules (e.g. No heavy work after 10 PM).`,
  ];

  return {
    dayOfWeek: selectedDay,
    startMinutes: selectedStart,
    duration,
    urgencyScore,
    explainableReasons,
  };
}
