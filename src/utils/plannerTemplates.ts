/**
 * Predefined Starter Templates for Custom Planner & Schedule Builder
 * Implements 7 starter templates with sensible default columns, options, and sample rows.
 */

import {
  CustomPlanner,
  PlannerColumn,
  PlannerRow,
  PlannerTemplateType,
} from '../types/customPlanner';

export interface TemplateMetadata {
  id: PlannerTemplateType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accentColor: string;
  badge: string;
  columnsCount: number;
}

export const STARTER_TEMPLATES_METADATA: TemplateMetadata[] = [
  {
    id: 'exam_schedule',
    title: 'Examination Schedule',
    subtitle: 'Academic Assessments & Venues',
    description: 'Track examination dates, start/end times, durations, venues, countdowns, and preparation progress.',
    icon: 'GraduationCap',
    accentColor: '#3B82F6',
    badge: 'Popular',
    columnsCount: 10,
  },
  {
    id: 'assignment_tracker',
    title: 'Assignment Tracker',
    subtitle: 'Coursework & Deliverables',
    description: 'Manage homework, project milestones, due dates, priorities, and submission statuses.',
    icon: 'BookOpen',
    accentColor: '#6366F1',
    badge: 'Academics',
    columnsCount: 7,
  },
  {
    id: 'project_planner',
    title: 'Project Planner',
    subtitle: 'Milestones & Tasks',
    description: 'Organise phases, responsibilities, completion percentages, priorities, and deadlines.',
    icon: 'Layers',
    accentColor: '#8B5CF6',
    badge: 'Productivity',
    columnsCount: 7,
  },
  {
    id: 'event_planner',
    title: 'Event Planner',
    subtitle: 'Gatherings, Conferences & Meetups',
    description: 'Coordinate date/time, locations, budgets, RSVP counts, and preparation checklists.',
    icon: 'CalendarDays',
    accentColor: '#F59E0B',
    badge: 'Planning',
    columnsCount: 7,
  },
  {
    id: 'personal_goals',
    title: 'Personal Goals',
    subtitle: 'Habits & Long-term Milestones',
    description: 'Track SMART goals, metrics, current progress, target values, and achievement statuses.',
    icon: 'Target',
    accentColor: '#10B981',
    badge: 'Self-Growth',
    columnsCount: 6,
  },
  {
    id: 'fitness_planner',
    title: 'Fitness Planner',
    subtitle: 'Workouts, Training & Conditioning',
    description: 'Log exercise regimens, muscle groups, session durations, sets/reps, and workout completions.',
    icon: 'Dumbbell',
    accentColor: '#F43F5E',
    badge: 'Health',
    columnsCount: 7,
  },
  {
    id: 'blank',
    title: 'Custom Blank Planner',
    subtitle: 'Start from Scratch',
    description: 'Clean slate with minimal starter columns. Build your custom schema from the ground up.',
    icon: 'Plus',
    accentColor: '#64748B',
    badge: 'Custom',
    columnsCount: 3,
  },
];

