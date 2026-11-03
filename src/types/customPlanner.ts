/**
 * Custom Planner & Schedule Builder — Core Types
 * Defines the schemas for user-created planners, dynamic columns, rows,
 * views, starter templates, and import/export payloads.
 */

export type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'dropdown'
  | 'checkbox'
  | 'status'
  | 'icon';

export interface DropdownOption {
  id: string;
  label: string;
  color: string; // Hex or CSS color string (e.g. '#3B82F6', '#10B981')
}

export interface PlannerColumn {
  id: string; // e.g. 'col_subject', 'col_exam_date'
  name: string; // e.g. 'Subject / Course'
  type: ColumnType;
  required?: boolean;
  options?: DropdownOption[]; // For 'dropdown' and 'status' types
  defaultValue?: any;
  visible: boolean; // Column visibility toggle
  order: number;
  width?: number; // Optional column pixel width for table layout
}

export interface PlannerRow {
  id: string;
  plannerId: string;
  values: Record<string, any>; // columnId -> cell value
  createdAt: number;
  updatedAt: number;
  order: number;
}

export type PlannerTemplateType =
  | 'exam_schedule'
  | 'assignment_tracker'
  | 'project_planner'
  | 'event_planner'
  | 'personal_goals'
  | 'fitness_planner'
  | 'blank';

export type PlannerDisplayMode = 'table' | 'card' | 'calendar';

export type TableDensity = 'compact' | 'comfortable';

export interface CustomPlanner {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name, e.g. 'GraduationCap'
  iconColor?: string;
  iconBg?: string;
  accentColor: string; // Hex or badge theme color (e.g. '#4F73E3')
  templateType: PlannerTemplateType;
  columns: PlannerColumn[];
  isArchived: boolean;
  isFavorite?: boolean;
  density: TableDensity;
  defaultView: PlannerDisplayMode;
  createdAt: number;
  updatedAt: number;
  storageState?: 'local_only' | 'cloud_synced';
}

export interface PlannerFilterState {
  searchQuery: string;
  columnFilters: Record<string, any>; // columnId -> filter value
  sortByColumnId?: string;
  sortDirection?: 'asc' | 'desc';
  showArchived?: boolean;
}

export interface ExamCountdownInfo {
  examId: string;
  subject: string;
  courseCode: string;
  icon: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  venue: string;
  status: string;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  isToday: boolean;
  isPast: boolean;
  rawDiffMs: number;
}

export interface ExamOverlapConflict {
  date: string;
  firstExamId: string;
  firstExamTitle: string;
  firstExamTime: string;
  secondExamId: string;
  secondExamTitle: string;
  secondExamTime: string;
}

export interface PlannerExportData {
  version: 1;
  exportedAt: string;
  planner: CustomPlanner;
  rows: PlannerRow[];
}

export interface PlannerBackupPackage {
  version: 1;
  app: 'BlockFlow';
  type: 'custom_planners_backup';
  exportedAt: string;
  planners: Array<{
    planner: CustomPlanner;
    rows: PlannerRow[];
  }>;
}
