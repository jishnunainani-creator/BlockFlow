import { ScheduledBlock } from '../types/timetable';
import { PlanVsRealityMetrics } from '../types/executionOS';
import { DailyExecutionScore } from '../types/execution';

export function calculatePlanVsReality(
  blocks: ScheduledBlock[],
  dailyScores: Record<string, DailyExecutionScore> = {}
): {
  metrics: PlanVsRealityMetrics;
  insights: string[];
  hasData: boolean;
} {
  if (!blocks || blocks.length === 0) {
    return {
      metrics: {
        plannedHoursTotal: 0,
        actualHoursTotal: 0,
        plannedSessionsCount: 0,
        completedSessionsCount: 0,
        adherencePct: 0,
        categoryBreakdown: [],
        timeWindowAdherence: [],
      },
      insights: [
        'Complete your scheduled timetable blocks for at least 2 days to generate live Plan vs Reality insights.',
      ],
      hasData: false,
    };
  }

  let plannedMins = 0;
  let actualMins = 0;
  let plannedCount = 0;
  let completedCount = 0;

  const categoryMap: Record<string, { planned: number; actual: number }> = {};
  const windowMap: Record<string, { planned: number; actual: number }> = {
    Morning: { planned: 0, actual: 0 },
    Afternoon: { planned: 0, actual: 0 },
    Evening: { planned: 0, actual: 0 },
  };

  blocks.forEach((b) => {
    plannedCount++;
    plannedMins += b.duration || 60;

    const cat = b.priority === 'high' ? 'High Priority Work' : b.priority === 'Study' ? 'Study' : 'General Work';
    if (!categoryMap[cat]) categoryMap[cat] = { planned: 0, actual: 0 };
    categoryMap[cat].planned += b.duration || 60;

    let windowName = 'Morning';
    if (b.startMinutes >= 720 && b.startMinutes < 1080) windowName = 'Afternoon';
    else if (b.startMinutes >= 1080) windowName = 'Evening';
    windowMap[windowName].planned += b.duration || 60;

    const isDone = b.status === 'completed' || b.status === 'faster' || (b as any).completed === true;
    if (isDone) {
      completedCount++;
      const dur = b.actualDuration || b.duration || 60;
      actualMins += dur;
      categoryMap[cat].actual += dur;
      windowMap[windowName].actual += dur;
    }
  });

  const plannedHoursTotal = Math.round((plannedMins / 60) * 10) / 10;
  const actualHoursTotal = Math.round((actualMins / 60) * 10) / 10;
  const adherencePct = plannedHoursTotal > 0 ? Math.min(100, Math.round((actualHoursTotal / plannedHoursTotal) * 100)) : 0;

  const categoryBreakdown = Object.entries(categoryMap).map(([category, val]) => ({
    category,
    plannedHours: Math.round((val.planned / 60) * 10) / 10,
    actualHours: Math.round((val.actual / 60) * 10) / 10,
  }));

  const timeWindowAdherence = Object.entries(windowMap).map(([window, val]) => ({
    window,
    plannedHours: Math.round((val.planned / 60) * 10) / 10,
    actualHours: Math.round((val.actual / 60) * 10) / 10,
  }));

  const insights: string[] = [];

  if (completedCount > 0) {
    insights.push(`Overall Plan Execution: You fulfilled ${actualHoursTotal}h out of ${plannedHoursTotal}h planned workload (${adherencePct}% adherence).`);

    const morningVal = windowMap.Morning;
    const morningPct = morningVal.planned > 0 ? Math.round((morningVal.actual / morningVal.planned) * 100) : 0;

    const eveningVal = windowMap.Evening;
    const eveningPct = eveningVal.planned > 0 ? Math.round((eveningVal.actual / eveningVal.planned) * 100) : 0;

    if (morningPct > eveningPct && morningVal.planned > 0) {
      insights.push(`Time Window Efficiency: Your morning adherence (${morningPct}%) significantly outperforms your evening adherence (${eveningPct}%).`);
    }

    if (adherencePct < 70) {
      insights.push(`Workload Buffer Recommendation: Consider reducing planned daily hours by 15-20% to prevent burnout and match actual capacity.`);
    }
  } else {
    insights.push('No completed activities recorded for the selected period.');
  }

  return {
    metrics: {
      plannedHoursTotal,
      actualHoursTotal,
      plannedSessionsCount: plannedCount,
      completedSessionsCount: completedCount,
      adherencePct,
      categoryBreakdown,
      timeWindowAdherence,
    },
    insights,
    hasData: completedCount > 0,
  };
}
