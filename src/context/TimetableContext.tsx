import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  LibraryBlock,
  ScheduledBlock,
  Resolution,
  TimetableTemplate,
  ConflictInfo,
  CompletionStatus,
} from '../types/timetable';
import {
  loadLibraryBlocks,
  saveLibraryBlocks,
  loadScheduledBlocks,
  saveScheduledBlocks,
  loadResolution,
  saveResolution,
  INITIAL_LIBRARY_BLOCKS,
} from '../utils/storage';
import { getISOWeekString, snapToResolution } from '../utils/timeUtils';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { detectConflicts } from '../utils/conflictUtils';
import {
  checkPendingReminders,
  sendBrowserNotification,
  playReminderChime,
  requestNotificationPermission,
} from '../utils/notificationUtils';
import { generateAISmartSchedule } from '../utils/aiProductivityEngine';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { migrateBlockFlowJSON } from '../utils/migration/dataMigrator';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppState {
  libraryBlocks: LibraryBlock[];
  scheduledBlocks: ScheduledBlock[];
  templates: TimetableTemplate[];
  customCategories: string[];
}

const TEMPLATES_KEY = 'timetable_templates_v2';
const CUSTOM_CATEGORIES_KEY = 'timetable_custom_categories_v1';

export const DEFAULT_TEMPLATES: TimetableTemplate[] = [
  {
    id: 'tmpl-college-sem3',
    name: 'College Semester 3 Official Timetable',
    description: 'CSE213, ENR211, ENR209, CSE305, MGT111, ENR207, ENR215 Lab, Self Study, Fitness, DSA & CAT (2026-W32)',
    createdAt: Date.now(),
    blocks: [
      // Monday (dayOfWeek: 0)
      { blockId: 'block-1785180426499', title: 'WAKE UP', description: 'WAKE UP', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 0, startMinutes: 420, duration: 30 },
      { blockId: 'block-1785178488270', title: 'CSE 213 SEC-1', description: 'CSE 213 SEC-1', color: '#06B6D4', priority: 'medium', icon: 'code', dayOfWeek: 0, startMinutes: 570, duration: 90 },
      { blockId: 'block-1785178924907', title: 'ENR211 SEC-2', description: 'ENR211 SEC-2', color: '#10B981', priority: 'medium', icon: 'brain', dayOfWeek: 0, startMinutes: 660, duration: 90 },
      { blockId: 'block-1785180327130', title: 'LUNCH BREAK', description: 'Lunch Break', color: '#EF4444', priority: 'medium', icon: 'coffee', dayOfWeek: 0, startMinutes: 750, duration: 30 },
      { blockId: 'block-1785179085804', title: 'ENR209 SEC-2', description: 'ENR209 SEC-2', color: '#F97316', priority: 'medium', icon: 'brain', dayOfWeek: 0, startMinutes: 780, duration: 90 },
      { blockId: 'block-1785180693019', title: 'Self Study', description: 'Self Study', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 0, startMinutes: 900, duration: 60 },
      { blockId: 'block-1785180693019', title: 'Self Study', description: 'Self Study', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 0, startMinutes: 960, duration: 60 },
      { blockId: 'block-1785181271512', title: 'Fitness', description: 'Gym,Cricket,Pickleball,TT.', color: '#64748B', priority: 'Fitness', icon: 'code', dayOfWeek: 0, startMinutes: 1140, duration: 90 },
      { blockId: 'block-dsa', title: 'DSA Practice', description: 'LeetCode, Data Structures & Algorithms problem solving', color: '#EF4444', priority: 'high', icon: 'code', dayOfWeek: 0, startMinutes: 1230, duration: 90 },
      { blockId: 'block-cat', title: 'CAT Preparation', description: 'Quantitative Aptitude, DILR & VARC mock tests', color: '#EC4899', priority: 'high', icon: 'target', dayOfWeek: 0, startMinutes: 1320, duration: 60 },

      // Tuesday (dayOfWeek: 1)
      { blockId: 'block-1785180426499', title: 'WAKE UP', description: 'WAKE UP', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 1, startMinutes: 420, duration: 30 },
      { blockId: 'block-1785179503902', title: 'CSE305 SEC-1', description: 'CSE305 SEC-1(Data Structure and Algorithms)', color: '#8B5CF6', priority: 'medium', icon: 'code', dayOfWeek: 1, startMinutes: 570, duration: 90 },
      { blockId: 'block-1785179761029', title: 'MGT111 SEC-2', description: 'SEC-2 Identity and Behaviour', color: '#F97316', priority: 'medium', icon: 'brain', dayOfWeek: 1, startMinutes: 660, duration: 90 },
      { blockId: 'block-1785180327130', title: 'LUNCH BREAK', description: 'Lunch Break', color: '#EF4444', priority: 'medium', icon: 'coffee', dayOfWeek: 1, startMinutes: 750, duration: 30 },
      { blockId: 'block-1785180693019', title: 'Self Study', description: 'Self Study', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 1, startMinutes: 840, duration: 60 },
      { blockId: 'block-1785180693019', title: 'Self Study', description: 'Self Study', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 1, startMinutes: 900, duration: 60 },
      { blockId: 'block-1785179966798', title: 'ENR207 SEC-2', description: 'ENR207 SEC-2', color: '#10B981', priority: 'medium', icon: 'brain', dayOfWeek: 1, startMinutes: 960, duration: 90 },
      { blockId: 'block-1785179085804', title: 'ENR209 SEC-2', description: 'ENR209 SEC-2', color: '#F97316', priority: 'medium', icon: 'brain', dayOfWeek: 1, startMinutes: 1050, duration: 90 },
      { blockId: 'block-dsa', title: 'DSA Practice', description: 'LeetCode, Data Structures & Algorithms problem solving', color: '#EF4444', priority: 'high', icon: 'code', dayOfWeek: 1, startMinutes: 1290, duration: 90 },
      { blockId: 'block-cat', title: 'CAT Preparation', description: 'Quantitative Aptitude, DILR & VARC mock tests', color: '#EC4899', priority: 'high', icon: 'target', dayOfWeek: 1, startMinutes: 1380, duration: 60 },

      // Wednesday (dayOfWeek: 2)
      { blockId: 'block-1785180426499', title: 'WAKE UP', description: 'WAKE UP', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 2, startMinutes: 420, duration: 30 },
      { blockId: 'block-1785178488270', title: 'CSE 213 SEC-1', description: 'CSE 213 SEC-1', color: '#06B6D4', priority: 'medium', icon: 'code', dayOfWeek: 2, startMinutes: 570, duration: 90 },
      { blockId: 'block-1785179503902', title: 'CSE305 SEC-1', description: 'CSE305 SEC-1(Data Structure and Algorithms)', color: '#8B5CF6', priority: 'medium', icon: 'code', dayOfWeek: 2, startMinutes: 660, duration: 90 },
      { blockId: 'block-1785180327130', title: 'LUNCH BREAK', description: 'Lunch Break', color: '#EF4444', priority: 'medium', icon: 'coffee', dayOfWeek: 2, startMinutes: 750, duration: 30 },
      { blockId: 'block-1785180693019', title: 'Self Study', description: 'Self Study', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 2, startMinutes: 840, duration: 60 },
      { blockId: 'block-1785180693019', title: 'Self Study', description: 'Self Study', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 2, startMinutes: 900, duration: 60 },
      { blockId: 'block-1785180693019', title: 'Self Study', description: 'Self Study', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 2, startMinutes: 960, duration: 60 },
      { blockId: 'block-1785181271512', title: 'Fitness', description: 'Gym,Cricket,Pickleball,TT.', color: '#64748B', priority: 'Fitness', icon: 'code', dayOfWeek: 2, startMinutes: 1110, duration: 90 },
      { blockId: 'block-dsa', title: 'DSA Practice', description: 'LeetCode, Data Structures & Algorithms problem solving', color: '#EF4444', priority: 'high', icon: 'code', dayOfWeek: 2, startMinutes: 1230, duration: 90 },
      { blockId: 'block-cat', title: 'CAT Preparation', description: 'Quantitative Aptitude, DILR & VARC mock tests', color: '#EC4899', priority: 'high', icon: 'target', dayOfWeek: 2, startMinutes: 1320, duration: 60 },

      // Thursday (dayOfWeek: 3)
      { blockId: 'block-1785180426499', title: 'WAKE UP', description: 'WAKE UP', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 3, startMinutes: 420, duration: 30 },
      { blockId: 'block-1785179503902', title: 'CSE305 SEC-1', description: 'CSE305 SEC-1(Data Structure and Algorithms)', color: '#8B5CF6', priority: 'medium', icon: 'code', dayOfWeek: 3, startMinutes: 570, duration: 90 },
      { blockId: 'block-1785179761029', title: 'MGT111 SEC-2', description: 'SEC-2 Identity and Behaviour', color: '#F97316', priority: 'medium', icon: 'brain', dayOfWeek: 3, startMinutes: 660, duration: 90 },
      { blockId: 'block-1785180327130', title: 'LUNCH BREAK', description: 'Lunch Break', color: '#EF4444', priority: 'medium', icon: 'coffee', dayOfWeek: 3, startMinutes: 750, duration: 30 },
      { blockId: 'block-1785180693019', title: 'Self Study', description: 'Self Study', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 3, startMinutes: 840, duration: 60 },
      { blockId: 'block-1785180693019', title: 'Self Study', description: 'Self Study', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 3, startMinutes: 900, duration: 60 },
      { blockId: 'block-1785179966798', title: 'ENR207 SEC-2', description: 'ENR207 SEC-2', color: '#10B981', priority: 'medium', icon: 'brain', dayOfWeek: 3, startMinutes: 960, duration: 90 },
      { blockId: 'block-1785181271512', title: 'Fitness', description: 'Gym,Cricket,Pickleball,TT.', color: '#64748B', priority: 'Fitness', icon: 'code', dayOfWeek: 3, startMinutes: 1140, duration: 90 },
      { blockId: 'block-dsa', title: 'DSA Practice', description: 'LeetCode, Data Structures & Algorithms problem solving', color: '#EF4444', priority: 'high', icon: 'code', dayOfWeek: 3, startMinutes: 1230, duration: 90 },
      { blockId: 'block-cat', title: 'CAT Preparation', description: 'Quantitative Aptitude, DILR & VARC mock tests', color: '#EC4899', priority: 'high', icon: 'target', dayOfWeek: 3, startMinutes: 1320, duration: 60 },

      // Friday (dayOfWeek: 4)
      { blockId: 'block-1785180426499', title: 'WAKE UP', description: 'WAKE UP', color: '#EC4899', priority: 'high', icon: 'code', dayOfWeek: 4, startMinutes: 420, duration: 30 },
      { blockId: 'block-1785178924907', title: 'ENR211 SEC-2', description: 'ENR211 SEC-2', color: '#10B981', priority: 'medium', icon: 'brain', dayOfWeek: 4, startMinutes: 570, duration: 90 },
      { blockId: 'block-1785178488270', title: 'CSE 213 SEC-1', description: 'CSE 213 SEC-1', color: '#06B6D4', priority: 'medium', icon: 'code', dayOfWeek: 4, startMinutes: 660, duration: 90 },
      { blockId: 'block-1785180327130', title: 'LUNCH BREAK', description: 'Lunch Break', color: '#EF4444', priority: 'medium', icon: 'coffee', dayOfWeek: 4, startMinutes: 750, duration: 30 },
      { blockId: 'block-1785179085804', title: 'ENR209 SEC-2', description: 'ENR209 SEC-2', color: '#F97316', priority: 'medium', icon: 'brain', dayOfWeek: 4, startMinutes: 780, duration: 90 },
      { blockId: 'block-1785180171203', title: 'ENR215 SEC-2', description: 'ENR215 SEC-2', color: '#F97316', priority: 'medium', icon: 'code', dayOfWeek: 4, startMinutes: 900, duration: 240 },
      { blockId: 'block-dsa', title: 'DSA Practice', description: 'LeetCode, Data Structures & Algorithms problem solving', color: '#EF4444', priority: 'high', icon: 'code', dayOfWeek: 4, startMinutes: 1290, duration: 90 },
      { blockId: 'block-cat', title: 'CAT Preparation', description: 'Quantitative Aptitude, DILR & VARC mock tests', color: '#EC4899', priority: 'high', icon: 'target', dayOfWeek: 4, startMinutes: 1380, duration: 60 },
    ],
  },
  {
    id: 'tmpl-college',
    name: 'Standard College Week Routine',
    description: 'Lectures, DSA practice, lab sessions, and gym',
    createdAt: Date.now(),
    blocks: [
      { blockId: 'block-dsa', title: 'DSA Practice', description: 'Problem solving', color: '#EF4444', priority: 'high', icon: 'code', dayOfWeek: 0, startMinutes: 480, duration: 90 },
      { blockId: 'block-internship', title: 'Internship Work', description: 'Sprint tasks', color: '#F97316', priority: 'high', icon: 'briefcase', dayOfWeek: 0, startMinutes: 600, duration: 120 },
      { blockId: 'block-gym', title: 'Gym & Workout', description: 'Fitness', color: '#3B82F6', priority: 'personal', icon: 'dumbbell', dayOfWeek: 0, startMinutes: 360, duration: 60 },
      { blockId: 'block-cat', title: 'CAT Preparation', description: 'QA drills', color: '#EC4899', priority: 'high', icon: 'target', dayOfWeek: 1, startMinutes: 480, duration: 90 },
      { blockId: 'block-revision', title: 'Daily Revision', description: 'Active recall', color: '#8B5CF6', priority: 'medium', icon: 'brain', dayOfWeek: 2, startMinutes: 480, duration: 60 },
    ],
  },
];

