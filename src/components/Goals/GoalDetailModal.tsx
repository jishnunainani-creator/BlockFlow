import React, { useState } from 'react';
import { Goal, ScheduledBlock } from '../../types/timetable';
import { calculateGoalMetrics } from '../../utils/goalEngine';
import { useTimetable } from '../../context/TimetableContext';
import { PlanGoalScheduleModal } from './PlanGoalScheduleModal';
import { normalizeGoal } from '../../utils/storage';
import {
  Target,
  Clock,
  Calendar,
  Sparkles,
  Plus,
  Minus,
  CheckCircle2,
  Trash2,
  X,
  Archive,
  RotateCcw,
  AlertCircle,
  CalendarPlus,
} from 'lucide-react';
import { DAYS_OF_WEEK, minutesToTimeStr } from '../../utils/timeUtils';

interface GoalDetailModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateGoal: (updatedGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  goal: rawGoal,
  isOpen,
  onClose,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const { currentWeekScheduledBlocks, scheduledBlocks, addToast } = useTimetable();
  const allBlocks = currentWeekScheduledBlocks?.length > 0 ? currentWeekScheduledBlocks : scheduledBlocks || [];

  const [isPlanScheduleOpen, setIsPlanScheduleOpen] = useState(false);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [editValue, setEditValue] = useState<number>(0);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');

  if (!isOpen || !rawGoal) return null;
  const goal = normalizeGoal(rawGoal);

  const metrics = calculateGoalMetrics(goal, allBlocks);
  const linkedBlocks = allBlocks.filter((b) => b && b.goalId === goal.id);

  const handleUpdateCurrentValue = (newVal: number) => {
    const clamped = Math.max(0, newVal);
    const targetVal = goal.smart?.targetValue ?? 10;
    const unitStr = goal.smart?.unit ?? 'units';
    const updated: Goal = {
      ...goal,
      smart: {
        ...goal.smart,
        currentValue: clamped,
      },
      status: clamped >= targetVal ? 'completed' : goal.status === 'completed' ? 'active' : goal.status,
    };
    onUpdateGoal(updated);
    addToast(`Updated progress to ${clamped} ${unitStr}`, 'info');
  };

  const handleToggleComplete = () => {
    const isNowCompleted = goal.status !== 'completed';
    const currentVal = goal.smart?.currentValue ?? 0;
    const targetVal = goal.smart?.targetValue ?? 10;
    const updated: Goal = {
      ...goal,
      status: isNowCompleted ? 'completed' : 'active',
      completedAt: isNowCompleted ? Date.now() : undefined,
      smart: {
        ...goal.smart,
        currentValue: isNowCompleted ? Math.max(currentVal, targetVal) : currentVal,
      },
    };
    onUpdateGoal(updated);
    addToast(isNowCompleted ? `Marked "${goal.title}" as completed!` : `Reopened "${goal.title}"`, 'success');
  };

  const handleArchiveToggle = () => {
    const isArchived = goal.status === 'archived';
    const updated: Goal = {
      ...goal,
      status: isArchived ? 'active' : 'archived',
    };
    onUpdateGoal(updated);
    addToast(isArchived ? `Restored "${goal.title}" from archive` : `Archived "${goal.title}"`, 'info');
  };

  const handleSaveRevisedDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeadline) return;

    const updated: Goal = {
      ...goal,
      smart: {
        ...goal.smart,
        deadline: newDeadline,
      },
      targetDate: newDeadline,
      deadline: newDeadline,
    };
    onUpdateGoal(updated);
    setIsEditingDeadline(false);
    addToast(`Revised deadline to ${newDeadline}`, 'success');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-in select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
          
          {/* ── Header ── */}
          <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/90 backdrop-blur-sm">
            <div className="space-y-2 max-w-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                >
                  {goal.category}
                </span>
                {goal.status === 'completed' && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Completed
                  </span>
                )}
                {goal.status === 'archived' && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                    <Archive size={11} /> Archived
                  </span>
                )}
                {metrics.isOverdue && goal.status === 'active' && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertCircle size={11} /> Overdue by {metrics.daysOverdue}d
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-snug">{goal.title}</h2>
              {goal.smart?.specificDetails && (
                <p className="text-xs text-slate-400 leading-relaxed">{goal.smart.specificDetails}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close goal details"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Modal Body ── */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
            
            {/* ── Section 1: Measurable Progress Card ── */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Measurable Progress
                  </span>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {metrics.actualCurrentValue} of {metrics.targetValue} {metrics.unit} completed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    {metrics.progressPct}% Complete
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${metrics.progressPct}%`,
                    backgroundColor: goal.color || '#3659C9',
                  }}
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {metrics.naturalProgressSummary}
              </p>

              {/* Quick Update Progress Controls */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Quick Progress Logger:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateCurrentValue(metrics.actualCurrentValue - 1)}
                    disabled={metrics.actualCurrentValue <= 0}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
                    title={`Subtract 1 ${metrics.unit}`}
                  >
                    <Minus size={13} />
                  </button>
                  <button
                    onClick={() => {
                      setEditValue(metrics.actualCurrentValue);
                      setIsEditingProgress(true);
                    }}
                    className="px-3 py-1.5 text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg text-white border border-slate-700"
                  >
                    {metrics.actualCurrentValue} {metrics.unit}
                  </button>
                  <button
                    onClick={() => handleUpdateCurrentValue(metrics.actualCurrentValue + 1)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title={`Add 1 ${metrics.unit}`}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Manual numeric input popover */}
              {isEditingProgress && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 mt-2 flex items-center gap-2.5 animate-fade-in">
                  <label className="text-xs text-slate-300">Set exact amount:</label>
                  <input
                    type="number"
                    min={0}
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      handleUpdateCurrentValue(editValue);
                      setIsEditingProgress(false);
                    }}
                    className="px-3 py-1.5 bg-[#3659C9] text-white text-xs font-semibold rounded-lg"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setIsEditingProgress(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* ── Section 2: Effort Breakdown Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Target Effort</span>
                <p className="text-lg font-bold text-white font-mono">{metrics.estimatedTotalHours}h</p>
                <p className="text-xs text-slate-400">Total estimated time</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Completed Sessions</span>
                <p className="text-lg font-bold text-emerald-400 font-mono">{metrics.completedHours}h</p>
                <p className="text-xs text-slate-400">Invested in finished blocks</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Remaining Effort</span>
                <p className="text-lg font-bold text-[#3659C9] font-mono">{metrics.remainingHours}h</p>
                <p className="text-xs text-slate-400">To schedule in timetable</p>
              </div>
            </div>

            {/* ── Section 3: SMART Criteria Details ── */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                SMART Framework Evaluation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Specific & Relevant */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-[#3659C9] uppercase tracking-wider block">
                    R — Relevance &amp; Purpose
                  </span>
                  <p className="text-slate-300 leading-relaxed italic text-xs">
                    "{goal.smart?.motivation || 'Important personal or academic priority.'}"
                  </p>
                </div>

                {/* Achievable & Feasibility */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-[#3659C9] uppercase tracking-wider block">
                    A — Feasibility Assessment
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {metrics.feasibility.message}
                  </p>
                </div>
              </div>

              {/* Time-bound Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#3659C9] uppercase tracking-wider block">
                    T — Time-Bound Target
                  </span>
                  <p className="text-slate-200">
                    Target Deadline: <strong className="text-white">{new Date(metrics.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setNewDeadline(metrics.deadline);
                    setIsEditingDeadline(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 self-start sm:self-auto"
                >
                  Revise Deadline
                </button>
              </div>

              {isEditingDeadline && (
                <form onSubmit={handleSaveRevisedDeadline} className="p-4 rounded-xl bg-slate-950 border border-slate-700 flex flex-wrap items-center gap-3 text-xs animate-fade-in">
                  <label className="text-slate-300 font-medium">New Target Date:</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <button type="submit" className="px-3.5 py-1.5 bg-[#3659C9] hover:bg-[#2F4EB8] text-white rounded-lg font-semibold">
                    Save Revision
                  </button>
                  <button type="button" onClick={() => setIsEditingDeadline(false)} className="text-slate-400 hover:text-white">
                    Cancel
                  </button>
                </form>
              )}
            </div>

            {/* ── Section 4: Next Recommended Action Banner ── */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Next Recommended Action
                </span>
                <p className="text-sm font-semibold text-white">{metrics.nextAction}</p>
              </div>

              <button
                onClick={() => setIsPlanScheduleOpen(true)}
                className="px-4 py-2 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm self-start sm:self-auto"
              >
                <CalendarPlus size={15} />
                <span>Plan in Timetable</span>
              </button>
            </div>

            {/* ── Section 5: Linked Timetable Blocks List ── */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Linked Timetable Sessions ({linkedBlocks.length})
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {metrics.plannedHours}h scheduled this week
                </span>
              </div>

              {linkedBlocks.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {linkedBlocks.map((b) => {
                    const dayName = DAYS_OF_WEEK.find((d) => d.index === b.dayOfWeek)?.short || 'Day';
                    const timeRange = `${minutesToTimeStr(b.startMinutes)} – ${minutesToTimeStr(b.startMinutes + b.duration)}`;
                    const isDone = b.status === 'completed' || b.status === 'faster';

                    return (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-[#3659C9]'}`} />
                          <span className="font-medium text-white">{b.title}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {dayName} {timeRange}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono">{b.duration}m</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                              isDone
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {b.status || 'Scheduled'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 text-center text-xs text-slate-400">
                  No blocks currently scheduled for this goal. Click "Plan in Timetable" to schedule focus sessions.
                </div>
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleComplete}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  goal.status === 'completed'
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                }`}
              >
                {goal.status === 'completed' ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
                <span>{goal.status === 'completed' ? 'Reopen Goal' : 'Mark Complete'}</span>
              </button>

              <button
                onClick={handleArchiveToggle}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={goal.status === 'archived' ? 'Restore from archive' : 'Archive goal'}
              >
                <Archive size={14} />
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete goal "${goal.title}"?`)) {
                    onDeleteGoal(goal.id);
                    onClose();
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Delete goal"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <button
              onClick={() => setIsPlanScheduleOpen(true)}
              className="px-4 py-2 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CalendarPlus size={14} />
              <span>Plan in Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Schedule Modal */}
      <PlanGoalScheduleModal
        goal={goal}
        isOpen={isPlanScheduleOpen}
        onClose={() => setIsPlanScheduleOpen(false)}
      />
    </>
  );
};
