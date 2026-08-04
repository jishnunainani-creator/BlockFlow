import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTimetable } from './TimetableContext';
import { useSession } from './SessionContext';
import { TimeCategory, TimeAllocationSummary } from '../types/timeBudget';
import { loadUserTimeCategories, saveUserTimeCategories, createDefaultCategories } from '../utils/timeBudgetStorage';
import { DateScopeFilter, calculateTimeAllocationSummary } from '../utils/timeBudgetEngine';

interface TimeBudgetContextType {
  categories: TimeCategory[];
  summary: TimeAllocationSummary;
  dateScope: DateScopeFilter;
  setDateScope: (scope: DateScopeFilter) => void;
  viewMode: 'planned' | 'actual';
  setViewMode: (mode: 'planned' | 'actual') => void;

  isAddCategoryOpen: boolean;
  openAddCategoryModal: () => void;
  closeAddCategoryModal: () => void;

  isBulkCategorizeOpen: boolean;
  openBulkCategorizeModal: () => void;
  closeBulkCategorizeModal: () => void;

  addCategory: (catData: Omit<TimeCategory, 'id' | 'displayOrder' | 'isActive'>) => TimeCategory;
  updateCategory: (categoryId: string, partialCat: Partial<TimeCategory>) => void;
  deleteCategory: (categoryId: string) => void;
  bulkCategorizeBlocks: (mappings: Record<string, string>) => void; // blockTitle -> categoryId
}

const TimeBudgetContext = createContext<TimeBudgetContextType | undefined>(undefined);

export const TimeBudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentWeekScheduledBlocks, libraryBlocks, updateScheduledBlock, updateLibraryBlock, addToast } = useTimetable();
  const { sessions } = useSession();

  const [categories, setCategories] = useState<TimeCategory[]>(createDefaultCategories());
  const [dateScope, setDateScope] = useState<DateScopeFilter>('week');
  const [viewMode, setViewMode] = useState<'planned' | 'actual'>('planned');

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isBulkCategorizeOpen, setIsBulkCategorizeOpen] = useState(false);

  // Load categories from local storage
  useEffect(() => {
    setCategories(loadUserTimeCategories());
  }, []);

  const openAddCategoryModal = useCallback(() => setIsAddCategoryOpen(true), []);
  const closeAddCategoryModal = useCallback(() => setIsAddCategoryOpen(false), []);

  const openBulkCategorizeModal = useCallback(() => setIsBulkCategorizeOpen(true), []);
  const closeBulkCategorizeModal = useCallback(() => setIsBulkCategorizeOpen(false), []);

  // Add custom category
  const addCategory = useCallback(
    (catData: Omit<TimeCategory, 'id' | 'displayOrder' | 'isActive'>): TimeCategory => {
      const newCat: TimeCategory = {
        ...catData,
        id: `cat-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
        displayOrder: categories.length,
        isActive: true,
      };

      const updated = [...categories, newCat];
      setCategories(updated);
      saveUserTimeCategories(updated);
      addToast(`Added Time Category "${newCat.name}"! 🏷️`, 'success');
      return newCat;
    },
    [categories, addToast]
  );

  // Update category
  const updateCategory = useCallback(
    (categoryId: string, partialCat: Partial<TimeCategory>) => {
      const updated = categories.map((c) => (c.id === categoryId ? { ...c, ...partialCat } : c));
      setCategories(updated);
      saveUserTimeCategories(updated);
      addToast('Category updated', 'info');
    },
    [categories, addToast]
  );

  // Delete category (Category Deletion Safety - Requirement 14)
  const deleteCategory = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);

      // Remap scheduled blocks & library blocks assigned to this category to undefined
      let assignedCount = 0;
      currentWeekScheduledBlocks.forEach((b) => {
        if ((b as any).categoryId === categoryId) {
          updateScheduledBlock(b.id, { categoryId: undefined } as any);
          assignedCount++;
        }
      });

      libraryBlocks.forEach((lib) => {
        if ((lib as any).categoryId === categoryId) {
          updateLibraryBlock(lib.id, { categoryId: undefined } as any);
        }
      });

      const updated = categories.filter((c) => c.id !== categoryId);
      setCategories(updated);
      saveUserTimeCategories(updated);

      addToast(
        `Removed category "${cat?.name || ''}". ${
          assignedCount > 0 ? `${assignedCount} blocks set as Uncategorized.` : ''
        }`,
        'warning'
      );
    },
    [categories, currentWeekScheduledBlocks, libraryBlocks, updateScheduledBlock, updateLibraryBlock, addToast]
  );

  // Bulk categorize activity blocks (Requirement 18)
  const bulkCategorizeBlocks = useCallback(
    (mappings: Record<string, string>) => {
      let count = 0;
      libraryBlocks.forEach((lib) => {
        const norm = lib.title.toLowerCase().trim();
        const matchedKey = Object.keys(mappings).find((k) => k.toLowerCase().trim() === norm);
        if (matchedKey && mappings[matchedKey]) {
          const categoryId = mappings[matchedKey];
          updateLibraryBlock(lib.id, { categoryId } as any);
          count++;
        }
      });

      currentWeekScheduledBlocks.forEach((block) => {
        const norm = block.title.toLowerCase().trim();
        const matchedKey = Object.keys(mappings).find((k) => k.toLowerCase().trim() === norm);
        if (matchedKey && mappings[matchedKey]) {
          const categoryId = mappings[matchedKey];
          updateScheduledBlock(block.id, { categoryId } as any);
        }
      });

      addToast(`Categorized ${count} activities! 🏷️`, 'success');
    },
    [libraryBlocks, currentWeekScheduledBlocks, updateLibraryBlock, updateScheduledBlock, addToast]
  );

  // Derive live Time Allocation Summary from timetable data
  const summary = calculateTimeAllocationSummary(
    categories,
    currentWeekScheduledBlocks,
    libraryBlocks,
    sessions,
    dateScope
  );

  return (
    <TimeBudgetContext.Provider
      value={{
        categories,
        summary,
        dateScope,
        setDateScope,
        viewMode,
        setViewMode,
        isAddCategoryOpen,
        openAddCategoryModal,
        closeAddCategoryModal,
        isBulkCategorizeOpen,
        openBulkCategorizeModal,
        closeBulkCategorizeModal,
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
