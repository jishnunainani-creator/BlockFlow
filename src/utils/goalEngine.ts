import { Goal, GoalComponent, GoalMilestone, ScheduledBlock } from '../types/timetable';
import { DAYS_OF_WEEK, minutesToTimeStr } from './timeUtils';

export interface SmartFeasibilityAnalysis {
  isRealistic: boolean;
  studyDaysNeeded: number;
  daysAvailable: number;
  dailyPaceHours: number;
  message: string;
}

export interface DualGoalMetrics {
  // SMART core progress
  progressPct: number; // 0-100 capped for UI progress bars
  actualCurrentValue: number; // can exceed target
  targetValue: number;
  unit: string;
  measurableType: 'quantity' | 'effort';

  // Effort tracking (hours)
  estimatedTotalHours: number;
  plannedHours: number; // Total hours currently scheduled in timetable
  completedHours: number; // Hours from completed/actual sessions
  remainingHours: number; // Max(0, estimated - completed)

  // Timeline
  startDate: string;
  deadline: string;
  daysRemaining: number;
  weeksRemaining: number;
  isOverdue: boolean;
  daysOverdue: number;

  // Feasibility & Insights
  feasibility: SmartFeasibilityAnalysis;
  naturalProgressSummary: string;
  nextAction: string;
  nextSessionBlock?: ScheduledBlock;

  // Backward compatibility fields
  planProgressPct: number;
  commitmentAdherencePct: number;
  totalCompletedHours: number;
  weeklyCompletedHours: number;
  totalRequiredHours: number;
}

/**
 * Calculates pure, authentic SMART metrics for a Goal.
 * Supports both quantity-based (e.g. chapters, problems) and effort-based (study hours).
 */
