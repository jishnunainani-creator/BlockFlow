export interface TimeCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  isSystemSuggested?: boolean;
}

export interface ActivityBreakdownItem {
  title: string;
  blockId?: string;
  scheduledMinutes: number;
  actualMinutes?: number;
  occurrenceCount: number;
  percentageOfCategory: number;
}

export interface CategoryAllocationItem {
  category: TimeCategory;
  scheduledMinutes: number;
  actualMinutes?: number;
  occurrenceCount: number;
  percentageOfTotalScheduled: number;
  activities: ActivityBreakdownItem[];
}

export interface TimeAllocationSummary {
  totalScheduledMinutes: number;
  totalActualMinutes: number;
  largestCategoryName?: string;
  largestCategoryMinutes?: number;
  mostScheduledActivityTitle?: string;
  mostScheduledActivityMinutes?: number;
  uncategorizedMinutes: number;
  uncategorizedActivityCount: number;
  allocations: CategoryAllocationItem[];
  uncategorizedActivities: ActivityBreakdownItem[];
}

export const DEFAULT_TIME_CATEGORIES: Omit<TimeCategory, 'id' | 'displayOrder' | 'isActive'>[] = [
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
