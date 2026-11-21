import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Repeat,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  PlanPeriod,
  DailyGoal,
  DailyGoalPriority,
  GOAL_PALETTE_OPTIONS,
} from '../../types/dailyGoals';
import { getDatesBetween } from '../../utils/dailyGoalsEngine';

interface PeriodFastBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: PlanPeriod;
  existingGoals: DailyGoal[];
  onBulkAddGoals: (goals: DailyGoal[]) => void;
}

type TabMode = 'copy_day' | 'repeat_weekdays' | 'bulk_add';

export const PeriodFastBuildModal: React.FC<PeriodFastBuildModalProps> = ({
  isOpen,
  onClose,
  period,
  existingGoals,
  onBulkAddGoals,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('copy_day');

  // Dates in period
  const periodDates = useMemo(() => {
    return getDatesBetween(period.startDate, period.endDate);
  }, [period.startDate, period.endDate]);

  // Mode 1: Copy Day
  const [sourceDate, setSourceDate] = useState<string>(periodDates[0] || '');
  const [targetDates, setTargetDates] = useState<string[]>([]);

  // Mode 2 & 3: Goal Template
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateColor, setTemplateColor] = useState('indigo');
  const [templatePriority, setTemplatePriority] = useState<DailyGoalPriority>('medium');
  const [templateEstimateMin, setTemplateEstimateMin] = useState<number>(60);
  const [templateIsMustDo, setTemplateIsMustDo] = useState(false);

  // Selected weekdays (0 = Mon, ..., 6 = Sun)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0, 1, 2, 3, 4]); // Mon-Fri by default

  if (!isOpen) return null;

  // Source goals for Copy Day
  const sourceGoals = existingGoals.filter((g) => g.date === sourceDate && g.periodId === period.id);

  const toggleTargetDate = (d: string) => {
    setTargetDates((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const selectAllTargets = () => {
    setTargetDates(periodDates.filter((d) => d !== sourceDate));
  };

  const toggleWeekday = (dayIndex: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleApplyCopyDay = () => {
    if (sourceGoals.length === 0 || targetDates.length === 0) return;

    const newGoals: DailyGoal[] = [];
    const now = Date.now();

    for (const targetDate of targetDates) {
      sourceGoals.forEach((src, idx) => {
        newGoals.push({
          ...src,
          id: `dg_${now}_${Math.random().toString(36).slice(2, 7)}`,
          date: targetDate,
          periodId: period.id,
          status: 'planned',
          measure: { ...src.measure, current: 0 },
          order: idx,
          createdAt: now,
          updatedAt: now,
          completedAt: undefined,
        });
      });
    }

    onBulkAddGoals(newGoals);
    onClose();
  };

  const handleApplyRepeatWeekdays = () => {
    if (!templateTitle.trim() || selectedWeekdays.length === 0) return;

    const newGoals: DailyGoal[] = [];
    const now = Date.now();

    for (const dateStr of periodDates) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayOfWeek = (new Date(y, m - 1, d).getDay() + 6) % 7; // Mon = 0
      if (selectedWeekdays.includes(dayOfWeek)) {
        newGoals.push({
          id: `dg_${now}_${Math.random().toString(36).slice(2, 7)}`,
          date: dateStr,
          periodId: period.id,
          title: templateTitle.trim(),
          color: templateColor,
          priority: templatePriority,
          isMustDo: templateIsMustDo,
          estimateMin: templateEstimateMin,
          measure: { type: 'check', current: 0 },
          status: 'planned',
          carryCount: 0,
          order: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    onBulkAddGoals(newGoals);
    onClose();
  };

  const handleApplyBulkAddAll = () => {
    if (!templateTitle.trim() || periodDates.length === 0) return;

    const newGoals: DailyGoal[] = [];
    const now = Date.now();

    for (const dateStr of periodDates) {
      newGoals.push({
        id: `dg_${now}_${Math.random().toString(36).slice(2, 7)}`,
        date: dateStr,
        periodId: period.id,
        title: templateTitle.trim(),
        color: templateColor,
        priority: templatePriority,
        isMustDo: templateIsMustDo,
        estimateMin: templateEstimateMin,
        measure: { type: 'check', current: 0 },
        status: 'planned',
        carryCount: 0,
        order: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    onBulkAddGoals(newGoals);
    onClose();
  };

  const weekdaysList = [
    { index: 0, label: 'Mon' },
    { index: 1, label: 'Tue' },
    { index: 2, label: 'Wed' },
    { index: 3, label: 'Thu' },
    { index: 4, label: 'Fri' },
    { index: 5, label: 'Sat' },
    { index: 6, label: 'Sun' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Fast Period Builder
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quickly populate daily goals across "{period.name}" ({periodDates.length} days)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 bg-slate-50 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('copy_day')}
            className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'copy_day'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Copy size={13} />
            <span>Copy Day to Other Days</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('repeat_weekdays')}
            className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'repeat_weekdays'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Repeat size={13} />
            <span>Repeat on Weekdays</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bulk_add')}
            className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'bulk_add'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PlusCircle size={13} />
            <span>Bulk-Add to All Days</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* ── TAB 1: COPY DAY ── */}
          {activeTab === 'copy_day' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Source Date to Copy From:
                </label>
                <select
                  value={sourceDate}
                  onChange={(e) => {
                    setSourceDate(e.target.value);
                    setTargetDates([]);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {periodDates.map((d) => {
                    const count = existingGoals.filter((g) => g.date === d && g.periodId === period.id).length;
                    return (
                      <option key={d} value={d}>
                        {d} ({count} goals)
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Source date contains {sourceGoals.length} goal(s).
                </p>
              </div>

              {sourceGoals.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Copy into which target dates? ({targetDates.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={selectAllTargets}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Select All Other Days
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {periodDates
                      .filter((d) => d !== sourceDate)
                      .map((d) => {
                        const isSelected = targetDates.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleTargetDate(d)}
                            className={`p-2 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span>{d}</span>
                            {isSelected && <CheckCircle2 size={13} className="text-indigo-600" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyCopyDay}
                disabled={sourceGoals.length === 0 || targetDates.length === 0}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors shadow-xs"
              >
                Copy {sourceGoals.length} Goal(s) to {targetDates.length} Days
              </button>
            </div>
          )}

          {/* ── TAB 2: REPEAT ON WEEKDAYS ── */}
          {activeTab === 'repeat_weekdays' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Goal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="e.g. 1-hour Chemistry revision & problem set"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Weekdays Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Days of Week to Repeat On:
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {weekdaysList.map((w) => {
                    const isSelected = selectedWeekdays.includes(w.index);
                    return (
                      <button
                        key={w.index}
                        type="button"
                        onClick={() => toggleWeekday(w.index)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimate & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Estimate (minutes)
                  </label>
                  <input
                    type="number"
                    step="15"
                    value={templateEstimateMin}
                    onChange={(e) => setTemplateEstimateMin(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Priority
                  </label>
                  <select
                    value={templatePriority}
                    onChange={(e) => setTemplatePriority(e.target.value as DailyGoalPriority)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white capitalize"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyRepeatWeekdays}
                disabled={!templateTitle.trim() || selectedWeekdays.length === 0}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors shadow-xs"
              >
                Schedule Recurring Goal Across Period
              </button>
            </div>
          )}

          {/* ── TAB 3: BULK ADD TO ALL DAYS ── */}
          {activeTab === 'bulk_add' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Goal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="e.g. Daily active recall flashcards (30 min)"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Estimate (minutes)
                  </label>
                  <input
                    type="number"
                    step="15"
                    value={templateEstimateMin}
                    onChange={(e) => setTemplateEstimateMin(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Priority
                  </label>
                  <select
                    value={templatePriority}
                    onChange={(e) => setTemplatePriority(e.target.value as DailyGoalPriority)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white capitalize"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyBulkAddAll}
                disabled={!templateTitle.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors shadow-xs"
              >
                Add to All {periodDates.length} Days in Period
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
