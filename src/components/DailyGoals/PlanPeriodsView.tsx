import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Sparkles,
  Flag,
  Copy,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  BarChart2,
  ArrowRight,
  Target,
  Zap,
} from 'lucide-react';
import {
  PlanPeriod,
  DailyGoal,
  DayReflection,
  GOAL_PALETTE_OPTIONS,
} from '../../types/dailyGoals';
import {
  loadPlanPeriods,
  savePlanPeriods,
  loadDailyGoals,
  saveDailyGoals,
  loadDayReflections,
  incrementSmartGoalProgress,
} from '../../utils/dailyGoalsStorage';
import {
  getDatesBetween,
  getPeriodDayProgress,
  getMilestoneCountdowns,
  computePeriodSummary,
  createCarriedGoal,
} from '../../utils/dailyGoalsEngine';
import { CreatePeriodModal } from './CreatePeriodModal';
import { PeriodFastBuildModal } from './PeriodFastBuildModal';
import { DailyGoalEditorModal } from './DailyGoalEditorModal';
import { ScheduledBlock } from '../../types/timetable';

interface PlanPeriodsViewProps {
  scheduledBlocks: ScheduledBlock[];
  addToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const PlanPeriodsView: React.FC<PlanPeriodsViewProps> = ({
  scheduledBlocks,
  addToast,
}) => {
  const [periods, setPeriods] = useState<PlanPeriod[]>(() => loadPlanPeriods());
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
  const [allGoals, setAllGoals] = useState<DailyGoal[]>(() => loadDailyGoals());
  const [reflections, setReflections] = useState<Record<string, DayReflection>>(() =>
    loadDayReflections()
  );

  // Selected date inside active period
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PlanPeriod | null>(null);
  const [isFastBuildOpen, setIsFastBuildOpen] = useState(false);
  const [isGoalEditorOpen, setIsGoalEditorOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DailyGoal | null>(null);
  const [deleteConfirmPeriodId, setDeleteConfirmPeriodId] = useState<string | null>(null);

  // Synchronize on mount and storage updates
  useEffect(() => {
    const handleUpdate = () => {
      setPeriods(loadPlanPeriods());
      setAllGoals(loadDailyGoals());
      setReflections(loadDayReflections());
    };
    window.addEventListener('blockflow_plan_periods_updated', handleUpdate);
    window.addEventListener('blockflow_daily_goals_updated', handleUpdate);
    return () => {
      window.removeEventListener('blockflow_plan_periods_updated', handleUpdate);
      window.removeEventListener('blockflow_daily_goals_updated', handleUpdate);
    };
  }, []);

  // Set default active period if not selected
  useEffect(() => {
    if (periods.length > 0) {
      if (!activePeriodId || !periods.some((p) => p.id === activePeriodId)) {
        setActivePeriodId(periods[0].id);
      }
    } else {
      setActivePeriodId(null);
    }
  }, [periods, activePeriodId]);

  // Active period object
  const activePeriod = useMemo(() => {
    return periods.find((p) => p.id === activePeriodId) || null;
  }, [periods, activePeriodId]);

  // Dates in active period
  const periodDates = useMemo(() => {
    if (!activePeriod) return [];
    return getDatesBetween(activePeriod.startDate, activePeriod.endDate);
  }, [activePeriod]);

  // Ensure selectedDate is valid for active period
  useEffect(() => {
    if (periodDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (periodDates.includes(todayStr) && (!selectedDate || !periodDates.includes(selectedDate))) {
        setSelectedDate(todayStr);
      } else if (!selectedDate || !periodDates.includes(selectedDate)) {
        setSelectedDate(periodDates[0]);
      }
    } else {
      setSelectedDate('');
    }
  }, [periodDates, selectedDate]);

  // Goals associated with this period
  const periodGoals = useMemo(() => {
    if (!activePeriod) return [];
    return allGoals.filter(
      (g) => g.periodId === activePeriod.id || (periodDates.includes(g.date) && g.periodId === activePeriod.id)
    );
  }, [allGoals, activePeriod, periodDates]);

  // Goals for selected date
  const selectedDateGoals = useMemo(() => {
    return allGoals.filter((g) => g.date === selectedDate);
  }, [allGoals, selectedDate]);

  // Milestone countdowns
  const milestoneCountdowns = useMemo(() => {
    if (!activePeriod || !activePeriod.milestones) return [];
    const refDate = selectedDate || activePeriod.startDate;
    return getMilestoneCountdowns(activePeriod.milestones, refDate);
  }, [activePeriod, selectedDate]);

  // Summary statistics
  const summary = useMemo(() => {
    if (!activePeriod) {
      return {
        totalGoals: 0,
        completedGoals: 0,
        completionRatePct: 0,
        carriedCount: 0,
        missReasonsBreakdown: {
          too_big: 0,
          ran_out_of_time: 0,
          low_energy: 0,
          distracted: 0,
          blocked: 0,
          deprioritised: 0,
        },
      };
    }
    return computePeriodSummary(activePeriod, periodGoals, Object.values(reflections));
  }, [activePeriod, periodGoals, reflections]);

  // Day progress ("Day X of N")
  const dayProgress = useMemo(() => {
    if (!activePeriod || !selectedDate) return null;
    return getPeriodDayProgress(activePeriod, selectedDate);
  }, [activePeriod, selectedDate]);

  // Save period
  const handleSavePeriod = (updatedPeriod: PlanPeriod) => {
    const updated = periods.some((p) => p.id === updatedPeriod.id)
      ? periods.map((p) => (p.id === updatedPeriod.id ? updatedPeriod : p))
      : [updatedPeriod, ...periods];

    setPeriods(updated);
    savePlanPeriods(updated);
    setActivePeriodId(updatedPeriod.id);
    addToast(`Plan Period "${updatedPeriod.name}" saved! 🎯`, 'success');
  };

  // Delete period
  const handleDeletePeriod = (periodId: string, deleteAssociatedGoals: boolean) => {
    const updated = periods.filter((p) => p.id !== periodId);
    setPeriods(updated);
    savePlanPeriods(updated);

    if (deleteAssociatedGoals) {
      const remainingGoals = allGoals.filter((g) => g.periodId !== periodId);
      setAllGoals(remainingGoals);
      saveDailyGoals(remainingGoals);
      addToast('Deleted period and its associated daily goals', 'info');
    } else {
      // Disassociate goals from period but keep them as standalone daily goals
      const unlinkedGoals = allGoals.map((g) =>
        g.periodId === periodId ? { ...g, periodId: undefined, updatedAt: Date.now() } : g
      );
      setAllGoals(unlinkedGoals);
      saveDailyGoals(unlinkedGoals);
      addToast('Deleted period. Preserved daily goals as independent goals.', 'info');
    }

    setDeleteConfirmPeriodId(null);
  };

  // Bulk add goals from Fast Build
  const handleBulkAddGoals = (newGoals: DailyGoal[]) => {
    const updated = [...allGoals, ...newGoals];
    setAllGoals(updated);
    saveDailyGoals(updated);
    addToast(`Added ${newGoals.length} goals to period "${activePeriod?.name}"! 🚀`, 'success');
  };

  // Goal CRUD handlers for selected day
  const handleSaveGoal = (goal: DailyGoal) => {
    const goalWithPeriod = { ...goal, periodId: activePeriod?.id };
    const exists = allGoals.some((g) => g.id === goal.id);
    const updated = exists
      ? allGoals.map((g) => (g.id === goal.id ? goalWithPeriod : g))
      : [...allGoals, goalWithPeriod];
    setAllGoals(updated);
    saveDailyGoals(updated);
    addToast('Goal saved', 'success');
  };

  const handleToggleGoalDone = (goal: DailyGoal) => {
    const isDone = goal.status === 'done';
    const nextStatus = isDone ? 'planned' : 'done';
    const updated = allGoals.map((g) =>
      g.id === goal.id
        ? {
            ...g,
            status: nextStatus as any,
            completedAt: nextStatus === 'done' ? Date.now() : undefined,
            updatedAt: Date.now(),
          }
        : g
    );
    setAllGoals(updated);
    saveDailyGoals(updated);
    if (nextStatus === 'done' && goal.linkedSmartGoalId) {
      const incrementVal = goal.measure.type === 'count' && goal.measure.target ? goal.measure.target : 1;
      const updatedSmart = incrementSmartGoalProgress(goal.linkedSmartGoalId, incrementVal);
      if (updatedSmart) {
        addToast('SMART Goal progress updated! 📈', 'info');
      }
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = allGoals.filter((g) => g.id !== goalId);
    setAllGoals(updated);
    saveDailyGoals(updated);
    addToast('Goal removed', 'info');
  };

  return (
    <div className="space-y-6">
      {/* ── TOP ACTION & PERIOD SELECTOR ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Plan Periods
              </h2>
              {activePeriod && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                  {activePeriod.kind}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured study sprints, exam revision blocks, and milestone countdowns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Selector Dropdown if multiple */}
          {periods.length > 0 && (
            <select
              value={activePeriodId || ''}
              onChange={(e) => setActivePeriodId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.startDate} to {p.endDate})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingPeriod(null);
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Plus size={14} />
            <span>New Period</span>
          </button>
        </div>
      </div>

      {/* ── EMPTY STATE WHEN NO PERIODS EXIST ── */}
      {periods.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Plan Periods Created Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Plan Periods group daily goals into focused academic phases (e.g., "Endsem 2026", "Midsem Sprint"). You can track milestones, copy schedules across days, and analyze execution adherence.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Create Your First Plan Period</span>
          </button>
        </div>
      ) : activePeriod ? (
        <div className="space-y-6">
          {/* ── PERIOD HEADER CARD & KPI STRIP ── */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activePeriod.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {activePeriod.startDate} – {activePeriod.endDate} ({periodDates.length} days)
                  </span>
                </div>
                {dayProgress && (
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Viewing Day {dayProgress.dayNumber} of {dayProgress.totalDays} ({selectedDate})
                  </p>
                )}
              </div>

              {/* Fast Build & Management Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsFastBuildOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles size={13} />
                  <span>Fast Build</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingPeriod(activePeriod);
                    setIsCreateModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmPeriodId(activePeriod.id)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Milestones Countdown Badges */}
            {milestoneCountdowns.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Flag size={12} className="text-indigo-500" />
                  Milestones:
                </span>
                {milestoneCountdowns.map((m, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                      m.isToday
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300 animate-pulse'
                        : m.daysRemaining > 0 && m.daysRemaining <= 3
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{m.label}</span>
                    <span className="font-mono text-[10px] opacity-80">
                      ({m.isToday ? 'Today!' : m.daysRemaining > 0 ? `in ${m.daysRemaining}d` : `${Math.abs(m.daysRemaining)}d ago`})
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Period Statistics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">Total Goals</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{summary.totalGoals}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">Goals Completed</span>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{summary.completedGoals}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">Completion Rate</span>
                <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{summary.completionRatePct}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">Carried Forward</span>
                <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{summary.carriedCount}</span>
              </div>
            </div>
          </div>

          {/* ── HORIZONTAL DAY STRIP ── */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Period Days ({periodDates.length})
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {periodDates.map((dateStr, idx) => {
                const isSelected = dateStr === selectedDate;
                const [y, m, d] = dateStr.split('-').map(Number);
                const dayDate = new Date(y, m - 1, d);
                const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                const monthName = dayDate.toLocaleDateString('en-US', { month: 'short' });

                const dayGoals = allGoals.filter((g) => g.date === dateStr);
                const doneCount = dayGoals.filter((g) => g.status === 'done').length;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-w-24 p-3 rounded-xl border text-center transition-all shrink-0 flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      Day {idx + 1} • {dayName}
                    </span>
                    <span className="text-sm font-bold font-mono">
                      {monthName} {d}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isSelected
                          ? 'bg-indigo-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {doneCount}/{dayGoals.length} done
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── DAY GOALS LIST FOR SELECTED DATE ── */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target size={15} className="text-indigo-500" />
                  <span>Goals for {selectedDate}</span>
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedDateGoals.length} goal(s) planned for this date
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingGoal(null);
                  setIsGoalEditorOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-xs"
              >
                <Plus size={13} />
                <span>Add Goal</span>
              </button>
            </div>

            {selectedDateGoals.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <p className="text-xs text-slate-500">No goals scheduled for {selectedDate} yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(null);
                    setIsGoalEditorOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60"
                >
                  + Add Goal for this Day
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateGoals.map((g) => {
                  const isDone = g.status === 'done';
                  return (
                    <div
                      key={g.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleGoalDone(g)}
                          className="shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400 hover:text-indigo-500" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-xs font-semibold block truncate ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {g.title}
                          </span>
                          <span className="text-[10px] text-slate-500 capitalize">
                            {g.priority} priority • {g.measure.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {g.estimateMin && (
                          <span className="text-[11px] font-mono text-slate-500">{g.estimateMin}m</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGoal(g);
                            setIsGoalEditorOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── PERIOD REFLECTION MISS REASONS BREAKDOWN ── */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BarChart2 size={14} className="text-indigo-500" />
              <span>Most Common Miss Reasons in this Period</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { label: 'Too Big', key: 'too_big' as const },
                { label: 'Ran out of time', key: 'ran_out_of_time' as const },
                { label: 'Low Energy', key: 'low_energy' as const },
                { label: 'Distracted', key: 'distracted' as const },
                { label: 'Blocked', key: 'blocked' as const },
                { label: 'Deprioritised', key: 'deprioritised' as const },
              ].map(({ label, key }) => (
                <div
                  key={key}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center"
                >
                  <span className="text-[10px] text-slate-500 block truncate">{label}</span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {summary.missReasonsBreakdown[key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── CREATE / EDIT PERIOD MODAL ── */}
      {isCreateModalOpen && (
        <CreatePeriodModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPeriod(null);
          }}
          period={editingPeriod}
          existingPeriods={periods}
          onSave={handleSavePeriod}
        />
      )}

      {/* ── FAST BUILD MODAL ── */}
      {isFastBuildOpen && activePeriod && (
        <PeriodFastBuildModal
          isOpen={isFastBuildOpen}
          onClose={() => setIsFastBuildOpen(false)}
          period={activePeriod}
          existingGoals={allGoals}
          onBulkAddGoals={handleBulkAddGoals}
        />
      )}

      {/* ── GOAL EDITOR MODAL FOR PERIOD DAYS ── */}
      {isGoalEditorOpen && (
        <DailyGoalEditorModal
          isOpen={isGoalEditorOpen}
          onClose={() => {
            setIsGoalEditorOpen(false);
            setEditingGoal(null);
          }}
          goal={editingGoal}
          dateStr={selectedDate}
          scheduledBlocks={scheduledBlocks}
          existingMustDoCount={allGoals.filter((g) => g.date === selectedDate && g.isMustDo).length}
          onSave={handleSaveGoal}
          onDelete={handleDeleteGoal}
        />
      )}

      {/* ── DELETE PERIOD CONFIRMATION MODAL ── */}
      {deleteConfirmPeriodId && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setDeleteConfirmPeriodId(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={22} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Plan Period?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              How would you like to handle the daily goals associated with this period?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDeletePeriod(deleteConfirmPeriodId, false)}
                className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-left flex items-center justify-between"
              >
                <span>Keep goals as independent daily goals</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDeletePeriod(deleteConfirmPeriodId, true)}
                className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-left flex items-center justify-between shadow-xs"
              >
                <span>Delete period and all its goals</span>
                <Trash2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmPeriodId(null)}
                className="w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 text-center mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
