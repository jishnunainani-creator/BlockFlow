import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTimetable } from './TimetableContext';
import { useSession } from './SessionContext';
import {
  UserTimeBudget,
  TimeBudgetSummary,
  TimeCategory,
  CategoryBudget,
  TargetPeriodType,
} from '../types/timeBudget';
import { loadUserTimeBudget, saveUserTimeBudget, createDefaultBudget } from '../utils/timeBudgetStorage';
import { DateScopeFilter, calculateTimeBudgetSummary } from '../utils/timeBudgetEngine';

interface TimeBudgetContextType {
  userBudget: UserTimeBudget;
  summary: TimeBudgetSummary;
  dateScope: DateScopeFilter;
  setDateScope: (scope: DateScopeFilter) => void;

  isConfigureModalOpen: boolean;
  openConfigureModal: () => void;
  closeConfigureModal: () => void;

  isBulkCategorizeOpen: boolean;
  openBulkCategorizeModal: () => void;
  closeBulkCategorizeModal: () => void;

  saveBudgetConfiguration: (
    categories: TimeCategory[],
    budgets: Record<string, CategoryBudget>,
    useDaySpecific?: boolean
  ) => void;

  addCategory: (
    catData: Omit<TimeCategory, 'id' | 'displayOrder' | 'isActive'>,
    targetMinutes: number,
    periodType?: TargetPeriodType
  ) => TimeCategory;

  updateCategory: (
    categoryId: string,
    partialCat: Partial<TimeCategory>,
    partialBudget?: Partial<CategoryBudget>
  ) => void;

  deleteCategory: (categoryId: string) => void;
  bulkCategorizeBlocks: (mappings: Record<string, string>) => void; // blockTitle -> categoryId
}

const TimeBudgetContext = createContext<TimeBudgetContextType | undefined>(undefined);

