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

// ── EXECUTION OS ENGINE FUNCTIONS ──

export function calculateCompletionProbability(block: ScheduledBlock): number {
  let probability = 85; // Base probability

  // Morning (6 AM - 12 PM) vs Evening (After 8 PM) adjustment
  if (block.startMinutes >= 360 && block.startMinutes <= 720) {
    probability += 9;
  } else if (block.startMinutes >= 1200) {
    probability -= 14;
  }

  // Duration impact: long sessions (>90m) have higher skip risk
  if (block.duration > 90) {
    probability -= 8;
  } else if (block.duration <= 60) {
    probability += 4;
  }

  // Priority adjustment
  if (block.priority === 'high' || block.priority === 'Study') {
    probability += 3;
  }

  return Math.min(99, Math.max(45, probability));
}

export function calculateExecutionScore(blocks: ScheduledBlock[]) {
  if (!blocks || blocks.length === 0) {
    return {
      score: 0,
      consistencyRating: 'No Data' as const,
      focusRating: 'No Data' as const,
      timeAccuracyPct: 0,
      goalProgressPct: 0,
      hasData: false,
    };
  }

  const metrics = calculateAdherenceMetrics(blocks);
  const score = Math.min(100, Math.max(0, metrics.adherenceScore));

  let consistencyRating: 'Excellent' | 'Good' | 'Fair' | 'Needs Focus' | 'No Data' = 'No Data';
  if (metrics.completedCount > 0) {
    if (score >= 90) consistencyRating = 'Excellent';
    else if (score >= 75) consistencyRating = 'Good';
    else if (score >= 60) consistencyRating = 'Fair';
    else consistencyRating = 'Needs Focus';
  }

  return {
    score,
    consistencyRating,
    focusRating: metrics.completedCount > 0 ? (score >= 85 ? ('Excellent' as const) : ('Good' as const)) : ('No Data' as const),
    timeAccuracyPct: metrics.completedCount > 0 ? Math.min(100, score) : 0,
    goalProgressPct: metrics.completedCount > 0 ? Math.min(100, Math.round(score * 0.85)) : 0,
    hasData: true,
  };
}

export function getProductivityDNA(params?: {
  scheduledBlocks?: ScheduledBlock[];
  scheduledBlocksByWeek?: Record<string, ScheduledBlock[]>;
  dailyScores?: Record<string, any>;
}) {
  const allBlocks: ScheduledBlock[] = [];
  if (params?.scheduledBlocks) allBlocks.push(...params.scheduledBlocks);
  if (params?.scheduledBlocksByWeek) {
    Object.values(params.scheduledBlocksByWeek).forEach((bList) => {
      if (Array.isArray(bList)) allBlocks.push(...bList);
    });
  }

  const completedBlocks = allBlocks.filter(
    (b) => b && (b.status === 'completed' || b.status === 'faster' || (b as any).completed === true)
  );

  const completedCount = completedBlocks.length;
  const daysTracked = Object.keys(params?.dailyScores || {}).length;

  // 1. Peak Focus Window
  let peakFocusWindow = 'Insufficient data (3+ completed blocks required)';
  if (completedCount >= 3) {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    completedBlocks.forEach((b) => {
      if (b.startMinutes >= 360 && b.startMinutes < 720) morning++;
      else if (b.startMinutes >= 720 && b.startMinutes < 1080) afternoon++;
      else if (b.startMinutes >= 1080) evening++;
    });

    if (morning >= afternoon && morning >= evening) peakFocusWindow = '8:00 AM – 11:30 AM (Morning)';
    else if (afternoon >= morning && afternoon >= evening) peakFocusWindow = '1:30 PM – 5:00 PM (Afternoon)';
    else peakFocusWindow = '6:30 PM – 9:30 PM (Evening)';
  }

  // 2. Preferred Session Duration
  let preferredSessionMinutes = 'Insufficient data';
  if (completedCount >= 3) {
    const avgDuration = Math.round(
      completedBlocks.reduce((sum, b) => sum + (b.duration || 60), 0) / completedCount
    );
    preferredSessionMinutes = `${avgDuration} mins`;
  }

  // 3. Most Productive Day
  let mostProductiveDay = 'Gathering history (7+ days required)';
  if (daysTracked >= 7 || completedCount >= 10) {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    completedBlocks.forEach((b) => {
      if (typeof b.dayOfWeek === 'number' && b.dayOfWeek >= 0 && b.dayOfWeek <= 6) {
        dayCounts[b.dayOfWeek]++;
      }
    });

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let maxIdx = 0;
    let maxVal = -1;
    dayCounts.forEach((c, idx) => {
      if (c > maxVal) {
        maxVal = c;
        maxIdx = idx;
      }
    });
    if (maxVal > 0) mostProductiveDay = dayNames[maxIdx];
  }

  // 4. Least Productive Time / Fatigue Drop-off
  let leastProductiveTime = 'Gathering history';
  if (allBlocks.length >= 5) {
    const eveningBlocks = allBlocks.filter((b) => b.startMinutes >= 1200);
    const eveningSkipped = eveningBlocks.filter((b) => b.status === 'skipped' || b.status === 'missed').length;
    if (eveningBlocks.length > 0 && eveningSkipped / eveningBlocks.length >= 0.4) {
      leastProductiveTime = 'After 8:00 PM (Fatigue drop-off)';
    } else {
      leastProductiveTime = 'No distinct drop-off';
    }
  }

  // 5. Max Effective Daily Hours
  let maxEffectiveDailyHours = '0h';
  if (completedCount > 0) {
    const totalHours = Math.round((completedBlocks.reduce((sum, b) => sum + (b.duration || 60), 0) / 60) * 10) / 10;
    maxEffectiveDailyHours = `${totalHours}h total`;
  }

  return {
    peakFocusWindow,
    preferredSessionMinutes,
    maxEffectiveDailyHours,
    mostProductiveDay,
    leastProductiveTime,
  };
}

