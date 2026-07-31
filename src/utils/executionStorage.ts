export const getTodayDateString = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

import {
  DailyExecutionScore,
  DailyReflection,
  MoodEntry,
  WeeklyExecutionReport,
  MonthlyPerformanceReport,
  ProductivityStreak,
  Achievement,
  AIMemory
} from '../types/execution';

export const loadDailyScores = (): Record<string, DailyExecutionScore> => getStorageItem('blockflow_ei_daily_scores', {});
export const saveDailyScores = (scores: Record<string, DailyExecutionScore>) => setStorageItem('blockflow_ei_daily_scores', scores);

export const loadReflections = (): Record<string, DailyReflection> => getStorageItem('blockflow_ei_reflections', {});
export const saveReflections = (reflections: Record<string, DailyReflection>) => setStorageItem('blockflow_ei_reflections', reflections);

export const loadMoods = (): Record<string, MoodEntry> => getStorageItem('blockflow_ei_moods', {});
export const saveMoods = (moods: Record<string, MoodEntry>) => setStorageItem('blockflow_ei_moods', moods);

export const loadWeeklyReports = (): Record<string, WeeklyExecutionReport> => getStorageItem('blockflow_ei_weekly_reports', {});
export const saveWeeklyReports = (reports: Record<string, WeeklyExecutionReport>) => setStorageItem('blockflow_ei_weekly_reports', reports);

export const loadMonthlyReports = (): Record<string, MonthlyPerformanceReport> => getStorageItem('blockflow_ei_monthly_reports', {});
export const saveMonthlyReports = (reports: Record<string, MonthlyPerformanceReport>) => setStorageItem('blockflow_ei_monthly_reports', reports);

export const loadStreaks = (): ProductivityStreak[] => getStorageItem('blockflow_ei_streaks', []);
export const saveStreaks = (streaks: ProductivityStreak[]) => setStorageItem('blockflow_ei_streaks', streaks);

export const loadAchievements = (): Achievement[] => getStorageItem('blockflow_ei_achievements', []);
export const saveAchievements = (achievements: Achievement[]) => setStorageItem('blockflow_ei_achievements', achievements);

export const loadAIMemory = (): AIMemory | null => getStorageItem('blockflow_ei_ai_memory', null);
export const saveAIMemory = (memory: AIMemory) => setStorageItem('blockflow_ei_ai_memory', memory);

export const loadFocusSessions = (): number => getStorageItem('blockflow_ei_focus_sessions', 0);
export const saveFocusSessions = (count: number) => setStorageItem('blockflow_ei_focus_sessions', count);
