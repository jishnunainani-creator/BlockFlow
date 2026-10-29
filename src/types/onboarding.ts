import { NavView } from '../components/Navigation/Sidebar';

export interface TourStep {
  stepId: number;
  title: string;
  subtitle?: string;
  badge?: string;
  description: string;
  targetView: NavView;
  selector?: string; // CSS selector or data attribute
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TOUR_STEPS: TourStep[] = [
  {
    stepId: 1,
    title: '1. Reusable Activity Library',
    subtitle: 'Foundation of your timetable',
    badge: 'Foundation',
    description: 'Create reusable activity blocks once—with custom color tags, priority weights, and default durations. Drag and drop them directly into your schedule anytime.',
    targetView: 'library',
    placement: 'center',
  },
  {
    stepId: 2,
    title: '2. Dynamic Timetable Grid',
    subtitle: 'Interactive schedule management',
    badge: 'Calendar',
    description: 'Drag, drop, resize, and manage your weekly timetable seamlessly. Toggle grid resolutions (15m, 30m, 60m) and click any block to view live execution stats.',
    targetView: 'calendar',
    placement: 'center',
  },
  {
    stepId: 3,
    title: '3. Voice & Text AI Scheduler',
    subtitle: 'Hands-free weekly planning',
    badge: 'AI Scheduling',
    description: 'You do not need to schedule manually! Speak or type what you want to accomplish (e.g. "Schedule 2 hours of Deep Work tomorrow morning"), and AI builds your week.',
    targetView: 'calendar',
    placement: 'center',
  },
  {
    stepId: 4,
    title: '4. Adaptive Planner & Conflict Engine',
    subtitle: 'Proactive intelligent schedule recovery',
    badge: '✨ New Feature',
    description: 'Plans change—BlockFlow adapts. The Adaptive Planner detects when activities run long or deadlines shift, spots schedule collisions, and suggests 1-click recovery slots.',
    targetView: 'adaptive-planner',
    placement: 'center',
  },
  {
    stepId: 5,
    title: '5. Task Inbox & Backlog Queue',
    subtitle: 'Frictionless thought capture and triage',
    badge: 'Task Inbox',
    description: 'Dump unscheduled tasks, coursework notes, and quick action items into the inbox. Prioritize them with Eisenhower matrix tags and launch directly into execution.',
    targetView: 'task-inbox',
    placement: 'center',
  },
  {
    stepId: 6,
    title: '6. Connected Focus Sessions',
    subtitle: 'Wall-clock execution tracking',
    badge: '✨ New Feature',
    description: 'Start focused work sessions directly linked to timetable blocks or tasks. Features Pomodoro (25/5), Focus (50/10), or custom timers with wall-clock accuracy across background tabs.',
    targetView: 'my-day',
    placement: 'center',
  },
  {
    stepId: 7,
    title: '7. Assignment Tracker & Study Plans',
    subtitle: 'Deadlines and multi-session milestones',
    badge: 'Coursework',
    description: 'Track academic deadlines and large milestones. AI automatically generates multi-session preparation plans with a 1-click "Add to Calendar" button.',
    targetView: 'assignments',
    placement: 'center',
  },
  {
    stepId: 8,
    title: '8. Mobile Quick Capture & PWA',
    subtitle: 'Lightning-fast mobile entry on the go',
    badge: '✨ New Feature',
    description: 'Capture tasks, assignments, goals, and blocks away from your laptop at /quick-add. Install it directly onto your home screen with offline-ready PWA support.',
    targetView: 'quick-add',
    placement: 'center',
  },
  {
    stepId: 9,
    title: '9. Weekly Review & Transition',
    subtitle: 'Close the loop on your week',
    badge: '✨ New Feature',
    description: 'Reflect on actual executed focus hours vs planned timetable blocks. Identify bottlenecks, score execution consistency, and roll over unresolved tasks into next week.',
    targetView: 'analytics',
    placement: 'center',
  },
  {
    stepId: 10,
    title: '10. Execution Intelligence & DNA',
    subtitle: 'Consistency heatmaps and life balance',
    badge: 'Analytics',
    description: 'Your Daily Execution Score measures adherence, on-time execution, and time accuracy. Inspect your 28-day consistency grid and peak productivity hours.',
    targetView: 'execution',
    placement: 'center',
  },
  {
    stepId: 11,
    title: '11. Privacy-First Local Architecture',
    subtitle: 'Complete data sovereignty & selective sync',
    badge: '✨ New Feature',
    description: 'Your productivity data stays local on your device by default in IndexedDB. Selectively sync designated categories to Supabase with granular consent controls.',
    targetView: 'settings',
    placement: 'center',
  },
  {
    stepId: 12,
    title: '12. You are All Set!',
    subtitle: 'Take control of your execution',
    badge: 'Ready to Flow',
    description: 'You are ready to transform planning into execution. Start with your clean schedule or switch between 5 pre-populated demo profiles anytime!',
    targetView: 'dashboard',
    placement: 'center',
  },
];
