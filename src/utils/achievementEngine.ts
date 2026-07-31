import { Achievement } from '../types/execution';

export const checkAchievements = (
  existingAchievements: Achievement[],
  stats: {
    totalCompletedActivities: number;
    highestScore: number;
    longestStreak: number;
    reflectionCount: number;
    weeklyReportsGenerated: number;
    totalDaysTracked: number;
  }
): Achievement[] => {
  const earned: Achievement[] = [];
  const existingIds = new Set(existingAchievements.map(a => a.id));

  const addIfNew = (ach: Achievement) => {
    if (!existingIds.has(ach.id)) {
      earned.push(ach);
    }
  };

  const now = Date.now();

  if (stats.totalCompletedActivities >= 10) addIfNew({ id: 'ach-10-activities', title: 'First Ten', description: 'Complete 10 activities', icon: '🎯', category: 'milestone', earnedAt: now });
  if (stats.totalCompletedActivities >= 50) addIfNew({ id: 'ach-50-activities', title: 'Fifty Strong', description: 'Complete 50 activities', icon: '💪', category: 'milestone', earnedAt: now });
  if (stats.totalCompletedActivities >= 100) addIfNew({ id: 'ach-100-activities', title: 'Century Club', description: 'Complete 100 activities', icon: '🏆', category: 'milestone', earnedAt: now });
  if (stats.totalCompletedActivities >= 500) addIfNew({ id: 'ach-500-activities', title: 'Legendary Executor', description: 'Complete 500 activities', icon: '⭐', category: 'milestone', earnedAt: now });

  if (stats.highestScore >= 90) addIfNew({ id: 'ach-first-90', title: 'Excellence Achieved', description: 'Score 90% or higher in daily execution', icon: '🔥', category: 'growth', earnedAt: now });
  
  if (stats.longestStreak >= 7) addIfNew({ id: 'ach-7-streak', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', earnedAt: now });
  if (stats.longestStreak >= 30) addIfNew({ id: 'ach-30-streak', title: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '💎', category: 'streak', earnedAt: now });

  if (stats.reflectionCount >= 1) addIfNew({ id: 'ach-first-reflection', title: 'Self-Aware', description: 'Complete your first daily reflection', icon: '📝', category: 'consistency', earnedAt: now });
  if (stats.reflectionCount >= 30) addIfNew({ id: 'ach-30-reflections', title: 'Deep Thinker', description: 'Complete 30 daily reflections', icon: '🧠', category: 'consistency', earnedAt: now });

  if (stats.weeklyReportsGenerated >= 1) addIfNew({ id: 'ach-first-weekly', title: 'Data Driven', description: 'Generate your first weekly report', icon: '📊', category: 'milestone', earnedAt: now });
  
  if (stats.totalDaysTracked >= 30) addIfNew({ id: 'ach-30-days', title: '30-Day Consistency', description: 'Use BlockFlow for 30 days', icon: '💪', category: 'consistency', earnedAt: now });

  return earned;
};
