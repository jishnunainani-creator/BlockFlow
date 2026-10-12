import { ActiveFocusSession, FocusSessionLog } from './focusStorage';
import { ExecutionSession } from '../types/sessionLog';

export interface CreateSessionParams {
  id?: string;
  taskTitle: string;
  blockId?: string;
  taskId?: string;
  goalId?: string;
  durationSeconds?: number;
  plannedDurationMinutes?: number;
  mode?: 'focus' | 'break';
  breakDurationSeconds?: number;
  now?: number;
}

export interface FinalizeSessionParams {
  session: ActiveFocusSession;
  now?: number;
  userNotes?: string;
  status?: 'completed' | 'cancelled' | 'early_exit';
  distractionReason?: string;
  rating?: number;
}

export interface FinalizeSessionResult {
  executionSession: ExecutionSession;
  focusSessionLog: FocusSessionLog;
  actualDurationMinutes: number;
  actualDurationSeconds: number;
}

/**
 * Creates a new active session using accurate wall-clock timestamps.
 */
export function createActiveSession(params: CreateSessionParams): ActiveFocusSession {
  const now = params.now ?? Date.now();
  const plannedMins = params.plannedDurationMinutes ?? Math.round((params.durationSeconds ?? 25 * 60) / 60);
  const totalSecs =
    params.durationSeconds !== undefined && params.durationSeconds > 0
      ? params.durationSeconds
      : Math.max(60, plannedMins * 60);

  const cleanTitle = params.taskTitle.trim() || 'Focus Session';

  return {
    id: params.id ?? `focus_${now}_${Math.random().toString(36).slice(2, 7)}`,
    taskTitle: cleanTitle,
    blockId: params.blockId,
    taskId: params.taskId,
    goalId: params.goalId,
    startedAt: now,
    lastStartedAt: now,
    endsAt: now + totalSecs * 1000,
    durationSeconds: totalSecs,
    plannedDurationMinutes: plannedMins,
    accumulatedFocusSeconds: 0,
    remainingSecondsOnPause: undefined,
    status: 'running',
    mode: params.mode ?? 'focus',
    breakDurationSeconds: params.breakDurationSeconds ?? 5 * 60,
    completionTriggered: false,
  };
}

/**
 * Pauses a running session. Paused time never counts towards focus time.
 * This operation is idempotent: calling it on an already paused session is a no-op.
 */
export function pauseActiveSession(
  session: ActiveFocusSession,
  now: number = Date.now()
): ActiveFocusSession {
  if (session.status !== 'running') {
    return session;
  }

  const lastStart = session.lastStartedAt ?? session.startedAt;
  const currentRunningSegment = Math.max(0, Math.floor((now - lastStart) / 1000));
  const newAccumulated = (session.accumulatedFocusSeconds ?? 0) + currentRunningSegment;
  const remaining = Math.max(0, session.durationSeconds - newAccumulated);

  return {
    ...session,
    status: 'paused',
    accumulatedFocusSeconds: newAccumulated,
    remainingSecondsOnPause: remaining,
    endsAt: now + remaining * 1000,
  };
}

/**
 * Resumes a paused session.
 * This operation is idempotent: calling it on an already running session is a no-op.
 */
export function resumeActiveSession(
  session: ActiveFocusSession,
  now: number = Date.now()
): ActiveFocusSession {
  if (session.status === 'running') {
    return session;
  }

  const remaining =
    session.remainingSecondsOnPause ??
    Math.max(0, session.durationSeconds - (session.accumulatedFocusSeconds ?? 0));

  return {
    ...session,
    status: 'running',
    lastStartedAt: now,
    endsAt: now + remaining * 1000,
    remainingSecondsOnPause: undefined,
  };
}

/**
 * Calculates total elapsed focus seconds using timestamps.
 * Resilient to browser tab backgrounding, thread suspension, and page reload.
 */
export function calculateElapsedSeconds(
  session: ActiveFocusSession,
  now: number = Date.now()
): number {
  const accumulated = session.accumulatedFocusSeconds ?? 0;

  if (session.status === 'running') {
    const lastStart = session.lastStartedAt ?? session.startedAt;
    const currentRunningSegment = Math.max(0, Math.floor((now - lastStart) / 1000));
    return Math.min(session.durationSeconds, accumulated + currentRunningSegment);
  }

  return Math.min(session.durationSeconds, accumulated);
}

/**
 * Calculates seconds remaining on the timer.
 */
export function calculateRemainingSeconds(
  session: ActiveFocusSession,
  now: number = Date.now()
): number {
  const elapsed = calculateElapsedSeconds(session, now);
  return Math.max(0, session.durationSeconds - elapsed);
}

/**
 * Checks if timer duration has completed.
 */
export function isSessionFinished(
  session: ActiveFocusSession,
  now: number = Date.now()
): boolean {
  return calculateRemainingSeconds(session, now) <= 0;
}

/**
 * Finalizes an active session into canonical persistence records.
 * Never auto-completes tasks without user confirmation.
 */
export function finalizeSession(params: FinalizeSessionParams): FinalizeSessionResult {
  const { session, now = Date.now(), userNotes, status = 'completed', distractionReason, rating } = params;

  const actualElapsedSeconds = calculateElapsedSeconds(session, now);
  const actualDurationMinutes = Math.max(1, Math.round(actualElapsedSeconds / 60));
  const plannedMinutes = session.plannedDurationMinutes ?? Math.round(session.durationSeconds / 60);

  const nowObj = new Date(now);
  const dateStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-${String(
    nowObj.getDate()
  ).padStart(2, '0')}`;
  const startMinutes = nowObj.getHours() * 60 + nowObj.getMinutes() - actualDurationMinutes;

  const focusLog: FocusSessionLog = {
    id: `log_${now}_${Math.random().toString(36).slice(2, 7)}`,
    taskTitle: session.taskTitle,
    blockId: session.blockId,
    taskId: session.taskId,
    goalId: session.goalId,
    startedAt: session.startedAt,
    endedAt: now,
    plannedMinutes,
    actualMinutes: actualDurationMinutes,
    status: status === 'cancelled' ? 'cancelled' : status === 'early_exit' ? 'early_exit' : 'completed',
    distractionReason,
    notes: userNotes,
  };

  const execSession: ExecutionSession = {
    id: `exec_${now}_${Math.random().toString(36).slice(2, 7)}`,
    scheduledBlockId: session.blockId ?? '',
    date: dateStr,
    plannedTitle: session.taskTitle,
    plannedStartMinutes: Math.max(0, startMinutes),
    plannedDuration: plannedMinutes,
    actualTitle: session.taskTitle,
    actualStartMinutes: Math.max(0, startMinutes),
    actualDuration: actualDurationMinutes,
    status: status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'partially_completed',
    notes: userNotes,
    focusRating: rating ?? 5,
    deviationReason: distractionReason,
    createdAt: now,
  };

  return {
    executionSession: execSession,
    focusSessionLog: focusLog,
    actualDurationMinutes,
    actualDurationSeconds: actualElapsedSeconds,
  };
}
