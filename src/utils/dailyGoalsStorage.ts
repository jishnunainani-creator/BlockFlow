/**
 * BlockFlow Daily Goals, Plan Periods & Day Reflections Local Storage
 * Scoped by user/guest, versioned with migrations, safe fallback
 */

import { DailyGoal, PlanPeriod, DayReflection, GoalMeasure } from '../types/dailyGoals';
import { getUserScopedKey, getActiveUserId } from './userScope';
import { idbGet, idbPut } from '../lib/indexedDbStore';
import { loadGoals, saveGoals } from './storage';

export const DAILY_GOALS_SCHEMA_VERSION = 1;

const KEYS = {
  DAILY_GOALS: 'blockflow_daily_goals_v1',
  PLAN_PERIODS: 'blockflow_plan_periods_v1',
  DAY_REFLECTIONS: 'blockflow_day_reflections_v1',
};

/**
 * Normalizes a raw object into a validated DailyGoal.
 */
export function normalizeDailyGoal(raw: any): DailyGoal {
  const now = Date.now();
  const rawMeasure = raw?.measure || {};
  const measure: GoalMeasure = {
    type: ['check', 'count', 'percent', 'minutes'].includes(rawMeasure.type) ? rawMeasure.type : 'check',
    target: typeof rawMeasure.target === 'number' ? rawMeasure.target : undefined,
    current: typeof rawMeasure.current === 'number' ? rawMeasure.current : 0,
  };

  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : `dg_${now}_${Math.random().toString(36).slice(2, 7)}`,
    date: typeof raw?.date === 'string' && raw.date ? raw.date : new Date().toISOString().split('T')[0],
    periodId: typeof raw?.periodId === 'string' ? raw.periodId : undefined,
    title: typeof raw?.title === 'string' ? raw.title.trim() : 'Untitled Goal',
    notes: typeof raw?.notes === 'string' ? raw.notes : undefined,
    color: typeof raw?.color === 'string' ? raw.color : 'indigo',
    priority: ['high', 'medium', 'low'].includes(raw?.priority) ? raw.priority : 'medium',
    isMustDo: Boolean(raw?.isMustDo),
    startTime: typeof raw?.startTime === 'string' ? raw.startTime : undefined,
    endTime: typeof raw?.endTime === 'string' ? raw.endTime : undefined,
    estimateMin: typeof raw?.estimateMin === 'number' ? raw.estimateMin : undefined,
    actualMin: typeof raw?.actualMin === 'number' ? raw.actualMin : undefined,
    measure,
    status: ['planned', 'in_progress', 'done', 'partial', 'skipped', 'carried'].includes(raw?.status)
      ? raw.status
      : 'planned',
    carriedFromId: typeof raw?.carriedFromId === 'string' ? raw.carriedFromId : undefined,
    carryCount: typeof raw?.carryCount === 'number' ? raw.carryCount : 0,
    linkedBlockId: typeof raw?.linkedBlockId === 'string' ? raw.linkedBlockId : undefined,
    linkedAssignmentId: typeof raw?.linkedAssignmentId === 'string' ? raw.linkedAssignmentId : undefined,
    linkedSmartGoalId: typeof raw?.linkedSmartGoalId === 'string' ? raw.linkedSmartGoalId : undefined,
    order: typeof raw?.order === 'number' ? raw.order : 0,
    createdAt: typeof raw?.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt : now,
    completedAt: typeof raw?.completedAt === 'number' ? raw.completedAt : undefined,
  };
}

/**
 * Normalizes a raw object into a validated PlanPeriod.
 */
export function normalizePlanPeriod(raw: any): PlanPeriod {
  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  const milestones = Array.isArray(raw?.milestones)
    ? raw.milestones.map((m: any) => ({
        date: typeof m?.date === 'string' ? m.date : todayStr,
        label: typeof m?.label === 'string' ? m.label : 'Milestone',
      }))
    : [];

  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : `period_${now}_${Math.random().toString(36).slice(2, 7)}`,
    name: typeof raw?.name === 'string' ? raw.name.trim() : 'New Plan Period',
    startDate: typeof raw?.startDate === 'string' ? raw.startDate : todayStr,
    endDate: typeof raw?.endDate === 'string' ? raw.endDate : todayStr,
    color: typeof raw?.color === 'string' ? raw.color : 'indigo',
    kind: ['exam', 'sprint', 'custom'].includes(raw?.kind) ? raw.kind : 'custom',
    milestones,
    createdAt: typeof raw?.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt : now,
  };
}

/**
 * Normalizes a raw object into a validated DayReflection.
 */
export function normalizeDayReflection(raw: any): DayReflection {
  const now = Date.now();
  const dateStr = typeof raw?.date === 'string' ? raw.date : new Date().toISOString().split('T')[0];
  const energy = typeof raw?.energy === 'number' && raw.energy >= 1 && raw.energy <= 5 ? raw.energy : 3;

  return {
    date: dateStr,
    energy,
    reasonTags: typeof raw?.reasonTags === 'object' && raw.reasonTags !== null ? raw.reasonTags : {},
    win: typeof raw?.win === 'string' ? raw.win : '',
    tomorrowFirstStep: typeof raw?.tomorrowFirstStep === 'string' ? raw.tomorrowFirstStep : '',
    completedAt: typeof raw?.completedAt === 'number' ? raw.completedAt : now,
  };
}

