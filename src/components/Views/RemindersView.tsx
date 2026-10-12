import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { minutesToTimeStr } from '../../utils/timeUtils';
import { playReminderChime } from '../../utils/notificationUtils';
import { loadGoals, saveGoals, normalizeGoal } from '../../utils/storage';
import { Goal } from '../../types/timetable';
import { calculateGoalMetrics } from '../../utils/goalEngine';
import {
  Bell,
  BellRing,
  Clock,
  Volume2,
  CheckCircle2,
  AlertCircle,
  VolumeX,
  Target,
  Calendar,
  Archive,
} from 'lucide-react';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';

interface RemindersViewProps {
  onNavigate?: (view: NavView) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ onNavigate }) => {
  const {
    currentWeekScheduledBlocks,
    scheduledBlocks,
    updateScheduledBlock,
    enableNotifications,
    notificationsEnabled,
    addToast,
  } = useTimetable();

  const allBlocks = currentWeekScheduledBlocks?.length > 0 ? currentWeekScheduledBlocks : scheduledBlocks || [];

  const [goals, setGoals] = useState<Goal[]>([]);
  const [editingDeadlineGoalId, setEditingDeadlineGoalId] = useState<string | null>(null);
  const [revisedDeadlineDate, setRevisedDeadlineDate] = useState<string>('');

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  const blocksWithReminders = currentWeekScheduledBlocks.filter(
    (b) => b.reminderMinutes && b.reminderMinutes > 0
  );

  const handleTestChime = () => {
    playReminderChime();
    addToast('Audio chime played', 'info');
  };

  const handleClearReminder = (id: string) => {
    updateScheduledBlock(id, { reminderMinutes: 0 });
    addToast('Reminder cleared', 'info');
  };

  const handleMarkGoalComplete = (rawGoal: Goal) => {
    const goal = normalizeGoal(rawGoal);
    const targetVal = goal.smart?.targetValue ?? 10;
    const currentVal = goal.smart?.currentValue ?? 0;
    const updated: Goal = {
      ...goal,
      status: 'completed',
      completedAt: Date.now(),
      smart: {
        ...goal.smart,
        currentValue: Math.max(currentVal, targetVal),
      },
    };
    const newGoals = goals.map((g) => (g.id === goal.id ? updated : g));
    setGoals(newGoals);
    saveGoals(newGoals);
    addToast(`Marked "${goal.title}" as complete!`, 'success');
  };

  const handleArchiveGoal = (goal: Goal) => {
    const updated: Goal = {
      ...goal,
      status: 'archived',
    };
    const newGoals = goals.map((g) => (g.id === goal.id ? updated : g));
    setGoals(newGoals);
    saveGoals(newGoals);
    addToast(`Archived "${goal.title}"`, 'info');
  };

  const handleSaveRevisedDeadline = (rawGoal: Goal) => {
    if (!revisedDeadlineDate) return;
    const goal = normalizeGoal(rawGoal);
    const updated: Goal = {
      ...goal,
      smart: {
        ...goal.smart,
        deadline: revisedDeadlineDate,
      },
      targetDate: revisedDeadlineDate,
      deadline: revisedDeadlineDate,
    };
    const newGoals = goals.map((g) => (g.id === goal.id ? updated : g));
    setGoals(newGoals);
    saveGoals(newGoals);
    setEditingDeadlineGoalId(null);
    addToast(`Revised deadline for "${goal.title}" to ${revisedDeadlineDate}`, 'success');
  };

  // Process goal deadlines & overdue status
  const activeGoalsWithMetrics = goals
    .filter((g) => g.status === 'active')
    .map((g) => ({
      goal: g,
      metrics: calculateGoalMetrics(g, allBlocks),
    }));

  const overdueGoals = activeGoalsWithMetrics.filter((item) => item.metrics.isOverdue);
  const upcomingGoals = activeGoalsWithMetrics.filter(
    (item) => !item.metrics.isOverdue && item.metrics.daysRemaining <= 7
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-5 sm:p-8 space-y-6 select-none scrollbar-thin">
      {/* Global Breadcrumb */}
      <PageBreadcrumb items={[{ label: 'Reminders' }]} onNavigate={onNavigate} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#3659C9]" />
            <span>Reminders &amp; Deadlines</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Activity start alerts and goal deadline review tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestChime}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Test Chime</span>
          </button>
          <button
            onClick={enableNotifications}
            className={`px-4 py-2 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
              notificationsEnabled
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-[#3659C9] hover:bg-[#2F4EB8] text-white'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{notificationsEnabled ? 'Alerts Active' : 'Enable Browser Alerts'}</span>
          </button>
        </div>
      </div>

      {/* ── GOAL DEADLINES & OVERDUE REVIEWS ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Target size={14} className="text-[#3659C9]" />
          <span>Goal Deadlines &amp; Review Status ({overdueGoals.length + upcomingGoals.length})</span>
        </h3>

        {overdueGoals.length === 0 && upcomingGoals.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
            All active goals are comfortably on schedule. No overdue deadlines.
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Overdue Goals - Presented Neutrally */}
            {overdueGoals.map(({ goal, metrics }) => (
              <div
                key={goal.id}
                className="p-4 rounded-lg bg-slate-900 border border-amber-500/30 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: goal.color }} />
                      <h4 className="text-sm font-semibold text-white">{goal.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Needs Review · Overdue by {metrics.daysOverdue} day{metrics.daysOverdue === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Planned target: {new Date(metrics.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {metrics.actualCurrentValue} of {metrics.targetValue} {metrics.unit} completed
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingDeadlineGoalId(goal.id);
                        setRevisedDeadlineDate(metrics.deadline);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                    >
                      Revise Deadline
                    </button>
                    <button
                      onClick={() => handleMarkGoalComplete(goal)}
                      className="px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded border border-emerald-500/20 transition-colors"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => handleArchiveGoal(goal)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="Archive goal"
                    >
                      <Archive size={14} />
                    </button>
                  </div>
                </div>

                {editingDeadlineGoalId === goal.id && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-700 flex items-center gap-2 text-xs">
                    <label className="text-slate-300">Set new deadline:</label>
                    <input
                      type="date"
                      value={revisedDeadlineDate}
                      onChange={(e) => setRevisedDeadlineDate(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                    <button
                      onClick={() => handleSaveRevisedDeadline(goal)}
                      className="px-3 py-1 bg-[#3659C9] text-white font-medium rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDeadlineGoalId(null)}
                      className="px-2 py-1 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Upcoming Deadlines (within 7 days) */}
            {upcomingGoals.map(({ goal, metrics }) => (
              <div
                key={goal.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-white text-sm">{goal.title}</h4>
                    <p className="text-slate-400 text-xs">
                      Due in <strong>{metrics.daysRemaining} day{metrics.daysRemaining === 1 ? '' : 's'}</strong> ({new Date(metrics.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}) · {metrics.actualCurrentValue} of {metrics.targetValue} {metrics.unit} completed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-slate-300 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {metrics.remainingHours}h effort left
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ACTIVE SCHEDULED BLOCK REMINDERS ── */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock size={14} className="text-[#3659C9]" />
          <span>Active Activity Start Alerts ({blocksWithReminders.length})</span>
        </h3>

        {blocksWithReminders.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg p-6">
            <Bell className="w-6 h-6 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-slate-300">No active activity alerts configured for this week</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Click any block in the Calendar to configure 15m audio/browser notifications.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blocksWithReminders.map((b) => (
              <div
                key={b.id}
                style={{ borderLeftColor: b.color }}
                className="p-4 rounded-lg bg-slate-900 border-l-4 border-y border-r border-slate-800 flex items-center justify-between"
              >
                <div className="space-y-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{b.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Starts at {minutesToTimeStr(b.startMinutes)}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 inline-block">
                    Alert {b.reminderMinutes}m before
                  </span>
                </div>

                <button
                  onClick={() => handleClearReminder(b.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Remove reminder"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
