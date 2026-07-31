import { ProductivityStreak, STREAK_CONFIG, DailyExecutionScore } from '../types/execution';
import { ScheduledBlock } from '../types/timetable';

export const initializeStreaks = (): ProductivityStreak[] => {
  return Object.entries(STREAK_CONFIG).map(([type, config]) => ({
    type: type as ProductivityStreak['type'],
    label: config.label,
    icon: config.icon,
    currentCount: 0,
    longestCount: 0,
    lastCompletedDate: '',
    isActive: false
  }));
};

export const checkStreakQualifiers = (
  blocks: ScheduledBlock[],
  score: DailyExecutionScore | null,
  reflectionDone: boolean
) => {
  let exerciseDone = false;
  let studyGoalMet = false; // Simplified logic, ideally cross-referenced with goals
  let morningRoutineDone = false;

  blocks.forEach(block => {
    const title = block.title.toLowerCase();
    if (block.status === 'completed' || block.status === 'faster' || block.status === 'took_longer') {
      if (title.includes('workout') || title.includes('exercise') || title.includes('gym') || title.includes('run')) {
        exerciseDone = true;
      }
      if (title.includes('study') || title.includes('read') || title.includes('learn')) {
        studyGoalMet = true;
      }
      if (block.startMinutes < 9 * 60) {
        morningRoutineDone = true;
      }
    }
  });

  return {
    dailyMissionDone: score?.dailyMissionCompleted || false,
    reflectionDone,
    exerciseDone,
    studyGoalMet,
    highScore: score ? score.overallScore >= 80 : false,
    morningRoutineDone
  };
};

export const updateStreaks = (
  streaks: ProductivityStreak[],
  date: string,
  qualifiers: ReturnType<typeof checkStreakQualifiers>
): ProductivityStreak[] => {
  
  const yesterday = new Date(new Date(date).getTime() - 86400000);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  return streaks.map(streak => {
    let qualified = false;
    switch (streak.type) {
      case 'daily_mission': qualified = qualifiers.dailyMissionDone; break;
      case 'reflection': qualified = qualifiers.reflectionDone; break;
      case 'exercise': qualified = qualifiers.exerciseDone; break;
      case 'study_goal': qualified = qualifiers.studyGoalMet; break;
      case 'high_score': qualified = qualifiers.highScore; break;
      case 'morning_routine': qualified = qualifiers.morningRoutineDone; break;
    }

    if (qualified) {
      if (streak.lastCompletedDate === yesterdayStr) {
        // Consecutive day
        const currentCount = streak.currentCount + 1;
        return {
          ...streak,
          currentCount,
          longestCount: Math.max(streak.longestCount, currentCount),
          lastCompletedDate: date,
          isActive: true
        };
      } else if (streak.lastCompletedDate === date) {
        // Already updated today
        return streak;
      } else {
        // Broken streak or first time
        return {
          ...streak,
          currentCount: 1,
          longestCount: Math.max(streak.longestCount, 1),
          lastCompletedDate: date,
          isActive: true
        };
      }
    } else {
      // Didn't qualify today
      if (streak.lastCompletedDate !== date && streak.lastCompletedDate !== yesterdayStr) {
        return {
          ...streak,
          currentCount: 0,
          isActive: false
        };
      }
      return streak; // Keep active until day is fully over, or leave as is if just checking mid-day
    }
  });
};
