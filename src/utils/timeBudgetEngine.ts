import { ScheduledBlock } from '../types/timetable';
import { ExecutionSession } from '../types/sessionLog';
import {
  UserTimeBudget,
  TimeBudgetSummary,
  CategoryComparisonItem,
  TimeCategory,
} from '../types/timeBudget';

export type DateScopeFilter = 'today' | 'week' | 'month';

export function calculateTimeBudgetSummary(
  userBudget: UserTimeBudget,
  scheduledBlocks: ScheduledBlock[],
  executionSessions: ExecutionSession[] = [],
  scope: DateScopeFilter = 'week'
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

  // Filter scheduled blocks by date scope
  const todayDayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun

  let filteredBlocks = scheduledBlocks;
  if (scope === 'today') {
    filteredBlocks = scheduledBlocks.filter((b) => b.dayOfWeek === todayDayIndex);
  }

  // Group scheduled blocks by category
  const scheduledMinsByCat: Record<string, number> = {};
  let totalScheduledScopeMinutes = 0;
  let uncategorizedCount = 0;

  filteredBlocks.forEach((block) => {
    totalScheduledScopeMinutes += block.duration;

    let catId = (block as any).categoryId;
    if (!catId) {
      const normTitle = block.title.toLowerCase().trim();
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
  let totalActualScopeMinutes = 0;

  executionSessions.forEach((session) => {
    totalActualScopeMinutes += session.actualDuration;

    let catId = (session as any).categoryId;
    if (!catId) {
      const normTitle = session.actualTitle.toLowerCase().trim();
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

    // Scope target minutes
    let targetScopeMinutes = targetWeeklyMinutes;
    if (scope === 'today') targetScopeMinutes = targetDailyMinutes;
    else if (scope === 'month') targetScopeMinutes = Math.round(targetWeeklyMinutes * 4.33);

    const scheduledScopeMinutes = scheduledMinsByCat[cat.id] || 0;
    const actualScopeMinutes = actualMinsByCat[cat.id] || 0;

    const scheduledDiffMinutes = scheduledScopeMinutes - targetScopeMinutes;
    const actualDiffMinutes = actualScopeMinutes - targetScopeMinutes;

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
      scheduledDailyMinutes: scope === 'today' ? scheduledScopeMinutes : Math.round(scheduledScopeMinutes / 7),
      scheduledWeeklyMinutes: scope === 'week' ? scheduledScopeMinutes : scheduledScopeMinutes * 7,
      actualDailyMinutes: scope === 'today' ? actualScopeMinutes : Math.round(actualScopeMinutes / 7),
      actualWeeklyMinutes: scope === 'week' ? actualScopeMinutes : actualScopeMinutes * 7,
      scheduledDiffMinutes,
      actualDiffMinutes,
      scheduledStatus,
      actualStatus,
    };
  });

  const unallocatedDailyMinutes = Math.max(0, 1440 - totalTargetDailyMinutes);
  const unallocatedWeeklyMinutes = Math.max(0, 10080 - totalTargetWeeklyMinutes);
  const totalScheduledDailyMinutes = Math.round(totalScheduledScopeMinutes / 7);
  const totalActualDailyMinutes = Math.round(totalActualScopeMinutes / 7);

  return {
    isConfigured: true,
    totalTargetDailyMinutes,
    totalTargetWeeklyMinutes,
    unallocatedDailyMinutes,
    unallocatedWeeklyMinutes,
    totalScheduledDailyMinutes: scope === 'today' ? totalScheduledScopeMinutes : totalScheduledDailyMinutes,
    totalScheduledWeeklyMinutes: scope === 'week' ? totalScheduledScopeMinutes : totalScheduledScopeMinutes * 7,
    totalActualDailyMinutes: scope === 'today' ? totalActualScopeMinutes : totalActualDailyMinutes,
    totalActualWeeklyMinutes: scope === 'week' ? totalActualScopeMinutes : totalActualScopeMinutes * 7,
    comparisons,
    uncategorizedBlockCount: uncategorizedCount,
  };
}
