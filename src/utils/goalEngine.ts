import { Goal, GoalComponent, GoalMilestone, ScheduledBlock } from '../types/timetable';

export interface DualGoalMetrics {
  planProgressPct: number;
  commitmentAdherencePct: number;
  totalCompletedHours: number;
  weeklyCompletedHours: number;
  totalRequiredHours: number;
  daysRemaining: number;
  weeksRemaining: number;
}

/**
 * Calculates pure, authentic dual metrics for a Goal.
 * 1. Plan Progress (% of overall goal plan completed)
 * 2. Commitment Adherence (% of target weekly hours fulfilled this week)
 */
export function calculateGoalMetrics(goal: Goal, blocks: ScheduledBlock[]): DualGoalMetrics {
  const goalBlocks = (blocks || []).filter((b) => b && b.goalId === goal.id);

  // 1. Total Completed Hours (all time)
  const completedMinsAllTime = goalBlocks.reduce((sum, b) => {
    if (b.status === 'completed' || b.status === 'faster' || (b as any).completed === true) {
      return sum + (b.actualDuration || b.duration || 60);
    }
    return sum;
  }, 0);
  const totalCompletedHours = Math.round((completedMinsAllTime / 60) * 10) / 10;

  // 2. Weekly Completed Hours (this week)
  const completedMinsThisWeek = goalBlocks.reduce((sum, b) => {
    if (b.status === 'completed' || b.status === 'faster' || (b as any).completed === true) {
      return sum + (b.actualDuration || b.duration || 60);
    }
    return sum;
  }, 0);
  const weeklyCompletedHours = Math.round((completedMinsThisWeek / 60) * 10) / 10;

  // 3. Days & Weeks Remaining
  let daysRemaining = 90;
  if (goal.targetDate) {
    const target = new Date(goal.targetDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(1, diffDays);
  }
  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));

  // 4. Total Required Hours
  const totalRequiredHours = goal.totalRequiredHours || (goal.targetWeeklyHours || 10) * weeksRemaining;

  // 5. Plan Progress %
  // If milestones exist, calculate from unlocked milestones weight; otherwise from completed hours
  let planProgressPct = 0;
  if (goal.milestones && goal.milestones.length > 0) {
    const unlockedWeight = goal.milestones
      .filter((m) => m.isUnlocked)
      .reduce((sum, m) => sum + (m.weightPct || 0), 0);
    planProgressPct = Math.min(100, Math.round(unlockedWeight));
  } else if (totalRequiredHours > 0) {
    planProgressPct = Math.min(100, Math.round((totalCompletedHours / totalRequiredHours) * 100));
  }

  // 6. Commitment Adherence %
  const targetWeekly = goal.targetWeeklyHours || 1;
  const commitmentAdherencePct = Math.min(100, Math.round((weeklyCompletedHours / targetWeekly) * 100));

  return {
    planProgressPct,
    commitmentAdherencePct,
    totalCompletedHours,
    weeklyCompletedHours,
    totalRequiredHours,
    daysRemaining,
    weeksRemaining,
  };
}

/**
 * Generates an AI Breakdown proposal of sub-components and milestones.
 */
