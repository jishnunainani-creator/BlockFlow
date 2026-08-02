import { getUserScopedKey } from './userScope';

export interface ActiveFocusSession {
  id: string;
  taskTitle: string;
  blockId?: string;
  goalId?: string;
  startedAt: number; // Date.now() timestamp
  endsAt: number; // Date.now() timestamp when timer reaches 00:00
  durationSeconds: number;
  remainingSecondsOnPause?: number;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  mode: 'focus' | 'break';
  breakDurationSeconds?: number;
  completionTriggered?: boolean;
}

export interface FocusSessionLog {
  id: string;
  startedAt: number;
  endedAt: number;
  plannedMinutes: number;
  actualMinutes: number;
  taskTitle: string;
  blockId?: string;
  goalId?: string;
  status: 'completed' | 'cancelled' | 'early_exit';
  distractionReason?: string;
}

const ACTIVE_SESSION_KEY_BASE = 'blockflow_active_focus_session';
const FOCUS_HISTORY_KEY_BASE = 'blockflow_focus_session_history';

export function loadActiveFocusSession(): ActiveFocusSession | null {
  try {
    const key = getUserScopedKey(ACTIVE_SESSION_KEY_BASE);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load active focus session:', err);
    return null;
  }
}

export function saveActiveFocusSession(session: ActiveFocusSession | null): void {
  try {
    const key = getUserScopedKey(ACTIVE_SESSION_KEY_BASE);
    if (!session) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save active focus session:', err);
  }
}

export function clearActiveFocusSession(): void {
  saveActiveFocusSession(null);
}

export function loadFocusHistory(): FocusSessionLog[] {
  try {
    const key = getUserScopedKey(FOCUS_HISTORY_KEY_BASE);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load focus history:', err);
    return [];
  }
}

export function saveFocusHistory(history: FocusSessionLog[]): void {
  try {
    const key = getUserScopedKey(FOCUS_HISTORY_KEY_BASE);
    localStorage.setItem(key, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save focus history:', err);
  }
}

export function appendFocusSessionLog(log: FocusSessionLog): void {
  const history = loadFocusHistory();
  saveFocusHistory([log, ...history]);
}