export function getTemplateDefaultColumns(templateType: PlannerTemplateType): PlannerColumn[] {
  switch (templateType) {
    case 'exam_schedule':
      return [
        { id: 'col_icon', name: 'Subject Icon', type: 'icon', visible: true, order: 0, width: 80 },
        { id: 'col_subject', name: 'Subject / Course', type: 'text', required: true, visible: true, order: 1, width: 220 },
        { id: 'col_code', name: 'Course Code', type: 'text', visible: true, order: 2, width: 120 },
        { id: 'col_date', name: 'Exam Date', type: 'date', required: true, visible: true, order: 3, width: 140 },
        { id: 'col_start_time', name: 'Start Time', type: 'time', visible: true, order: 4, width: 110 },
        { id: 'col_duration', name: 'Duration (mins)', type: 'number', visible: true, order: 5, width: 130 },
        { id: 'col_end_time', name: 'End Time', type: 'time', visible: true, order: 6, width: 110 },
        { id: 'col_venue', name: 'Venue / Hall', type: 'text', visible: true, order: 7, width: 150 },
        {
          id: 'col_status',
          name: 'Preparation Status',
          type: 'status',
          visible: true,
          order: 8,
          width: 160,
          options: [
            { id: 'not_started', label: 'Not Started', color: '#EF4444' },
            { id: 'in_revision', label: 'In Revision', color: '#F59E0B' },
            { id: 'confident', label: 'Confident / Ready', color: '#10B981' },
            { id: 'completed', label: 'Exam Completed', color: '#6366F1' },
          ],
        },
        { id: 'col_notes', name: 'Notes & Syllabus', type: 'text', visible: true, order: 9, width: 220 },
      ];

    case 'assignment_tracker':
      return [
        { id: 'col_icon', name: 'Icon', type: 'icon', visible: true, order: 0, width: 80 },
        { id: 'col_title', name: 'Assignment Title', type: 'text', required: true, visible: true, order: 1, width: 220 },
        { id: 'col_course', name: 'Course', type: 'text', visible: true, order: 2, width: 150 },
        { id: 'col_due_date', name: 'Due Date', type: 'date', required: true, visible: true, order: 3, width: 140 },
        {
          id: 'col_priority',
          name: 'Priority',
          type: 'dropdown',
          visible: true,
          order: 4,
          width: 130,
          options: [
            { id: 'p_high', label: 'High Priority', color: '#EF4444' },
            { id: 'p_med', label: 'Medium', color: '#F59E0B' },
            { id: 'p_low', label: 'Low', color: '#3B82F6' },
          ],
        },
        { id: 'col_hours', name: 'Est. Hours', type: 'number', visible: true, order: 5, width: 110 },
        {
          id: 'col_status',
          name: 'Status',
          type: 'status',
          visible: true,
          order: 6,
          width: 150,
          options: [
            { id: 'pending', label: 'Pending', color: '#94A3B8' },
            { id: 'in_progress', label: 'In Progress', color: '#3B82F6' },
            { id: 'submitted', label: 'Submitted', color: '#10B981' },
          ],
        },
      ];

    case 'project_planner':
      return [
        { id: 'col_icon', name: 'Icon', type: 'icon', visible: true, order: 0, width: 80 },
        { id: 'col_task', name: 'Task / Milestone', type: 'text', required: true, visible: true, order: 1, width: 220 },
        { id: 'col_phase', name: 'Phase', type: 'text', visible: true, order: 2, width: 140 },
        { id: 'col_start', name: 'Start Date', type: 'date', visible: true, order: 3, width: 130 },
        { id: 'col_end', name: 'End Date', type: 'date', visible: true, order: 4, width: 130 },
        { id: 'col_progress', name: 'Progress %', type: 'number', visible: true, order: 5, width: 110 },
        {
          id: 'col_status',
          name: 'Status',
          type: 'status',
          visible: true,
          order: 6,
          width: 140,
          options: [
            { id: 'backlog', label: 'Backlog', color: '#64748B' },
            { id: 'active', label: 'In Flight', color: '#3B82F6' },
            { id: 'blocked', label: 'Blocked', color: '#EF4444' },
            { id: 'done', label: 'Done', color: '#10B981' },
          ],
        },
      ];

    case 'event_planner':
      return [
        { id: 'col_icon', name: 'Icon', type: 'icon', visible: true, order: 0, width: 80 },
        { id: 'col_event', name: 'Event Name', type: 'text', required: true, visible: true, order: 1, width: 220 },
        { id: 'col_date', name: 'Date', type: 'date', required: true, visible: true, order: 2, width: 130 },
        { id: 'col_time', name: 'Time', type: 'time', visible: true, order: 3, width: 110 },
        { id: 'col_location', name: 'Location / Venue', type: 'text', visible: true, order: 4, width: 160 },
        { id: 'col_budget', name: 'Budget ($)', type: 'number', visible: true, order: 5, width: 110 },
        {
          id: 'col_status',
          name: 'Status',
          type: 'status',
          visible: true,
          order: 6,
          width: 140,
          options: [
            { id: 'planning', label: 'Planning', color: '#F59E0B' },
            { id: 'confirmed', label: 'Confirmed', color: '#10B981' },
            { id: 'archived', label: 'Past Event', color: '#94A3B8' },
          ],
        },
      ];

    case 'personal_goals':
      return [
        { id: 'col_icon', name: 'Icon', type: 'icon', visible: true, order: 0, width: 80 },
        { id: 'col_goal', name: 'Goal Title', type: 'text', required: true, visible: true, order: 1, width: 220 },
        { id: 'col_category', name: 'Category', type: 'text', visible: true, order: 2, width: 140 },
        { id: 'col_target_date', name: 'Target Date', type: 'date', visible: true, order: 3, width: 130 },
        { id: 'col_metric', name: 'Current / Target', type: 'text', visible: true, order: 4, width: 140 },
        {
          id: 'col_status',
          name: 'Status',
          type: 'status',
          visible: true,
          order: 5,
          width: 140,
          options: [
            { id: 'active', label: 'In Progress', color: '#3B82F6' },
            { id: 'achieved', label: 'Achieved', color: '#10B981' },
            { id: 'paused', label: 'On Hold', color: '#64748B' },
          ],
        },
      ];

    case 'fitness_planner':
      return [
        { id: 'col_icon', name: 'Icon', type: 'icon', visible: true, order: 0, width: 80 },
        { id: 'col_exercise', name: 'Workout / Exercise', type: 'text', required: true, visible: true, order: 1, width: 220 },
        { id: 'col_muscle', name: 'Focus Area', type: 'text', visible: true, order: 2, width: 140 },
        { id: 'col_date', name: 'Date', type: 'date', required: true, visible: true, order: 3, width: 130 },
        { id: 'col_duration', name: 'Duration (mins)', type: 'number', visible: true, order: 4, width: 130 },
        { id: 'col_sets', name: 'Sets / Reps / Weight', type: 'text', visible: true, order: 5, width: 160 },
        { id: 'col_done', name: 'Completed', type: 'checkbox', visible: true, order: 6, width: 100 },
      ];

    case 'blank':
    default:
      return [
        { id: 'col_title', name: 'Title', type: 'text', required: true, visible: true, order: 0, width: 240 },
        { id: 'col_date', name: 'Date', type: 'date', visible: true, order: 1, width: 140 },
        {
          id: 'col_status',
          name: 'Status',
          type: 'status',
          visible: true,
          order: 2,
          width: 150,
          options: [
            { id: 'todo', label: 'To Do', color: '#94A3B8' },
            { id: 'in_progress', label: 'In Progress', color: '#3B82F6' },
            { id: 'done', label: 'Done', color: '#10B981' },
          ],
        },
      ];
  }
}

