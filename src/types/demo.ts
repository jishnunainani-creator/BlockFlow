import { LibraryBlock, ScheduledBlock, Goal, DailyMissionItem } from './timetable';
import { DailyExecutionScore, DailyReflection, MoodEntry, WeeklyExecutionReport, MonthlyPerformanceReport, ProductivityStreak, Achievement } from './execution';

export type DemoProfileType = 
  | 'college_student'
  | 'software_developer'
  | 'working_professional'
  | 'exam_aspirant'
  | 'fitness_planner';

export interface DemoProfileConfig {
  id: DemoProfileType;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  badgeColor: string;
}

export interface DemoProfileData {
  libraryBlocks: LibraryBlock[];
  scheduledBlocks: ScheduledBlock[];
  dailyMissions: DailyMissionItem[];
  goals: Goal[];
  reflections: Record<string, DailyReflection>;
  moods: Record<string, MoodEntry>;
  dailyScores: Record<string, DailyExecutionScore>;
  streaks: ProductivityStreak[];
  achievements: Achievement[];
  aiRecommendations: string[];
}

export const DEMO_PROFILES: DemoProfileConfig[] = [
  {
    id: 'college_student',
    title: 'College Student',
    subtitle: 'CS & Engineering Major',
    icon: '🎓',
    description: 'Operating Systems, DSA Problem Solving, Web Dev Project, Gym, and Exam Prep.',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'software_developer',
    title: 'Software Developer',
    subtitle: 'Full-Stack Engineer',
    icon: '🧑‍💻',
    description: 'Sprint Standup, Feature Engineering, Code Reviews, System Design, and Side Project.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'working_professional',
    title: 'Working Professional',
    subtitle: 'Product & Tech Consultant',
    icon: '💼',
    description: 'Client Syncs, Deep Work Focus Blocks, Strategy Planning, Networking, and Workout.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'exam_aspirant',
    title: 'Competitive Exam Aspirant',
    subtitle: 'CAT / GMAT / UPSC Prep',
    icon: '📚',
    description: 'Quant Mocks, Verbal Reasoning, Current Affairs, Flashcard Revision, and Analysis.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'fitness_planner',
    title: 'Fitness & Lifestyle Planner',
    subtitle: 'Health & Personal Habits',
    icon: '🏋️',
    description: 'Morning Cardio, Strength Training, Meal Prep, Mindfulness, and Habit Tracking.',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
];
