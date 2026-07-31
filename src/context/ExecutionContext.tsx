import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTimetable } from './TimetableContext';
import { 
  DailyExecutionScore, DailyReflection, MoodEntry, WeeklyExecutionReport, MonthlyPerformanceReport,
  ProductivityStreak, Achievement, HabitCorrelation, AIMemory, ImprovementSuggestion, MoodType
} from '../types/execution';
import {
  loadDailyScores, saveDailyScores, loadReflections, saveReflections, loadMoods, saveMoods,
  loadWeeklyReports, saveWeeklyReports, loadMonthlyReports, saveMonthlyReports, loadStreaks,
  saveStreaks, loadAchievements, saveAchievements, loadAIMemory, saveAIMemory, getTodayDateString
} from '../utils/executionStorage';
import { calculateDailyExecutionScore, calculateWeeklyScore } from '../utils/executionScoreEngine';
import { analyzeReflections, generateAIPerformanceSummary, generateTomorrowSuggestions } from '../utils/reflectionEngine';
import { detectHabitCorrelations } from '../utils/habitCorrelationEngine';
import { initializeStreaks, updateStreaks, checkStreakQualifiers } from '../utils/streakEngine';
import { checkAchievements } from '../utils/achievementEngine';
import { ScheduledBlock } from '../types/timetable';

interface ExecutionContextType {
  todayScore: DailyExecutionScore | null;
  todayMood: MoodEntry | null;
  todayReflection: DailyReflection | null;
  
  dailyScores: Record<string, DailyExecutionScore>;
  reflections: Record<string, DailyReflection>;
  moods: Record<string, MoodEntry>;
  
  weeklyReports: Record<string, WeeklyExecutionReport>;
  monthlyReports: Record<string, MonthlyPerformanceReport>;
  
  streaks: ProductivityStreak[];
  achievements: Achievement[];
  
  habitCorrelations: HabitCorrelation[];
  aiMemory: AIMemory | null;
  improvementSuggestions: ImprovementSuggestion[];
  performanceSummary: string[];
  tomorrowSuggestions: string[];
  reflectionInsights: string[];
  
  saveDailyReflection: (reflection: DailyReflection) => void;
  saveMood: (mood: MoodType) => void;
  recalculateTodayScore: () => void;
  generateWeeklyReport: (weekId: string) => WeeklyExecutionReport;
  generateMonthlyReport: (month: string) => MonthlyPerformanceReport;
  refreshInsights: () => void;
}

const ExecutionContext = createContext<ExecutionContextType | undefined>(undefined);

