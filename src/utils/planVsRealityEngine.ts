import { ScheduledBlock } from '../types/timetable';
import {
  ExecutionSession,
  DeviationRecord,
  PlanVsRealityMetrics,
  DeviationAnalyticsSummary,
  StudyHistorySummary,
  PlanningInsightPattern,
  TopicStudyItem,
} from '../types/sessionLog';
import { formatMinutesToTimeString } from './timeUtils';

export function calculatePlanVsReality(
  date: string,
  scheduledBlocks: ScheduledBlock[],
  sessions: ExecutionSession[],
  deviations: DeviationRecord[]
): PlanVsRealityMetrics {
  const sessionMap = new Map<string, ExecutionSession>();
  sessions.forEach((s) => {
    if (s.date === date) {
      sessionMap.set(s.scheduledBlockId, s);
    }
  });

  const deviationMap = new Map<string, DeviationRecord>();
  deviations.forEach((d) => {
    if (d.date === date) {
      deviationMap.set(d.scheduledBlockId, d);
    }
  });

  let completedAsPlannedCount = 0;
  let completedDifferentlyCount = 0;
  let rescheduledCount = 0;
  let skippedCount = 0;
  let cancelledCount = 0;

  const items = scheduledBlocks.map((block) => {
    const session = sessionMap.get(block.id);
    const deviation = deviationMap.get(block.id);

    const plannedTimeStr = `${formatMinutesToTimeString(block.startMinutes)} – ${formatMinutesToTimeString(
      block.startMinutes + block.duration
    )}`;

    if (!session) {
      const isCompleted = block.status === 'completed' || block.status === 'faster' || block.status === 'took_longer';
      const isSkipped = block.status === 'skipped' || block.status === 'missed';
      const isRescheduled = block.status === 'rescheduled';
      const isReplaced = block.status === 'replaced';
      const isCancelled = block.status === 'cancelled';

      if (isCompleted) {
        completedAsPlannedCount++;
      } else if (isSkipped) {
        skippedCount++;
      } else if (isRescheduled) {
        rescheduledCount++;
      } else if (isReplaced) {
        completedDifferentlyCount++;
      } else if (isCancelled) {
        cancelledCount++;
      }

      return {
        scheduledBlockId: block.id,
        plannedTitle: block.title,
        plannedTimeStr,
        actualTitle: isReplaced ? 'Replaced' : isSkipped ? 'Skipped' : block.title,
        actualTimeStr: plannedTimeStr,
        status: (block.status as any) || 'not_started',
      };
    }

    // Session exists
    const actualTimeStr = `${formatMinutesToTimeString(session.actualStartMinutes)} – ${formatMinutesToTimeString(
      session.actualStartMinutes + session.actualDuration
    )}`;

    if (session.status === 'completed') {
      if (session.actualTitle === session.plannedTitle) {
        completedAsPlannedCount++;
      } else {
        completedDifferentlyCount++;
      }
    } else if (session.status === 'partially_completed') {
      completedDifferentlyCount++;
    } else if (session.status === 'rescheduled') {
      rescheduledCount++;
    } else if (session.status === 'replaced') {
      completedDifferentlyCount++;
    } else if (session.status === 'skipped') {
      skippedCount++;
    } else if (session.status === 'cancelled') {
      cancelledCount++;
    }

    return {
      scheduledBlockId: block.id,
      plannedTitle: block.title,
      plannedTimeStr,
      actualTitle: session.actualTitle,
      actualTimeStr,
      status: session.status,
      topic: session.topic,
      subtopics: session.subtopics,
      deviationReason: session.deviationReason || deviation?.reason,
    };
  });

  const totalPlannedCount = scheduledBlocks.length;
  const planAdherencePct =
    totalPlannedCount > 0 ? Math.round((completedAsPlannedCount / totalPlannedCount) * 100) : 0;

  // Execution score = weighted completed work (completed as planned or completed differently count vs total)
  const completedTotal = completedAsPlannedCount + completedDifferentlyCount;
  const executionScore =
    totalPlannedCount > 0 ? Math.min(100, Math.round((completedTotal / totalPlannedCount) * 100)) : 0;

  return {
    date,
    planAdherencePct,
    executionScore,
    completedAsPlannedCount,
    completedDifferentlyCount,
    rescheduledCount,
    skippedCount,
    cancelledCount,
    totalPlannedCount,
    items,
  };
}

