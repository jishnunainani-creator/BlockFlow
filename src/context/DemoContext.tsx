import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DemoProfileType, DEMO_PROFILES } from '../types/demo';
import { TOUR_STEPS, TourStep } from '../types/onboarding';
import { getDemoProfileData } from '../utils/demoProfiles';
import { saveScheduledBlocks, saveLibraryBlocks, loadScheduledBlocks, loadLibraryBlocks } from '../utils/storage';
import { saveDailyScores, saveReflections, saveMoods, saveStreaks, saveAchievements, loadDailyScores, loadReflections, loadMoods, loadStreaks, loadAchievements } from '../utils/executionStorage';
import { loadCustomMilestones, saveCustomMilestones } from '../utils/assignmentStorage';
import { getISOWeekString } from '../utils/timeUtils';
import { Goal, DailyMissionItem } from '../types/timetable';

interface DemoContextType {
  isDemoMode: boolean;
  activeProfile: DemoProfileType | null;
  loadDemoProfile: (profileType: DemoProfileType) => void;
  clearDemoData: () => void;
  
  // Onboarding Tour State
  isOnboardingOpen: boolean;
  isTourActive: boolean;
  currentTourStep: TourStep;
  currentStepIndex: number;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  closeTour: () => void;
  skipOnboarding: () => void;
  completeOnboarding: (loadDemo?: boolean) => void;
}

const DEMO_MODE_STORAGE_KEY = 'blockflow_is_demo_mode';
const ACTIVE_PROFILE_KEY = 'blockflow_active_demo_profile';
const USER_BACKUP_KEY = 'blockflow_real_user_data_backup';
const ONBOARDING_COMPLETED_KEY = 'blockflow_onboarding_completed_v1';

const GOALS_KEY = 'blockflow_goals_v1';
const MISSIONS_KEY = 'blockflow_missions_v1';

function loadGoalsHelper(): Goal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveGoalsHelper(goals: Goal[]): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function loadMissionsHelper(): DailyMissionItem[] {
  try {
    const raw = localStorage.getItem(MISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMissionsHelper(missions: DailyMissionItem[]): void {
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'true';
  });

  const [activeProfile, setActiveProfile] = useState<DemoProfileType | null>(() => {
    return (localStorage.getItem(ACTIVE_PROFILE_KEY) as DemoProfileType) || null;
  });

  // Onboarding State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const currentWeekId = getISOWeekString();

  // Auto-detect first time user on mount
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (!completed) {
      setIsOnboardingOpen(true);
    }
  }, []);

  // ── LOAD DEMO PROFILE ──
  const loadDemoProfile = useCallback((profileType: DemoProfileType) => {
    // 1. If not already in demo mode, backup current user data
    if (!isDemoMode) {
      const backupData = {
        blocks: loadScheduledBlocks(currentWeekId),
        libraryBlocks: loadLibraryBlocks(),
        goals: loadGoalsHelper(),
        dailyMissions: loadMissionsHelper(),
        dailyScores: loadDailyScores(),
        reflections: loadReflections(),
        moods: loadMoods(),
        streaks: loadStreaks(),
        achievements: loadAchievements(),
        customMilestones: loadCustomMilestones(),
      };
      localStorage.setItem(USER_BACKUP_KEY, JSON.stringify(backupData));
    }

    // 2. Generate and set profile data
    const demoData = getDemoProfileData(profileType);

    saveLibraryBlocks(demoData.libraryBlocks);
    saveScheduledBlocks(demoData.scheduledBlocks);
    saveMissionsHelper(demoData.dailyMissions);
    saveGoalsHelper(demoData.goals);
    saveDailyScores(demoData.dailyScores);
    saveReflections(demoData.reflections);
    saveMoods(demoData.moods);
    saveStreaks(demoData.streaks);
    saveAchievements(demoData.achievements);
    saveCustomMilestones(demoData.customMilestones || [
      { id: 'demo-m-1', title: '100 Hours Deep Work', description: 'Logged 100 hours of focused study in BlockFlow', category: 'focus', measurementType: 'hours', targetValue: 100, currentValue: 100, earnedDate: 'Oct 15, 2026', isUnlocked: true, isCustom: true },
      { id: 'demo-m-2', title: '30-Day Study Streak', description: 'Maintained 30 consecutive days of study', category: 'consistency', measurementType: 'days', targetValue: 30, currentValue: 30, earnedDate: 'Oct 12, 2026', isUnlocked: true, isCustom: true },
      { id: 'demo-m-3', title: 'First Full Stack Project', description: 'Shipped complete full-stack web application', category: 'career', measurementType: 'count', targetValue: 1, currentValue: 1, earnedDate: 'Sep 28, 2026', isUnlocked: true, isCustom: true },
      { id: 'demo-m-4', title: 'A+ in Data Structures', description: 'Achieved top grade in Data Structures coursework', category: 'learning', measurementType: 'score', targetValue: 95, currentValue: 95, earnedDate: 'May 15, 2026', isUnlocked: true, isCustom: true },
    ]);

    setIsDemoMode(true);
    setActiveProfile(profileType);
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, 'true');
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileType);

    // Refresh page state smoothly so context listeners re-read storage
    window.location.reload();
  }, [isDemoMode, currentWeekId]);

  // ── CLEAR DEMO DATA ──
  const clearDemoData = useCallback(() => {
    const backupJson = localStorage.getItem(USER_BACKUP_KEY);
    if (backupJson) {
      try {
        const backup = JSON.parse(backupJson);
        saveScheduledBlocks(backup.blocks || []);
        saveLibraryBlocks(backup.libraryBlocks || []);
        saveGoalsHelper(backup.goals || []);
        saveMissionsHelper(backup.dailyMissions || []);
        saveDailyScores(backup.dailyScores || {});
        saveReflections(backup.reflections || {});
        saveMoods(backup.moods || {});
        saveStreaks(backup.streaks || []);
        saveAchievements(backup.achievements || []);
        saveCustomMilestones(backup.customMilestones || []);
      } catch (err) {
        console.error("Failed to restore backup data", err);
      }
      localStorage.removeItem(USER_BACKUP_KEY);
    } else {
      // Clear to clean state if no backup
      saveScheduledBlocks([]);
      saveLibraryBlocks([]);
      saveGoalsHelper([]);
      saveMissionsHelper([]);
      saveDailyScores({});
      saveReflections({});
      saveMoods({});
      saveStreaks([]);
      saveAchievements([]);
      saveCustomMilestones([]);
    }

    setIsDemoMode(false);
    setActiveProfile(null);
    localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);

    window.location.reload();
  }, []);

  // ── TOUR CONTROL FUNCTIONS ──
  const startTour = useCallback(() => {
    setIsOnboardingOpen(false);
    setIsTourActive(true);
    setCurrentStepIndex(0);
  }, []);

  const nextTourStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsTourActive(false);
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    }
  }, [currentStepIndex]);

  const prevTourStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const closeTour = useCallback(() => {
    setIsTourActive(false);
    setIsOnboardingOpen(false);
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  }, []);

  const skipOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
    setIsTourActive(false);
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  }, []);

  const completeOnboarding = useCallback((loadDemo: boolean = false) => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsOnboardingOpen(false);
    setIsTourActive(false);
    if (loadDemo) {
      loadDemoProfile('college_student');
    }
  }, [loadDemoProfile]);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        activeProfile,
        loadDemoProfile,
        clearDemoData,
        isOnboardingOpen,
        isTourActive,
        currentTourStep: TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0],
        currentStepIndex,
        startTour,
        nextTourStep,
        prevTourStep,
        closeTour,
        skipOnboarding,
        completeOnboarding,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
