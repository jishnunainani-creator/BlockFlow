export type TargetPeriodType = 'daily' | 'weekly';
export type TargetType = 'preferred' | 'strict';

export interface TimeCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  isSystemSuggested?: boolean;
}

export interface CategoryBudget {
  categoryId: string;
  targetMinutes: number; // e.g. 300 for 5h
  periodType: TargetPeriodType; // 'daily' or 'weekly'
  targetType: TargetType; // 'preferred' or 'strict'
  weekdayTargetMinutes?: number;
  weekendTargetMinutes?: number;
}

export interface UserTimeBudget {
  isConfigured: boolean;
  categories: TimeCategory[];
  budgets: Record<string, CategoryBudget>; // categoryId -> CategoryBudget
  useDaySpecific: boolean;
  updatedAt: number;
}

export interface CategoryComparisonItem {
  category: TimeCategory;
  budget: CategoryBudget;
  targetDailyMinutes: number;
  targetWeeklyMinutes: number;
  scheduledDailyMinutes: number;
  scheduledWeeklyMinutes: number;
  actualDailyMinutes?: number;
  actualWeeklyMinutes?: number;
  scheduledDiffMinutes: number; // scheduled - target
  actualDiffMinutes?: number; // actual - target
  scheduledStatus: 'on_track' | 'over_budget' | 'under_target';
  actualStatus?: 'on_track' | 'over_budget' | 'under_target';
}

export interface TimeBudgetSummary {
  isConfigured: boolean;
  totalTargetDailyMinutes: number;
  totalTargetWeeklyMinutes: number;
  unallocatedDailyMinutes: number;
  unallocatedWeeklyMinutes: number;
  totalScheduledDailyMinutes: number;
  totalScheduledWeeklyMinutes: number;
  totalActualDailyMinutes: number;
  totalActualWeeklyMinutes: number;
  comparisons: CategoryComparisonItem[];
  uncategorizedBlockCount: number;
}

export const DEFAULT_SUGGESTED_CATEGORIES: Omit<TimeCategory, 'id' | 'displayOrder' | 'isActive'>[] = [
  { name: 'Sleep', color: '#6366F1', icon: 'moon' },
  { name: 'Academics', color: '#3B82F6', icon: 'book' },
  { name: 'Career / Work', color: '#10B981', icon: 'briefcase' },
  { name: 'Fitness', color: '#F59E0B', icon: 'dumbbell' },
  { name: 'Personal / Routine', color: '#EC4899', icon: 'user' },
  { name: 'Travel / Commute', color: '#8B5CF6', icon: 'car' },
  { name: 'Leisure', color: '#06B6D4', icon: 'smile' },
  { name: 'Family', color: '#F97316', icon: 'heart' },
  { name: 'Flexible', color: '#64748B', icon: 'sliders' },
];