export function generateTemplateSampleRows(plannerId: string, templateType: PlannerTemplateType): PlannerRow[] {
  const now = Date.now();
  const today = new Date();
  const formatISO = (d: Date) => d.toISOString().split('T')[0];

  const inDays = (days: number) => {
    const target = new Date(today);
    target.setDate(target.getDate() + days);
    return formatISO(target);
  };

  switch (templateType) {
    case 'exam_schedule':
      return [
        {
          id: `row_exam_1_${now}`,
          plannerId,
          order: 0,
          createdAt: now,
          updatedAt: now,
          values: {
            col_icon: 'Calculator',
            col_subject: 'Differential Equations & Linear Algebra',
            col_code: 'MAT210',
            col_date: inDays(2),
            col_start_time: '09:00',
            col_duration: 180,
            col_end_time: '12:00',
            col_venue: 'Hall B - Room 204',
            col_status: 'in_revision',
            col_notes: 'Chapters 4-8: Eigenvalues, Matrix Diagonalization, ODEs',
          },
        },
        {
          id: `row_exam_2_${now}`,
          plannerId,
          order: 1,
          createdAt: now + 1,
          updatedAt: now + 1,
          values: {
            col_icon: 'Code',
            col_subject: 'Operating Systems & Distributed Computing',
            col_code: 'CS401',
            col_date: inDays(5),
            col_start_time: '14:00',
            col_duration: 120,
            col_end_time: '16:00',
            col_venue: 'Science Complex - Amphitheater 1',
            col_status: 'confident',
            col_notes: 'Concurrency, Mutex Locks, Page Replacement Algorithms',
          },
        },
        {
          id: `row_exam_3_${now}`,
          plannerId,
          order: 2,
          createdAt: now + 2,
          updatedAt: now + 2,
          values: {
            col_icon: 'Cpu',
            col_subject: 'Digital System Design & FPGA Synthesis',
            col_code: 'ECE330',
            col_date: inDays(9),
            col_start_time: '10:00',
            col_duration: 150,
            col_end_time: '12:30',
            col_venue: 'Engineering Wing - Lab 4B',
            col_status: 'not_started',
            col_notes: 'Verilog state machines, timing constraints & pipelining',
          },
        },
      ];

    case 'assignment_tracker':
      return [
        {
          id: `row_asgn_1_${now}`,
          plannerId,
          order: 0,
          createdAt: now,
          updatedAt: now,
          values: {
            col_icon: 'FileCode',
            col_title: 'Kernel Scheduler Implementation',
            col_course: 'CS401 Operating Systems',
            col_due_date: inDays(3),
            col_priority: 'p_high',
            col_hours: 8,
            col_status: 'in_progress',
          },
        },
        {
          id: `row_asgn_2_${now}`,
          plannerId,
          order: 1,
          createdAt: now + 1,
          updatedAt: now + 1,
          values: {
            col_icon: 'Sigma',
            col_title: 'Fourier Transform Problem Set',
            col_course: 'MAT210 Linear Algebra',
            col_due_date: inDays(7),
            col_priority: 'p_med',
            col_hours: 4,
            col_status: 'pending',
          },
        },
      ];

    case 'fitness_planner':
      return [
        {
          id: `row_fit_1_${now}`,
          plannerId,
          order: 0,
          createdAt: now,
          updatedAt: now,
          values: {
            col_icon: 'Dumbbell',
            col_exercise: 'Barbell Squats & Romanian Deadlifts',
            col_muscle: 'Lower Body / Posterior Chain',
            col_date: inDays(0),
            col_duration: 60,
            col_sets: '4 sets x 8 reps @ 100kg',
            col_done: true,
          },
        },
        {
          id: `row_fit_2_${now}`,
          plannerId,
          order: 1,
          createdAt: now + 1,
          updatedAt: now + 1,
          values: {
            col_icon: 'Activity',
            col_exercise: '5km Zone 2 Recovery Run',
            col_muscle: 'Cardiovascular Conditioning',
            col_date: inDays(1),
            col_duration: 35,
            col_sets: 'Target HR: 135-145 bpm',
            col_done: false,
          },
        },
      ];

    default:
      return [];
  }
}

export function createPlannerFromTemplate(
  templateType: PlannerTemplateType,
  customName?: string,
  customDescription?: string
): { planner: CustomPlanner; rows: PlannerRow[] } {
  const meta = STARTER_TEMPLATES_METADATA.find((m) => m.id === templateType) || STARTER_TEMPLATES_METADATA[6];
  const now = Date.now();
  const plannerId = `planner_${templateType}_${now}`;

  const columns = getTemplateDefaultColumns(templateType);
  const rows = generateTemplateSampleRows(plannerId, templateType);

  const planner: CustomPlanner = {
    id: plannerId,
    name: customName?.trim() || meta.title,
    description: customDescription?.trim() || meta.description,
    icon: meta.icon,
    accentColor: meta.accentColor,
    templateType,
    columns,
    isArchived: false,
    isFavorite: false,
    density: 'comfortable',
    defaultView: 'table',
    createdAt: now,
    updatedAt: now,
    storageState: 'local_only',
  };

  return { planner, rows };
}
