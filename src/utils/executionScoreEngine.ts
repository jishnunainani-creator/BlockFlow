import { ScheduledBlock } from '../types/timetable';
import { DailyExecutionScore } from '../types/execution';
import { getTodayDateString } from './executionStorage';

export const calculateDailyExecutionScore = (
  blocks: ScheduledBlock[],
  dailyMissionCompleted: boolean,
  focusSessionsCount: number
): DailyExecutionScore => {
  let totalCount = blocks.length;
  if (totalCount === 0) {
    return {
      date: getTodayDateString(),
      overallScore: 0,
      completionPct: 0,
      onTimePct: 0,
      postponedCount: 0,
      skippedCount: 0,
      timeAccuracyPct: 0,
      priorityScores: { high: 0, medium: 0, low: 0 },
      dailyMissionCompleted,
      focusSessionsCount,
      scheduleAdherencePct: 0,
      totalPlannedMinutes: 0,
      totalCompletedMinutes: 0,
      completedCount: 0,
      totalCount: 0,
    };
  }

  let completedCount = 0;
  let onTimeCount = 0;
  let postponedCount = 0;
  let skippedCount = 0;
  let totalPlannedMinutes = 0;
  let totalCompletedMinutes = 0;
  let timeAccuracyTotal = 0;
  let startedCount = 0;

  const priorityStats = {
    high: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 },
  };

  blocks.forEach(block => {
    totalPlannedMinutes += block.duration;
    const isCompleted = block.status === 'completed' || block.status === 'faster' || block.status === 'took_longer';
    
    if (block.status && block.status !== 'not_started') {
      startedCount++;
    }

    if (isCompleted) {
      completedCount++;
      const actualDur = block.actualDuration || block.duration;
      totalCompletedMinutes += actualDur;
      
      const accuracy = Math.max(0, 1 - Math.abs(actualDur - block.duration) / block.duration);
      timeAccuracyTotal += accuracy;
    }

    if (block.status === 'completed' || block.status === 'faster') {
      onTimeCount++;
    } else if (block.status === 'skipped' || block.status === 'missed') {
      skippedCount++;
    } else if (block.status === 'not_started' && block.completedAt) { // heuristic for postponed if needed, keeping simple for now
       // We'll just count as postponed if logic demands it, but standard statuses don't have it explicitly
    }

    const p = (block.priority === 'high' || block.priority === 'medium' || block.priority === 'low') ? block.priority : 'medium';
    priorityStats[p].total++;
    if (isCompleted) priorityStats[p].completed++;
  });

  const completionPct = (completedCount / totalCount) * 100;
  const onTimePct = completedCount > 0 ? (onTimeCount / completedCount) * 100 : 0;
  const timeAccuracyPct = completedCount > 0 ? (timeAccuracyTotal / completedCount) * 100 : 0;
  const scheduleAdherencePct = (startedCount / totalCount) * 100;

  const calcPrioScore = (total: number, comp: number) => total > 0 ? (comp / total) * 100 : 0;
  const priorityScores = {
    high: calcPrioScore(priorityStats.high.total, priorityStats.high.completed),
    medium: calcPrioScore(priorityStats.medium.total, priorityStats.medium.completed),
    low: calcPrioScore(priorityStats.low.total, priorityStats.low.completed),
  };

  // Score weighting
  let overallScore = 0;
  overallScore += (completionPct * 0.25);
  overallScore += (onTimePct * 0.15);
  
  const skippedPenalty = (skippedCount / totalCount) * 10;
  overallScore -= skippedPenalty;
  
  overallScore += (timeAccuracyPct * 0.15);
  
  const priorityWeight = (
    (priorityScores.high * 3) + 
    (priorityScores.medium * 2) + 
    (priorityScores.low * 1)
  ) / 6;
  overallScore += (priorityWeight * 0.15);
  
  if (dailyMissionCompleted) overallScore += 10;
  
  const focusScore = Math.min(focusSessionsCount / 3, 1) * 100;
  overallScore += (focusScore * 0.05);
  
  overallScore += (scheduleAdherencePct * 0.05);

  overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));

  return {
    date: getTodayDateString(),
    overallScore,
    completionPct,
    onTimePct,
    postponedCount,
    skippedCount,
    timeAccuracyPct,
    priorityScores,
    dailyMissionCompleted,
    focusSessionsCount,
    scheduleAdherencePct,
    totalPlannedMinutes,
    totalCompletedMinutes,
    completedCount,
    totalCount
  };
};

export const calculateWeeklyScore = (dailyScores: DailyExecutionScore[]): number => {
  if (dailyScores.length === 0) return 0;
  const total = dailyScores.reduce((acc, score) => acc + score.overallScore, 0);
  return Math.round(total / dailyScores.length);
};

export const calculateMonthlyScore = (weeklyScores: number[]): number => {
  if (weeklyScores.length === 0) return 0;
  const total = weeklyScores.reduce((acc, score) => acc + score, 0);
  return Math.round(total / weeklyScores.length);
};
