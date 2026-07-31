import { DemoProfileType, DemoProfileData } from '../types/demo';
import { LibraryBlock, ScheduledBlock, Goal, DailyMissionItem } from '../types/timetable';
import { DailyExecutionScore, DailyReflection, MoodEntry, ProductivityStreak, Achievement } from '../types/execution';
import { getISOWeekString } from './timeUtils';

export function getDemoProfileData(profileType: DemoProfileType): DemoProfileData {
  const currentWeekId = getISOWeekString();
  const todayStr = new Date().toISOString().split('T')[0];

  const getPastDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  switch (profileType) {
    case 'college_student': return getCollegeStudentProfile(currentWeekId, todayStr, getPastDateStr);
    case 'software_developer': return getSoftwareDeveloperProfile(currentWeekId, todayStr, getPastDateStr);
    case 'working_professional': return getWorkingProfessionalProfile(currentWeekId, todayStr, getPastDateStr);
    case 'exam_aspirant': return getExamAspirantProfile(currentWeekId, todayStr, getPastDateStr);
    case 'fitness_planner': return getFitnessPlannerProfile(currentWeekId, todayStr, getPastDateStr);
    default: return getCollegeStudentProfile(currentWeekId, todayStr, getPastDateStr);
  }
}

// ── 1. COLLEGE STUDENT PROFILE ──
function getCollegeStudentProfile(weekId: string, todayStr: string, pastDate: (days: number) => string): DemoProfileData {
  const libraryBlocks: LibraryBlock[] = [
    { id: 'lib-1', title: 'Operating Systems Lecture', defaultDuration: 90, color: '#3B82F6', icon: 'book', priority: 'high' },
    { id: 'lib-2', title: 'DSA Sheet Problems', defaultDuration: 120, color: '#10B981', icon: 'code', priority: 'high' },
    { id: 'lib-3', title: 'Web Dev Project Sprint', defaultDuration: 90, color: '#8B5CF6', icon: 'briefcase', priority: 'medium' },
    { id: 'lib-4', title: 'Evening Workout & Core', defaultDuration: 60, color: '#EF4444', icon: 'dumbbell', priority: 'medium' },
    { id: 'lib-5', title: 'Tech Club Meeting', defaultDuration: 60, color: '#F59E0B', icon: 'user', priority: 'low' },
    { id: 'lib-6', title: 'Non-Fiction Reading', defaultDuration: 45, color: '#EC4899', icon: 'coffee', priority: 'personal' },
  ];

  const scheduledBlocks: ScheduledBlock[] = [
    // Mon
    { id: 'sb-1', blockId: 'lib-1', title: 'Operating Systems Lecture', color: '#3B82F6', priority: 'high', icon: 'book', dayOfWeek: 0, startMinutes: 540, duration: 90, weekId, status: 'completed' },
    { id: 'sb-2', blockId: 'lib-2', title: 'DSA Sheet Problems', color: '#10B981', priority: 'high', icon: 'code', dayOfWeek: 0, startMinutes: 660, duration: 120, weekId, status: 'completed' },
    { id: 'sb-3', blockId: 'lib-4', title: 'Evening Workout & Core', color: '#EF4444', priority: 'medium', icon: 'dumbbell', dayOfWeek: 0, startMinutes: 1080, duration: 60, weekId, status: 'completed' },
    // Tue
    { id: 'sb-4', blockId: 'lib-3', title: 'Web Dev Project Sprint', color: '#8B5CF6', priority: 'medium', icon: 'briefcase', dayOfWeek: 1, startMinutes: 600, duration: 90, weekId, status: 'completed' },
    { id: 'sb-5', blockId: 'lib-2', title: 'DSA Sheet Problems', color: '#10B981', priority: 'high', icon: 'code', dayOfWeek: 1, startMinutes: 840, duration: 120, weekId, status: 'completed' },
    // Wed
    { id: 'sb-6', blockId: 'lib-1', title: 'Operating Systems Lecture', color: '#3B82F6', priority: 'high', icon: 'book', dayOfWeek: 2, startMinutes: 540, duration: 90, weekId, status: 'completed' },
    { id: 'sb-7', blockId: 'lib-5', title: 'Tech Club Meeting', color: '#F59E0B', priority: 'low', icon: 'user', dayOfWeek: 2, startMinutes: 960, duration: 60, weekId, status: 'completed' },
    // Thu
    { id: 'sb-8', blockId: 'lib-2', title: 'DSA Sheet Problems', color: '#10B981', priority: 'high', icon: 'code', dayOfWeek: 3, startMinutes: 600, duration: 120, weekId, status: 'completed' },
    { id: 'sb-9', blockId: 'lib-3', title: 'Web Dev Project Sprint', color: '#8B5CF6', priority: 'medium', icon: 'briefcase', dayOfWeek: 3, startMinutes: 840, duration: 90, weekId, status: 'in_progress' },
    // Fri
    { id: 'sb-10', blockId: 'lib-1', title: 'Operating Systems Revision', color: '#3B82F6', priority: 'high', icon: 'book', dayOfWeek: 4, startMinutes: 540, duration: 90, weekId, status: 'not_started' },
    { id: 'sb-11', blockId: 'lib-4', title: 'Evening Workout & Core', color: '#EF4444', priority: 'medium', icon: 'dumbbell', dayOfWeek: 4, startMinutes: 1080, duration: 60, weekId, status: 'not_started' },
  ];

  const dailyMissions: DailyMissionItem[] = [
    { id: 'm-1', title: 'Solve 4 Graph Algorithm Questions (Striver Sheet)', duration: 120, completionProbability: 92, completed: true },
    { id: 'm-2', title: 'Complete OS Virtual Memory Chapter Notes', duration: 90, completionProbability: 88, completed: true },
    { id: 'm-3', title: 'Finish React Custom Hook Refactoring for Project', duration: 90, completionProbability: 85, completed: false },
    { id: 'm-4', title: '45-Min Gym Workout & Hydration Target', duration: 45, completionProbability: 95, completed: true },
  ];

  const goals: Goal[] = [
    { id: 'g-1', title: 'Master 100 Striver DSA Problems', category: 'Coding', targetHoursPerDay: 2.5, progressPct: 68, deadline: 'September 2026', color: '#10B981' },
    { id: 'g-2', title: 'Maintain 90%+ Execution Score', category: 'Productivity', targetHoursPerDay: 4.0, progressPct: 88, deadline: 'December 2026', color: '#3B82F6' },
    { id: 'g-3', title: 'Ship Portfolio Web Application', category: 'Project', targetHoursPerDay: 1.5, progressPct: 75, deadline: 'August 2026', color: '#8B5CF6' },
  ];

  const reflections: Record<string, DailyReflection> = {
    [pastDate(1)]: {
      date: pastDate(1), dayRating: 'excellent',
      whatWentWell: 'Crushed 5 Graph questions on Striver sheet and finished OS assignment early.',
      whatPreventedWork: 'Slight fatigue after lunch, took a 20-min power nap.',
      improveTomorrow: 'Start DSA session immediately at 10 AM without checking social media.',
      gratitude: 'Grateful for good coffee and steady focus window in morning.',
      energyLevel: 'high', focusRating: 9, scheduleRealistic: 'yes', distractions: ['phone'],
      additionalThoughts: 'Felt in flow state during coding block.', createdAt: Date.now() - 86400000,
    },
    [pastDate(2)]: {
      date: pastDate(2), dayRating: 'good',
      whatWentWell: 'Completed OS lecture notes and attended club meeting on time.',
      whatPreventedWork: 'Prolonged discussion during club meeting pushed evening study back.',
      improveTomorrow: 'Set strict time limit for extracurricular meetings.',
      gratitude: 'Great collaboration with team members.',
      energyLevel: 'moderate', focusRating: 7, scheduleRealistic: 'somewhat', distractions: ['meetings'],
      additionalThoughts: 'Adjusted evening schedule dynamically.', createdAt: Date.now() - 172800000,
    },
  };

  const moods: Record<string, MoodEntry> = {
    [pastDate(0)]: { date: pastDate(0), mood: 'excellent', createdAt: Date.now() },
    [pastDate(1)]: { date: pastDate(1), mood: 'good', createdAt: Date.now() - 86400000 },
    [pastDate(2)]: { date: pastDate(2), mood: 'neutral', createdAt: Date.now() - 172800000 },
    [pastDate(3)]: { date: pastDate(3), mood: 'good', createdAt: Date.now() - 259200000 },
    [pastDate(4)]: { date: pastDate(4), mood: 'excellent', createdAt: Date.now() - 345600000 },
  };

  const dailyScores: Record<string, DailyExecutionScore> = {
    [pastDate(0)]: { date: pastDate(0), overallScore: 92, completionPct: 88, onTimePct: 90, postponedCount: 0, skippedCount: 0, timeAccuracyPct: 94, priorityScores: { high: 100, medium: 80, low: 75 }, dailyMissionCompleted: true, focusSessionsCount: 3, scheduleAdherencePct: 92, totalPlannedMinutes: 300, totalCompletedMinutes: 270, completedCount: 3, totalCount: 3 },
    [pastDate(1)]: { date: pastDate(1), overallScore: 88, completionPct: 85, onTimePct: 85, postponedCount: 1, skippedCount: 0, timeAccuracyPct: 90, priorityScores: { high: 90, medium: 85, low: 80 }, dailyMissionCompleted: true, focusSessionsCount: 2, scheduleAdherencePct: 88, totalPlannedMinutes: 270, totalCompletedMinutes: 240, completedCount: 2, totalCount: 3 },
    [pastDate(2)]: { date: pastDate(2), overallScore: 81, completionPct: 75, onTimePct: 80, postponedCount: 1, skippedCount: 1, timeAccuracyPct: 85, priorityScores: { high: 80, medium: 75, low: 70 }, dailyMissionCompleted: false, focusSessionsCount: 2, scheduleAdherencePct: 80, totalPlannedMinutes: 240, totalCompletedMinutes: 180, completedCount: 2, totalCount: 3 },
  };

  const streaks: ProductivityStreak[] = [
    { type: 'daily_mission', label: 'Daily Mission', icon: '🎯', currentCount: 5, longestCount: 12, lastCompletedDate: todayStr, isActive: true },
    { type: 'high_score', label: 'High Score (80%+)', icon: '🔥', currentCount: 4, longestCount: 9, lastCompletedDate: todayStr, isActive: true },
    { type: 'reflection', label: 'Reflection Journal', icon: '📝', currentCount: 3, longestCount: 7, lastCompletedDate: pastDate(1), isActive: true },
    { type: 'exercise', label: 'Gym Workout', icon: '💪', currentCount: 3, longestCount: 5, lastCompletedDate: pastDate(1), isActive: true },
  ];

  const achievements: Achievement[] = [
    { id: 'ach-1', title: 'Excellence Achieved', description: 'Score 90%+ Execution Score on a day', icon: '🔥', category: 'growth', earnedAt: Date.now() - 86400000 },
    { id: 'ach-2', title: 'Fifty Strong', description: 'Complete 50 planned activity blocks', icon: '💪', category: 'milestone', earnedAt: Date.now() - 432000000 },
    { id: 'ach-3', title: 'Self-Aware', description: 'Log your first daily reflection entry', icon: '📝', category: 'consistency', earnedAt: Date.now() - 604800000 },
  ];

  const aiRecommendations = [
    "Your highest focus window occurs between 9:30 AM and 11:30 AM. Keep scheduling DSA problem solving here.",
    "You have a 92% completion rate on High Priority tasks. Great execution discipline!",
    "Consider adding a 10-minute break between OS lectures and coding blocks to maintain peak energy.",
  ];

  return { libraryBlocks, scheduledBlocks, dailyMissions, goals, reflections, moods, dailyScores, streaks, achievements, aiRecommendations };
}