export function generateAIGoalBreakdown(goal: Goal): {
  components: Omit<GoalComponent, 'id'>[];
  milestones: Omit<GoalMilestone, 'id'>[];
} {
  const category = (goal.category || 'Career').toLowerCase();
  const title = (goal.title || '').toLowerCase();

  const components: Omit<GoalComponent, 'id'>[] = [];
  const milestones: Omit<GoalMilestone, 'id'>[] = [];

  if (category.includes('academics') || title.includes('cat') || title.includes('exam')) {
    components.push(
      { title: 'Core Concepts & Theory Review', targetHours: 30, completedHours: 0, status: 'pending' },
      { title: 'Practice Problems & Question Sets', targetHours: 40, completedHours: 0, status: 'pending' },
      { title: 'Full-Length Mock Exams & Analysis', targetHours: 20, completedHours: 0, status: 'pending' }
    );
    const tDate = goal.targetDate || '2026-12-31';
    milestones.push(
      { title: 'Complete Syllabus Foundations', targetDate: tDate, isUnlocked: false, weightPct: 35 },
      { title: 'Pass First Full Mock Exam with 85%+ Accuracy', targetDate: tDate, isUnlocked: false, weightPct: 35 },
      { title: 'Final Speed & Accuracy Refinement', targetDate: tDate, isUnlocked: false, weightPct: 30 }
    );
  } else if (category.includes('fitness') || title.includes('fitness') || title.includes('gym')) {
    components.push(
      { title: 'Strength Training & Weightlifting', targetHours: 25, completedHours: 0, status: 'pending' },
      { title: 'Cardio & Endurance Workouts', targetHours: 15, completedHours: 0, status: 'pending' },
      { title: 'Nutrition & Meal Prep Consistency', targetHours: 10, completedHours: 0, status: 'pending' }
    );
    const tDate = goal.targetDate || '2026-12-31';
    milestones.push(
      { title: 'Complete 30-Day Workout Consistency', targetDate: tDate, isUnlocked: false, weightPct: 50 },
      { title: 'Achieve Target Physical Milestones', targetDate: tDate, isUnlocked: false, weightPct: 50 }
    );
  } else {
    components.push(
      { title: 'Architecture & System Design Phase', targetHours: 20, completedHours: 0, status: 'pending' },
      { title: 'Core Feature Build & Integration', targetHours: 40, completedHours: 0, status: 'pending' },
      { title: 'Testing, Polish & Deployment', targetHours: 15, completedHours: 0, status: 'pending' }
    );
    const tDate = goal.targetDate || '2026-12-31';
    milestones.push(
      { title: 'Complete Initial Prototype MVP', targetDate: tDate, isUnlocked: false, weightPct: 40 },
      { title: 'Beta Testing & Core Feedback Refinement', targetDate: tDate, isUnlocked: false, weightPct: 30 },
      { title: 'Official Launch & Milestone Goal Achieved', targetDate: tDate, isUnlocked: false, weightPct: 30 }
    );
  }

  return { components, milestones };
}

/**
 * Inspects existing timetable blocks to propose candidate free slots for Goal scheduling.
 */
export function generateAIGoalCandidateSlots(
  goal: Goal,
  existingBlocks: ScheduledBlock[],
  currentWeekId: string
): Omit<ScheduledBlock, 'id' | 'weekId'>[] {
  const candidates: Omit<ScheduledBlock, 'id' | 'weekId'>[] = [];
  const preferredWindow = goal.preferredEnergyWindow || 'morning';
  const duration = goal.preferredSessionMinutes || 90;

  // Determine start minutes based on preferred window
  let startMinutes = 540; // 09:00 AM (Morning)
  if (preferredWindow === 'afternoon') startMinutes = 840; // 02:00 PM
  else if (preferredWindow === 'evening') startMinutes = 1140; // 07:00 PM

  // Candidate days: Monday (0), Wednesday (2), Friday (4)
  const candidateDays = [0, 2, 4];

  candidateDays.forEach((day) => {
    // Check if slot is occupied
    const isOccupied = (existingBlocks || []).some(
      (b) =>
        b.dayOfWeek === day &&
        Math.max(b.startMinutes, startMinutes) < Math.min(b.startMinutes + b.duration, startMinutes + duration)
    );

    if (!isOccupied) {
      candidates.push({
        blockId: `lib-goal-${goal.id}`,
        title: `${goal.title} Session`,
        description: `Dedicated focused session for Goal: ${goal.title}`,
        color: goal.color || '#8B5CF6',
        priority: 'high',
        icon: 'target',
        dayOfWeek: day,
        startMinutes,
        duration,
        status: 'not_started',
        goalId: goal.id,
        goalTitle: goal.title,
      });
    }
  });

  return candidates;
}
