import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTimetable } from './TimetableContext';
import { ScheduledBlock } from '../types/timetable';
import {
  ExecutionSession,
  DeviationRecord,
  PlanVsRealityMetrics,
  DeviationAnalyticsSummary,
  StudyHistorySummary,
  PlanningInsightPattern,
} from '../types/sessionLog';
import {
  loadExecutionSessions,
  saveExecutionSessions,
  loadDeviations,
  saveDeviations,
  appendExecutionSession,
  appendDeviationRecord,
} from '../utils/sessionStorage';
import {
  calculatePlanVsReality,
  calculateDeviationAnalytics,
  calculateStudyAnalytics,
  detectPlanningPatterns,
} from '../utils/planVsRealityEngine';
import { getTodayDateString } from '../utils/executionStorage';

interface SessionContextType {
  sessions: ExecutionSession[];
  deviations: DeviationRecord[];

  activeSessionLogBlock: ScheduledBlock | null;
  openSessionLogModal: (block: ScheduledBlock) => void;
  closeSessionLogModal: () => void;

  activeReplaceBlock: ScheduledBlock | null;
  openReplaceModal: (block: ScheduledBlock) => void;
  closeReplaceModal: () => void;

  logSession: (sessionData: Omit<ExecutionSession, 'id' | 'createdAt'>) => ExecutionSession;
  replaceActivity: (params: {
    scheduledBlock: ScheduledBlock;
    actualTitle: string;
    reason: string;
    note?: string;
    actionOnPlanned: 'reschedule' | 'inbox' | 'skip' | 'cancel';
    rescheduledBlockId?: string;
  }) => void;
  extendSession: (scheduledBlockId: string, additionalMinutes: number) => void;

