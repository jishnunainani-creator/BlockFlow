import { ScheduledBlock, LibraryBlock } from '../types/timetable';
import { AIInsight, WeeklyAIReport } from '../types/ai';
import { DAYS_OF_WEEK, minutesToTimeStr } from './timeUtils';

export function calculateAdherenceMetrics(blocks: ScheduledBlock[]) {
  if (blocks.length === 0) {
    return {
      adherenceScore: 100,
      plannedHours: 0,
      completedHours: 0,
      completedCount: 0,
      totalCount: 0,
      skippedCount: 0,
      grade: 'A+' as const,
    };
  }

  const totalCount = blocks.length;
  let completedCount = 0;
  let skippedCount = 0;
  let plannedMinutes = 0;
  let completedMinutes = 0;

  blocks.forEach((b) => {
    plannedMinutes += b.duration;
    const isDone = b.status === 'completed' || b.status === 'faster' || b.status === 'took_longer';
    if (isDone) {
      completedCount++;
      completedMinutes += b.actualDuration || b.duration;
    } else if (b.status === 'skipped' || b.status === 'missed') {
      skippedCount++;
    }
  });

  const completionRatio = completedCount / totalCount;
  const hoursRatio = plannedMinutes > 0 ? Math.min(1, completedMinutes / plannedMinutes) : 1;

  const rawScore = Math.round((completionRatio * 0.5 + hoursRatio * 0.5) * 100);
  const adherenceScore = Math.min(100, Math.max(0, rawScore));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'C';
  if (adherenceScore >= 90) grade = 'A+';
  else if (adherenceScore >= 80) grade = 'A';
  else if (adherenceScore >= 70) grade = 'B';
  else if (adherenceScore >= 50) grade = 'C';
  else grade = 'D';

  return {
    adherenceScore,
    plannedHours: Number((plannedMinutes / 60).toFixed(1)),
    completedHours: Number((completedMinutes / 60).toFixed(1)),
    completedCount,
    totalCount,
    skippedCount,
    grade,
  };
}

export function generateAIInsights(
  scheduledBlocks: ScheduledBlock[],
  libraryBlocks: LibraryBlock[]
): AIInsight[] {
  const insights: AIInsight[] = [];

  if (scheduledBlocks.length === 0) {
    insights.push({
      id: 'ins-empty',
      type: 'timing_suggestion',
      title: 'Schedule Your Week',
      description: 'Your weekly timetable is currently empty. Drag activity blocks to build your routine.',
      icon: 'sparkles',
      recommendation: 'Use "+ Create New Block" or "✨ AI Auto-Schedule" to build your week.',
      confidence: 100,
    });
    return insights;
  }

  // 1. Morning vs Evening Efficiency
  const morningBlocks = scheduledBlocks.filter((b) => b.startMinutes >= 360 && b.startMinutes < 720); // 06:00 - 12:00
  const eveningBlocks = scheduledBlocks.filter((b) => b.startMinutes >= 1200); // 20:00+

  const morningDone = morningBlocks.filter((b) => b.status === 'completed' || b.status === 'faster').length;
  const morningRate = morningBlocks.length > 0 ? Math.round((morningDone / morningBlocks.length) * 100) : 0;

  const eveningSkipped = eveningBlocks.filter((b) => b.status === 'skipped' || b.status === 'missed').length;
  const eveningSkipRate = eveningBlocks.length > 0 ? Math.round((eveningSkipped / eveningBlocks.length) * 100) : 0;

  if (morningBlocks.length > 0 && morningRate >= 70) {
    insights.push({
      id: 'ins-morning-peak',
      type: 'peak_performance',
      title: 'Morning Productivity Peak Identified',
      description: `You achieve a ${morningRate}% completion rate for tasks scheduled before 12:00 PM.`,
      icon: 'zap',
      recommendation: 'Schedule your most demanding High-Priority tasks (e.g. DSA, Exams) between 8:00 AM and 11:30 AM.',
      confidence: 94,
    });
  }

  if (eveningBlocks.length > 0 && eveningSkipRate >= 40) {
    insights.push({
      id: 'ins-evening-skip',
      type: 'skipped_trend',
      title: 'Late Evening Activity Drop-off',
      description: `Activities scheduled after 8:00 PM are skipped ${eveningSkipRate}% of the time due to fatigue.`,
      icon: 'alert-triangle',
      recommendation: 'Shift workout or study sessions to late afternoon (04:00 PM – 06:00 PM) for better consistency.',
      confidence: 88,
    });
  }

  // 2. High Priority Overload check (3+ consecutive high priority tasks without breaks)
  let consecutiveHigh = 0;
  let hasOverload = false;
  scheduledBlocks.forEach((b) => {
    if (b.priority === 'high') consecutiveHigh++;
    else consecutiveHigh = 0;
    if (consecutiveHigh >= 3) hasOverload = true;
  });

  if (hasOverload) {
    insights.push({
      id: 'ins-overload',
      type: 'workload_warning',
      title: 'High-Intensity Overload Warning',
      description: 'You have 3 or more consecutive high-priority blocks scheduled without recovery breaks.',
      icon: 'shield-alert',
      recommendation: 'Insert 15-minute rest breaks or lower-intensity activities between high-focus blocks to prevent burnout.',
      confidence: 91,
    });
  }

  // 3. Category Habit Insight
  const fitnessBlocks = scheduledBlocks.filter((b) => b.title.toLowerCase().includes('gym') || b.title.toLowerCase().includes('workout'));
  const fitnessDone = fitnessBlocks.filter((b) => b.status === 'completed' || b.status === 'faster').length;
  if (fitnessBlocks.length >= 2 && fitnessDone === fitnessBlocks.length) {
    insights.push({
      id: 'ins-habit-fitness',
      type: 'positive_habit',
      title: 'Strong Fitness Habit Formation',
      description: 'You have achieved a 100% completion rate for Gym & Workout sessions this week!',
      icon: 'award',
      recommendation: 'Maintain your current workout timing slot to consolidate this habit.',
      confidence: 98,
    });
  }

  return insights;
}