// ──────────────────────────────────────────────
// DAILY GOALS CRUD
// ──────────────────────────────────────────────

export function loadDailyGoals(): DailyGoal[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getUserScopedKey(KEYS.DAILY_GOALS);
    let raw = localStorage.getItem(key);
    if (!raw && !getActiveUserId()) {
      raw = localStorage.getItem(KEYS.DAILY_GOALS);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeDailyGoal).sort((a, b) => a.order - b.order);
      }
    }
  } catch (err) {
    console.error('[DailyGoalsStorage] Failed to load daily goals:', err);
  }
  return [];
}

export function saveDailyGoals(goals: DailyGoal[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserScopedKey(KEYS.DAILY_GOALS);
    const normalized = goals.map(normalizeDailyGoal);
    localStorage.setItem(key, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('blockflow_daily_goals_updated'));
  } catch (err) {
    console.error('[DailyGoalsStorage] Failed to save daily goals:', err);
  }
}

// ──────────────────────────────────────────────
// PLAN PERIODS CRUD
// ──────────────────────────────────────────────

export function loadPlanPeriods(): PlanPeriod[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getUserScopedKey(KEYS.PLAN_PERIODS);
    let raw = localStorage.getItem(key);
    if (!raw && !getActiveUserId()) {
      raw = localStorage.getItem(KEYS.PLAN_PERIODS);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizePlanPeriod).sort((a, b) => a.startDate.localeCompare(b.startDate));
      }
    }
  } catch (err) {
    console.error('[DailyGoalsStorage] Failed to load plan periods:', err);
  }
  return [];
}

export function savePlanPeriods(periods: PlanPeriod[]): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserScopedKey(KEYS.PLAN_PERIODS);
    const normalized = periods.map(normalizePlanPeriod);
    localStorage.setItem(key, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('blockflow_plan_periods_updated'));
  } catch (err) {
    console.error('[DailyGoalsStorage] Failed to save plan periods:', err);
  }
}

// ──────────────────────────────────────────────
// DAY REFLECTIONS CRUD
// ──────────────────────────────────────────────

export function loadDayReflections(): Record<string, DayReflection> {
  if (typeof window === 'undefined') return {};
  try {
    const key = getUserScopedKey(KEYS.DAY_REFLECTIONS);
    let raw = localStorage.getItem(key);
    if (!raw && !getActiveUserId()) {
      raw = localStorage.getItem(KEYS.DAY_REFLECTIONS);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        const result: Record<string, DayReflection> = {};
        for (const [date, val] of Object.entries(parsed)) {
          result[date] = normalizeDayReflection(val);
        }
        return result;
      }
    }
  } catch (err) {
    console.error('[DailyGoalsStorage] Failed to load day reflections:', err);
  }
  return {};
}

export function loadDayReflection(dateStr: string): DayReflection | null {
  const reflections = loadDayReflections();
  return reflections[dateStr] || null;
}

export function saveDayReflection(reflection: DayReflection): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserScopedKey(KEYS.DAY_REFLECTIONS);
    const current = loadDayReflections();
    const normalized = normalizeDayReflection(reflection);
    current[normalized.date] = normalized;
    localStorage.setItem(key, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('blockflow_day_reflections_updated', { detail: normalized }));
  } catch (err) {
    console.error('[DailyGoalsStorage] Failed to save day reflection:', err);
  }
}

export function saveDayReflections(reflections: Record<string, DayReflection>): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserScopedKey(KEYS.DAY_REFLECTIONS);
    const normalizedMap: Record<string, DayReflection> = {};
    for (const [date, val] of Object.entries(reflections)) {
      normalizedMap[date] = normalizeDayReflection(val);
    }
    localStorage.setItem(key, JSON.stringify(normalizedMap));
    window.dispatchEvent(new CustomEvent('blockflow_day_reflections_updated'));
  } catch (err) {
    console.error('[DailyGoalsStorage] Failed to save day reflections map:', err);
  }
}

/**
 * Increments progress on a linked SMART goal when a daily goal is completed.
 */
export function incrementSmartGoalProgress(smartGoalId: string, amount: number = 1): boolean {
  try {
    const goals = loadGoals();
    let updatedAny = false;
    const updated = goals.map((g) => {
      if (g.id !== smartGoalId) return g;
      updatedAny = true;
      const currentVal = (g.smart?.currentValue || 0) + amount;
      const targetVal = g.smart?.targetValue || 100;
      const progressPct = Math.min(100, Math.round((currentVal / (targetVal || 1)) * 100));
      return {
        ...g,
        progressPct,
        smart: {
          ...g.smart,
          currentValue: currentVal,
        },
        status: progressPct >= 100 ? ('completed' as const) : g.status,
        updatedAt: Date.now(),
      };
    });

    if (updatedAny) {
      saveGoals(updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('blockflow_goals_changed'));
      }
      return true;
    }
  } catch (err) {
    console.error('[DailyGoalsStorage] Failed to increment SMART goal progress:', err);
  }
  return false;
}
