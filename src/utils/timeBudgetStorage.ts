import { getUserScopedKey } from './userScope';
import { TimeCategory, DEFAULT_TIME_CATEGORIES } from '../types/timeBudget';

const TIME_CATEGORIES_STORAGE_KEY = 'blockflow_user_time_categories_v1';

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

export const createDefaultCategories = (): TimeCategory[] => {
  return DEFAULT_TIME_CATEGORIES.map((cat, idx) => ({
    id: `cat-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
    displayOrder: idx,
    isActive: true,
    isSystemSuggested: true,
  }));
};

export const loadUserTimeCategories = (): TimeCategory[] => {
  const loaded = getStorageItem<TimeCategory[] | null>(TIME_CATEGORIES_STORAGE_KEY, null);
  if (!loaded || loaded.length === 0) return createDefaultCategories();
  return loaded;
};

export const saveUserTimeCategories = (categories: TimeCategory[]): void => {
  setStorageItem(TIME_CATEGORIES_STORAGE_KEY, categories);
};