export function calculateDeviationAnalytics(
  deviations: DeviationRecord[],
  sessions: ExecutionSession[],
  days: number = 30
): DeviationAnalyticsSummary {
  const totalSessions = sessions.length;
  const totalDeviations = deviations.length;

  if (totalSessions < 3 && totalDeviations < 3) {
    return {
      hasEnoughData: false,
      totalDeviations: 0,
      executedAsPlannedPct: 0,
      rescheduledPct: 0,
      replacedPct: 0,
      cancelledSkippedPct: 0,
      reasonBreakdown: [],
    };
  }

  const completedAsPlanned = sessions.filter(
    (s) => s.status === 'completed' && s.actualTitle === s.plannedTitle
  ).length;

  const rescheduled = sessions.filter((s) => s.status === 'rescheduled').length +
    deviations.filter((d) => d.deviationType === 'reschedule').length;

  const replaced = sessions.filter((s) => s.status === 'replaced').length +
    deviations.filter((d) => d.deviationType === 'replacement').length;

  const cancelledSkipped = sessions.filter((s) => s.status === 'skipped' || s.status === 'cancelled').length +
    deviations.filter((d) => d.deviationType === 'skip' || d.deviationType === 'cancellation').length;

  const grandTotal = Math.max(1, completedAsPlanned + rescheduled + replaced + cancelledSkipped);

  const executedAsPlannedPct = Math.round((completedAsPlanned / grandTotal) * 100);
  const rescheduledPct = Math.round((rescheduled / grandTotal) * 100);
  const replacedPct = Math.round((replaced / grandTotal) * 100);
  const cancelledSkippedPct = Math.round((cancelledSkipped / grandTotal) * 100);

  const reasonMap = new Map<string, number>();
  deviations.forEach((d) => {
    if (d.reason) {
      reasonMap.set(d.reason, (reasonMap.get(d.reason) || 0) + 1);
    }
  });
  sessions.forEach((s) => {
    if (s.deviationReason) {
      reasonMap.set(s.deviationReason, (reasonMap.get(s.deviationReason) || 0) + 1);
    }
  });

  const reasonBreakdown = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalDeviations > 0 ? Math.round((count / totalDeviations) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    hasEnoughData: true,
    totalDeviations,
    executedAsPlannedPct,
    rescheduledPct,
    replacedPct,
    cancelledSkippedPct,
    reasonBreakdown,
  };
}

export function calculateStudyAnalytics(
  sessions: ExecutionSession[],
  scheduledBlocks: ScheduledBlock[] = []
): StudyHistorySummary {
  // Filter study related sessions
  const isStudyTitle = (t: string) => {
    const norm = t.toLowerCase();
    return (
      norm.includes('study') ||
      norm.includes('reading') ||
      norm.includes('dsa') ||
      norm.includes('math') ||
      norm.includes('code') ||
      norm.includes('assignment') ||
      norm.includes('course') ||
      norm.includes('learning')
    );
  };

  const studySessions = sessions.filter(
    (s) => isStudyTitle(s.plannedTitle) || isStudyTitle(s.actualTitle) || s.topic
  );

  if (studySessions.length === 0) {
    return {
      hasData: false,
      totalScheduledHours: 0,
      totalActualHours: 0,
      planAdherencePct: 0,
      totalSessionsCount: 0,
      subjectBreakdown: {},
    };
  }

  let totalActualMinutes = 0;
  let totalScheduledMinutes = 0;
  let completedAsPlanned = 0;

  const subjectMap: Record<string, { totalMinutes: number; topics: Map<string, TopicStudyItem> }> = {};

  studySessions.forEach((s) => {
    totalActualMinutes += s.actualDuration;
    totalScheduledMinutes += s.plannedDuration;
    if (s.status === 'completed' && s.actualTitle === s.plannedTitle) {
      completedAsPlanned++;
    }

    const subject = s.actualTitle.trim() || s.plannedTitle.trim();
    if (!subjectMap[subject]) {
      subjectMap[subject] = { totalMinutes: 0, topics: new Map() };
    }

    subjectMap[subject].totalMinutes += s.actualDuration;

    const topicName = s.topic?.trim() || 'General Study';
    const topicObj = subjectMap[subject].topics.get(topicName) || {
      topic: topicName,
      totalMinutes: 0,
      sessionsCount: 0,
      subtopics: [],
      lastStudiedDate: s.date,
    };

    topicObj.totalMinutes += s.actualDuration;
    topicObj.sessionsCount += 1;
    if (s.subtopics && s.subtopics.length > 0) {
      const set = new Set([...topicObj.subtopics, ...s.subtopics]);
      topicObj.subtopics = Array.from(set);
    }
    if (s.date > topicObj.lastStudiedDate) {
      topicObj.lastStudiedDate = s.date;
    }

    subjectMap[subject].topics.set(topicName, topicObj);
  });

  const subjectBreakdownFormatted: Record<string, { totalMinutes: number; topics: TopicStudyItem[] }> = {};
  Object.keys(subjectMap).forEach((sub) => {
    subjectBreakdownFormatted[sub] = {
      totalMinutes: subjectMap[sub].totalMinutes,
      topics: Array.from(subjectMap[sub].topics.values()),
    };
  });

  const planAdherencePct =
    studySessions.length > 0 ? Math.round((completedAsPlanned / studySessions.length) * 100) : 0;

  return {
    hasData: true,
    totalScheduledHours: Number((totalScheduledMinutes / 60).toFixed(1)),
    totalActualHours: Number((totalActualMinutes / 60).toFixed(1)),
    planAdherencePct,
    totalSessionsCount: studySessions.length,
    subjectBreakdown: subjectBreakdownFormatted,
  };
}