interface TimetableContextType {
  libraryBlocks: LibraryBlock[];
  scheduledBlocks: ScheduledBlock[];
  currentWeekScheduledBlocks: ScheduledBlock[];
  currentWeekId: string;
  setCurrentWeekId: (weekId: string) => void;
  resolution: Resolution;
  setResolution: (res: Resolution) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Custom Categories
  customCategories: string[];
  addCustomCategory: (name: string) => void;

  // Selection & Clipboard
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  selectedCell: { dayOfWeek: number; startMinutes: number } | null;
  setSelectedCell: (cell: { dayOfWeek: number; startMinutes: number } | null) => void;
  copiedBlock: ScheduledBlock | LibraryBlock | null;
  copySelectedBlock: () => void;
  pasteCopiedBlock: () => void;
  duplicateSelectedBlock: () => void;
  deleteSelectedBlock: () => void;
  deselectAll: () => void;

  // Conflicts & Completion
  conflicts: Map<string, ConflictInfo>;
  updateBlockStatus: (id: string, status: CompletionStatus) => void;

  // Library block actions
  addLibraryBlock: (block: Omit<LibraryBlock, 'id'>) => LibraryBlock;
  updateLibraryBlock: (id: string, block: Partial<LibraryBlock>) => void;
  deleteLibraryBlock: (id: string) => void;

