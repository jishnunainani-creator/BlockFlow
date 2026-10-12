import { ProposedPlanItem, ScheduleConstraintConfig } from '../types/adaptivePlanner';
import { getUserScopedKey } from './userScope';
import { DEFAULT_CONSTRAINT_CONFIG } from './adaptivePlannerEngine';

const ADAPTIVE_PROPOSALS_KEY = 'blockflow_adaptive_proposals_v1';
const ADAPTIVE_CONFIG_KEY = 'blockflow_adaptive_config_v1';

export function loadStoredProposals(): ProposedPlanItem[] {
  try {
    const key = getUserScopedKey(ADAPTIVE_PROPOSALS_KEY);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load adaptive proposals', e);
  }
  return [];
}

export function saveStoredProposals(proposals: ProposedPlanItem[]): void {
  try {
    const key = getUserScopedKey(ADAPTIVE_PROPOSALS_KEY);
    localStorage.setItem(key, JSON.stringify(proposals));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('blockflow_adaptive_proposals_changed'));
    }
  } catch (e) {
    console.error('Failed to save adaptive proposals', e);
  }
}

export function loadPlannerConfig(): ScheduleConstraintConfig {
  try {
    const key = getUserScopedKey(ADAPTIVE_CONFIG_KEY);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CONSTRAINT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load planner config', e);
  }
  return DEFAULT_CONSTRAINT_CONFIG;
}

export function savePlannerConfig(config: ScheduleConstraintConfig): void {
  try {
    const key = getUserScopedKey(ADAPTIVE_CONFIG_KEY);
    localStorage.setItem(key, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save planner config', e);
  }
}
