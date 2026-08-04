import { ScheduledBlock } from '../types/timetable';
import { ExecutionSession } from '../types/sessionLog';
import {
  UserTimeBudget,
  TimeBudgetSummary,
  CategoryComparisonItem,
  TimeCategory,
} from '../types/timeBudget';

export function calculateTimeBudgetSummary(
  userBudget: UserTimeBudget,
  scheduledBlocks: ScheduledBlock[],
  executionSessions: ExecutionSession[] = []
): TimeBudgetSummary {
  if (!userBudget.isConfigured) {
    return {
      isConfigured: false,
      totalTargetDailyMinutes: 0,
      totalTargetWeeklyMinutes: 0,
      unallocatedDailyMinutes: 1440,
      unallocatedWeeklyMinutes: 10080,
      totalScheduledDailyMinutes: 0,
      totalScheduledWeeklyMinutes: 0,
      totalActualDailyMinutes: 0,
      totalActualWeeklyMinutes: 0,
      comparisons: [],
      uncategorizedBlockCount: scheduledBlocks.length,
    };
  }

  const activeCategories = userBudget.categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Group scheduled blocks by category
  const scheduledMinsByCat: Record<string, number> = {};
  let totalScheduledWeeklyMinutes = 0;
  let uncategorizedCount = 0;

  scheduledBlocks.forEach((block) => {
    totalScheduledWeeklyMinutes += block.duration;

    // Match by block.categoryId or match by title/priority fallback
    let catId = (block as any).categoryId;
    if (!catId) {
      const normTitle = block.title.toLowerCase();
      const matchedCat = activeCategories.find(
        (c) => normTitle.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(normTitle)
      );
      if (matchedCat) {
        catId = matchedCat.id;
      }
    }

    if (catId && userBudget.budgets[catId]) {
      scheduledMinsByCat[catId] = (scheduledMinsByCat[catId] || 0) + block.duration;
    } else {
      uncategorizedCount++;
    }
  });

  // Group actual execution sessions by category
  const actualMinsByCat: Record<string, number> = {};
  let totalActualWeeklyMinutes = 0;

  executionSessions.forEach((session) => {
    totalActualWeeklyMinutes += session.actualDuration;

    let catId = (session as any).categoryId;
    if (!catId) {
      const normTitle = session.actualTitle.toLowerCase();
      const matchedCat = activeCategories.find(
        (c) => normTitle.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(normTitle)
      );
      if (matchedCat) {
        catId = matchedCat.id;
      }
    }

    if (catId && userBudget.budgets[catId]) {
      actualMinsByCat[catId] = (actualMinsByCat[catId] || 0) + session.actualDuration;
    }
  });

  let totalTargetDailyMinutes = 0;
  let totalTargetWeeklyMinutes = 0;

  const comparisons: CategoryComparisonItem[] = activeCategories.map((cat) => {
    const budget = userBudget.budgets[cat.id] || {
      categoryId: cat.id,
      targetMinutes: 0,
      periodType: 'daily',
      targetType: 'preferred',
    };

    let targetDailyMinutes = 0;
    let targetWeeklyMinutes = 0;

    if (budget.periodType === 'weekly') {
      targetWeeklyMinutes = budget.targetMinutes;
      targetDailyMinutes = Math.round(budget.targetMinutes / 7);
    } else {
      targetDailyMinutes = budget.targetMinutes;
      targetWeeklyMinutes = budget.targetMinutes * 7;
    }

    totalTargetDailyMinutes += targetDailyMinutes;
    totalTargetWeeklyMinutes += targetWeeklyMinutes;

    const scheduledWeeklyMinutes = scheduledMinsByCat[cat.id] || 0;
    const scheduledDailyMinutes = Math.round(scheduledWeeklyMinutes / 7);

    const actualWeeklyMinutes = actualMinsByCat[cat.id] || 0;
    const actualDailyMinutes = Math.round(actualWeeklyMinutes / 7);

    const scheduledDiffMinutes = scheduledDailyMinutes - targetDailyMinutes;
    const actualDiffMinutes = actualDailyMinutes - targetDailyMinutes;

    let scheduledStatus: 'on_track' | 'over_budget' | 'under_target' = 'on_track';
    if (scheduledDiffMinutes > 30) scheduledStatus = 'over_budget';
    else if (scheduledDiffMinutes < -30) scheduledStatus = 'under_target';

    let actualStatus: 'on_track' | 'over_budget' | 'under_target' = 'on_track';
    if (actualDiffMinutes > 30) actualStatus = 'over_budget';
    else if (actualDiffMinutes < -30) actualStatus = 'under_target';

    return {
      category: cat,
      budget,
      targetDailyMinutes,
      targetWeeklyMinutes,
      scheduledDailyMinutes,
      scheduledWeeklyMinutes,
      actualDailyMinutes,
      actualWeeklyMinutes,
      scheduledDiffMinutes,
      actualDiffMinutes,
      scheduledStatus,
      actualStatus,
    };
  });

  const unallocatedDailyMinutes = Math.max(0, 1440 - totalTargetDailyMinutes);
  const unallocatedWeeklyMinutes = Math.max(0, 10080 - totalTargetWeeklyMinutes);
  const totalScheduledDailyMinutes = Math.round(totalScheduledWeeklyMinutes / 7);
  const totalActualDailyMinutes = Math.round(totalActualWeeklyMinutes / 7);

  return {
    isConfigured: true,
    totalTargetDailyMinutes,
    totalTargetWeeklyMinutes,
    unallocatedDailyMinutes,
    unallocatedWeeklyMinutes,
    totalScheduledDailyMinutes,
    totalScheduledWeeklyMinutes,
    totalActualDailyMinutes,
    totalActualWeeklyMinutes,
    comparisons,
    uncategorizedBlockCount: uncategorizedCount,
  };
}