// ── 2. SOFTWARE DEVELOPER PROFILE ──
function getSoftwareDeveloperProfile(weekId: string, todayStr: string, pastDate: (days: number) => string): DemoProfileData {
  const libraryBlocks: LibraryBlock[] = [
    { id: 'dev-1', title: 'Sprint Standup & Backlog Sync', defaultDuration: 30, color: '#3B82F6', icon: 'briefcase', priority: 'high' },
    { id: 'dev-2', title: 'Feature Coding (Deep Work)', defaultDuration: 180, color: '#10B981', icon: 'code', priority: 'high' },
    { id: 'dev-3', title: 'PR Code Reviews & Testing', defaultDuration: 60, color: '#8B5CF6', icon: 'target', priority: 'medium' },
    { id: 'dev-4', title: 'System Design Study', defaultDuration: 60, color: '#F59E0B', icon: 'brain', priority: 'medium' },
    { id: 'dev-5', title: 'Side Project Build', defaultDuration: 90, color: '#EC4899', icon: 'sparkles', priority: 'personal' },
  ];

  const scheduledBlocks: ScheduledBlock[] = [
    { id: 'dsb-1', blockId: 'dev-1', title: 'Sprint Standup & Backlog Sync', color: '#3B82F6', priority: 'high', icon: 'briefcase', dayOfWeek: 0, startMinutes: 570, duration: 30, weekId, status: 'completed' },
    { id: 'dsb-2', blockId: 'dev-2', title: 'Feature Coding (Deep Work)', color: '#10B981', priority: 'high', icon: 'code', dayOfWeek: 0, startMinutes: 600, duration: 180, weekId, status: 'completed' },
    { id: 'dsb-3', blockId: 'dev-3', title: 'PR Code Reviews & Testing', color: '#8B5CF6', priority: 'medium', icon: 'target', dayOfWeek: 0, startMinutes: 840, duration: 60, weekId, status: 'completed' },
    { id: 'dsb-4', blockId: 'dev-2', title: 'Feature Coding (Deep Work)', color: '#10B981', priority: 'high', icon: 'code', dayOfWeek: 1, startMinutes: 600, duration: 180, weekId, status: 'completed' },
    { id: 'dsb-5', blockId: 'dev-4', title: 'System Design Study', color: '#F59E0B', priority: 'medium', icon: 'brain', dayOfWeek: 1, startMinutes: 900, duration: 60, weekId, status: 'completed' },
  ];

  const dailyMissions: DailyMissionItem[] = [
    { id: 'dm-1', title: 'Ship Auth Middleware Bug Fix to Staging', duration: 120, completionProbability: 94, completed: true },
    { id: 'dm-2', title: 'Review 3 Open Frontend Pull Requests', duration: 60, completionProbability: 89, completed: true },
    { id: 'dm-3', title: 'Read System Design Chapter on Distributed Caching', duration: 60, completionProbability: 82, completed: true },
    { id: 'dm-4', title: 'Update API Documentation in Postman', duration: 45, completionProbability: 91, completed: false },
  ];

  const goals: Goal[] = [
    { id: 'dg-1', title: 'Complete Microservices Course', category: 'Learning', targetHoursPerDay: 2.0, progressPct: 80, deadline: 'September 2026', color: '#10B981' },
    { id: 'dg-2', title: 'Zero Critical Release Bugs', category: 'Work', targetHoursPerDay: 3.5, progressPct: 100, deadline: 'December 2026', color: '#3B82F6' },
  ];

  const reflections: Record<string, DailyReflection> = {
    [pastDate(1)]: {
      date: pastDate(1), dayRating: 'excellent',
      whatWentWell: 'Deep work block was completely uninterrupted. Fixed complex race condition in auth service.',
      whatPreventedWork: 'Ad-hoc Slack notifications during afternoon.',
      improveTomorrow: 'Turn on Slack Do Not Disturb mode during 10 AM-1 PM deep work.',
      gratitude: 'Grateful for great IDE tooling and clean architecture.',
      energyLevel: 'very_high', focusRating: 10, scheduleRealistic: 'yes', distractions: ['social_media'],
      additionalThoughts: 'Achieved complete flow state.', createdAt: Date.now() - 86400000,
    },
  };

  const moods: Record<string, MoodEntry> = {
    [pastDate(0)]: { date: pastDate(0), mood: 'excellent', createdAt: Date.now() },
    [pastDate(1)]: { date: pastDate(1), mood: 'excellent', createdAt: Date.now() - 86400000 },
    [pastDate(2)]: { date: pastDate(2), mood: 'good', createdAt: Date.now() - 172800000 },
  };

  const dailyScores: Record<string, DailyExecutionScore> = {
    [pastDate(0)]: { date: pastDate(0), overallScore: 95, completionPct: 90, onTimePct: 95, postponedCount: 0, skippedCount: 0, timeAccuracyPct: 96, priorityScores: { high: 100, medium: 90, low: 85 }, dailyMissionCompleted: true, focusSessionsCount: 4, scheduleAdherencePct: 95, totalPlannedMinutes: 330, totalCompletedMinutes: 300, completedCount: 3, totalCount: 3 },
    [pastDate(1)]: { date: pastDate(1), overallScore: 91, completionPct: 88, onTimePct: 90, postponedCount: 0, skippedCount: 0, timeAccuracyPct: 92, priorityScores: { high: 95, medium: 85, low: 80 }, dailyMissionCompleted: true, focusSessionsCount: 3, scheduleAdherencePct: 90, totalPlannedMinutes: 240, totalCompletedMinutes: 220, completedCount: 2, totalCount: 2 },
  };

  const streaks: ProductivityStreak[] = [
    { type: 'high_score', label: 'High Score (80%+)', icon: '🔥', currentCount: 7, longestCount: 14, lastCompletedDate: todayStr, isActive: true },
    { type: 'daily_mission', label: 'Daily Mission', icon: '🎯', currentCount: 6, longestCount: 10, lastCompletedDate: todayStr, isActive: true },
  ];

  const achievements: Achievement[] = [
    { id: 'ach-dev-1', title: 'Legendary Executor', description: 'Reach 500 completed activities', icon: '⭐', category: 'milestone', earnedAt: Date.now() - 1000000 },
    { id: 'ach-dev-2', title: 'Week Warrior', description: 'Maintain a 7-day high score streak', icon: '🔥', category: 'streak', earnedAt: Date.now() - 86400000 },
  ];

  const aiRecommendations = [
    "Your morning deep work blocks have a 98% focus accuracy. Preserve 10 AM to 1 PM for code generation.",
    "Slack interruptions drop your focus rating by ~2 points in the afternoon. Consider batching communications.",
  ];

  return { libraryBlocks, scheduledBlocks, dailyMissions, goals, reflections, moods, dailyScores, streaks, achievements, aiRecommendations };
}

