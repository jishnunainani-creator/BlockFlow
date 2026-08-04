import { getUserScopedKey } from './userScope';
import { UserTimeBudget, DEFAULT_SUGGESTED_CATEGORIES } from '../types/timeBudget';

const TIME_BUDGET_STORAGE_KEY = 'blockflow_user_time_budget_v1';

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

export const createDefaultBudget = (): UserTimeBudget => {
  const categories = DEFAULT_SUGGESTED_CATEGORIES.map((cat, idx) => ({
    id: `cat-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
    displayOrder: idx,
    isActive: true,
    isSystemSuggested: true,
  }));

  const defaultTargetsMinutes: Record<string, number> = {
    'cat-sleep': 480, // 8h
    'cat-academics': 300, // 5h
    'cat-career-work': 180, // 3h
    'cat-fitness': 60, // 1h
    'cat-personal-routine': 120, // 2h
    'cat-leisure': 120, // 2h
    'cat-travel-commute': 60, // 1h
    'cat-flexible': 120, // 2h
    'cat-family': 0,
  };

  const budgets: Record<string, any> = {};
  categories.forEach((cat) => {
    budgets[cat.id] = {
      categoryId: cat.id,
      targetMinutes: defaultTargetsMinutes[cat.id] || 0,
      periodType: 'daily',
      targetType: 'preferred',
    };
  });

  return {
    isConfigured: false,
    categories,
    budgets,
    useDaySpecific: false,
    updatedAt: Date.now(),
  };
};

export const loadUserTimeBudget = (): UserTimeBudget => {
  const defaultVal = createDefaultBudget();
  const loaded = getStorageItem<UserTimeBudget | null>(TIME_BUDGET_STORAGE_KEY, null);
  if (!loaded) return defaultVal;
  return loaded;
};

export const saveUserTimeBudget = (budget: UserTimeBudget): void => {
  setStorageItem(TIME_BUDGET_STORAGE_KEY, budget);
};
