import React, { useState, useEffect } from 'react';
import { useTimeBudget } from '../../context/TimeBudgetContext';
import { useTimetable } from '../../context/TimetableContext';
import { Tag, Check, X, Sparkles } from 'lucide-react';

interface BulkCategorizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkCategorizeModal: React.FC<BulkCategorizeModalProps> = ({ isOpen, onClose }) => {
  const { userBudget, bulkCategorizeBlocks } = useTimeBudget();
  const { currentWeekScheduledBlocks, libraryBlocks } = useTimetable();

  const [mappings, setMappings] = useState<Record<string, string>>({});

  // Collect unique activity titles from scheduled blocks & library blocks
  const activeCategories = userBudget.categories.filter((c) => c.isActive);

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      const allTitles = new Set<string>();

      currentWeekScheduledBlocks.forEach((b) => allTitles.add(b.title));
      libraryBlocks.forEach((b) => allTitles.add(b.title));

      allTitles.forEach((title) => {
        const norm = title.toLowerCase();
        // Suggest matching category by keyword
        const suggestedCat = activeCategories.find(
          (c) => norm.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(norm)
        );

        if (suggestedCat) {
          initial[title] = suggestedCat.id;
        } else if (norm.includes('gym') || norm.includes('workout') || norm.includes('run')) {
          const fitCat = activeCategories.find((c) => c.name.toLowerCase().includes('fit'));
          if (fitCat) initial[title] = fitCat.id;
        } else if (norm.includes('code') || norm.includes('study') || norm.includes('dsa') || norm.includes('sec')) {
          const acadCat = activeCategories.find((c) => c.name.toLowerCase().includes('acad'));
          if (acadCat) initial[title] = acadCat.id;
        } else if (norm.includes('job') || norm.includes('intern') || norm.includes('work')) {
          const carCat = activeCategories.find((c) => c.name.toLowerCase().includes('car'));
          if (carCat) initial[title] = carCat.id;
        } else if (norm.includes('lunch') || norm.includes('wake') || norm.includes('dinner')) {
          const persCat = activeCategories.find((c) => c.name.toLowerCase().includes('per'));
          if (persCat) initial[title] = persCat.id;
        }
      });

      setMappings(initial);
    }
  }, [isOpen, currentWeekScheduledBlocks, libraryBlocks, activeCategories]);

  if (!isOpen) return null;

  const handleSelectChange = (title: string, categoryId: string) => {
    setMappings((prev) => ({ ...prev, [title]: categoryId }));
  };

  const handleApply = () => {
    bulkCategorizeBlocks(mappings);
    onClose();
  };

  const uniqueTitles = Array.from(
    new Set([
      ...currentWeekScheduledBlocks.map((b) => b.title),
      ...libraryBlocks.map((b) => b.title),
    ])
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Categorize Activities</h3>
              <p className="text-xs text-slate-400 font-medium">
                Map your reusable activities to your Personal Time Budget categories.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activity List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {uniqueTitles.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No activities to categorize yet.</p>
          ) : (
            uniqueTitles.map((title) => (
              <div
                key={title}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Activity Library item
                  </span>
                </div>

                <select
                  value={mappings[title] || ''}
                  onChange={(e) => handleSelectChange(title, e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 shrink-0"
                >
                  <option value="">-- Select Category --</option>
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Categories
          </button>
        </div>
      </div>
    </div>
  );
};