// ── 3. WORKING PROFESSIONAL PROFILE ──
function getWorkingProfessionalProfile(weekId: string, todayStr: string, pastDate: (days: number) => string): DemoProfileData {
  const libraryBlocks: LibraryBlock[] = [
    { id: 'pro-1', title: 'Client Sync & Quarterly Review', defaultDuration: 60, color: '#3B82F6', icon: 'user', priority: 'high' },
    { id: 'pro-2', title: 'Strategy & Proposal Drafting', defaultDuration: 120, color: '#10B981', icon: 'target', priority: 'high' },
    { id: 'pro-3', title: 'Email & Communications Batch', defaultDuration: 45, color: '#6B7280', icon: 'coffee', priority: 'low' },
    { id: 'pro-4', title: 'Networking & Industry Reading', defaultDuration: 45, color: '#8B5CF6', icon: 'book', priority: 'medium' },
  ];

  const scheduledBlocks: ScheduledBlock[] = [
    { id: 'psb-1', blockId: 'pro-1', title: 'Client Sync & Quarterly Review', color: '#3B82F6', priority: 'high', icon: 'user', dayOfWeek: 0, startMinutes: 600, duration: 60, weekId, status: 'completed' },
    { id: 'psb-2', blockId: 'pro-2', title: 'Strategy & Proposal Drafting', color: '#10B981', priority: 'high', icon: 'target', dayOfWeek: 0, startMinutes: 690, duration: 120, weekId, status: 'completed' },
  ];

  const dailyMissions: DailyMissionItem[] = [
    { id: 'pm-1', title: 'Finalize Q4 Product Roadmap Deck', duration: 90, completionProbability: 90, completed: true },
    { id: 'pm-2', title: 'Client Feedback Follow-Up Calls', duration: 45, completionProbability: 85, completed: true },
  ];

  const goals: Goal[] = [
    { id: 'pg-1', title: 'Close Q3 Enterprise Retainer', category: 'Business', targetHoursPerDay: 3.0, progressPct: 90, deadline: 'September 2026', color: '#3B82F6' },
  ];

  const reflections: Record<string, DailyReflection> = {
    [pastDate(1)]: { date: pastDate(1), dayRating: 'good', whatWentWell: 'Client meeting resulted in signed contract extension.', whatPreventedWork: 'Back-to-back calls in afternoon.', improveTomorrow: 'Block 2 hours uninterrupted focus before 11 AM.', gratitude: 'Grateful for client trust.', energyLevel: 'high', focusRating: 8, scheduleRealistic: 'yes', distractions: ['meetings'], additionalThoughts: 'Solid day.', createdAt: Date.now() - 86400000 },
  };

  const moods: Record<string, MoodEntry> = { [pastDate(0)]: { date: pastDate(0), mood: 'good', createdAt: Date.now() } };

  const dailyScores: Record<string, DailyExecutionScore> = {
    [pastDate(0)]: { date: pastDate(0), overallScore: 86, completionPct: 85, onTimePct: 88, postponedCount: 0, skippedCount: 0, timeAccuracyPct: 90, priorityScores: { high: 90, medium: 80, low: 75 }, dailyMissionCompleted: true, focusSessionsCount: 2, scheduleAdherencePct: 86, totalPlannedMinutes: 180, totalCompletedMinutes: 180, completedCount: 2, totalCount: 2 },
  };

  const streaks: ProductivityStreak[] = [
    { type: 'daily_mission', label: 'Daily Mission', icon: '🎯', currentCount: 4, longestCount: 8, lastCompletedDate: todayStr, isActive: true },
  ];

  const achievements: Achievement[] = [
    { id: 'ach-pro-1', title: 'Century Club', description: 'Complete 100 planned activities', icon: '🏆', category: 'milestone', earnedAt: Date.now() - 2000000 },
  ];

  const aiRecommendations = ["Keep limiting admin tasks to single afternoon blocks to protect strategic thinking hours."];

  return { libraryBlocks, scheduledBlocks, dailyMissions, goals, reflections, moods, dailyScores, streaks, achievements, aiRecommendations };
}