export function calculateGoalMetrics(goal: Goal, blocks: ScheduledBlock[]): DualGoalMetrics {
  const goalBlocks = (blocks || []).filter((b) => b && b.goalId === goal.id);

  // 1. Effort calculations from actual schedule
  let completedMinsAllTime = 0;
  let plannedMinsAllTime = 0;

  goalBlocks.forEach((b) => {
    const blockDuration = b.actualDuration || b.duration || 60;
    plannedMinsAllTime += blockDuration;

    if (b.status === 'completed' || b.status === 'faster' || (b as any).completed === true) {
      completedMinsAllTime += blockDuration;
    }
  });

  const completedHours = Math.round((completedMinsAllTime / 60) * 10) / 10;
  const plannedHours = Math.round((plannedMinsAllTime / 60) * 10) / 10;

  // Target hours definition
  const estimatedTotalHours =
    goal.smart?.estimatedTotalHours ||
    goal.totalRequiredHours ||
    (goal.targetWeeklyHours ? goal.targetWeeklyHours * 2 : 12);

  const remainingHours = Math.max(0, Math.round((estimatedTotalHours - completedHours) * 10) / 10);

  // 2. Timeline calculations
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startDate = goal.smart?.startDate || new Date(goal.createdAt || now.getTime()).toISOString().split('T')[0];
  const deadline = goal.smart?.deadline || goal.targetDate || goal.deadline || todayStr;

  const deadlineTime = new Date(`${deadline}T23:59:59`).getTime();
  const nowTime = now.getTime();
  const diffMs = deadlineTime - nowTime;
  const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isOverdue = daysDiff < 0 && goal.status !== 'completed';
  const daysRemaining = Math.max(0, daysDiff);
  const daysOverdue = isOverdue ? Math.abs(daysDiff) : 0;
  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));

  // 3. Measurable Progress
  const measurableType = goal.smart?.measurableType || 'quantity';
  const targetValue = goal.smart?.targetValue ?? estimatedTotalHours;
  const unit = goal.smart?.unit || (measurableType === 'effort' ? 'hours' : 'units');

  let actualCurrentValue = goal.smart?.currentValue ?? 0;
  // If effort-based, keep synced with completed hours if user hasn't explicitly set higher
  if (measurableType === 'effort') {
    actualCurrentValue = Math.max(actualCurrentValue, completedHours);
  }

  // Progress percentage (capped at 100% for display)
  let progressPct = 0;
  if (targetValue > 0) {
    progressPct = Math.min(100, Math.max(0, Math.round((actualCurrentValue / targetValue) * 100)));
  }

  // If goal is explicitly marked completed, ensure 100%
  if (goal.status === 'completed') {
    progressPct = 100;
  }

  // 4. Feasibility analysis
  const dailyAvailable = goal.smart?.dailyAvailableHours || (goal.targetWeeklyHours ? goal.targetWeeklyHours / 7 : 1);
  const studyDaysNeeded = dailyAvailable > 0 ? Math.ceil(remainingHours / dailyAvailable) : remainingHours;
  const isRealistic = daysRemaining >= studyDaysNeeded;

  let feasibilityMessage = '';
  if (goal.status === 'completed') {
    feasibilityMessage = 'Goal completed successfully.';
  } else if (isOverdue) {
    feasibilityMessage = `Target deadline passed ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} ago. Revise deadline or adjust schedule.`;
  } else if (remainingHours <= 0) {
    feasibilityMessage = 'All estimated effort completed.';
  } else if (isRealistic) {
    feasibilityMessage = `Requires ~${studyDaysNeeded} study day${studyDaysNeeded === 1 ? '' : 's'} at ${dailyAvailable}h/day. With ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining, this target is achievable.`;
  } else {
    feasibilityMessage = `Tight timeline: ~${studyDaysNeeded} study days needed at ${dailyAvailable}h/day, but only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remain before deadline. Consider extending deadline.`;
  }

  const feasibility: SmartFeasibilityAnalysis = {
    isRealistic,
    studyDaysNeeded,
    daysAvailable: daysRemaining,
    dailyPaceHours: dailyAvailable,
    message: feasibilityMessage,
  };

  // 5. Natural Progress Summary Sentence
  let naturalProgressSummary = '';
  if (goal.status === 'completed') {
    naturalProgressSummary = `Target achieved! You completed all ${targetValue} ${unit}.`;
  } else if (measurableType === 'effort') {
    if (completedHours === 0) {
      naturalProgressSummary = `Starting out. ${estimatedTotalHours} planned study hours remain to be completed.`;
    } else if (progressPct >= 50) {
      naturalProgressSummary = `You're past the halfway mark. ${completedHours} of your ${estimatedTotalHours} planned study hours are complete.`;
    } else {
      naturalProgressSummary = `${completedHours} of your ${estimatedTotalHours} planned study hours are complete (${progressPct}%).`;
    }
  } else {
    if (actualCurrentValue === 0) {
      naturalProgressSummary = `0 of ${targetValue} ${unit} completed so far.`;
    } else if (actualCurrentValue >= targetValue) {
      naturalProgressSummary = `Goal target reached: ${actualCurrentValue} of ${targetValue} ${unit} completed!`;
    } else {
      naturalProgressSummary = `${actualCurrentValue} of ${targetValue} ${unit} completed (${progressPct}%).`;
    }
  }

  // 6. Next Recommended Action & Upcoming Block
  const currentDayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const upcomingBlocks = goalBlocks
    .filter((b) => b.status === 'not_started' || b.status === 'scheduled' || !b.status)
    .sort((a, b) => {
      // sort by day and startMinutes
      if (a.dayOfWeek !== b.dayOfWeek) {
        return (a.dayOfWeek - currentDayOfWeek + 7) % 7 - ((b.dayOfWeek - currentDayOfWeek + 7) % 7);
      }
      return a.startMinutes - b.startMinutes;
    });

  const nextSessionBlock = upcomingBlocks[0];

  let nextAction = '';
  if (goal.status === 'completed') {
    nextAction = 'Goal complete. Great work!';
  } else if (nextSessionBlock) {
    const dayName = DAYS_OF_WEEK.find((d) => d.index === nextSessionBlock.dayOfWeek)?.full || 'Today';
    const isToday = nextSessionBlock.dayOfWeek === currentDayOfWeek;
    const timeStr = minutesToTimeStr(nextSessionBlock.startMinutes);
    nextAction = isToday && nextSessionBlock.startMinutes > currentMins
      ? `Next session today at ${timeStr} (${nextSessionBlock.duration}m)`
      : `Next session: ${dayName} at ${timeStr} (${nextSessionBlock.duration}m)`;
  } else if (remainingHours > 0) {
    nextAction = `No sessions scheduled this week. ${remainingHours}h remaining to allocate.`;
  } else {
    nextAction = 'Ready for final milestone review.';
  }

  // Commitment adherence % for this week
  const weeklyTarget = goal.smart?.weeklyAvailableHours || goal.targetWeeklyHours || 6;
  const commitmentAdherencePct = Math.min(100, Math.round((completedHours / weeklyTarget) * 100));

  return {
    progressPct,
    actualCurrentValue,
    targetValue,
    unit,
    measurableType,

    estimatedTotalHours,
    plannedHours,
    completedHours,
    remainingHours,

    startDate,
    deadline,
    daysRemaining,
    weeksRemaining,
    isOverdue,
    daysOverdue,

    feasibility,
    naturalProgressSummary,
    nextAction,
    nextSessionBlock,

    // Backward compatibility
    planProgressPct: progressPct,
    commitmentAdherencePct,
    totalCompletedHours: completedHours,
    weeklyCompletedHours: completedHours,
    totalRequiredHours: estimatedTotalHours,
  };
}