import { ExecutionSession, DeviationRecord } from '../types/sessionLog';

export function processAIExecutionAssistantQuery(
  query: string,
  sessions: ExecutionSession[],
  deviations: DeviationRecord[],
  scheduledBlocks: ScheduledBlock[]
): { response: string; quickLogCandidate?: Partial<ExecutionSession>; replacementCandidate?: any } {
  const norm = query.toLowerCase().trim();

  // 1. AI Quick Logging Intent
  // e.g. "I finished self study. I studied graphs, BFS and DFS and solved 3 LeetCode problems."
  if (norm.includes('finished') || norm.includes('completed') || norm.includes('i studied') || norm.includes('i worked on')) {
    const studyBlock = scheduledBlocks.find(
      (b) => b.title.toLowerCase().includes('study') || b.title.toLowerCase().includes('dsa') || b.title.toLowerCase().includes('code')
    ) || scheduledBlocks[0];

    let topic = 'General Study';
    let subtopics: string[] = [];
    if (norm.includes('graphs')) {
      topic = 'Graphs';
      subtopics = ['BFS', 'DFS'];
    } else if (norm.includes('dynamic programming') || norm.includes('dp')) {
      topic = 'Dynamic Programming';
      subtopics = ['Knapsack', 'Memoization'];
    }

    return {
      response: `Got it! I found your recent scheduled block "${studyBlock?.title || 'Self Study'}". I have prepared a Session Log:\n• Topic: ${topic}\n• Subtopics: ${subtopics.join(', ') || 'None'}\n• Result: Completed\nWould you like me to save this Session Log?`,
      quickLogCandidate: {
        scheduledBlockId: studyBlock?.id || 'block-1',
        plannedTitle: studyBlock?.title || 'Self Study',
        actualTitle: studyBlock?.title || 'Self Study',
        topic,
        subtopics,
        notes: query,
        status: 'completed',
        actualStartMinutes: studyBlock?.startMinutes || 960,
        actualDuration: studyBlock?.duration || 60,
      },
    };
  }

  // 2. Replacement Intent
  // e.g. "I didn't do DSA today, I went to the gym instead."
  if (norm.includes("didn't do") || norm.includes('went to') || norm.includes('instead') || norm.includes('replaced')) {
    const dsaBlock = scheduledBlocks.find((b) => b.title.toLowerCase().includes('dsa')) || scheduledBlocks[0];

    return {
      response: `I'll record your change of plan for "${dsaBlock?.title || 'DSA Practice'}":\n• Planned: ${dsaBlock?.title || 'DSA Practice'}\n• Actual: Fitness / Gym\n• Deviation Reason: Health / fitness\nWhat should happen to ${dsaBlock?.title || 'DSA Practice'}?`,
      replacementCandidate: {
        block: dsaBlock,
        actualTitle: 'Fitness / Gym',
        reason: 'Health / fitness',
      },
    };
  }

  // 3. Query Execution History (Part 17)
  if (norm.includes('what did i study') || norm.includes('topics')) {
    if (sessions.length === 0) {
      return { response: 'You haven\'t logged any study sessions yet. Complete a study activity and log what you worked on to build your learning history.' };
    }

    const topicsLogged = sessions
      .filter((s) => s.topic)
      .map((s) => `• ${s.actualTitle}: ${s.topic} (${s.subtopics?.join(', ') || ''})`)
      .slice(0, 5);

    if (topicsLogged.length === 0) {
      return { response: 'No topic-level details logged in your study sessions yet.' };
    }

    return { response: `Here is what you logged recently:\n${topicsLogged.join('\n')}` };
  }

  if (norm.includes('hours') && norm.includes('study')) {
    const totalMinutes = sessions
      .filter((s) => s.topic || s.actualTitle.toLowerCase().includes('study') || s.actualTitle.toLowerCase().includes('dsa'))
      .reduce((sum, s) => sum + s.actualDuration, 0);

    const hours = (totalMinutes / 60).toFixed(1);
    return { response: `Based on your actual logged sessions, you have completed **${hours} hours** of study time.` };
  }

  if (norm.includes('cancel') || norm.includes('miss') || norm.includes('why')) {
    if (deviations.length === 0) {
      return { response: 'You haven\'t recorded any schedule deviations or missed activities yet.' };
    }

    const reasonsMap: Record<string, number> = {};
    deviations.forEach((d) => {
      reasonsMap[d.reason] = (reasonsMap[d.reason] || 0) + 1;
    });

    const topReason = Object.entries(reasonsMap).sort((a, b) => b[1] - a[1])[0];
    return {
      response: `Based on your real deviation records, your most common reason for missing or changing activities is **"${topReason[0]}"** (${topReason[1]} times).`,
    };
  }

  if (norm.includes('follow') || norm.includes('adherence') || norm.includes('schedule')) {
    const total = sessions.length;
    if (total === 0) {
      return { response: 'Not enough execution history yet to calculate schedule adherence.' };
    }

    const completedAsPlanned = sessions.filter((s) => s.status === 'completed' && s.actualTitle === s.plannedTitle).length;
    const adherence = Math.round((completedAsPlanned / total) * 100);

    return {
      response: `Your overall Plan Adherence score is **${adherence}%** (${completedAsPlanned} of ${total} sessions executed exactly as planned).`,
    };
  }

  return {
    response: `I am monitoring your execution history. You can ask me what you studied, your plan adherence, or log your completed sessions!`,
  };
}