// ── 4. COMPETITIVE EXAM ASPIRANT PROFILE ──
function getExamAspirantProfile(weekId: string, todayStr: string, pastDate: (days: number) => string): DemoProfileData {
  const libraryBlocks: LibraryBlock[] = [
    { id: 'exam-1', title: 'Quantitative Aptitude Mock', defaultDuration: 120, color: '#EF4444', icon: 'target', priority: 'high' },
    { id: 'exam-2', title: 'Verbal Ability & Reading Comp', defaultDuration: 90, color: '#3B82F6', icon: 'book', priority: 'high' },
    { id: 'exam-3', title: 'Mock Test Error Analysis', defaultDuration: 90, color: '#10B981', icon: 'brain', priority: 'high' },
    { id: 'exam-4', title: 'Current Affairs & Editorials', defaultDuration: 45, color: '#F59E0B', icon: 'coffee', priority: 'medium' },
  ];

  const scheduledBlocks: ScheduledBlock[] = [
    { id: 'esb-1', blockId: 'exam-1', title: 'Quantitative Aptitude Mock', color: '#EF4444', priority: 'high', icon: 'target', dayOfWeek: 0, startMinutes: 540, duration: 120, weekId, status: 'completed' },
    { id: 'esb-2', blockId: 'exam-3', title: 'Mock Test Error Analysis', color: '#10B981', priority: 'high', icon: 'brain', dayOfWeek: 0, startMinutes: 690, duration: 90, weekId, status: 'completed' },
  ];

  const dailyMissions: DailyMissionItem[] = [
    { id: 'em-1', title: 'Complete Full-Length CAT Sectional Mock #14', duration: 120, completionProbability: 93, completed: true },
    { id: 'em-2', title: 'Review 25 Quant Formula Flashcards', duration: 45, completionProbability: 88, completed: true },
  ];

  const goals: Goal[] = [
    { id: 'eg-1', title: 'Target 99+ Percentile in Mocks', category: 'Exam Prep', targetHoursPerDay: 4.5, progressPct: 94, deadline: 'November 2026', color: '#EF4444' },
  ];

  const reflections: Record<string, DailyReflection> = {
    [pastDate(1)]: { date: pastDate(1), dayRating: 'excellent', whatWentWell: 'Scored 96 percentile on Quant sectional mock.', whatPreventedWork: 'Slight slowdown on Geometry section.', improveTomorrow: 'Practice 15 Geometry problem variations.', gratitude: 'Grateful for steady progress.', energyLevel: 'very_high', focusRating: 9, scheduleRealistic: 'yes', distractions: [], additionalThoughts: 'Confidence building up.', createdAt: Date.now() - 86400000 },
  };

  const moods: Record<string, MoodEntry> = { [pastDate(0)]: { date: pastDate(0), mood: 'excellent', createdAt: Date.now() } };

  const dailyScores: Record<string, DailyExecutionScore> = {
    [pastDate(0)]: { date: pastDate(0), overallScore: 94, completionPct: 92, onTimePct: 95, postponedCount: 0, skippedCount: 0, timeAccuracyPct: 95, priorityScores: { high: 95, medium: 90, low: 85 }, dailyMissionCompleted: true, focusSessionsCount: 3, scheduleAdherencePct: 94, totalPlannedMinutes: 210, totalCompletedMinutes: 210, completedCount: 2, totalCount: 2 },
  };

  const streaks: ProductivityStreak[] = [
    { type: 'study_goal', label: 'Study Goal', icon: '📚', currentCount: 9, longestCount: 18, lastCompletedDate: todayStr, isActive: true },
  ];

  const achievements: Achievement[] = [
    { id: 'ach-exam-1', title: 'Monthly Master', description: 'Maintain 30-day consistency streak', icon: '💎', category: 'streak', earnedAt: Date.now() - 3000000 },
  ];

  const aiRecommendations = ["Mock analysis right after test completion improves memory retention by 40%."];

  return { libraryBlocks, scheduledBlocks, dailyMissions, goals, reflections, moods, dailyScores, streaks, achievements, aiRecommendations };
}