export const ExecutionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentWeekScheduledBlocks } = useTimetable();
  const todayStr = getTodayDateString();

  const [dailyScores, setDailyScores] = useState<Record<string, DailyExecutionScore>>({});
  const [reflections, setReflections] = useState<Record<string, DailyReflection>>({});
  const [moods, setMoods] = useState<Record<string, MoodEntry>>({});
  const [weeklyReports, setWeeklyReports] = useState<Record<string, WeeklyExecutionReport>>({});
  const [monthlyReports, setMonthlyReports] = useState<Record<string, MonthlyPerformanceReport>>({});
  const [streaks, setStreaks] = useState<ProductivityStreak[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [aiMemory, setAiMemory] = useState<AIMemory | null>(null);

  const [todayScore, setTodayScore] = useState<DailyExecutionScore | null>(null);
  
  const [habitCorrelations, setHabitCorrelations] = useState<HabitCorrelation[]>([]);
  const [improvementSuggestions, setImprovementSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<string[]>([]);
  const [tomorrowSuggestions, setTomorrowSuggestions] = useState<string[]>([]);
  const [reflectionInsights, setReflectionInsights] = useState<string[]>([]);

  // 1. Load Data on mount
  useEffect(() => {
    setDailyScores(loadDailyScores());
    setReflections(loadReflections());
    setMoods(loadMoods());
    setWeeklyReports(loadWeeklyReports());
    setMonthlyReports(loadMonthlyReports());
    
    let loadedStreaks = loadStreaks();
    if (!loadedStreaks || loadedStreaks.length === 0) {
      loadedStreaks = initializeStreaks();
    }
    setStreaks(loadedStreaks);
    
    setAchievements(loadAchievements());
    setAiMemory(loadAIMemory());
  }, []);

  const getTodayBlocks = useCallback((): ScheduledBlock[] => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    return currentWeekScheduledBlocks.filter(b => b.dayOfWeek === todayIndex);
  }, [currentWeekScheduledBlocks]);

  // 2. Recalculate Today's Score
  const recalculateTodayScore = useCallback(() => {
    const blocks = getTodayBlocks();
    // Assuming focus sessions count and daily mission can be retrieved from elsewhere, passing 0 and false for now
    const score = calculateDailyExecutionScore(blocks, false, 0);
    setTodayScore(score);
    
    setDailyScores(prev => {
      const next = { ...prev, [todayStr]: score };
      saveDailyScores(next);
      return next;
    });
  }, [getTodayBlocks, todayStr]);

  useEffect(() => {
    recalculateTodayScore();
  }, [currentWeekScheduledBlocks, recalculateTodayScore]);

  // Insights refresh
  const refreshInsights = useCallback(() => {
    if (!todayScore) return;
    const blocks = getTodayBlocks();
    
    const { insights, suggestions } = analyzeReflections(reflections, dailyScores);
    setReflectionInsights(insights);
    setImprovementSuggestions(suggestions);
    
    setPerformanceSummary(generateAIPerformanceSummary(todayScore, blocks));
    setTomorrowSuggestions(generateTomorrowSuggestions(blocks, reflections[todayStr] || null, aiMemory));
    
    setHabitCorrelations(detectHabitCorrelations(dailyScores, reflections, blocks));
  }, [todayScore, getTodayBlocks, reflections, dailyScores, aiMemory, todayStr]);

  useEffect(() => {
    if (todayScore) {
      refreshInsights();
    }
  }, [todayScore, reflections, refreshInsights]);

  // Save Reflection
  const saveDailyReflection = (reflection: DailyReflection) => {
    const updatedReflections = { ...reflections, [reflection.date]: reflection };
    setReflections(updatedReflections);
    saveReflections(updatedReflections);

    // Update streaks
    const blocks = getTodayBlocks();
    const qualifiers = checkStreakQualifiers(blocks, todayScore, true);
    const updatedStreaks = updateStreaks(streaks, reflection.date, qualifiers);
    setStreaks(updatedStreaks);
    saveStreaks(updatedStreaks);

    // Check achievements
    const totalCompleted = Object.values(dailyScores).reduce((acc, score) => acc + score.completedCount, 0);
    const highestScore = Math.max(...Object.values(dailyScores).map(s => s.overallScore), 0);
    const longestStreak = Math.max(...updatedStreaks.map(s => s.longestCount), 0);
    
    const newEarned = checkAchievements(achievements, {
      totalCompletedActivities: totalCompleted,
      highestScore,
      longestStreak,
      reflectionCount: Object.keys(updatedReflections).length,
      weeklyReportsGenerated: Object.keys(weeklyReports).length,
      totalDaysTracked: Object.keys(dailyScores).length
    });

    if (newEarned.length > 0) {
      const updatedAchievements = [...achievements, ...newEarned];
      setAchievements(updatedAchievements);
      saveAchievements(updatedAchievements);
    }
    
    refreshInsights();
  };

  // Save Mood
  const saveMood = (mood: MoodType) => {
    const entry: MoodEntry = { date: todayStr, mood, createdAt: Date.now() };
    const updatedMoods = { ...moods, [todayStr]: entry };
    setMoods(updatedMoods);
    saveMoods(updatedMoods);
  };

  // Generate Reports
  const generateWeeklyReport = (weekId: string): WeeklyExecutionReport => {
    // Simplified stub. Aggregates past 7 days based on dailyScores
    const report: WeeklyExecutionReport = {
      weekId,
      weeklyScore: 0,
      totalPlannedHours: 0,
      totalCompletedHours: 0,
      completionRate: 0,
      dailyScores: [],
      mostProductiveDay: 'Monday',
      leastProductiveDay: 'Sunday',
      mostCompletedCategory: 'Work',
      mostSkippedCategory: 'Personal',
      dailyMissionCompletionRate: 0,
      goalProgress: 0,
      avgFocusTime: 0,
      moodTrend: [],
      aiRecommendations: ["Focus on completing high-priority tasks early."],
      generatedAt: Date.now()
    };
    
    const next = { ...weeklyReports, [weekId]: report };
    setWeeklyReports(next);
    saveWeeklyReports(next);
    return report;
  };

  const generateMonthlyReport = (month: string): MonthlyPerformanceReport => {
    const report: MonthlyPerformanceReport = {
      month,
      monthlyScore: 0,
      avgDailyScore: 0,
      bestWeek: { weekId: '', score: 0 },
      mostConsistentWeek: { weekId: '', variance: 0 },
      totalHoursWorked: 0,
      totalHoursStudied: 0,
      hoursByCategory: {},
      goalCompletionPct: 0,
      habitConsistency: 0,
      productivityTrend: 'stable',
      aiMonthlyReview: "You have shown steady progress this month.",
      weeklyScores: [],
      reflectionCount: 0,
      avgMood: 0,
      generatedAt: Date.now()
    };

    const next = { ...monthlyReports, [month]: report };
    setMonthlyReports(next);
    saveMonthlyReports(next);
    return report;
  };

  return (
    <ExecutionContext.Provider value={{
      todayScore,
      todayMood: moods[todayStr] || null,
      todayReflection: reflections[todayStr] || null,
      dailyScores,
      reflections,
      moods,
      weeklyReports,
      monthlyReports,
      streaks,
      achievements,
      habitCorrelations,
      aiMemory,
      improvementSuggestions,
      performanceSummary,
      tomorrowSuggestions,
      reflectionInsights,
      saveDailyReflection,
      saveMood,
      recalculateTodayScore,
      generateWeeklyReport,
      generateMonthlyReport,
      refreshInsights
    }}>
      {children}
    </ExecutionContext.Provider>
  );
};

export const useExecution = () => {
  const context = useContext(ExecutionContext);
  if (!context) {
    throw new Error('useExecution must be used within an ExecutionProvider');
  }
  return context;
};
