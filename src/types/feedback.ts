export type FeedbackCategory = 'bug' | 'feature' | 'ui_ux' | 'performance' | 'general';

export type FeedbackStatus = 'open' | 'in_review' | 'planned' | 'resolved';

export interface FeedbackItem {
  id: string;
  userId?: string | null;
  userEmail: string;
  category: FeedbackCategory;
  rating: number; // 1 to 5
  title: string;
  message: string;
  pageContext?: string;
  status: FeedbackStatus;
  adminNote?: string;
  syncState: 'synced' | 'pending_sync' | 'local_only';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CreateFeedbackInput {
  category: FeedbackCategory;
  rating: number;
  title: string;
  message: string;
  pageContext?: string;
}

export const FEEDBACK_CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  description: string;
  badgeClass: string;
}[] = [
  {
    id: 'feature',
    label: 'Feature Request',
    description: 'Suggest a new capability or workflow',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'bug',
    label: 'Bug Report',
    description: 'Something is broken or behaving unexpectedly',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  {
    id: 'ui_ux',
    label: 'UI & Design',
    description: 'Visual polish, layout, or usability feedback',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Speed, sync latency, or responsiveness',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    id: 'general',
    label: 'General',
    description: 'Overall thoughts or praise',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
];

export const FEEDBACK_STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; badgeClass: string }
> = {
  open: {
    label: 'Open',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  },
  in_review: {
    label: 'In Review',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  planned: {
    label: 'Planned',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  resolved: {
    label: 'Resolved',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
};
