import React, { useState } from 'react';
import {
  Target,
  Plus,
  Star,
  Clock,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Circle,
  MoreVertical,
  Compass,
  ArrowRight,
  Trash2,
  SkipForward,
  Edit2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  DailyGoal,
  DayGoalStats,
  GOAL_PALETTE_OPTIONS,
} from '../../types/dailyGoals';
import { ScheduledBlock } from '../../types/timetable';
import { selectDayGoalStats } from '../../utils/dataSelectors';
import { reorderGoals, createCarriedGoal } from '../../utils/dailyGoalsEngine';
import { incrementSmartGoalProgress } from '../../utils/dailyGoalsStorage';

interface DailyGoalsCardProps {
  dateStr: string; // "YYYY-MM-DD"
  goals: DailyGoal[];
  scheduledBlocks: ScheduledBlock[];
  onSaveGoal: (goal: DailyGoal) => void;
  onUpdateGoalsList: (goals: DailyGoal[]) => void;
  onDeleteGoal: (goalId: string) => void;
  onOpenEditor: (goal?: DailyGoal) => void;
  onOpenPlanDay: () => void;
  onStartFocus?: (goal: DailyGoal) => void;
  addToast: (message: string, type: 'info' | 'success' | 'warning' | 'error', options?: { actionLabel?: string; onAction?: () => void }) => void;
}

