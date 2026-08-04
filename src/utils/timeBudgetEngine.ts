import { ScheduledBlock, LibraryBlock } from '../types/timetable';
import { ExecutionSession } from '../types/sessionLog';
import {
  TimeCategory,
  TimeAllocationSummary,
  CategoryAllocationItem,
  ActivityBreakdownItem,
} from '../types/timeBudget';

export type DateScopeFilter = 'today' | 'week' | 'month';

export function calculateTimeAllocationSummary(
  categories: TimeCategory[],
  scheduledBlocks: ScheduledBlock[],
  libraryBlocks: LibraryBlock[] = [],
  executionSessions: ExecutionSession[] = [],
  scope: DateScopeFilter = 'week'
): TimeAllocationSummary {
  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Filter scheduled blocks by date scope
  const todayDayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun

  let filteredBlocks = scheduledBlocks;
  if (scope === 'today') {
    filteredBlocks = scheduledBlocks.filter((b) => b.dayOfWeek === todayDayIndex);
  }

  // Create fast lookup map from libraryBlocks
  const libMap = new Map<string, LibraryBlock>();
  libraryBlocks.forEach((lib) => {
    libMap.set(lib.id, lib);
    libMap.set(lib.title.toLowerCase().trim(), lib);
  });

  // Group scheduled blocks by Category ID and Activity Title
  const catScheduledMap: Record<string, { totalMins: number; count: number; activities: Record<string, { mins: number; count: number }> }> = {};
  const uncategorizedActivities: Record<string, { mins: number; count: number }> = {};
  let totalScheduledMins = 0;
  let uncategorizedMins = 0;

  activeCategories.forEach((cat) => {
    catScheduledMap[cat.id] = { totalMins: 0, count: 0, activities: {} };
  });

  filteredBlocks.forEach((block) => {
    const duration = block.duration || 60;
    totalScheduledMins += duration;

    // Match category ID
    let matchedCatId: string | undefined = block.categoryId;

    if (!matchedCatId && block.blockId) {
      const lib = libMap.get(block.blockId);
      if (lib?.categoryId) matchedCatId = lib.categoryId;
    }

    if (!matchedCatId && block.title) {
      const normTitle = block.title.toLowerCase().trim();
      const lib = libMap.get(normTitle);
      if (lib?.categoryId) matchedCatId = lib.categoryId;
    }

    if (!matchedCatId && block.title) {
      const normTitle = block.title.toLowerCase().trim();
      const catMatch = activeCategories.find(
        (c) => normTitle.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(normTitle)
      );
      if (catMatch) matchedCatId = catMatch.id;
    }

    const titleKey = block.title.trim();

    if (matchedCatId && catScheduledMap[matchedCatId]) {
      const catEntry = catScheduledMap[matchedCatId];
      catEntry.totalMins += duration;
      catEntry.count += 1;

      if (!catEntry.activities[titleKey]) {
        catEntry.activities[titleKey] = { mins: 0, count: 0 };
      }
      catEntry.activities[titleKey].mins += duration;
      catEntry.activities[titleKey].count += 1;
    } else {
      uncategorizedMins += duration;
      if (!uncategorizedActivities[titleKey]) {
        uncategorizedActivities[titleKey] = { mins: 0, count: 0 };
      }
      uncategorizedActivities[titleKey].mins += duration;
      uncategorizedActivities[titleKey].count += 1;
    }
  });

  // Group actual execution sessions by Category ID
  const catActualMap: Record<string, number> = {};
  let totalActualMins = 0;

  executionSessions.forEach((session) => {
    const duration = session.actualDuration || 0;
    totalActualMins += duration;

    let matchedCatId: string | undefined = (session as any).categoryId;
    if (!matchedCatId) {
      const normTitle = session.actualTitle.toLowerCase().trim();
      const lib = libMap.get(normTitle);
      if (lib?.categoryId) matchedCatId = lib.categoryId;
    }

    if (matchedCatId && catScheduledMap[matchedCatId]) {
      catActualMap[matchedCatId] = (catActualMap[matchedCatId] || 0) + duration;
    }
  });

  // Build allocations list
  const allocations: CategoryAllocationItem[] = [];
  let largestCatName: string | undefined;
  let largestCatMins = 0;
  let mostScheduledActTitle: string | undefined;
  let mostScheduledActMins = 0;

  activeCategories.forEach((cat) => {
    const entry = catScheduledMap[cat.id] || { totalMins: 0, count: 0, activities: {} };
    const scheduledMinutes = entry.totalMins;

    if (scheduledMinutes > largestCatMins) {
      largestCatMins = scheduledMinutes;
      largestCatName = cat.name;
    }

    const percentageOfTotalScheduled =
      totalScheduledMins > 0 ? Math.round((scheduledMinutes / totalScheduledMins) * 1000) / 10 : 0;

    // Build Activity Breakdown list inside this category
    const activitiesList: ActivityBreakdownItem[] = Object.entries(entry.activities).map(([title, data]) => {
      if (data.mins > mostScheduledActMins) {
        mostScheduledActMins = data.mins;
        mostScheduledActTitle = title;
      }

      const pctOfCat =
        scheduledMinutes > 0 ? Math.round((data.mins / scheduledMinutes) * 1000) / 10 : 0;

      return {
        title,
        scheduledMinutes: data.mins,
        occurrenceCount: data.count,
        percentageOfCategory: pctOfCat,
      };
    });

    // Sort activities by scheduled duration descending
    activitiesList.sort((a, b) => b.scheduledMinutes - a.scheduledMinutes);

    allocations.push({
      category: cat,
      scheduledMinutes,
      actualMinutes: catActualMap[cat.id],
      occurrenceCount: entry.count,
      percentageOfTotalScheduled,
      activities: activitiesList,
    });
  });

  // Sort categories by scheduled minutes descending
  allocations.sort((a, b) => b.scheduledMinutes - a.scheduledMinutes);

  // Build uncategorized activities list
  const uncategorizedList: ActivityBreakdownItem[] = Object.entries(uncategorizedActivities).map(
    ([title, data]) => ({
      title,
      scheduledMinutes: data.mins,
      occurrenceCount: data.count,
      percentageOfCategory: 100,
    })
  );

  return {
    totalScheduledMinutes: totalScheduledMins,
    totalActualMinutes: totalActualMins,
    largestCategoryName: largestCatName,
    largestCategoryMinutes: largestCatMins,
    mostScheduledActivityTitle: mostScheduledActTitle,
    mostScheduledActivityMinutes: mostScheduledActMins,
    uncategorizedMinutes: uncategorizedMins,
    uncategorizedActivityCount: Object.keys(uncategorizedActivities).length,
    allocations,
    uncategorizedActivities: uncategorizedList,
  };
}
