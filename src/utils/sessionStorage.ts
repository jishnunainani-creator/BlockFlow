import { getUserScopedKey } from './userScope';
import { ExecutionSession, DeviationRecord } from '../types/sessionLog';

const SESSIONS_KEY = 'blockflow_execution_sessions_v1';
const DEVIATIONS_KEY = 'blockflow_deviations_v1';

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const scopedKey = getUserScopedKey(key);
    const item = localStorage.getItem(scopedKey);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading storage key "${key}":`, error);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    const scopedKey = getUserScopedKey(key);
    localStorage.setItem(scopedKey, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving storage key "${key}":`, error);
  }
};

export const loadExecutionSessions = (): ExecutionSession[] => {
  return getStorageItem<ExecutionSession[]>(SESSIONS_KEY, []);
};

export const saveExecutionSessions = (sessions: ExecutionSession[]): void => {
  setStorageItem(SESSIONS_KEY, sessions);
};

export const loadDeviations = (): DeviationRecord[] => {
  return getStorageItem<DeviationRecord[]>(DEVIATIONS_KEY, []);
};

export const saveDeviations = (deviations: DeviationRecord[]): void => {
  setStorageItem(DEVIATIONS_KEY, deviations);
};

export const appendExecutionSession = (session: ExecutionSession): ExecutionSession[] => {
  const current = loadExecutionSessions();
  // Check if session for this scheduledBlockId already exists
  const existingIdx = current.findIndex((s) => s.id === session.id || s.scheduledBlockId === session.scheduledBlockId);
  let updated: ExecutionSession[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = session;
  } else {
    updated = [session, ...current];
  }
  saveExecutionSessions(updated);
  return updated;
};

export const appendDeviationRecord = (deviation: DeviationRecord): DeviationRecord[] => {
  const current = loadDeviations();
  const updated = [deviation, ...current];
  saveDeviations(updated);
  return updated;
};
