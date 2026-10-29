/**
 * Thought Space — Type Definitions
 * Distraction-free, local-first hierarchical notes and thoughts workspace.
 */

export type ThoughtColor =
  | 'default'
  | 'sand'
  | 'sage'
  | 'sky'
  | 'lavender'
  | 'rose'
  | 'mint'
  | 'stone';

export interface ThoughtColorConfig {
  id: ThoughtColor;
  label: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  dotColor: string;
}

export const THOUGHT_COLORS: Record<ThoughtColor, ThoughtColorConfig> = {
  default: {
    id: 'default',
    label: 'Slate (Default)',
    bgLight: 'bg-white',
    bgDark: 'dark:bg-slate-900',
    borderLight: 'border-slate-200',
    borderDark: 'dark:border-slate-800',
    dotColor: '#64748b',
  },
  sand: {
    id: 'sand',
    label: 'Warm Sand',
    bgLight: 'bg-amber-50/70',
    bgDark: 'dark:bg-amber-950/20',
    borderLight: 'border-amber-200/80',
    borderDark: 'dark:border-amber-900/40',
    dotColor: '#d97706',
  },
  sage: {
    id: 'sage',
    label: 'Sage Green',
    bgLight: 'bg-emerald-50/70',
    bgDark: 'dark:bg-emerald-950/20',
    borderLight: 'border-emerald-200/80',
    borderDark: 'dark:border-emerald-900/40',
    dotColor: '#059669',
  },
  sky: {
    id: 'sky',
    label: 'Soft Sky',
    bgLight: 'bg-sky-50/70',
    bgDark: 'dark:bg-sky-950/20',
    borderLight: 'border-sky-200/80',
    borderDark: 'dark:border-sky-900/40',
    dotColor: '#0284c7',
  },
  lavender: {
    id: 'lavender',
    label: 'Muted Lavender',
    bgLight: 'bg-purple-50/70',
    bgDark: 'dark:bg-purple-950/20',
    borderLight: 'border-purple-200/80',
    borderDark: 'dark:border-purple-900/40',
    dotColor: '#9333ea',
  },
  rose: {
    id: 'rose',
    label: 'Dusty Rose',
    bgLight: 'bg-rose-50/70',
    bgDark: 'dark:bg-rose-950/20',
    borderLight: 'border-rose-200/80',
    borderDark: 'dark:border-rose-900/40',
    dotColor: '#e11d48',
  },
  mint: {
    id: 'mint',
    label: 'Fresh Mint',
    bgLight: 'bg-teal-50/70',
    bgDark: 'dark:bg-teal-950/20',
    borderLight: 'border-teal-200/80',
    borderDark: 'dark:border-teal-900/40',
    dotColor: '#0d9488',
  },
  stone: {
    id: 'stone',
    label: 'Neutral Stone',
    bgLight: 'bg-stone-50/80',
    bgDark: 'dark:bg-stone-900/40',
    borderLight: 'border-stone-200',
    borderDark: 'dark:border-stone-800',
    dotColor: '#78716c',
  },
};

export const VALID_COLORS = Object.keys(THOUGHT_COLORS) as ThoughtColor[];

export interface ThoughtNote {
  id: string;
  parentNoteId?: string | null;
  title: string;
  body: string;
  color: ThoughtColor;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  isArchived: boolean;
}

export interface ThoughtNoteTree extends ThoughtNote {
  depth: number;
  children: ThoughtNoteTree[];
  subnoteCount: number;
}

export type ThoughtSortOption = 'updated_desc' | 'created_desc' | 'title_asc';

export type ThoughtFilterOption = 'all' | 'pinned' | 'archived';

export interface ThoughtSpaceBackup {
  app: 'BlockFlow';
  format: 'thought_space_backup';
  version: 1;
  exportedAt: string;
  noteCount: number;
  notes: ThoughtNote[];
}

export interface ThoughtImportValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalNotes: number;
  rootNotesCount: number;
  subnotesCount: number;
  duplicateIdsCount: number;
  sanitizedNotes: ThoughtNote[];
}

export type DeleteChildrenChoice = 'cascade' | 'reparent';
