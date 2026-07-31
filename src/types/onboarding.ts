import { NavView } from '../components/Navigation/Sidebar';

export interface TourStep {
  stepId: number;
  title: string;
  description: string;
  targetView: NavView;
  selector?: string; // CSS selector or data attribute
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TOUR_STEPS: TourStep[] = [
  {
    stepId: 1,
    title: '1. Activity Library',
    description: 'Create reusable activity blocks once—with custom color tags, priority, and default duration—and drag them into your schedule anytime.',
    targetView: 'library',
    placement: 'center',
  },
  {
    stepId: 2,
    title: '2. Dynamic Calendar',
    description: 'Drag, drop, resize, and manage your weekly timetable seamlessly. Change grid resolution (15m/30m/60m) and click any block to view stats.',
    targetView: 'calendar',
    placement: 'center',
  },
  {
    stepId: 3,
    title: '3. AI Intelligent Scheduler',
    description: 'You don\'t need to schedule manually! Simply speak or type what you want to do (e.g., "Schedule 2 hours of DSA practice on Tuesday morning"), and AI builds your week.',
    targetView: 'calendar',
    placement: 'center',
  },
  {
    stepId: 4,
    title: '4. Assignment Tracker & AI Study Plans',
    description: 'Track academic coursework and projects. AI automatically generates multi-session study plans with a 1-click "Add to Calendar" button.',
    targetView: 'assignments',
    placement: 'center',
  },
  {
    stepId: 5,
    title: '5. Fullscreen Focus Mode OS',
    description: 'Enter a zero-distraction focus environment with Pomodoro (25/5), Focus (50/10), Deep Work (90/20) timers, and automatic distraction trigger logging.',
    targetView: 'dashboard',
    placement: 'center',
  },
  {
    stepId: 6,
    title: '6. AI Daily Mission',
    description: 'Every day, BlockFlow synthesizes your goals and schedule into a single highest-impact Daily Mission card so you stay focused.',
    targetView: 'dashboard',
    placement: 'center',
  },
  {
    stepId: 7,
    title: '7. Execution Intelligence Score',
    description: 'Productivity isn\'t just checking boxes. Your Daily Execution Score measures task completion, on-time execution, priority weighting, and time accuracy.',
    targetView: 'execution',
    placement: 'center',
  },
  {
    stepId: 8,
    title: '8. Heatmap & Life Balance Meter',
    description: 'Inspect your 28-day consistency grid (GitHub-style) and visualize your life balance across 5 categories with AI imbalance warnings.',
    targetView: 'analytics',
    placement: 'center',
  },
  {
    stepId: 9,
    title: '9. Sunday AI Mentor Review & Future Me',
    description: 'Get weekly AI mentor reports with strategic recommendations, and seal time capsules to your future self to track long-term growth.',
    targetView: 'execution',
    placement: 'center',
  },
  {
    stepId: 10,
    title: '10. You\'re All Set!',
    description: 'You\'re ready to take control of your execution. Start with your own schedule or switch between 5 pre-populated Demo Profiles!',
    targetView: 'dashboard',
    placement: 'center',
  },
];