  // Scheduled block actions
  addScheduledBlock: (block: Omit<ScheduledBlock, 'id' | 'weekId'>) => void;
  moveScheduledBlock: (id: string, dayOfWeek: number, startMinutes: number) => void;
  resizeScheduledBlock: (id: string, newDuration: number) => void;
  updateScheduledBlock: (id: string, partial: Partial<ScheduledBlock>) => void;
  deleteScheduledBlock: (id: string) => void;
  
  // Week actions
  duplicateCurrentWeekTo: (targetWeekId: string) => void;
  clearCurrentWeek: () => void;

  // Templates & AI actions
  templates: TimetableTemplate[];
  saveCurrentWeekAsTemplate: (name: string, description?: string) => void;
  loadTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
  duplicateTemplate: (templateId: string) => void;
  runAISmartSchedule: () => void;

  // Notifications
  enableNotifications: () => Promise<void>;
  notificationsEnabled: boolean;

  // Backup Import/Export
  exportJSONBackup: () => void;
  importJSONBackup: (jsonStr: string) => boolean;

  // History & Toast
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  toasts: ToastMessage[];
  addToast: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWeekId, setCurrentWeekId] = useState<string>(() => getISOWeekString());
  const [resolution, setResolutionState] = useState<Resolution>(() => loadResolution());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ dayOfWeek: number; startMinutes: number } | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<ScheduledBlock | LibraryBlock | null>(null);

  const loadTemplates = (): TimetableTemplate[] => {
    try {
      const data = localStorage.getItem(TEMPLATES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge: add any DEFAULT_TEMPLATES not already in stored list (by id)
          const storedIds = new Set(parsed.map((t: TimetableTemplate) => t.id));
          const missingDefaults = DEFAULT_TEMPLATES.filter(t => !storedIds.has(t.id));
          return [...missingDefaults, ...parsed];
        }
      }
    } catch (e) {
      console.error('Failed to load templates', e);
    }
    return DEFAULT_TEMPLATES;
  };

  const loadCustomCategories = (): string[] => {
    try {
      const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load custom categories', e);
    }
    return ['Side Project', 'Research', 'Gaming'];
  };

  const initialAppState: AppState = {
    libraryBlocks: loadLibraryBlocks(),
    scheduledBlocks: loadScheduledBlocks(currentWeekId),
    templates: loadTemplates(),
    customCategories: loadCustomCategories(),
  };

  const {
    state: appState,
    set: updateAppState,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
  } = useUndoRedo<AppState>(initialAppState);

  const currentWeekScheduledBlocks = appState.scheduledBlocks.filter(
    (sb) => sb.weekId === currentWeekId
  );
  const conflicts = detectConflicts(currentWeekScheduledBlocks);

  useEffect(() => {
    saveLibraryBlocks(appState.libraryBlocks);
    saveScheduledBlocks(appState.scheduledBlocks);
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(appState.templates));
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(appState.customCategories));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [appState]);

  // Supabase Auth listener effect
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        console.log('Supabase session active:', session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Startup: ensure all INITIAL_LIBRARY_BLOCKS exist in state (match by title, case-insensitive)
  useEffect(() => {
    const existingTitles = new Set(
      appState.libraryBlocks.map((b) => b.title.toLowerCase().trim())
    );
    const missing = INITIAL_LIBRARY_BLOCKS.filter(
      (b) => !existingTitles.has(b.title.toLowerCase().trim())
    );
    if (missing.length > 0) {
      updateAppState({
        ...appState,
        libraryBlocks: [...missing, ...appState.libraryBlocks],
      });
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToast = useCallback((text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addCustomCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || appState.customCategories.includes(trimmed)) return;

    updateAppState({
      ...appState,
      customCategories: [...appState.customCategories, trimmed],
    });
    addToast(`Added category "${trimmed}"!`, 'success');
  }, [appState, updateAppState, addToast]);

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      addToast('Browser notifications enabled! 🔔', 'success');
    } else {
      addToast('Notifications permission denied', 'warning');
    }
  };

  useEffect(() => {
    const notifiedSet = new Set<string>();
    const interval = setInterval(() => {
      checkPendingReminders(currentWeekScheduledBlocks, notifiedSet, (block, minutesBefore) => {
        playReminderChime();
        const msg = `"${block.title}" starts in ${minutesBefore} minutes!`;
        addToast(`⏰ Reminder: ${msg}`, 'warning');
        sendBrowserNotification('Activity Reminder', msg);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [currentWeekScheduledBlocks, addToast]);

  const setResolution = useCallback((newRes: Resolution) => {
    setResolutionState(newRes);
    saveResolution(newRes);
    addToast(`Grid resolution set to ${newRes === 120 ? '2h' : newRes === 240 ? '4h' : `${newRes}m`}`, 'info');
  }, [addToast]);

  // Library actions
  const addLibraryBlock = useCallback((blockData: Omit<LibraryBlock, 'id'>): LibraryBlock => {
    const newBlock: LibraryBlock = {
      ...blockData,
      id: `block-${Date.now()}`,
      lastUsedAt: Date.now(),
      usageCount: 0,
    };

    updateAppState({
      ...appState,
      libraryBlocks: [newBlock, ...appState.libraryBlocks],
    });

    addToast(`Created block "${newBlock.title}"`, 'success');
    return newBlock;
  }, [appState, updateAppState, addToast]);

  const updateLibraryBlock = useCallback((id: string, partial: Partial<LibraryBlock>) => {
    const updatedBlocks = appState.libraryBlocks.map((b) => (b.id === id ? { ...b, ...partial } : b));
    const updatedScheduled = appState.scheduledBlocks.map((sb) => {
      if (sb.blockId === id) {
        return {
          ...sb,
          title: partial.title !== undefined ? partial.title : sb.title,
          description: partial.description !== undefined ? partial.description : sb.description,
          color: partial.color !== undefined ? partial.color : sb.color,
          priority: partial.priority !== undefined ? partial.priority : sb.priority,
          icon: partial.icon !== undefined ? partial.icon : sb.icon,
        };
      }
      return sb;
    });

    updateAppState({
      ...appState,
      libraryBlocks: updatedBlocks,
      scheduledBlocks: updatedScheduled,
    });

    addToast(`Updated block library`, 'info');
  }, [appState, updateAppState, addToast]);

  const deleteLibraryBlock = useCallback((id: string) => {
    const block = appState.libraryBlocks.find((b) => b.id === id);
    const updatedBlocks = appState.libraryBlocks.filter((b) => b.id !== id);
    const updatedScheduled = appState.scheduledBlocks.filter((sb) => sb.blockId !== id);

    updateAppState({
      ...appState,
      libraryBlocks: updatedBlocks,
      scheduledBlocks: updatedScheduled,
    });

    addToast(`Deleted block "${block?.title || ''}"`, 'warning');
  }, [appState, updateAppState, addToast]);

  const updateBlockStatus = useCallback((id: string, status: CompletionStatus) => {
    const updatedScheduled = appState.scheduledBlocks.map((sb) => {
      if (sb.id === id) {
        return {
          ...sb,
          status,
          completedAt: status === 'completed' || status === 'faster' || status === 'took_longer' ? Date.now() : sb.completedAt,
        };
      }
      return sb;
    });

    updateAppState({
      ...appState,
      scheduledBlocks: updatedScheduled,
    });

    addToast(`Updated status to ${status.replace('_', ' ')}`, 'info');
  }, [appState, updateAppState, addToast]);

  // Scheduled Actions
  const addScheduledBlock = useCallback((blockData: Omit<ScheduledBlock, 'id' | 'weekId'>) => {
    const snappedStart = snapToResolution(blockData.startMinutes, resolution);
    const snappedDuration = snapToResolution(blockData.duration, resolution);

    const newScheduled: ScheduledBlock = {
      ...blockData,
      id: `sched-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
      startMinutes: snappedStart,
      duration: snappedDuration,
      weekId: currentWeekId,
      reminderMinutes: blockData.reminderMinutes || 15,
      status: blockData.status || 'not_started',
    };

    const updatedLibrary = appState.libraryBlocks.map((b) => {
      if (b.id === blockData.blockId) {
        return {
          ...b,
          lastUsedAt: Date.now(),
          usageCount: (b.usageCount || 0) + 1,
        };
      }
      return b;
    });

    updateAppState({
      ...appState,
      libraryBlocks: updatedLibrary,
      scheduledBlocks: [...appState.scheduledBlocks, newScheduled],
    });

    setSelectedBlockId(newScheduled.id);
    addToast(`Scheduled "${newScheduled.title}"`, 'success');
  }, [appState, updateAppState, resolution, currentWeekId, addToast]);

  const moveScheduledBlock = useCallback((id: string, dayOfWeek: number, startMinutes: number) => {
    const snappedStart = snapToResolution(startMinutes, resolution);
    
    const updatedScheduled = appState.scheduledBlocks.map((sb) => {
      if (sb.id === id) {
        return {
          ...sb,
          dayOfWeek,
          startMinutes: snappedStart,
          weekId: currentWeekId,
        };
      }
      return sb;
    });

    updateAppState({
      ...appState,
      scheduledBlocks: updatedScheduled,
    });

    addToast(`Moved block`, 'info');
  }, [appState, updateAppState, resolution, currentWeekId, addToast]);

  const resizeScheduledBlock = useCallback((id: string, newDuration: number) => {
    const snappedDuration = snapToResolution(newDuration, resolution);

    const updatedScheduled = appState.scheduledBlocks.map((sb) => {
      if (sb.id === id) {
        return {
          ...sb,
          duration: snappedDuration,
        };
      }
      return sb;
    });

    updateAppState({
      ...appState,
      scheduledBlocks: updatedScheduled,
    });
  }, [appState, updateAppState, resolution]);

  const updateScheduledBlock = useCallback((id: string, partial: Partial<ScheduledBlock>) => {
    const updatedScheduled = appState.scheduledBlocks.map((sb) => {
      if (sb.id === id) {
        return {
          ...sb,
          ...partial,
        };
      }
      return sb;
    });

    updateAppState({
      ...appState,
      scheduledBlocks: updatedScheduled,
    });

    addToast(`Updated block`, 'info');
  }, [appState, updateAppState, addToast]);

  const deleteScheduledBlock = useCallback((id: string) => {
    const sb = appState.scheduledBlocks.find((b) => b.id === id);
    const updatedScheduled = appState.scheduledBlocks.filter((b) => b.id !== id);

    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }

    updateAppState({
      ...appState,
      scheduledBlocks: updatedScheduled,
    });

    addToast(`Removed "${sb?.title || 'block'}"`, 'info');
  }, [appState, updateAppState, selectedBlockId, addToast]);

  // Selection & Clipboard Actions
  const copySelectedBlock = useCallback(() => {
    if (selectedBlockId) {
      const found = appState.scheduledBlocks.find((sb) => sb.id === selectedBlockId);
      if (found) {
        setCopiedBlock(found);
        addToast(`Copied "${found.title}" (Ctrl+C)`, 'info');
      }
    }
  }, [selectedBlockId, appState.scheduledBlocks, addToast]);

  const pasteCopiedBlock = useCallback(() => {
    if (!copiedBlock) return;
    const targetDay = selectedCell ? selectedCell.dayOfWeek : 0;
    const targetStart = selectedCell ? selectedCell.startMinutes : 480;

    addScheduledBlock({
      blockId: 'blockId' in copiedBlock ? copiedBlock.blockId : copiedBlock.id,
      title: copiedBlock.title,
      description: copiedBlock.description,
      color: copiedBlock.color,
      priority: copiedBlock.priority,
      icon: copiedBlock.icon,
      dayOfWeek: targetDay,
      startMinutes: targetStart,
      duration: 'defaultDuration' in copiedBlock ? copiedBlock.defaultDuration : copiedBlock.duration,
      status: 'not_started',
    });
    addToast(`Pasted "${copiedBlock.title}" (Ctrl+V)`, 'success');
  }, [copiedBlock, selectedCell, addScheduledBlock, addToast]);

  const duplicateSelectedBlock = useCallback(() => {
    if (!selectedBlockId) return;
    const found = appState.scheduledBlocks.find((sb) => sb.id === selectedBlockId);
    if (!found) return;

    const targetStart = snapToResolution(found.startMinutes + found.duration, resolution);
    addScheduledBlock({
      blockId: found.blockId,
      title: `${found.title} (Copy)`,
      description: found.description,
      color: found.color,
      priority: found.priority,
      icon: found.icon,
      dayOfWeek: found.dayOfWeek,
      startMinutes: targetStart,
      duration: found.duration,
      status: 'not_started',
    });
    addToast(`Duplicated "${found.title}" (Ctrl+D)`, 'success');
  }, [selectedBlockId, appState.scheduledBlocks, resolution, addScheduledBlock, addToast]);

  const deleteSelectedBlock = useCallback(() => {
    if (selectedBlockId) {
      deleteScheduledBlock(selectedBlockId);
    }
  }, [selectedBlockId, deleteScheduledBlock]);

  const deselectAll = useCallback(() => {
    setSelectedBlockId(null);
    setSelectedCell(null);
  }, []);

  // Templates Actions
  const saveCurrentWeekAsTemplate = useCallback((name: string, description?: string) => {
    const currentBlocks = appState.scheduledBlocks.filter((sb) => sb.weekId === currentWeekId);
    if (currentBlocks.length === 0) {
      addToast('No blocks in current week to save as template!', 'warning');
      return;
    }

    const templateBlocks = currentBlocks.map((sb) => ({
      blockId: sb.blockId,
      title: sb.title,
      description: sb.description,
      color: sb.color,
      priority: sb.priority,
      icon: sb.icon,
      dayOfWeek: sb.dayOfWeek,
      startMinutes: sb.startMinutes,
      duration: sb.duration,
    }));

    const newTemplate: TimetableTemplate = {
      id: `tmpl-${Date.now()}`,
      name,
      description,
      createdAt: Date.now(),
      blocks: templateBlocks,
    };

    updateAppState({
      ...appState,
      templates: [newTemplate, ...appState.templates],
    });

    addToast(`Saved template "${name}"!`, 'success');
  }, [appState, updateAppState, currentWeekId, addToast]);

  const loadTemplate = useCallback((templateId: string) => {
    const template = appState.templates.find((t) => t.id === templateId);
    if (!template) return;

    const nonCurrentBlocks = appState.scheduledBlocks.filter((sb) => sb.weekId !== currentWeekId);
    const loadedBlocks: ScheduledBlock[] = template.blocks.map((b) => ({
      ...b,
      id: `sched-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
      weekId: currentWeekId,
      status: 'not_started',
    }));

    updateAppState({
      ...appState,
      scheduledBlocks: [...nonCurrentBlocks, ...loadedBlocks],
    });

    addToast(`Loaded template "${template.name}" into active week!`, 'success');
  }, [appState, updateAppState, currentWeekId, addToast]);

  const deleteTemplate = useCallback((templateId: string) => {
    const tmpl = appState.templates.find((t) => t.id === templateId);
    const updated = appState.templates.filter((t) => t.id !== templateId);

    updateAppState({
      ...appState,
      templates: updated,
    });

    addToast(`Deleted template "${tmpl?.name || ''}"`, 'info');
  }, [appState, updateAppState, addToast]);

  const duplicateTemplate = useCallback((templateId: string) => {
    const tmpl = appState.templates.find((t) => t.id === templateId);
    if (!tmpl) return;

    const copy: TimetableTemplate = {
      ...tmpl,
      id: `tmpl-${Date.now()}`,
      name: `${tmpl.name} (Copy)`,
      createdAt: Date.now(),
    };

    updateAppState({
      ...appState,
      templates: [copy, ...appState.templates],
    });

    addToast(`Duplicated template "${tmpl.name}"`, 'success');
  }, [appState, updateAppState, addToast]);

  const runAISmartSchedule = useCallback(() => {
    const generated = generateAISmartSchedule(appState.libraryBlocks, currentWeekId);
    const nonCurrentBlocks = appState.scheduledBlocks.filter((sb) => sb.weekId !== currentWeekId);

    updateAppState({
      ...appState,
      scheduledBlocks: [...nonCurrentBlocks, ...generated],
    });

    addToast('Generated AI Smart Timetable for active week! ✨', 'success');
  }, [appState, currentWeekId, updateAppState, addToast]);

  const duplicateCurrentWeekTo = useCallback((targetWeekId: string) => {
    const currentWeekBlocks = appState.scheduledBlocks.filter((sb) => sb.weekId === currentWeekId);
    if (currentWeekBlocks.length === 0) {
      addToast(`Current week has no blocks to copy!`, 'warning');
      return;
    }

    const nonTargetBlocks = appState.scheduledBlocks.filter((sb) => sb.weekId !== targetWeekId);
    const duplicatedBlocks: ScheduledBlock[] = currentWeekBlocks.map((sb) => ({
      ...sb,
      id: `sched-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
      weekId: targetWeekId,
      status: 'not_started',
    }));

    updateAppState({
      ...appState,
      scheduledBlocks: [...nonTargetBlocks, ...duplicatedBlocks],
    });

    addToast(`Duplicated current schedule to week ${targetWeekId}`, 'success');
  }, [appState, updateAppState, currentWeekId, addToast]);

  const clearCurrentWeek = useCallback(() => {
    const nonCurrentBlocks = appState.scheduledBlocks.filter((sb) => sb.weekId !== currentWeekId);

    updateAppState({
      ...appState,
      scheduledBlocks: nonCurrentBlocks,
    });

    addToast(`Cleared current week schedule`, 'warning');
  }, [appState, updateAppState, currentWeekId, addToast]);

  const exportJSONBackup = useCallback(() => {
    const backupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      libraryBlocks: appState.libraryBlocks,
      scheduledBlocks: appState.scheduledBlocks,
      templates: appState.templates,
      customCategories: appState.customCategories,
      resolution,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `Timetable_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported Cloud JSON Backup file!', 'success');
  }, [appState, resolution, addToast]);

  const importJSONBackup = useCallback((jsonStr: string) => {
    try {
      const result = migrateBlockFlowJSON(jsonStr);
      if (result) {
        const allBlocks: ScheduledBlock[] = [];
        Object.values(result.scheduledBlocksByWeek).forEach((blocks: any) => {
          allBlocks.push(...blocks);
        });

        updateAppState({
          libraryBlocks: result.libraryBlocks,
          scheduledBlocks: allBlocks,
          templates: result.templates.length > 0 ? result.templates : appState.templates,
          customCategories: result.customCategories.length > 0 ? result.customCategories : appState.customCategories,
        });

        addToast(`Successfully imported ${result.report.libraryCount} library blocks & ${result.report.activitiesCount} activities across ${result.report.weeksCount} weeks! 🎉`, 'success');
        return true;
      }
    } catch (e) {
      console.error('Failed to import JSON backup', e);
    }
    addToast('Invalid backup file format', 'error');
    return false;
  }, [appState.templates, appState.customCategories, updateAppState, addToast]);

  const undo = useCallback(() => {
    if (canUndo) {
      historyUndo();
      addToast('Undid action (Ctrl+Z)', 'info');
    }
  }, [canUndo, historyUndo, addToast]);

  const redo = useCallback(() => {
    if (canRedo) {
      historyRedo();
      addToast('Redid action (Ctrl+Y)', 'info');
    }
  }, [canRedo, historyRedo, addToast]);

  return (
    <TimetableContext.Provider
      value={{
        libraryBlocks: appState.libraryBlocks,
        scheduledBlocks: appState.scheduledBlocks,
        currentWeekScheduledBlocks,
        currentWeekId,
        setCurrentWeekId,
        resolution,
        setResolution,
        searchQuery,
        setSearchQuery,
        customCategories: appState.customCategories,
        addCustomCategory,
        selectedBlockId,
        setSelectedBlockId,
        selectedCell,
        setSelectedCell,
        copiedBlock,
        copySelectedBlock,
        pasteCopiedBlock,
        duplicateSelectedBlock,
        deleteSelectedBlock,
        deselectAll,
        conflicts,
        updateBlockStatus,
        addLibraryBlock,
        updateLibraryBlock,
        deleteLibraryBlock,
        addScheduledBlock,
        moveScheduledBlock,
        resizeScheduledBlock,
        updateScheduledBlock,
        deleteScheduledBlock,
        duplicateCurrentWeekTo,
        clearCurrentWeek,
        templates: appState.templates,
        saveCurrentWeekAsTemplate,
        loadTemplate,
        deleteTemplate,
        duplicateTemplate,
        runAISmartSchedule,
        enableNotifications,
        notificationsEnabled,
        exportJSONBackup,
        importJSONBackup,
        undo,
        redo,
        canUndo,
        canRedo,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetable = () => {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
};
