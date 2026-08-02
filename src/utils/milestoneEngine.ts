import { CustomMilestone } from '../types/executionOS';
import { ScheduledBlock, Goal } from '../types/timetable';
import { DailyExecutionScore, DailyReflection, ProductivityStreak } from '../types/execution';
import { Assignment } from '../types/executionOS';
import { SYSTEM_MILESTONE_DEFINITIONS } from './assignmentStorage';

export interface UserActivityMetrics {
  totalCompletedActivities: number;
  totalCompletedHours: number;
  highestExecutionScore: number;
  longestStreak: number;
  totalReflectionsSubmitted: number;
  totalAssignmentsCompleted: number;
  totalGoalsCompleted: number;
}

/**
 * Extracts canonical, idempotent user metrics directly from source data.
 */
export function extractMetricsFromData(params: {
  scheduledBlocks?: ScheduledBlock[];
  scheduledBlocksByWeek?: Record<string, ScheduledBlock[]>;
  dailyScores: Record<string, DailyExecutionScore>;
  reflections: Record<string, DailyReflection>;
  assignments: Assignment[];
  goals: Goal[];
  streaks: ProductivityStreak[];
}): UserActivityMetrics {
  let completedCount = 0;
  let totalMinutes = 0;

  const processBlocks = (blocksList: ScheduledBlock[]) => {
    if (Array.isArray(blocksList)) {
      blocksList.forEach((b) => {
        if (b && (b.status === 'completed' || (b as any).completed === true)) {
          completedCount++;
          totalMinutes += Number(b.duration) || 0;
        }
      });
    }
  };

  if (params.scheduledBlocks) {
    processBlocks(params.scheduledBlocks);
  }

  if (params.scheduledBlocksByWeek) {
    Object.values(params.scheduledBlocksByWeek).forEach((blocks) => processBlocks(blocks));
  }

  const completedHours = Math.round((totalMinutes / 60) * 10) / 10;

  // 2. Highest execution score
  let maxScore = 0;
  Object.values(params.dailyScores || {}).forEach((s) => {
    if (s && s.overallScore > maxScore) {
      maxScore = s.overallScore;
    }
  });

  // 3. Longest active/historical streak
  let maxStreak = 0;
  (params.streaks || []).forEach((s) => {
    if (s) {
      if (s.longestCount > maxStreak) maxStreak = s.longestCount;
      if (s.currentCount > maxStreak) maxStreak = s.currentCount;
    }
  });

  // 4. Total submitted daily reflections
  const reflectionCount = Object.keys(params.reflections || {}).length;

  // 5. Total completed assignments
  const assignmentCount = (params.assignments || []).filter(
    (a) => a && (a.status === 'submitted' || a.status === 'graded' || a.progressPct === 100)
  ).length;

  // 6. Total completed goals (100% progress)
  const goalCount = (params.goals || []).filter(
    (g) => g && (g.progressPct === 100 || (g as any).completed === true)
  ).length;

  return {
    totalCompletedActivities: completedCount,
    totalCompletedHours: completedHours,
    highestExecutionScore: maxScore,
    longestStreak: maxStreak,
    totalReflectionsSubmitted: reflectionCount,
    totalAssignmentsCompleted: assignmentCount,
    totalGoalsCompleted: goalCount,
  };
}

/**
 * Recalculates system milestones based on canonical user metrics.
 * Pure function: Idempotent and deterministic.
 */
export function calculateMilestones(
  systemMilestones: CustomMilestone[],
  customMilestones: CustomMilestone[],
  metrics: UserActivityMetrics
): {
  updatedSystemMilestones: CustomMilestone[];
  updatedCustomMilestones: CustomMilestone[];
  newlyUnlocked: CustomMilestone[];
} {
  const newlyUnlocked: CustomMilestone[] = [];
  const baseSystem = systemMilestones.length > 0 ? systemMilestones : SYSTEM_MILESTONE_DEFINITIONS;

  const updatedSystem = baseSystem.map((m) => {
    let currentVal = 0;
    switch (m.id) {
      case 'sys-m-1':
      case 'sys-m-2':
      case 'sys-m-3':
      case 'sys-m-4':
        currentVal = metrics.totalCompletedActivities;
        break;
      case 'sys-m-5':
      case 'sys-m-6':
      case 'sys-m-7':
        currentVal = metrics.totalCompletedHours;
        break;
      case 'sys-m-8':
        currentVal = metrics.highestExecutionScore;
        break;
      case 'sys-m-9':
        currentVal = metrics.longestStreak;
        break;
      case 'sys-m-10':
      case 'sys-m-11':
        currentVal = metrics.totalReflectionsSubmitted;
        break;
      case 'sys-m-12':
        currentVal = metrics.totalAssignmentsCompleted;
        break;
      case 'sys-m-13':
        currentVal = metrics.totalGoalsCompleted;
        break;
      default:
        currentVal = m.currentValue;
    }

    const wasUnlocked = m.isUnlocked;
    const isUnlockedNow = currentVal >= m.targetValue;

    const todayDateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (!wasUnlocked && isUnlockedNow) {
      newlyUnlocked.push({
        ...m,
        currentValue: currentVal,
        isUnlocked: true,
        earnedDate: todayDateStr,
      });
    }

    return {
      ...m,
      currentValue: currentVal,
      isUnlocked: isUnlockedNow,
      earnedDate: isUnlockedNow ? m.earnedDate || todayDateStr : undefined,
    };
  });

  return {
    updatedSystemMilestones: updatedSystem,
    updatedCustomMilestones: customMilestones,
    newlyUnlocked,
  };
}
