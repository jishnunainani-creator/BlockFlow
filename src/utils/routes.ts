import { NavView } from '../components/Navigation/Sidebar';

export interface RouteMeta {
  view: NavView;
  path: string;
  title: string;
  section: string;
  breadcrumbLabel: string;
}

export const ROUTES: Record<NavView, RouteMeta> = {
  dashboard: {
    view: 'dashboard',
    path: '/dashboard',
    title: 'Dashboard · BlockFlow',
    section: 'Overview',
    breadcrumbLabel: 'Dashboard',
  },
  calendar: {
    view: 'calendar',
    path: '/calendar',
    title: 'Calendar & Timetable · BlockFlow',
    section: 'Plan & Organize',
    breadcrumbLabel: 'Calendar & Timetable',
  },
  'task-inbox': {
    view: 'task-inbox',
    path: '/tasks',
    title: 'Task Inbox · BlockFlow',
    section: 'Plan & Organize',
    breadcrumbLabel: 'Task Inbox',
  },
  assignments: {
    view: 'assignments',
    path: '/assignments',
    title: 'Assignment Tracker · BlockFlow',
    section: 'Plan & Organize',
    breadcrumbLabel: 'Assignment Tracker',
  },
  goals: {
    view: 'goals',
    path: '/goals',
    title: 'SMART Goals · BlockFlow',
    section: 'Plan & Organize',
    breadcrumbLabel: 'Goals & Planning',
  },
  focus: {
    view: 'focus',
    path: '/focus',
    title: 'Focus Mode · BlockFlow',
    section: 'Focus & Improve',
    breadcrumbLabel: 'Focus Mode',
  },
  library: {
    view: 'library',
    path: '/library',
    title: 'Activity Library · BlockFlow',
    section: 'Focus & Improve',
    breadcrumbLabel: 'Activity Library',
  },
  resources: {
    view: 'resources',
    path: '/resources',
    title: 'Resources · BlockFlow',
    section: 'Focus & Improve',
    breadcrumbLabel: 'Resources',
  },
  templates: {
    view: 'templates',
    path: '/templates',
    title: 'Timetable Templates · BlockFlow',
    section: 'Focus & Improve',
    breadcrumbLabel: 'Templates',
  },
  'ai-insights': {
    view: 'ai-insights',
    path: '/ai-coach',
    title: 'AI Coach · BlockFlow',
    section: 'Focus & Improve',
    breadcrumbLabel: 'AI Coach',
  },
  analytics: {
    view: 'analytics',
    path: '/analytics',
    title: 'Productivity Analytics · BlockFlow',
    section: 'Insights',
    breadcrumbLabel: 'Analytics & Reflection',
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
    section: 'Utilities',
    breadcrumbLabel: 'Reminders',
  },
  settings: {
    view: 'settings',
    path: '/settings',
    title: 'Settings · BlockFlow',
    section: 'Utilities',
    breadcrumbLabel: 'Settings',
  },
};

export const PATH_TO_VIEW_MAP: Record<string, NavView> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/home': 'dashboard',
  '/calendar': 'calendar',
  '/timetable': 'calendar',
  '/tasks': 'task-inbox',
  '/task-inbox': 'task-inbox',
  '/inbox': 'task-inbox',
  '/assignments': 'assignments',
  '/goals': 'goals',
  '/smart-goals': 'goals',
  '/focus': 'focus',
  '/library': 'library',
  '/resources': 'resources',
  '/tools': 'resources',
  '/templates': 'templates',
  '/analytics': 'analytics',
  '/execution': 'execution',
  '/ai-coach': 'ai-insights',
  '/ai-insights': 'ai-insights',
  '/coach': 'ai-insights',
  '/reminders': 'reminders',
  '/settings': 'settings',
};

/**
 * Resolves current URL (pathname or hash) to a NavView. Defaults to 'dashboard'.
 */
export function getInitialNavView(): NavView {
  if (typeof window === 'undefined') return 'dashboard';

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

  return 'dashboard';
}

/**
 * Updates browser history and document title for client-side navigation.
 */
export function syncRouteUrl(view: NavView, replace: boolean = false): void {
  if (typeof window === 'undefined') return;

  const route = ROUTES[view] || ROUTES.dashboard;
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const targetPath = route.path;

  // Don't push if already on the path or on '/' when dashboard
  const isEquivalent =
    currentPath === targetPath || (view === 'dashboard' && (currentPath === '/' || currentPath === '/dashboard'));

  if (!isEquivalent) {
    if (replace) {
      window.history.replaceState({ view }, '', targetPath);
    } else {
      window.history.pushState({ view }, '', targetPath);
    }
  }

  // Update page title
  document.title = route.title;
}