export function generateWeeklyAIReport(
  weekId: string,
  scheduledBlocks: ScheduledBlock[]
): WeeklyAIReport {
  const metrics = calculateAdherenceMetrics(scheduledBlocks);

  // Top day calculation
  const dayStats = DAYS_OF_WEEK.map((d) => {
    const dayBlocks = scheduledBlocks.filter((b) => b.dayOfWeek === d.index);
    const done = dayBlocks.filter((b) => b.status === 'completed' || b.status === 'faster').length;
    return { name: d.full, done, total: dayBlocks.length };
  });

  const sortedDays = dayStats.sort((a, b) => b.done - a.done);
  const topDay = sortedDays[0]?.name || 'Monday';

  // Most productive activity
  const activityCounts: Record<string, number> = {};
  scheduledBlocks.forEach((b) => {
    if (b.status === 'completed' || b.status === 'faster') {
      activityCounts[b.title] = (activityCounts[b.title] || 0) + 1;
    }
  });

  const sortedActivities = Object.entries(activityCounts).sort((a, b) => b[1] - a[1]);
  const mostProductiveActivity = sortedActivities[0]?.[0] || 'DSA Practice';

  // Most skipped
  const skippedCounts: Record<string, number> = {};
  scheduledBlocks.forEach((b) => {
    if (b.status === 'skipped' || b.status === 'missed') {
      skippedCounts[b.title] = (skippedCounts[b.title] || 0) + 1;
    }
  });
  const sortedSkipped = Object.entries(skippedCounts).sort((a, b) => b[1] - a[1]);
  const mostSkippedActivity = sortedSkipped[0]?.[0] || 'Late Night Reading';

  return {
    weekId,
    adherenceScore: metrics.adherenceScore,
    adherenceGrade: metrics.grade,
    plannedHours: metrics.plannedHours,
    completedHours: metrics.completedHours,
    completedTasksCount: metrics.completedCount,
    totalTasksCount: metrics.totalCount,
    skippedTasksCount: metrics.skippedCount,
    topPerformingDay: topDay,
    mostProductiveActivity,
    mostSkippedActivity,
    highlights: [
      `Achieved a ${metrics.adherenceScore}% schedule adherence grade (${metrics.grade}).`,
      `Completed ${metrics.completedHours}h out of ${metrics.plannedHours}h planned workload.`,
      `Peak productivity achieved on ${topDay}.`,
    ],
    recommendations: [
      `Schedule your most demanding ${mostProductiveActivity} sessions between 08:00 AM and 11:30 AM.`,
      `Consider moving ${mostSkippedActivity} to an earlier afternoon slot to improve completion rate.`,
      `Maintain regular 15-minute recovery intervals between high-priority sessions.`,
    ],
    generatedAt: Date.now(),
  };
}

export function generateAISmartSchedule(
  libraryBlocks: LibraryBlock[],
  weekId: string
): ScheduledBlock[] {
  const generated: ScheduledBlock[] = [];

  // Core slots pattern based on optimal productivity science
  const dayPatterns = [
    { day: 0, blocks: ['block-gym', 'block-dsa', 'block-internship'] }, // Mon
    { day: 1, blocks: ['block-cat', 'block-internship', 'block-reading'] }, // Tue
    { day: 2, blocks: ['block-gym', 'block-dsa', 'block-revision'] }, // Wed
    { day: 3, blocks: ['block-cat', 'block-internship', 'block-reading'] }, // Thu
    { day: 4, blocks: ['block-gym', 'block-dsa', 'block-revision'] }, // Fri
    { day: 5, blocks: ['block-cat', 'block-reading'] }, // Sat
  ];

  dayPatterns.forEach(({ day, blocks }) => {
    let currentStart = 360; // 06:00 AM

    blocks.forEach((blockId) => {
      const libBlock = libraryBlocks.find((b) => b.id === blockId) || libraryBlocks[0];
      if (!libBlock) return;

      generated.push({
        id: `ai-sched-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
        blockId: libBlock.id,
        title: libBlock.title,
        description: libBlock.description,
        color: libBlock.color,
        priority: libBlock.priority,
        icon: libBlock.icon,
        dayOfWeek: day,
        startMinutes: currentStart,
        duration: libBlock.defaultDuration || 60,
        weekId,
        status: 'not_started',
        reminderMinutes: 15,
      });

      currentStart += (libBlock.defaultDuration || 60) + 30; // 30m break spacing
    });
  });

  return generated;
}