export const DailyGoalsCard: React.FC<DailyGoalsCardProps> = ({
  dateStr,
  goals,
  scheduledBlocks,
  onSaveGoal,
  onUpdateGoalsList,
  onDeleteGoal,
  onOpenEditor,
  onOpenPlanDay,
  onStartFocus,
  addToast,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [activeMenuGoalId, setActiveMenuGoalId] = useState<string | null>(null);

  // Compute canonical stats using single source of truth selector
  const stats = React.useMemo(() => {
    return selectDayGoalStats({
      dateStr,
      goals,
      scheduledBlocks,
    });
  }, [dateStr, goals, scheduledBlocks]);

  // Current date goals sorted by order
  const dayGoals = React.useMemo(() => {
    return goals
      .filter((g) => g.date === dateStr)
      .sort((a, b) => a.order - b.order);
  }, [goals, dateStr]);

  // Inline Quick Add
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newGoal: DailyGoal = {
      id: `dg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: dateStr,
      title: quickTitle.trim(),
      color: 'indigo',
      priority: 'medium',
      isMustDo: false,
      measure: { type: 'check', current: 0 },
      status: 'planned',
      carryCount: 0,
      order: dayGoals.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSaveGoal(newGoal);
    setQuickTitle('');
    addToast('Daily goal added! 🎯', 'success');
  };

  // Reorder keyboard / tap move
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dayGoals.length) return;

    const reorderedDay = reorderGoals(dayGoals, index, targetIndex);
    // Merge back into full goals list
    const otherGoals = goals.filter((g) => g.date !== dateStr);
    onUpdateGoalsList([...otherGoals, ...reorderedDay]);
  };

  // Toggle status / completion
  const handleToggleDone = (goal: DailyGoal) => {
    const nextStatus = goal.status === 'done' ? 'planned' : 'done';
    const nextCurrent = nextStatus === 'done'
      ? (goal.measure.target || (goal.measure.type === 'percent' ? 100 : 1))
      : 0;

    const updated: DailyGoal = {
      ...goal,
      status: nextStatus,
      measure: {
        ...goal.measure,
        current: nextCurrent,
      },
      completedAt: nextStatus === 'done' ? Date.now() : undefined,
      updatedAt: Date.now(),
    };

    onSaveGoal(updated);
    if (nextStatus === 'done') {
      addToast(`Completed: "${goal.title}" ✨`, 'success');
      if (goal.linkedSmartGoalId) {
        const incrementVal = goal.measure.type === 'count' && goal.measure.target ? goal.measure.target : 1;
        const updatedSmart = incrementSmartGoalProgress(goal.linkedSmartGoalId, incrementVal);
        if (updatedSmart) {
          addToast('Linked SMART goal progress updated! 📈', 'info');
        }
      }
    }
  };

  // Carry-over to tomorrow
  const handleCarryOver = (goal: DailyGoal) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const tomorrow = new Date(y, m - 1, d + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    const { updatedSource, carriedGoal } = createCarriedGoal(goal, tomorrowStr);

    // Save source as carried and add clone for tomorrow
    const otherGoals = goals.filter((g) => g.id !== goal.id);
    onUpdateGoalsList([...otherGoals, updatedSource, carriedGoal]);
    setActiveMenuGoalId(null);

    addToast(`Carried over to ${tomorrowStr} ➡️`, 'info');
  };

  // Skip goal
  const handleSkip = (goal: DailyGoal) => {
    const updated: DailyGoal = {
      ...goal,
      status: 'skipped',
      updatedAt: Date.now(),
    };
    onSaveGoal(updated);
    setActiveMenuGoalId(null);

    addToast(`Marked "${goal.title}" as skipped`, 'info', {
      actionLabel: 'Undo',
      onAction: () => {
        onSaveGoal({ ...goal, status: 'planned', updatedAt: Date.now() });
      },
    });
  };

  // Delete with undo
  const handleDelete = (goal: DailyGoal) => {
    onDeleteGoal(goal.id);
    setActiveMenuGoalId(null);

    addToast(`Deleted goal "${goal.title}"`, 'info', {
      actionLabel: 'Undo',
      onAction: () => {
        onSaveGoal(goal);
      },
    });
  };

  // Toggle Must-Do
  const handleToggleMustDo = (goal: DailyGoal) => {
    const updated: DailyGoal = {
      ...goal,
      isMustDo: !goal.isMustDo,
      updatedAt: Date.now(),
    };
    onSaveGoal(updated);
  };

  // Color helper
  const getColorDot = (colorId: string) => {
    const opt = GOAL_PALETTE_OPTIONS.find((o) => o.id === colorId);
    return opt?.dotColor || '#6366F1';
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Today's Goals
              </h2>
              {/* Day Score Badge */}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                  stats.scorePct === null
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    : stats.scorePct >= 80
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    : 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                }`}
                title="Weighted Day Score (High: 3, Med: 2, Low: 1)"
              >
                Score: {stats.formattedScore}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {stats.completedCount}/{stats.totalCount} completed • {stats.mustDoCompletedCount}/{stats.mustDoCount} must-dos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPlanDay}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span>Plan Day</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenEditor()}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Gentle Must-Do Cap Warning banner if > 3 must-dos */}
      {stats.mustDoCount > 3 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            {stats.mustDoCount} goals are marked Must-Do. We recommend focusing on at most 3 to ensure high completion.
          </span>
        </div>
      )}

      {/* Inline Quick Add Input */}
      <form onSubmit={handleQuickAdd} className="relative">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="+ Quick add a goal for today (press Enter)..."
          className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
        />
        {quickTitle.trim() && (
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
          >
            Add
          </button>
        )}
      </form>

      {/* Goal List or Honest Empty State */}
      {dayGoals.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Target className="w-6 h-6 text-slate-400 mx-auto stroke-1" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No Daily Goals Set for Today
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            What is the single most important outcome you want to achieve today? Use the quick-add bar above or click Plan Day.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayGoals.map((goal, index) => {
            const isDone = goal.status === 'done';
            const isSkipped = goal.status === 'skipped';
            const isCarried = goal.status === 'carried';
            const isMust = Boolean(goal.isMustDo);
            const isMenuOpen = activeMenuGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className={`p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                  isDone
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-80'
                    : isSkipped || isCarried
                    ? 'bg-slate-50/40 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 opacity-60'
                    : isMust
                    ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-300 dark:border-amber-900/40'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Main Goal Row */}
                <div className="flex items-center justify-between gap-2.5">
                  {/* Left: Reorder buttons, Checkbox & Info */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Up/Down keyboard accessible reorder buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        title="Move goal up"
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 p-0.5"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === dayGoals.length - 1}
                        title="Move goal down"
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 p-0.5"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>

                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleDone(goal)}
                      title={isDone ? 'Mark as planned' : 'Mark as done'}
                      className="shrink-0 transition-transform active:scale-90"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/40" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-indigo-500" />
                      )}
                    </button>

                    {/* Color Dot (Palette Token) */}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getColorDot(goal.color) }}
                      title={`Color tag: ${goal.color}`}
                    />

                    {/* Title & Notes */}
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpenEditor(goal)}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-semibold break-words ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {goal.title}
                        </span>

                        {isCarried && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                            carried
                          </span>
                        )}

                        {goal.carryCount > 0 && !isCarried && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono">
                            carried ×{goal.carryCount}
                          </span>
                        )}
                      </div>

                      {goal.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {goal.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Badges, Must-Do, Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Time chip if scheduled */}
                    {goal.startTime && goal.endTime && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Clock size={10} />
                        {goal.startTime}–{goal.endTime}
                      </span>
                    )}

                    {/* Priority badge */}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                        goal.priority === 'high'
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600'
                          : goal.priority === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                      }`}
                    >
                      {goal.priority}
                    </span>

                    {/* Must-Do Star toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleMustDo(goal)}
                      title={isMust ? 'Remove from Must-Dos' : 'Mark as Top 3 Must-Do'}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Star
                        size={14}
                        className={isMust ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}
                      />
                    </button>

                    {/* Start Focus button */}
                    {onStartFocus && !isDone && (
                      <button
                        type="button"
                        onClick={() => onStartFocus(goal)}
                        title="Start Focus Session on this goal"
                        className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                      >
                        <Play size={13} />
                      </button>
                    )}

                    {/* More Actions Dropdown Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuGoalId(isMenuOpen ? null : goal.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20 py-1 text-xs animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onOpenEditor(goal);
                              setActiveMenuGoalId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2"
                          >
                            <Edit2 size={13} />
                            <span>Edit Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCarryOver(goal)}
                            className="w-full px-3 py-1.5 text-left text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2"
                          >
                            <ArrowRight size={13} />
                            <span>Carry to Tomorrow</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSkip(goal)}
                            className="w-full px-3 py-1.5 text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2"
                          >
                            <SkipForward size={13} />
                            <span>Skip Goal</span>
                          </button>

                          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                          <button
                            type="button"
                            onClick={() => handleDelete(goal)}
                            className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-semibold"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Carry-Over Suggestion Banner after 3 Carries */}
                {goal.carryCount >= 3 && !isDone && !isSkipped && !isCarried && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Carried {goal.carryCount}×. Split into smaller steps or drop?</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenEditor(goal)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-100 dark:hover:bg-slate-700 text-[10px] border border-amber-200 dark:border-amber-900/60 transition-colors"
                      >
                        Break down
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSkip(goal)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                )}

                {/* Measure Progress Bar or Stepper if count / percent / minutes */}
                {goal.measure.type !== 'check' && (
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>
                          {goal.measure.type === 'percent'
                            ? `${goal.measure.current}% complete`
                            : `${goal.measure.current} of ${goal.measure.target || 0} ${goal.measure.type}`}
                        </span>
                        {goal.estimateMin && (
                          <span className="font-mono">Est: {goal.estimateMin}m</span>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              goal.measure.type === 'percent'
                                ? goal.measure.current
                                : (goal.measure.current / (goal.measure.target || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Quick increment buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.max(0, (goal.measure.current || 0) - 1);
                          onSaveGoal({
                            ...goal,
                            measure: { ...goal.measure, current: nextVal },
                            status: nextVal === 0 ? 'planned' : 'partial',
                            updatedAt: Date.now(),
                          });
                        }}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const target = goal.measure.target || (goal.measure.type === 'percent' ? 100 : 10);
                          const nextVal = Math.min(target, (goal.measure.current || 0) + (goal.measure.type === 'percent' ? 10 : 1));
                          const isComplete = nextVal >= target;
                          onSaveGoal({
                            ...goal,
                            measure: { ...goal.measure, current: nextVal },
                            status: isComplete ? 'done' : 'partial',
                            completedAt: isComplete ? Date.now() : undefined,
                            updatedAt: Date.now(),
                          });
                        }}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