/**
 * Proposed session item returned by transparent schedule proposal engine.
 */
export interface ProposedGoalSession {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startMinutes: number;
  duration: number;
  title: string;
  hasCollision: boolean;
  collisionMessage?: string;
  shiftedFrom?: number;
  isAccepted: boolean;
}

export interface ProposeScheduleParams {
  goal: Goal;
  existingBlocks: ScheduledBlock[];
  selectedDays: number[]; // [0..6]
  sessionDuration: number; // minutes, e.g. 60
  totalSessionsToSchedule: number;
  preferredTimeWindow?: 'morning' | 'afternoon' | 'evening' | 'any';
}

/**
 * Transparent proposal engine:
 * Detects collisions with existing blocks and proposes genuinely open windows.
 * Does not overwrite or claim magical auto-magic without user confirmation.
 */
export function proposeSmartGoalScheduleSlots({
  goal,
  existingBlocks,
  selectedDays,
  sessionDuration,
  totalSessionsToSchedule,
  preferredTimeWindow = 'morning',
}: ProposeScheduleParams): ProposedGoalSession[] {
  const proposed: ProposedGoalSession[] = [];
  if (selectedDays.length === 0 || totalSessionsToSchedule <= 0) return proposed;

  // Determine ideal start minute by window
  let preferredStart = 540; // 09:00 AM (morning)
  if (preferredTimeWindow === 'afternoon') preferredStart = 840; // 02:00 PM
  else if (preferredTimeWindow === 'evening') preferredStart = 1140; // 07:00 PM

  let sessionsGenerated = 0;
  let dayIndexPointer = 0;

  while (sessionsGenerated < totalSessionsToSchedule && dayIndexPointer < selectedDays.length * 4) {
    const day = selectedDays[dayIndexPointer % selectedDays.length];
    const dayName = DAYS_OF_WEEK.find((d) => d.index === day)?.full || 'Monday';

    // Existing blocks on this day (exclude any already completed in the past)
    const dayBlocks = (existingBlocks || []).filter((b) => b && b.dayOfWeek === day);

    // Check if preferred start time collides
    const candidateEnd = preferredStart + sessionDuration;
    const collidingBlock = dayBlocks.find((b) => {
      const bEnd = b.startMinutes + b.duration;
      return Math.max(preferredStart, b.startMinutes) < Math.min(candidateEnd, bEnd);
    });

    if (!collidingBlock) {
      // Free slot directly at preferred time!
      proposed.push({
        id: `prop-${goal.id}-${day}-${preferredStart}-${sessionsGenerated}`,
        dayOfWeek: day,
        dayName,
        startMinutes: preferredStart,
        duration: sessionDuration,
        title: `${goal.title} (Session ${sessionsGenerated + 1})`,
        hasCollision: false,
        isAccepted: true,
      });
      sessionsGenerated++;
    } else {
      // Collision detected! Transparently search for the nearest open gap on that day (between 08:00 and 21:00)
      let foundShiftedStart: number | null = null;
      let searchedStart = 480; // 08:00 AM
      const latestAllowed = 1260 - sessionDuration; // 21:00 (9:00 PM)

      while (searchedStart <= latestAllowed) {
        const testEnd = searchedStart + sessionDuration;
        const testCollision = dayBlocks.find((b) => {
          const bEnd = b.startMinutes + b.duration;
          return Math.max(searchedStart, b.startMinutes) < Math.min(testEnd, bEnd);
        });

        if (!testCollision) {
          foundShiftedStart = searchedStart;
          break;
        }

        // Jump forward to after colliding block
        searchedStart = testCollision.startMinutes + testCollision.duration;
        // Snap to 15m intervals
        searchedStart = Math.ceil(searchedStart / 15) * 15;
      }

      if (foundShiftedStart !== null) {
        proposed.push({
          id: `prop-${goal.id}-${day}-${foundShiftedStart}-${sessionsGenerated}`,
          dayOfWeek: day,
          dayName,
          startMinutes: foundShiftedStart,
          duration: sessionDuration,
          title: `${goal.title} (Session ${sessionsGenerated + 1})`,
          hasCollision: false,
          shiftedFrom: preferredStart,
          collisionMessage: `Shifted to ${minutesToTimeStr(foundShiftedStart)} to avoid "${collidingBlock.title}"`,
          isAccepted: true,
        });
        sessionsGenerated++;
      } else {
        // No open gap on this day
        proposed.push({
          id: `prop-${goal.id}-${day}-${preferredStart}-${sessionsGenerated}`,
          dayOfWeek: day,
          dayName,
          startMinutes: preferredStart,
          duration: sessionDuration,
          title: `${goal.title} (Session ${sessionsGenerated + 1})`,
          hasCollision: true,
          collisionMessage: `No open ${sessionDuration}m window on ${dayName}. Overlaps with "${collidingBlock.title}".`,
          isAccepted: false,
        });
        sessionsGenerated++;
      }
    }

    dayIndexPointer++;
  }

  return proposed;
}

