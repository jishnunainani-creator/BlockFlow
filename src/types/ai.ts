export interface AIInsight {
  id: string;
  type: 'peak_performance' | 'timing_suggestion' | 'workload_warning' | 'positive_habit' | 'skipped_trend';
  title: string;
  description: string;
  icon: string;
  recommendation: string;
  confidence: number; // 0 to 100
}

export interface WeeklyAIReport {
  weekId: string;
  adherenceScore: number; // 0 to 100
  adherenceGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  plannedHours: number;
  completedHours: number;
  completedTasksCount: number;
  totalTasksCount: number;
  skippedTasksCount: number;
  topPerformingDay: string;
  mostProductiveActivity: string;
  mostSkippedActivity: string;
  highlights: string[];
  recommendations: string[];
  generatedAt: number;
}
