// Enums/Unions
export type MoodType = 'excellent' | 'good' | 'neutral' | 'low' | 'difficult';
export type EnergyLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'very_low';
export type DayRating = 'excellent' | 'good' | 'average' | 'difficult' | 'unproductive';
export type DistractionType = 'social_media' | 'meetings' | 'phone' | 'procrastination' | 'fatigue' | 'other';
export type StreakType = 'daily_mission' | 'reflection' | 'exercise' | 'study_goal' | 'high_score' | 'morning_routine';
export type EndOfDayStep = 'mission_status' | 'mark_remaining' | 'execution_score' | 'reflection' | 'ai_summary' | 'tomorrow_suggestions' | 'completed';

// Core interfaces
export interface DailyExecutionScore {
  date: string; // ISO date string YYYY-MM-DD
  overallScore: number; // 0-100
  completionPct: number;
  onTimePct: number;
  postponedCount: number;
  skippedCount: number;
  timeAccuracyPct: number;
  priorityScores: { high: number; medium: number; low: number }; // each 0-100
  dailyMissionCompleted: boolean;
  focusSessionsCount: number;
  scheduleAdherencePct: number;
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
  completedCount: number;
  totalCount: number;
}

export interface DailyReflection {
  date: string;
  dayRating: DayRating;
  whatWentWell: string;
  whatPreventedWork: string;
  improveTomorrow: string;
  gratitude: string;
  energyLevel: EnergyLevel;
  focusRating: number; // 1-10
  scheduleRealistic: 'yes' | 'no' | 'somewhat';
  distractions: DistractionType[];
  additionalThoughts: string;
  createdAt: number;
}

export interface MoodEntry {
  date: string;
  mood: MoodType;
  createdAt: number;
}

export interface WeeklyExecutionReport {
  weekId: string;
  weeklyScore: number;
  totalPlannedHours: number;
  totalCompletedHours: number;
  completionRate: number;
  dailyScores: { date: string; score: number }[];
  mostProductiveDay: string;
  leastProductiveDay: string;
  mostCompletedCategory: string;
  mostSkippedCategory: string;
  dailyMissionCompletionRate: number;
  goalProgress: number;
  avgFocusTime: number;
  moodTrend: MoodType[];
  aiRecommendations: string[];
  generatedAt: number;
}

export interface MonthlyPerformanceReport {
  month: string; // YYYY-MM
  monthlyScore: number;
  avgDailyScore: number;
  bestWeek: { weekId: string; score: number };
  mostConsistentWeek: { weekId: string; variance: number };
  totalHoursWorked: number;
  totalHoursStudied: number;
  hoursByCategory: Record<string, number>;
  goalCompletionPct: number;
  habitConsistency: number;
  productivityTrend: 'improving' | 'stable' | 'declining';
  aiMonthlyReview: string;
  weeklyScores: { weekId: string; score: number }[];
  reflectionCount: number;
  avgMood: number;
  generatedAt: number;
}

export interface ProductivityStreak {
  type: StreakType;
  label: string;
  icon: string;
  currentCount: number;
  longestCount: number;
  lastCompletedDate: string;
  isActive: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'streak' | 'consistency' | 'growth';
  earnedAt: number;
}

export interface HabitCorrelation {
  id: string;
  description: string;
  confidence: number; // 0-100
  impactDirection: 'positive' | 'negative';
  dataPoints: number;
  category: string;
}

export interface AIMemory {
  preferredWorkingHours: { start: number; end: number };
  frequentDistractions: string[];
  energyPatterns: { morning: number; afternoon: number; evening: number; night: number };
  studyConsistency: number;
  reflectionThemes: string[];
  moodTrends: { avgByDay: Record<string, number> };
  totalDataPoints: number;
  lastUpdated: number;
}

export interface ImprovementSuggestion {
  id: string;
  suggestion: string;
  category: 'scheduling' | 'habits' | 'focus' | 'breaks' | 'energy';
  confidence: number;
  basedOn: string;
}

export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string }> = {
  excellent: { emoji: '😊', label: 'Excellent', color: '#10B981' },
  good: { emoji: '🙂', label: 'Good', color: '#3B82F6' },
  neutral: { emoji: '😐', label: 'Neutral', color: '#F59E0B' },
  low: { emoji: '😔', label: 'Low', color: '#F97316' },
  difficult: { emoji: '😞', label: 'Difficult', color: '#EF4444' },
};

export const ENERGY_CONFIG: Record<EnergyLevel, { label: string; color: string }> = {
  very_high: { label: 'Very High', color: '#10B981' },
  high: { label: 'High', color: '#3B82F6' },
  moderate: { label: 'Moderate', color: '#F59E0B' },
  low: { label: 'Low', color: '#F97316' },
  very_low: { label: 'Very Low', color: '#EF4444' },
};

export const STREAK_CONFIG: Record<StreakType, { label: string; icon: string; description: string }> = {
  daily_mission: { label: 'Daily Mission', icon: '🎯', description: 'Complete all daily mission items' },
  reflection: { label: 'Reflection Journal', icon: '📝', description: 'Complete daily reflection' },
  exercise: { label: 'Exercise', icon: '💪', description: 'Complete a health/fitness activity' },
  study_goal: { label: 'Study Goal', icon: '📚', description: 'Meet daily study hour target' },
  high_score: { label: 'High Score', icon: '🔥', description: 'Achieve 80%+ execution score' },
  morning_routine: { label: 'Morning Routine', icon: '🌅', description: 'First activity done by 9 AM' },
};

export const DAY_RATING_CONFIG: Record<DayRating, { emoji: string; label: string; color: string }> = {
  excellent: { emoji: '🌟', label: 'Excellent', color: '#10B981' },
  good: { emoji: '👍', label: 'Good', color: '#3B82F6' },
  average: { emoji: '😐', label: 'Average', color: '#F59E0B' },
  difficult: { emoji: '😣', label: 'Difficult', color: '#F97316' },
  unproductive: { emoji: '😩', label: 'Unproductive', color: '#EF4444' },
};

export const DISTRACTION_OPTIONS: { type: DistractionType; label: string; icon: string }[] = [
  { type: 'social_media', label: 'Social Media', icon: '📱' },
  { type: 'meetings', label: 'Meetings', icon: '👥' },
  { type: 'phone', label: 'Phone', icon: '📞' },
  { type: 'procrastination', label: 'Procrastination', icon: '⏳' },
  { type: 'fatigue', label: 'Fatigue', icon: '😴' },
  { type: 'other', label: 'Other', icon: '❓' },
];