// ── 5. FITNESS & LIFESTYLE PLANNER PROFILE ──
function getFitnessPlannerProfile(weekId: string, todayStr: string, pastDate: (days: number) => string): DemoProfileData {
  const libraryBlocks: LibraryBlock[] = [
    { id: 'fit-1', title: 'Morning HIIT & Cardio Run', defaultDuration: 45, color: '#10B981', icon: 'dumbbell', priority: 'high' },
    { id: 'fit-2', title: 'Strength Training Session', defaultDuration: 75, color: '#EF4444', icon: 'dumbbell', priority: 'high' },
    { id: 'fit-3', title: 'Nutrition Meal Prep', defaultDuration: 60, color: '#F59E0B', icon: 'coffee', priority: 'medium' },
    { id: 'fit-4', title: 'Mindfulness & Meditation', defaultDuration: 30, color: '#8B5CF6', icon: 'sparkles', priority: 'personal' },
  ];

  const scheduledBlocks: ScheduledBlock[] = [
    { id: 'fsb-1', blockId: 'fit-1', title: 'Morning HIIT & Cardio Run', color: '#10B981', priority: 'high', icon: 'dumbbell', dayOfWeek: 0, startMinutes: 420, duration: 45, weekId, status: 'completed' },
    { id: 'fsb-2', blockId: 'fit-2', title: 'Strength Training Session', color: '#EF4444', priority: 'high', icon: 'dumbbell', dayOfWeek: 0, startMinutes: 1050, duration: 75, weekId, status: 'completed' },
  ];

  const dailyMissions: DailyMissionItem[] = [
    { id: 'fm-1', title: 'Run 5K at Sub-25 Min Pace', duration: 45, completionProbability: 95, completed: true },
    { id: 'fm-2', title: 'Complete Upper Body Hypertrophy Session', duration: 75, completionProbability: 92, completed: true },
  ];

  const goals: Goal[] = [
    { id: 'fg-1', title: '30-Day Fitness Challenge', category: 'Health', targetHoursPerDay: 2.0, progressPct: 73, deadline: 'August 2026', color: '#10B981' },
  ];

  const reflections: Record<string, DailyReflection> = {
    [pastDate(1)]: { date: pastDate(1), dayRating: 'excellent', whatWentWell: 'Pushed personal best on bench press and ran 5k in 24 mins.', whatPreventedWork: 'None!', improveTomorrow: 'Hydrate earlier in morning.', gratitude: 'Grateful for strong body.', energyLevel: 'very_high', focusRating: 10, scheduleRealistic: 'yes', distractions: [], additionalThoughts: 'Feeling energized.', createdAt: Date.now() - 86400000 },
  };

  const moods: Record<string, MoodEntry> = { [pastDate(0)]: { date: pastDate(0), mood: 'excellent', createdAt: Date.now() } };

  const dailyScores: Record<string, DailyExecutionScore> = {
    [pastDate(0)]: { date: pastDate(0), overallScore: 96, completionPct: 95, onTimePct: 98, postponedCount: 0, skippedCount: 0, timeAccuracyPct: 96, priorityScores: { high: 100, medium: 90, low: 90 }, dailyMissionCompleted: true, focusSessionsCount: 2, scheduleAdherencePct: 96, totalPlannedMinutes: 120, totalCompletedMinutes: 120, completedCount: 2, totalCount: 2 },
  };

  const streaks: ProductivityStreak[] = [
    { type: 'exercise', label: 'Workout Streak', icon: '💪', currentCount: 14, longestCount: 21, lastCompletedDate: todayStr, isActive: true },
  ];

  const achievements: Achievement[] = [
    { id: 'ach-fit-1', title: '30-Day Consistency', description: 'Track 30 consecutive days of activity', icon: '💪', category: 'consistency', earnedAt: Date.now() - 5000000 },
  ];

  const aiRecommendations = ["Consistent morning exercise increases your daily focus rating by an average of +1.8 points."];

  return { libraryBlocks, scheduledBlocks, dailyMissions, goals, reflections, moods, dailyScores, streaks, achievements, aiRecommendations };
}
