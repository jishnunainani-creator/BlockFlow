import React, { useState } from 'react';
import { useTimeBudget } from '../../context/TimeBudgetContext';
import { AddCategoryModal } from './AddCategoryModal';
import { BulkCategorizeModal } from './BulkCategorizeModal';
import { Clock, Plus, Tag, Sparkles, ChevronDown, ChevronUp, Layers, PieChart, BarChart2 } from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

export default function PersonalTimeBudgetWidget() {
  const {
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
  } = useTimeBudget();

  // Track expanded category IDs for Activity Breakdown
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({});

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCatIds((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const totalScheduledHoursStr = formatDuration(summary.totalScheduledMinutes);
  const totalActualHoursStr = formatDuration(summary.totalActualMinutes);

  // Dynamic deterministic insights (Requirement 27)
  const insights: string[] = [];
  if (summary.largestCategoryName && summary.largestCategoryMinutes) {
    const pct = summary.totalScheduledMinutes > 0
      ? Math.round((summary.largestCategoryMinutes / summary.totalScheduledMinutes) * 100)
      : 0;
    insights.push(`${summary.largestCategoryName} accounts for ${pct}% of your scheduled time ${dateScope === 'today' ? 'today' : dateScope === 'month' ? 'this month' : 'this week'}.`);
  }

  if (summary.mostScheduledActivityTitle && summary.mostScheduledActivityMinutes) {
    insights.push(`Your most scheduled activity is "${summary.mostScheduledActivityTitle}" at ${formatDuration(summary.mostScheduledActivityMinutes)}.`);
  }

  if (summary.uncategorizedActivityCount > 0) {
    insights.push(`${summary.uncategorizedActivityCount} activities still need categories.`);
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 select-none shadow-xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                TIME ALLOCATION
              </h2>
              <p className="text-xs text-indigo-400 font-semibold tracking-wide mt-0.5">
                See where your scheduled time is going.
              </p>
            </div>
          </div>

          {/* Controls & Scope Filter (Requirement 12) */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            {/* Scope Filter (Today | This Week | This Month) */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px] font-semibold">
              <button
                onClick={() => setDateScope('today')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateScope === 'today'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateScope('week')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateScope === 'week'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setDateScope('month')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateScope === 'month'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                This Month
              </button>
            </div>

            {/* Mode Toggle (Planned vs Actual) */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px] font-semibold">
              <button
                onClick={() => setViewMode('planned')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'planned'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Planned
              </button>
              <button
                onClick={() => setViewMode('actual')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'actual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Actual
              </button>
            </div>

            <button
              onClick={openBulkCategorizeModal}
              className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Categorize Activities
              {summary.uncategorizedActivityCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300">
                  {summary.uncategorizedActivityCount}
                </span>
              )}
            </button>

            <button
              onClick={openAddCategoryModal}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Category
            </button>
          </div>
        </div>

        {/* Top Summary Stat Cards (Requirement 16) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" /> Total Scheduled
            </span>
            <div className="text-xl font-black text-white font-mono">{totalScheduledHoursStr}</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <PieChart className="w-3 h-3 text-blue-400" /> Largest Category
            </span>
            <div className="text-sm font-bold text-white truncate">
              {summary.largestCategoryName || 'None'}
            </div>
            {summary.largestCategoryMinutes ? (
              <span className="text-[10px] text-slate-400 font-mono">
                {formatDuration(summary.largestCategoryMinutes)}
              </span>
            ) : null}
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <BarChart2 className="w-3 h-3 text-emerald-400" /> Top Activity
            </span>
            <div className="text-sm font-bold text-white truncate">
              {summary.mostScheduledActivityTitle || 'None'}
            </div>
            {summary.mostScheduledActivityMinutes ? (
              <span className="text-[10px] text-slate-400 font-mono">
                {formatDuration(summary.mostScheduledActivityMinutes)}
              </span>
            ) : null}
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-400" /> Uncategorized
            </span>
            <div className="text-xl font-black text-white font-mono">
              {formatDuration(summary.uncategorizedMinutes)}
            </div>
          </div>
        </div>

        {/* Visual Distribution Bar (Requirement 15) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Scheduled Time Distribution</span>
            <span className="text-slate-500 font-mono">
              {dateScope === 'today' ? 'Today' : dateScope === 'month' ? 'This Month' : 'This Week'}
            </span>
          </div>

          <div className="flex h-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-0.5 gap-0.5">
            {summary.allocations.map((item) => {
              if (item.scheduledMinutes <= 0) return null;
              const pct = item.percentageOfTotalScheduled;
              return (
                <div
                  key={item.category.id}
                  style={{ width: `${Math.max(2, pct)}%`, backgroundColor: item.category.color }}
                  className="h-full rounded-md transition-all hover:opacity-80 relative group"
                  title={`${item.category.name}: ${formatDuration(item.scheduledMinutes)} (${pct}%)`}
                />
              );
            })}

            {summary.uncategorizedMinutes > 0 && summary.totalScheduledMinutes > 0 && (
              <div
                style={{
                  width: `${Math.max(
                    2,
                    (summary.uncategorizedMinutes / summary.totalScheduledMinutes) * 100
                  )}%`,
                }}
                className="h-full bg-slate-700/80 rounded-md transition-all relative"
                title={`Uncategorized: ${formatDuration(summary.uncategorizedMinutes)}`}
              />
            )}
          </div>
        </div>

        {/* Mathematical Insights Banner (Requirement 27) */}
        {insights.length > 0 && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              {insights.map((ins, idx) => (
                <p key={idx}>• {ins}</p>
              ))}
            </div>
          </div>
        )}

        {/* Category Allocation Cards with Expandable Activity Breakdown (Requirements 13 & 14) */}
        <div className="space-y-3 pt-1">
          {summary.allocations
            .filter((item) => item.scheduledMinutes > 0)
            .map((item) => {
              const isExpanded = expandedCatIds[item.category.id];
              const schedHoursStr = formatDuration(item.scheduledMinutes);
              const actualHoursStr = item.actualMinutes ? formatDuration(item.actualMinutes) : undefined;

              return (
                <div
                  key={item.category.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 hover:border-slate-700/80 transition-all shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: item.category.color }}
                      />
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          {item.category.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {schedHoursStr} scheduled · {item.percentageOfTotalScheduled}% of total
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {viewMode === 'actual' && (
                        <div className="text-xs font-semibold text-emerald-400 font-mono">
                          Actual: {actualHoursStr || '0m'}
                        </div>
                      )}

                      <button
                        onClick={() => toggleCategoryExpand(item.category.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <span>{item.activities.length} activities</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentageOfTotalScheduled}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>

                  {/* Expandable Activity Breakdown List (Requirement 14 & 29) */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-fade-in">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Activity Breakdown for {item.category.name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.activities.map((act) => (
                          <div
                            key={act.title}
                            className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-white block truncate">{act.title}</span>
                              <span className="text-[10px] text-slate-500">
                                {act.occurrenceCount} {act.occurrenceCount === 1 ? 'session' : 'sessions'}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-indigo-300 font-mono block">
                                {formatDuration(act.scheduledMinutes)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {act.percentageOfCategory}% of {item.category.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Uncategorized Section (Requirement 17) */}
          {summary.uncategorizedMinutes > 0 && (
            <div className="bg-slate-950/70 border border-amber-500/20 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
                  <h3 className="text-xs font-bold text-amber-300">Uncategorized Activities</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white font-mono">
                    {formatDuration(summary.uncategorizedMinutes)}
                  </span>
                  <button
                    onClick={openBulkCategorizeModal}
                    className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
                  >
                    Categorize Activities
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddCategoryModal isOpen={isAddCategoryOpen} onClose={closeAddCategoryModal} />
      <BulkCategorizeModal isOpen={isBulkCategorizeOpen} onClose={closeBulkCategorizeModal} />
    </>
  );
}