export function detectPlanningPatterns(
  sessions: ExecutionSession[],
  deviations: DeviationRecord[]
): PlanningInsightPattern[] {
  const patterns: PlanningInsightPattern[] = [];

  // Minimum evidence threshold: at least 3 relevant instances required
  if (sessions.length < 3) return patterns;

  // 1. Check for timing completion differences (e.g. Evening vs Morning sessions for same topic)
  const topicTimingMap: Record<
    string,
    { morningTotal: number; morningCompleted: number; eveningTotal: number; eveningCompleted: number }
  > = {};

  sessions.forEach((s) => {
    const topicKey = s.plannedTitle.trim();
    if (!topicTimingMap[topicKey]) {
      topicTimingMap[topicKey] = { morningTotal: 0, morningCompleted: 0, eveningTotal: 0, eveningCompleted: 0 };
    }

    const isMorning = s.plannedStartMinutes < 12 * 60; // before 12:00 PM
    const isEvening = s.plannedStartMinutes >= 17 * 60; // 5:00 PM onwards

    if (isMorning) {
      topicTimingMap[topicKey].morningTotal++;
      if (s.status === 'completed') topicTimingMap[topicKey].morningCompleted++;
    } else if (isEvening) {
      topicTimingMap[topicKey].eveningTotal++;
      if (s.status === 'completed') topicTimingMap[topicKey].eveningCompleted++;
    }
  });

  Object.keys(topicTimingMap).forEach((topic) => {
    const stats = topicTimingMap[topic];
    if (stats.morningTotal >= 3 && stats.eveningTotal >= 3) {
      const morningRate = Math.round((stats.morningCompleted / stats.morningTotal) * 100);
      const eveningRate = Math.round((stats.eveningCompleted / stats.eveningTotal) * 100);

      if (morningRate >= 75 && eveningRate <= 60) {
        patterns.push({
          id: `pattern-timing-${topic.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'timing_recommendation',
          title: `Move ${topic} to Morning Window`,
          description: `Your evening ${topic} sessions have a ${eveningRate}% completion rate vs ${morningRate}% in the morning.`,
          evidenceCount: stats.eveningTotal + stats.morningTotal,
          suggestedActionLabel: 'Adjust Future Planning',
        });
      }
    }
  });

  // 2. Check for repeated activity replacements (e.g. Replacing evening study with fitness)
  const replacementMap = new Map<string, { planned: string; actual: string; count: number }>();

  deviations.forEach((d) => {
    if (d.deviationType === 'replacement' && d.actualTitle) {
      const key = `${d.plannedTitle}--->${d.actualTitle}`;
      const existing = replacementMap.get(key) || { planned: d.plannedTitle, actual: d.actualTitle, count: 0 };
      existing.count++;
      replacementMap.set(key, existing);
    }
  });

  replacementMap.forEach(({ planned, actual, count }, key) => {
    if (count >= 3) {
      patterns.push({
        id: `pattern-replace-${key}`,
        type: 'replacement_rule',
        title: `Preferred ${actual} Window Detected`,
        description: `You have replaced ${planned} sessions with ${actual} ${count} times recently.`,
        evidenceCount: count,
        suggestedActionLabel: `Prefer ${actual} in this window`,
        ruleData: {
          activityTitle: actual,
          preferredWindowStart: 18 * 60, // 6 PM
          preferredWindowEnd: 20 * 60, // 8 PM
        },
      });
    }
  });

  return patterns;
}