  getPlanVsRealityForDate: (date: string, scheduledBlocks: ScheduledBlock[]) => PlanVsRealityMetrics;
  getDeviationAnalytics: (days?: number) => DeviationAnalyticsSummary;
  getStudyHistory: () => StudyHistorySummary;
  getPlanningInsights: () => PlanningInsightPattern[];
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentWeekScheduledBlocks, updateScheduledBlock, addScheduledBlock, addToast } = useTimetable();

  const [sessions, setSessions] = useState<ExecutionSession[]>([]);
  const [deviations, setDeviations] = useState<DeviationRecord[]>([]);

  const [activeSessionLogBlock, setActiveSessionLogBlock] = useState<ScheduledBlock | null>(null);
  const [activeReplaceBlock, setActiveReplaceBlock] = useState<ScheduledBlock | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    setSessions(loadExecutionSessions());
    setDeviations(loadDeviations());
  }, []);

  const openSessionLogModal = useCallback((block: ScheduledBlock) => {
    setActiveSessionLogBlock(block);
  }, []);

  const closeSessionLogModal = useCallback(() => {
    setActiveSessionLogBlock(null);
  }, []);

  const openReplaceModal = useCallback((block: ScheduledBlock) => {
    setActiveReplaceBlock(block);
  }, []);

  const closeReplaceModal = useCallback(() => {
    setActiveReplaceBlock(null);
  }, []);

  // Log an actual execution session
  const logSession = useCallback(
    (sessionData: Omit<ExecutionSession, 'id' | 'createdAt'>): ExecutionSession => {
      const newSession: ExecutionSession = {
        ...sessionData,
        id: `sess-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
        createdAt: Date.now(),
      };

      const updatedSessions = appendExecutionSession(newSession);
      setSessions(updatedSessions);

      // Also update scheduled block status
      updateScheduledBlock(sessionData.scheduledBlockId, {
        status: sessionData.status as any,
        completedAt: Date.now(),
        actualDuration: sessionData.actualDuration,
      });

      addToast(`Session logged for "${newSession.actualTitle}"! 📝`, 'success');
      return newSession;
    },
    [updateScheduledBlock, addToast]
  );

  // Replace Activity Scenario (Part 6)
  const replaceActivity = useCallback(
    ({
      scheduledBlock,
      actualTitle,
      reason,
      note,
      actionOnPlanned,
      rescheduledBlockId,
    }: {
      scheduledBlock: ScheduledBlock;
      actualTitle: string;
      reason: string;
      note?: string;
      actionOnPlanned: 'reschedule' | 'inbox' | 'skip' | 'cancel';
      rescheduledBlockId?: string;
    }) => {
      const dateStr = getTodayDateString();

      // 1. Create Deviation Record
      const newDeviation: DeviationRecord = {
        id: `dev-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
        scheduledBlockId: scheduledBlock.id,
        date: dateStr,
        plannedTitle: scheduledBlock.title,
        actualTitle,
        deviationType: 'replacement',
        reason,
        note,
        rescheduledBlockId,
        createdAt: Date.now(),
      };
      const updatedDeviations = appendDeviationRecord(newDeviation);
      setDeviations(updatedDeviations);

      // 2. Create Execution Session representing the actual activity
      const newSession: ExecutionSession = {
        id: `sess-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
        scheduledBlockId: scheduledBlock.id,
        date: dateStr,
        plannedTitle: scheduledBlock.title,
        plannedStartMinutes: scheduledBlock.startMinutes,
        plannedDuration: scheduledBlock.duration,
        plannedDescription: scheduledBlock.description,
        actualTitle,
        actualStartMinutes: scheduledBlock.startMinutes,
        actualDuration: scheduledBlock.duration,
        status: 'replaced',
        deviationReason: reason,
        deviationNote: note,
        rescheduledBlockId,
        createdAt: Date.now(),
      };
      const updatedSessions = appendExecutionSession(newSession);
      setSessions(updatedSessions);

      // 3. Preserve original scheduled block history, update status to 'replaced'
      let finalStatus: any = 'replaced';
      if (actionOnPlanned === 'skip') finalStatus = 'skipped';
      if (actionOnPlanned === 'cancel') finalStatus = 'cancelled';
      if (actionOnPlanned === 'reschedule') finalStatus = 'rescheduled';

      updateScheduledBlock(scheduledBlock.id, {
        status: finalStatus,
      });

      addToast(`Replaced "${scheduledBlock.title}" with "${actualTitle}"`, 'info');
    },
    [updateScheduledBlock, addToast]
  );

  // Extend Session (Part 21)
  const extendSession = useCallback(
    (scheduledBlockId: string, additionalMinutes: number) => {
      const block = currentWeekScheduledBlocks.find((b) => b.id === scheduledBlockId);
      if (!block) return;

      const newDuration = block.duration + additionalMinutes;
      updateScheduledBlock(scheduledBlockId, {
        duration: newDuration,
        actualDuration: newDuration,
      });

      addToast(`Extended session by +${additionalMinutes}m ⏱️`, 'success');
    },
    [currentWeekScheduledBlocks, updateScheduledBlock, addToast]
  );

  // Plan vs Reality Metrics
  const getPlanVsRealityForDate = useCallback(
    (date: string, scheduledBlocks: ScheduledBlock[]) => {
      return calculatePlanVsReality(date, scheduledBlocks, sessions, deviations);
    },
    [sessions, deviations]
  );

  // Deviation Analytics
  const getDeviationAnalytics = useCallback(
    (days: number = 30) => {
      return calculateDeviationAnalytics(deviations, sessions, days);
    },
    [deviations, sessions]
  );

  // Study History Summary
  const getStudyHistory = useCallback(() => {
    return calculateStudyAnalytics(sessions, currentWeekScheduledBlocks);
  }, [sessions, currentWeekScheduledBlocks]);

  // Planning Insights / Patterns
  const getPlanningInsights = useCallback(() => {
    return detectPlanningPatterns(sessions, deviations);
  }, [sessions, deviations]);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        deviations,
        activeSessionLogBlock,
        openSessionLogModal,
        closeSessionLogModal,
        activeReplaceBlock,
        openReplaceModal,
        closeReplaceModal,
        logSession,
        replaceActivity,
        extendSession,
        getPlanVsRealityForDate,
        getDeviationAnalytics,
        getStudyHistory,
        getPlanningInsights,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
