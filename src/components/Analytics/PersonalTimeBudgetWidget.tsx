import React, { useState } from 'react';
import { useTimeBudget } from '../../context/TimeBudgetContext';
import { TimeBudgetConfigureModal } from './TimeBudgetConfigureModal';
import { BulkCategorizeModal } from './BulkCategorizeModal';
import { DateScopeFilter } from '../../utils/timeBudgetEngine';
import { Clock, Sliders, AlertTriangle, CheckCircle2, Tag, TrendingUp, Sparkles, BarChart2, Calendar } from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

export default function PersonalTimeBudgetWidget() {
  const {
    summary,
    userBudget,
    dateScope,
    setDateScope,
    isConfigureModalOpen,
    openConfigureModal,
    closeConfigureModal,
    isBulkCategorizeOpen,
    openBulkCategorizeModal,
    closeBulkCategorizeModal,
  } = useTimeBudget();

  const [viewMode, setViewMode] = useState<'scheduled' | 'reality'>('scheduled');

  if (!summary.isConfigured) {
    return (
      <>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 select-none text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-xl font-black text-white tracking-tight">Personal Time Budget</h2>
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
              Decide where your time should go.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              You haven't created a time budget yet. Decide how you'd ideally like to distribute your time across study, work, health, personal life, or your own custom categories.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={openConfigureModal}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
            >
              <Sliders className="w-4 h-4" />
              Configure Time Budget
            </button>
          </div>
        </div>

        <TimeBudgetConfigureModal isOpen={isConfigureModalOpen} onClose={closeConfigureModal} />
      </>
    );
  }

  // Configured State calculations
  const totalTargetDailyHours = Number((summary.totalTargetDailyMinutes / 60).toFixed(1));
  const unallocatedDailyHours = Number((summary.unallocatedDailyMinutes / 60).toFixed(1));

  // Deterministic insights (Requirement 28)
  const insights: string[] = [];
  summary.comparisons.forEach((item) => {
    const diffH = Math.abs(Number((item.scheduledDiffMinutes / 60).toFixed(1)));
    if (item.scheduledDiffMinutes < -30) {
      insights.push(`${item.category.name} is ${diffH}h below your target.`);
    } else if (item.scheduledDiffMinutes > 30) {
      insights.push(`You scheduled ${diffH}h more ${item.category.name} than your target.`);
    }
  });

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 select-none shadow-xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Personal Time Budget
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  AUTOMATIC ALLOCATION
                </span>
              </h2>
              <p className="text-xs text-indigo-400 font-semibold tracking-wide mt-0.5">
                Decide where your time should go.
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

            {/* View Mode Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px] font-semibold">
              <button
                onClick={() => setViewMode('scheduled')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'scheduled'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Planned
              </button>
              <button
                onClick={() => setViewMode('reality')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'reality'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Actual
              </button>
            </div>

            <button
              onClick={openBulkCategorizeModal}
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Categorize Activities
              {summary.uncategorizedBlockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300">
                  {summary.uncategorizedBlockCount}
                </span>
              )}
            </button>

            <button
              onClick={openConfigureModal}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Sliders className="w-3.5 h-3.5" />
              Configure Targets
            </button>
          </div>
        </div>

        {/* 24H Proportional Allocation Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Target Allocation ({totalTargetDailyHours}h / 24h)</span>
            {unallocatedDailyHours > 0 ? (
              <span className="text-slate-500 font-mono">{unallocatedDailyHours}h UNALLOCATED</span>
            ) : (
              <span className="text-emerald-400 font-mono">100% Allocated</span>
            )}
          </div>

          <div className="flex h-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-0.5 gap-0.5">
            {summary.comparisons.map((item) => {
              const pct = (item.targetDailyMinutes / 1440) * 100;
              if (pct <= 0) return null;
              return (
                <div
                  key={item.category.id}
                  style={{ width: `${pct}%`, backgroundColor: item.category.color }}
                  className="h-full rounded-md transition-all hover:opacity-80 relative group"
                  title={`${item.category.name}: ${(item.targetDailyMinutes / 60).toFixed(1)}h / day target`}
                />
              );
            })}
            {unallocatedDailyHours > 0 && (
              <div
                style={{ width: `${(summary.unallocatedDailyMinutes / 1440) * 100}%` }}
                className="h-full bg-slate-800/80 rounded-md transition-all relative"
                title={`UNALLOCATED: ${unallocatedDailyHours}h / day (Time not assigned to a category)`}
              />
            )}
          </div>
        </div>

        {/* Mathematical Insights Banner */}
        {insights.length > 0 && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 flex flex-wrap gap-2 text-xs font-medium text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              {insights.slice(0, 3).map((ins, idx) => (
                <p key={idx}>• {ins}</p>
              ))}
            </div>
          </div>
        )}

        {/* Category Allocation Cards with Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {summary.comparisons.map((item) => {
            const targetMins = dateScope === 'today' ? item.targetDailyMinutes : item.targetWeeklyMinutes;
            const scheduledMins = dateScope === 'today' ? item.scheduledDailyMinutes : item.scheduledWeeklyMinutes;
            const actualMins = dateScope === 'today' ? item.actualDailyMinutes : item.actualWeeklyMinutes;

            const targetHours = (targetMins / 60).toFixed(1);
            const scheduledHours = (scheduledMins / 60).toFixed(1);
            const actualHours = actualMins !== undefined ? (actualMins / 60).toFixed(1) : undefined;

            const pctScheduled = targetMins > 0 ? Math.min(100, Math.round((scheduledMins / targetMins) * 100)) : 0;

            const isScheduledOver = item.scheduledDiffMinutes > 30;
            const isScheduledUnder = item.scheduledDiffMinutes < -30;

            return (
              <div
                key={item.category.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 hover:border-slate-700/80 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.category.color }}
                    />
                    <h3 className="text-xs font-bold text-white truncate">{item.category.name}</h3>
                  </div>

                  {/* Status Badge */}
                  {isScheduledOver && (
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-semibold">
                      +{formatDuration(Math.abs(item.scheduledDiffMinutes))} Over
                    </span>
                  )}
                  {isScheduledUnder && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                      -{formatDuration(Math.abs(item.scheduledDiffMinutes))} Under
                    </span>
                  )}
                  {!isScheduledOver && !isScheduledUnder && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                      On Track
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>{scheduledHours}h scheduled</span>
                    <span>{pctScheduled}% of target ({targetHours}h)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pctScheduled}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown (Target vs Scheduled vs Actual) */}
                <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Target</span>
                    <strong className="text-xs font-bold text-white font-mono">{targetHours}h</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Scheduled</span>
                    <strong className="text-xs font-bold text-indigo-300 font-mono">{scheduledHours}h</strong>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Actual</span>
                    <strong className="text-xs font-bold text-emerald-400 font-mono">
                      {actualHours !== undefined ? `${actualHours}h` : '--'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TimeBudgetConfigureModal isOpen={isConfigureModalOpen} onClose={closeConfigureModal} />
      <BulkCategorizeModal isOpen={isBulkCategorizeOpen} onClose={closeBulkCategorizeModal} />
    </>
  );
}