export const TimeBudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentWeekScheduledBlocks, updateScheduledBlock, addToast } = useTimetable();
  const { sessions } = useSession();

  const [userBudget, setUserBudget] = useState<UserTimeBudget>(createDefaultBudget());
  const [dateScope, setDateScope] = useState<DateScopeFilter>('week');
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isBulkCategorizeOpen, setIsBulkCategorizeOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    setUserBudget(loadUserTimeBudget());
  }, []);

  const openConfigureModal = useCallback(() => setIsConfigureModalOpen(true), []);
  const closeConfigureModal = useCallback(() => setIsConfigureModalOpen(false), []);

  const openBulkCategorizeModal = useCallback(() => setIsBulkCategorizeOpen(true), []);
  const closeBulkCategorizeModal = useCallback(() => setIsBulkCategorizeOpen(false), []);

  // Save budget configuration
  const saveBudgetConfiguration = useCallback(
    (categories: TimeCategory[], budgets: Record<string, CategoryBudget>, useDaySpecific: boolean = false) => {
      const updated: UserTimeBudget = {
        isConfigured: true,
        categories,
        budgets,
        useDaySpecific,
        updatedAt: Date.now(),
      };

      setUserBudget(updated);
      saveUserTimeBudget(updated);
      addToast('Personal Time Budget updated! ⏳', 'success');
    },
    [addToast]
  );

  // Add custom category
  const addCategory = useCallback(
    (
      catData: Omit<TimeCategory, 'id' | 'displayOrder' | 'isActive'>,
      targetMinutes: number,
      periodType: TargetPeriodType = 'daily'
    ): TimeCategory => {
      const newCat: TimeCategory = {
        ...catData,
        id: `cat-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
        displayOrder: userBudget.categories.length,
        isActive: true,
      };

      const newBudget: CategoryBudget = {
        categoryId: newCat.id,
        targetMinutes,
        periodType,
        targetType: 'preferred',
      };

      const updatedCategories = [...userBudget.categories, newCat];
      const updatedBudgets = { ...userBudget.budgets, [newCat.id]: newBudget };

      const updated: UserTimeBudget = {
        ...userBudget,
        isConfigured: true,
        categories: updatedCategories,
        budgets: updatedBudgets,
        updatedAt: Date.now(),
      };

      setUserBudget(updated);
      saveUserTimeBudget(updated);
      addToast(`Added category "${newCat.name}"! 🏷️`, 'success');
      return newCat;
    },
    [userBudget, addToast]
  );

  // Update category
  const updateCategory = useCallback(
    (categoryId: string, partialCat: Partial<TimeCategory>, partialBudget?: Partial<CategoryBudget>) => {
      const updatedCategories = userBudget.categories.map((c) =>
        c.id === categoryId ? { ...c, ...partialCat } : c
      );

      const updatedBudgets = { ...userBudget.budgets };
      if (partialBudget && updatedBudgets[categoryId]) {
        updatedBudgets[categoryId] = { ...updatedBudgets[categoryId], ...partialBudget };
      }

      const updated: UserTimeBudget = {
        ...userBudget,
        categories: updatedCategories,
        budgets: updatedBudgets,
        updatedAt: Date.now(),
      };

      setUserBudget(updated);
      saveUserTimeBudget(updated);
      addToast('Category updated', 'info');
    },
    [userBudget, addToast]
  );

  // Delete category (Category Deletion Safety - Requirement 14)
  const deleteCategory = useCallback(
    (categoryId: string) => {
      const cat = userBudget.categories.find((c) => c.id === categoryId);

      // Check if assigned to any current blocks
      const assignedCount = currentWeekScheduledBlocks.filter((b) => (b as any).categoryId === categoryId).length;
      if (assignedCount > 0) {
        // Remap assigned blocks to undefined (uncategorized)
        currentWeekScheduledBlocks.forEach((b) => {
          if ((b as any).categoryId === categoryId) {
            updateScheduledBlock(b.id, { categoryId: undefined } as any);
          }
        });
      }

      const updatedCategories = userBudget.categories.filter((c) => c.id !== categoryId);
      const updatedBudgets = { ...userBudget.budgets };
      delete updatedBudgets[categoryId];

      const updated: UserTimeBudget = {
        ...userBudget,
        categories: updatedCategories,
        budgets: updatedBudgets,
        updatedAt: Date.now(),
      };

      setUserBudget(updated);
      saveUserTimeBudget(updated);
      addToast(`Removed category "${cat?.name || ''}". ${assignedCount > 0 ? `${assignedCount} blocks set as Uncategorized.` : ''}`, 'warning');
    },
    [userBudget, currentWeekScheduledBlocks, updateScheduledBlock, addToast]
  );

  // Bulk categorize activity blocks (Part 10)
  const bulkCategorizeBlocks = useCallback(
    (mappings: Record<string, string>) => {
      let count = 0;
      currentWeekScheduledBlocks.forEach((block) => {
        const norm = block.title.toLowerCase().trim();
        const matchedKey = Object.keys(mappings).find((k) => k.toLowerCase().trim() === norm);
        if (matchedKey) {
          const categoryId = mappings[matchedKey];
          updateScheduledBlock(block.id, { categoryId } as any);
          count++;
        }
      });

      addToast(`Categorized ${count} activities! 🏷️`, 'success');
    },
    [currentWeekScheduledBlocks, updateScheduledBlock, addToast]
  );

  const summary = calculateTimeBudgetSummary(userBudget, currentWeekScheduledBlocks, sessions, dateScope);

  return (
    <TimeBudgetContext.Provider
      value={{
        userBudget,
        summary,
        dateScope,
        setDateScope,
        isConfigureModalOpen,
        openConfigureModal,
        closeConfigureModal,
        isBulkCategorizeOpen,
        openBulkCategorizeModal,
        closeBulkCategorizeModal,
        saveBudgetConfiguration,
        addCategory,
        updateCategory,
        deleteCategory,
        bulkCategorizeBlocks,
      }}
    >
      {children}
    </TimeBudgetContext.Provider>
  );
};

export const useTimeBudget = (): TimeBudgetContextType => {
  const context = useContext(TimeBudgetContext);
  if (!context) {
    throw new Error('useTimeBudget must be used within a TimeBudgetProvider');
  }
  return context;
};
