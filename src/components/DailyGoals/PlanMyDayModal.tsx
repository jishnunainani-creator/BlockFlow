import React, { useMemo } from 'react';
import {
  X,
  Compass,
  Star,
  Clock,
  ArrowRight,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { DailyGoal, DayGoalStats } from '../../types/dailyGoals';
import { ScheduledBlock } from '../../types/timetable';
import { checkTimeBudget } from '../../utils/dailyGoalsEngine';
import { formatDuration } from '../../utils/timeUtils';

interface PlanMyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  goals: DailyGoal[];
  scheduledBlocks: ScheduledBlock[];
  onToggleMustDo: (goalId: string) => void;
  onOpenCreateGoal: () => void;
  onCompletePlan: () => void;
}

export const PlanMyDayModal: React.FC<PlanMyDayModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  goals,
  scheduledBlocks,
  onToggleMustDo,
  onOpenCreateGoal,
  onCompletePlan,
}) => {
  const dayGoals = useMemo(() => {
    return goals.filter((g) => g.date === dateStr);
  }, [goals, dateStr]);

  const carriedGoals = useMemo(() => {
    return dayGoals.filter((g) => (g.carryCount || 0) > 0);
  }, [dayGoals]);

  const budget = useMemo(() => {
    return checkTimeBudget({
      goals: dayGoals,
      scheduledBlocks,
      dateStr,
    });
  }, [dayGoals, scheduledBlocks, dateStr]);

  const mustDoGoals = useMemo(() => {
    return dayGoals.filter((g) => g.isMustDo);
  }, [dayGoals]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Plan My Day</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose your Top 3 Must-Dos and balance your time budget for {dateStr}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Time Budget Visual Bar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Available Free Time Budget
              </span>
              <span className="font-mono text-slate-600 dark:text-slate-400">
                {formatDuration(budget.plannedMinutes)} planned / {formatDuration(budget.freeMinutes)} free
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budget.isOverloaded ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{
                  width: `${Math.min(100, budget.freeMinutes > 0 ? (budget.plannedMinutes / budget.freeMinutes) * 100 : 100)}%`,
                }}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Excludes {formatDuration(budget.nonWorkMinutes)} sleep & meals and {formatDuration(budget.fixedCommitmentMinutes)} fixed commitments.
            </p>

            {budget.isOverloaded && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Overloaded by {formatDuration(budget.overloadDeltaMinutes)}. Consider trimming or carrying over non-essential goals.
                </span>
              </div>
            )}
          </div>

          {/* Carried Over Goals Notice */}
          {carriedGoals.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {carriedGoals.length} Carried Goal(s) from previous days
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                These goals were carried forward so you don't lose track of ongoing progress.
              </p>
            </div>
          )}

          {/* Top 3 Must-Do Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Select Today's Top 3 Must-Dos ({mustDoGoals.length}/3)
              </span>
              <button
                type="button"
                onClick={onOpenCreateGoal}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Add Goal
              </button>
            </div>

            {dayGoals.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No daily goals added for {dateStr} yet.
                </p>
                <button
                  type="button"
                  onClick={onOpenCreateGoal}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Create First Goal
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {dayGoals.map((g) => {
                  const isMust = Boolean(g.isMustDo);
                  return (
                    <div
                      key={g.id}
                      onClick={() => onToggleMustDo(g.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isMust
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          className="shrink-0 p-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMustDo(g.id);
                          }}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isMust ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {g.title}
                        </span>
                        {g.carryCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            carried ×{g.carryCount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {g.estimateMin && (
                          <span className="text-[11px] font-mono text-slate-500">
                            {g.estimateMin}m
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                            g.priority === 'high'
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600'
                              : g.priority === 'medium'
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600'
                              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                          }`}
                        >
                          {g.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => {
              onCompletePlan();
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-xs"
          >
            <span>Start My Day</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
