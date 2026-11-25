import { NavView } from '../components/Navigation/Sidebar';

export interface RouteMeta {
  view: NavView;
  path: string;
  title: string;
  section: string;
  breadcrumbLabel: string;
}

export const ROUTES: Record<NavView, RouteMeta> = {
  'my-day': {
    view: 'my-day',
    path: '/today',
    title: 'Today · BlockFlow',
    section: 'Today',
    breadcrumbLabel: 'Today',
  },
  calendar: {
    view: 'calendar',
    path: '/timetable',
    title: 'Timetable · BlockFlow',
    section: 'Timetable',
    breadcrumbLabel: 'Timetable',
  },
  'adaptive-planner': {
    view: 'adaptive-planner',
    path: '/planner',
    title: 'Planner · BlockFlow',
    section: 'Planner',
    breadcrumbLabel: 'Planner',
  },
  goals: {
    view: 'goals',
    path: '/goals',
    title: 'SMART Goals · BlockFlow',
    section: 'Goals',
    breadcrumbLabel: 'Goals',
  },
  'task-inbox': {
    view: 'task-inbox',
    path: '/inbox',
    title: 'Inbox & Notes · BlockFlow',
    section: 'Inbox & Notes',
    breadcrumbLabel: 'Inbox & Notes',
  },
  focus: {
    view: 'focus',
    path: '/focus',
    title: 'Focus Mode · BlockFlow',
    section: 'Focus',
    breadcrumbLabel: 'Focus',
  },
  analytics: {
    view: 'analytics',
    path: '/insights',
    title: 'Productivity Insights · BlockFlow',
    section: 'Insights',
    breadcrumbLabel: 'Insights',
  },
  dashboard: {
    view: 'dashboard',
    path: '/dashboard',
    title: 'Executive Dashboard · BlockFlow',
    section: 'Insights',
    breadcrumbLabel: 'Dashboard',
  },
  'thought-space': {
    view: 'thought-space',
    path: '/thought-space',
    title: 'Thought Space · BlockFlow',
    section: 'Inbox & Notes',
    breadcrumbLabel: 'Thought Space',
  },
  'my-planners': {
    view: 'my-planners',
    path: '/planners',
    title: 'My Planners · BlockFlow',
    section: 'Planner',
    breadcrumbLabel: 'My Planners',
  },
  assignments: {
    view: 'assignments',
    path: '/assignments',
    title: 'Assignment Tracker · BlockFlow',
    section: 'Planner',
    breadcrumbLabel: 'Assignment Tracker',
  },
  library: {
    view: 'library',
    path: '/library',
    title: 'Activity Library · BlockFlow',
    section: 'Timetable',
    breadcrumbLabel: 'Activity Library',
  },
  resources: {
    view: 'resources',
    path: '/resources',
    title: 'Resources · BlockFlow',
    section: 'Timetable',
    breadcrumbLabel: 'Resources',
  },
  templates: {
    view: 'templates',
    path: '/templates',
    title: 'Timetable Templates · BlockFlow',
    section: 'Timetable',
    breadcrumbLabel: 'Templates',
  },
  'ai-insights': {
    view: 'ai-insights',
    path: '/ai-coach',
    title: 'AI Coach · BlockFlow',
    section: 'Insights',
    breadcrumbLabel: 'AI Coach',
  },
  execution: {
    view: 'execution',
    path: '/execution',
    title: 'Execution Intelligence · BlockFlow',
    section: 'Insights',
    breadcrumbLabel: 'Execution Intelligence',
  },
  reminders: {
    view: 'reminders',
    path: '/reminders',
    title: 'Reminders · BlockFlow',
    section: 'Settings',
    breadcrumbLabel: 'Reminders',
  },
  settings: {
    view: 'settings',
    path: '/settings',
    title: 'Settings · BlockFlow',
    section: 'Settings',
    breadcrumbLabel: 'Settings',
  },
  'privacy-policy': {
    view: 'privacy-policy',
    path: '/privacy',
    title: 'Privacy Policy · BlockFlow',
    section: 'Legal',
    breadcrumbLabel: 'Privacy Policy',
  },
  terms: {
    view: 'terms',
    path: '/terms',
    title: 'Terms of Service · BlockFlow',
    section: 'Legal',
    breadcrumbLabel: 'Terms of Service',
  },
  'quick-add': {
    view: 'quick-add',
    path: '/quick-add',
    title: 'Quick Capture · BlockFlow',
    section: 'Inbox & Notes',
    breadcrumbLabel: 'Quick Capture',
  },
  feedback: {
    view: 'feedback',
    path: '/feedback',
    title: 'Feedback · BlockFlow',
    section: 'Feedback',
    breadcrumbLabel: 'Feedback',
  },
};

export const PATH_TO_VIEW_MAP: Record<string, NavView> = {
  '/': 'my-day',
  '/today': 'my-day',
  '/my-day': 'my-day',
  '/home': 'my-day',
  '/calendar': 'calendar',
  '/timetable': 'calendar',
  '/library': 'library',
  '/templates': 'templates',
  '/resources': 'resources',
  '/tools': 'resources',
  '/planner': 'adaptive-planner',
  '/adaptive-planner': 'adaptive-planner',
  '/planners': 'my-planners',
  '/my-planners': 'my-planners',
  '/schedules': 'my-planners',
  '/assignments': 'assignments',
  '/goals': 'goals',
  '/smart-goals': 'goals',
  '/inbox': 'task-inbox',
  '/tasks': 'task-inbox',
  '/task-inbox': 'task-inbox',
  '/notes': 'thought-space',
  '/thought-space': 'thought-space',
  '/thoughts': 'thought-space',
  '/focus': 'focus',
  '/insights': 'analytics',
  '/analytics': 'analytics',
  '/dashboard': 'dashboard',
  '/execution': 'execution',
  '/ai-coach': 'ai-insights',
  '/ai-insights': 'ai-insights',
  '/coach': 'ai-insights',
  '/settings': 'settings',
  '/feedback': 'feedback',
  '/reminders': 'reminders',
  '/privacy': 'privacy-policy',
  '/privacy-policy': 'privacy-policy',
  '/terms': 'terms',
  '/terms-of-service': 'terms',
  '/quick-add': 'quick-add',
  '/quick-capture': 'quick-add',
  '/capture': 'quick-add',
  '/add': 'quick-add',
};

/**
 * Resolves current URL (pathname or hash) to a NavView. Defaults to 'my-day'.
 */
export function getInitialNavView(): NavView {
  if (typeof window === 'undefined') return 'my-day';

  // 1. Check pathname (normalized without trailing slash)
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (PATH_TO_VIEW_MAP[path]) {
    return PATH_TO_VIEW_MAP[path];
  }

  // 2. Check hash fallback (e.g., #/goals or #goals)
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().replace(/\/$/, '');
  if (hash) {
    const hashPath = `/${hash}`;
    if (PATH_TO_VIEW_MAP[hashPath]) {
      return PATH_TO_VIEW_MAP[hashPath];
    }
  }

  return 'my-day';
}

/**
 * Updates browser history and document title for client-side navigation.
 */
export function syncRouteUrl(view: NavView, replace: boolean = false): void {
  if (typeof window === 'undefined') return;

  const route = ROUTES[view] || ROUTES['my-day'];
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const targetPath = route.path;

  const isEquivalent =
    currentPath === targetPath || (view === 'my-day' && (currentPath === '/' || currentPath === '/today'));

  if (!isEquivalent) {
    if (replace) {
      window.history.replaceState({ view }, '', targetPath);
    } else {
      window.history.pushState({ view }, '', targetPath);
    }
  }

  document.title = route.title;
}
