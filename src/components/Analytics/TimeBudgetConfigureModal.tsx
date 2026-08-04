import React, { useState, useEffect } from 'react';
import { useTimeBudget } from '../../context/TimeBudgetContext';
import { TimeCategory, CategoryBudget, TargetPeriodType, TargetType } from '../../types/timeBudget';
import { Clock, Plus, Trash2, Check, AlertTriangle, X, Sliders, Shield } from 'lucide-react';

interface TimeBudgetConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimeBudgetConfigureModal: React.FC<TimeBudgetConfigureModalProps> = ({ isOpen, onClose }) => {
  const { userBudget, saveBudgetConfiguration, addCategory, deleteCategory } = useTimeBudget();

  const [categories, setCategories] = useState<TimeCategory[]>([]);
  const [budgets, setBudgets] = useState<Record<string, CategoryBudget>>({});
  const [useDaySpecific, setUseDaySpecific] = useState(false);

  // New Category Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [newCatHours, setNewCatHours] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setCategories(userBudget.categories);
      setBudgets(JSON.parse(JSON.stringify(userBudget.budgets)));
      setUseDaySpecific(userBudget.useDaySpecific || false);
      setShowAddForm(false);
    }
  }, [isOpen, userBudget]);

  if (!isOpen) return null;

  // Calculate live daily total minutes allocated across active categories
  const totalDailyMinutes = categories
    .filter((c) => c.isActive)
    .reduce((sum, cat) => {
      const b = budgets[cat.id];
      if (!b) return sum;
      if (b.periodType === 'weekly') {
        return sum + Math.round((b.targetMinutes || 0) / 7);
      }
      return sum + (b.targetMinutes || 0);
    }, 0);

  const totalDailyHours = Number((totalDailyMinutes / 60).toFixed(1));
  const diffHours = Number((totalDailyHours - 24).toFixed(1));
  const isOver = totalDailyMinutes > 1440;
  const isUnder = totalDailyMinutes < 1440;

  const handleTargetChange = (catId: string, hoursStr: string) => {
    const hours = parseFloat(hoursStr) || 0;
    const targetMinutes = Math.round(hours * 60);

    setBudgets((prev) => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || { categoryId: catId, periodType: 'daily', targetType: 'preferred' }),
        targetMinutes,
      },
    }));
  };

  const handlePeriodTypeToggle = (catId: string) => {
    setBudgets((prev) => {
      const current = prev[catId] || { categoryId: catId, targetMinutes: 0, periodType: 'daily', targetType: 'preferred' };
      const newPeriod: TargetPeriodType = current.periodType === 'daily' ? 'weekly' : 'daily';
      let newTargetMins = current.targetMinutes;

      if (newPeriod === 'weekly') {
        newTargetMins = current.targetMinutes * 7;
      } else {
        newTargetMins = Math.round(current.targetMinutes / 7);
      }

      return {
        ...prev,
        [catId]: {
          ...current,
          periodType: newPeriod,
          targetMinutes: newTargetMins,
        },
      };
    });
  };

  const handleTargetTypeToggle = (catId: string) => {
    setBudgets((prev) => {
      const current = prev[catId] || { categoryId: catId, targetMinutes: 0, periodType: 'daily', targetType: 'preferred' };
      const newType: TargetType = current.targetType === 'strict' ? 'preferred' : 'strict';
      return {
        ...prev,
        [catId]: { ...current, targetType: newType },
      };
    });
  };

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory(
      { name: newCatName.trim(), color: newCatColor, icon: 'tag' },
      Math.round(newCatHours * 60),
      'daily'
    );

    setNewCatName('');
    setShowAddForm(false);
  };

  const handleSave = () => {
    saveBudgetConfiguration(categories, budgets, useDaySpecific);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                YOUR 24H TIME BUDGET
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Decide where your time should go on an average day.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Allocation Summary Banner */}
        <div className="bg-slate-950/90 border-b border-slate-800/80 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400">Allocated:</span>{' '}
              <strong className={`font-mono text-sm font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                {totalDailyHours}h / 24h
              </strong>
            </div>
          </div>

          {isOver && (
            <span className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {diffHours}h over 24-hour budget
            </span>
          )}

          {isUnder && (
            <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {Math.abs(diffHours)}h unallocated
            </span>
          )}

          {!isOver && !isUnder && (
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Perfect 24h Allocation
            </span>
          )}
        </div>

        {/* Categories Target List */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {categories
            .filter((c) => c.isActive)
            .map((cat) => {
              const b = budgets[cat.id] || { categoryId: cat.id, targetMinutes: 0, periodType: 'daily', targetType: 'preferred' };
              const currentHours = b.periodType === 'weekly'
                ? Number(((b.targetMinutes || 0) / 60).toFixed(1))
                : Number(((b.targetMinutes || 0) / 60).toFixed(1));

              return (
                <div
                  key={cat.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        {cat.name}
                        {b.targetType === 'strict' && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Strict
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {b.periodType === 'weekly'
                          ? `~${(currentHours / 7).toFixed(1)}h / day average`
                          : `${(currentHours * 7).toFixed(0)}h / week total`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Target Duration Input */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="168"
                        value={currentHours}
                        onChange={(e) => handleTargetChange(cat.id, e.target.value)}
                        className="w-14 bg-transparent text-xs font-bold text-white text-right focus:outline-none"
                      />
                      <span className="text-xs text-slate-400 font-medium">
                        {b.periodType === 'weekly' ? 'h/wk' : 'h/day'}
                      </span>
                    </div>

                    {/* Period Type Toggle (Daily vs Weekly) */}
                    <button
                      type="button"
                      onClick={() => handlePeriodTypeToggle(cat.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-400 hover:text-white transition-colors"
                      title="Switch between Daily and Weekly target"
                    >
                      {b.periodType === 'daily' ? 'Set Weekly' : 'Set Daily'}
                    </button>

                    {/* Strict vs Preferred Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTargetTypeToggle(cat.id)}
                      className={`p-1.5 rounded-xl border text-[10px] transition-colors ${
                        b.targetType === 'strict'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title="Toggle Preferred vs Strict target"
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Custom Category */}
                    {!cat.isSystemSuggested && (
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* Add Custom Category Drawer */}
          {showAddForm ? (
            <form onSubmit={handleCreateNewCategory} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-white">Create Custom Category</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category Name (e.g. Side Project)"
                  className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={newCatHours}
                    onChange={(e) => setNewCatHours(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white text-right"
                  />
                  <span className="text-xs text-slate-400">h/day</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Add Category
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border border-dashed border-slate-800 hover:border-slate-700 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom Time Category
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all"
          >
            <Check className="w-4 h-4" />
            Save Time Budget
          </button>
        </div>
      </div>
    </div>
  );
};