/**
 * Legacy AI Breakdown proposal for sub-components and milestones.
 */
export function generateAIGoalBreakdown(goal: Goal): {
  components: Omit<GoalComponent, 'id'>[];
  milestones: Omit<GoalMilestone, 'id'>[];
} {
  const category = (goal.category || 'Academics').toLowerCase();
  const title = (goal.title || '').toLowerCase();

  const components: Omit<GoalComponent, 'id'>[] = [];
  const milestones: Omit<GoalMilestone, 'id'>[] = [];

  if (category.includes('academics') || title.includes('data structures') || title.includes('exam')) {
    components.push(
      { title: 'Core Theoretical Foundations', targetHours: 4, completedHours: 0, status: 'pending' },
      { title: 'Problem Solving & Exercises', targetHours: 6, completedHours: 0, status: 'pending' },
      { title: 'Review & Revision Session', targetHours: 2, completedHours: 0, status: 'pending' }
    );
    const tDate = goal.smart?.deadline || goal.targetDate || '2026-12-31';
    milestones.push(
      { title: 'Foundational Concepts Understood', targetDate: tDate, isUnlocked: false, weightPct: 40 },
      { title: 'Practice Problems Completed', targetDate: tDate, isUnlocked: false, weightPct: 40 },
      { title: 'Final Self-Assessment Complete', targetDate: tDate, isUnlocked: false, weightPct: 20 }
    );
  } else {
    components.push(
      { title: 'Preparation & Architecture', targetHours: 4, completedHours: 0, status: 'pending' },
      { title: 'Focused Execution Sprint', targetHours: 6, completedHours: 0, status: 'pending' },
      { title: 'Polishing & Verification', targetHours: 2, completedHours: 0, status: 'pending' }
    );
    const tDate = goal.smart?.deadline || goal.targetDate || '2026-12-31';
    milestones.push(
      { title: 'Initial Milestone Achieved', targetDate: tDate, isUnlocked: false, weightPct: 50 },
      { title: 'Final Outcome Delivered', targetDate: tDate, isUnlocked: false, weightPct: 50 }
    );
  }

  return { components, milestones };
}

/**
 * Candidate slots generator for backward-compatibility.
 */
export function generateAIGoalCandidateSlots(
  goal: Goal,
  existingBlocks: ScheduledBlock[],
  _currentWeekId: string
): Omit<ScheduledBlock, 'id' | 'weekId'>[] {
  const proposals = proposeSmartGoalScheduleSlots({
    goal,
    existingBlocks,
    selectedDays: goal.smart?.preferredDays || [0, 2, 4],
    sessionDuration: goal.smart?.preferredSessionMinutes || 60,
    totalSessionsToSchedule: 3,
    preferredTimeWindow: goal.smart?.preferredEnergyWindow || 'morning',
  });

  return proposals
    .filter((p) => !p.hasCollision)
    .map((p) => ({
      blockId: `lib-goal-${goal.id}`,
      title: p.title,
      description: `SMART Goal: ${goal.title}`,
      color: goal.color || '#3659C9',
      priority: 'high',
      icon: 'target',
      dayOfWeek: p.dayOfWeek,
      startMinutes: p.startMinutes,
      duration: p.duration,
      status: 'not_started',
      goalId: goal.id,
      goalTitle: goal.title,
    }));
}
