import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useSession } from '../../context/SessionContext';
import { loadTaskInbox } from '../../utils/taskInboxStorage';
import { loadAssignments } from '../../utils/assignmentStorage';
import { loadGoals } from '../../utils/storage';
import { loadFocusHistory } from '../../utils/focusStorage';
import {
  calculateWeeklyReviewData,
  WeeklyReviewData,
} from '../../utils/weeklyReviewEngine';
import {
  loadWeeklyReflection,
  saveWeeklyReflection,
  WeeklyReflectionRecord,
} from '../../utils/weeklyReviewStorage';
import {
  getAdjacentWeekId,
  getISOWeekString,
  formatDuration,
} from '../../utils/timeUtils';
import { NavView } from '../Navigation/Sidebar';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  Sparkles,
  ArrowRight,
  BookOpen,
  Save,
  RotateCcw,
  Star,
  ListTodo,
  TrendingUp,
  Award,
} from 'lucide-react';

interface WeeklyReviewSectionProps {
  onNavigate?: (view: NavView) => void;
}

export const WeeklyReviewSection: React.FC<WeeklyReviewSectionProps> = ({ onNavigate }) => {
  const { currentWeekScheduledBlocks, scheduledBlocks, currentWeekId, addToast } = useTimetable();
  const { sessions } = useSession();

  // Selected week for review navigation
  const [selectedWeekId, setSelectedWeekId] = useState<string>(() => currentWeekId || getISOWeekString(new Date()));

  // Active data states
  const [tasks, setTasks] = useState(() => loadTaskInbox());
  const [assignments, setAssignments] = useState(() => loadAssignments());
  const [goals, setGoals] = useState(() => loadGoals());
  const [focusLogs, setFocusLogs] = useState(() => loadFocusHistory());

  // Weekly Reflection form state
  const [reflection, setReflection] = useState<WeeklyReflectionRecord>({
    weekId: selectedWeekId,
    whatWentWell: '',
    whatDidntGetFinished: '',
    whatToChangeNextWeek: '',
    rating: 5,
    updatedAt: 0,
  });
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  // Sync data whenever selected week changes or component mounts
  useEffect(() => {
    setTasks(loadTaskInbox());
    setAssignments(loadAssignments());
    setGoals(loadGoals());
    setFocusLogs(loadFocusHistory());

    const saved = loadWeeklyReflection(selectedWeekId);
    if (saved) {
      setReflection(saved);
    } else {
      setReflection({
        weekId: selectedWeekId,
        whatWentWell: '',
        whatDidntGetFinished: '',
        whatToChangeNextWeek: '',
        rating: 5,
        updatedAt: 0,
      });
    }
  }, [selectedWeekId]);

  // Calculate review data deterministically
  const reviewData: WeeklyReviewData = useMemo(() => {
    const allBlocks = scheduledBlocks.length > 0 ? scheduledBlocks : currentWeekScheduledBlocks;
    return calculateWeeklyReviewData({
      weekId: selectedWeekId,
      scheduledBlocks: allBlocks,
      executionSessions: sessions,
      focusHistory: focusLogs,
      tasks,
      assignments,
      goals,
    });
  }, [selectedWeekId, scheduledBlocks, currentWeekScheduledBlocks, sessions, focusLogs, tasks, assignments, goals]);

  const { metrics, upcomingAssignments, unresolvedItems } = reviewData;

  // Handlers for week navigation
  const handlePrevWeek = () => {
    setSelectedWeekId((prev) => getAdjacentWeekId(prev, -1));
  };

  const handleNextWeek = () => {
    setSelectedWeekId((prev) => getAdjacentWeekId(prev, 1));
  };

  const handleCurrentWeek = () => {
    const nowWeek = getISOWeekString(new Date());
    setSelectedWeekId(nowWeek);
  };

  // Save reflection handler
  const handleSaveReflection = useCallback(() => {
    setIsSavingReflection(true);
    saveWeeklyReflection({
      ...reflection,
      weekId: selectedWeekId,
    });
    setTimeout(() => {
      setIsSavingReflection(false);
      addToast('Weekly reflection saved successfully! 📝', 'success');
    }, 200);
  }, [reflection, selectedWeekId, addToast]);

  const isCurrentWeek = selectedWeekId === getISOWeekString(new Date());

  return (
    <div className="space-y-6 pt-2">
      {/* ── WEEK NAVIGATION HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Weekly Review & Reflection
            </span>
            {isCurrentWeek && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active Week
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
            <span>{selectedWeekId}</span>
            <span className="text-sm font-normal text-slate-400">({metrics.dateRangeLabel})</span>
          </h2>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleCurrentWeek}
            disabled={isCurrentWeek}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isCurrentWeek
                ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-default'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            This Week
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Next Week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── KEY EXECUTION METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Focus Time & Sessions */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Focus Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {metrics.totalFocusMinutes > 0 ? formatDuration(metrics.totalFocusMinutes) : '0h'}
            </span>
            <span className="text-xs font-bold text-slate-400">
              ({metrics.totalFocusSessionsCount} {metrics.totalFocusSessionsCount === 1 ? 'session' : 'sessions'})
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {metrics.avgFocusSessionDurationMinutes > 0
              ? `Avg ${metrics.avgFocusSessionDurationMinutes}m per session`
              : 'No recorded focus sessions'}
          </p>
        </div>

        {/* Card 2: Planned vs Actual Adherence */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Schedule Adherence</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {metrics.totalPlannedBlockMinutes > 0 ? `${metrics.timeAdherencePct}%` : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {metrics.totalPlannedBlockMinutes > 0
                ? `${formatDuration(metrics.totalActualRecordedMinutes)} / ${formatDuration(metrics.totalPlannedBlockMinutes)}`
                : 'No blocks planned'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {metrics.completedBlocksCount} of {metrics.totalScheduledBlocksCount} scheduled blocks finished
          </p>
        </div>

        {/* Card 3: Task Completion Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {metrics.totalCompletedTasks}
            </span>
            <span className="text-xs font-bold text-slate-400">
              ({metrics.taskCompletionRatePct}% rate)
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {metrics.totalIncompleteTasks} pending · {metrics.totalOverdueTasks} overdue
          </p>
        </div>

        {/* Card 4: Week Quality Rating */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Execution Rating</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReflection((prev) => ({ ...prev, rating: star }))}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  size={20}
                  className={
                    (reflection.rating || 5) >= star
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-700'
                  }
                />
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            Personal focus rating for this week
          </p>
        </div>
      </div>

      {/* ── PLANNED VS ACTUAL VISUAL COMPARISON ── */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Planned Time vs. Actual Focus Execution</span>
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {metrics.totalPlannedBlockMinutes > 0
              ? `${metrics.timeAdherencePct}% Adherence`
              : 'No scheduled blocks'}
          </span>
        </div>

        {metrics.totalPlannedBlockMinutes === 0 && metrics.totalActualRecordedMinutes === 0 ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
            No scheduled blocks or recorded focus sessions for {selectedWeekId}.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Planned Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Planned Timetable Time</span>
                <span className="text-slate-300 font-mono">
                  {formatDuration(metrics.totalPlannedBlockMinutes)}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      metrics.totalPlannedBlockMinutes > 0 ? 100 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Actual Recorded Focus Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Actual Recorded Focus Time</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {formatDuration(metrics.totalActualRecordedMinutes)}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      metrics.totalPlannedBlockMinutes > 0
                        ? (metrics.totalActualRecordedMinutes / metrics.totalPlannedBlockMinutes) * 100
                        : metrics.totalActualRecordedMinutes > 0
                        ? 100
                        : 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── GOALS & ASSIGNMENTS CONTEXT ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Goals Progress */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>SMART Goals Context</span>
            </h3>
            {onNavigate && (
              <button
                onClick={() => onNavigate('goals')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View Goals →
              </button>
            )}
          </div>

          {reviewData.goals.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No active SMART goals configured.</p>
          ) : (
            <div className="space-y-2.5">
              {reviewData.goals.slice(0, 3).map((g) => {
                const pct = g.target > 0 ? Math.min(100, Math.round((g.progress / g.target) * 100)) : 0;
                return (
                  <div key={g.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200 truncate">{g.title}</span>
                      <span className="text-indigo-400 font-mono text-[11px] font-bold">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Approaching Assignments */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Assignment Deadlines</span>
            </h3>
            {onNavigate && (
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                View Assignments →
              </button>
            )}
          </div>

          {upcomingAssignments.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No pending assignments approaching.</p>
          ) : (
            <div className="space-y-2">
              {upcomingAssignments.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-slate-200 block truncate">{a.title}</span>
                    <span className="text-[10px] text-slate-500">{a.course || 'Due'} · {a.dueDate}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      a.daysRemaining < 0
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : a.daysRemaining <= 2
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {a.daysRemaining < 0
                      ? 'Overdue'
                      : a.daysRemaining === 0
                      ? 'Due Today'
                      : `In ${a.daysRemaining}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── GUIDED WEEKLY REFLECTION FORM ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Structured Weekly Reflection</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reflect on your progress, document blockers, and set intentional goals for next week.
            </p>
          </div>

          <button
            onClick={handleSaveReflection}
            disabled={isSavingReflection}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSavingReflection ? 'Saving...' : 'Save Reflection'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Question 1: What went well? */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              1. What went well this week? 🌟
            </label>
            <textarea
              value={reflection.whatWentWell}
              onChange={(e) => setReflection({ ...reflection, whatWentWell: e.target.value })}
              placeholder="Key wins, completed milestones, or focused sessions..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Question 2: What didn't get finished? */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              2. What didn't get finished and why? ⚠️
            </label>
            <textarea
              value={reflection.whatDidntGetFinished}
              onChange={(e) => setReflection({ ...reflection, whatDidntGetFinished: e.target.value })}
              placeholder="Missed blocks, fatigue, overestimates, or unexpected tasks..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Question 3: What should change next week? */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              3. What should change next week? 🎯
            </label>
            <textarea
              value={reflection.whatToChangeNextWeek}
              onChange={(e) => setReflection({ ...reflection, whatToChangeNextWeek: e.target.value })}
              placeholder="Scheduling adjustments, buffer times, habit fixes..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── NEXT-WEEK TRANSITION & ACTION PLAN ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              <span>Next-Week Bridge & Unresolved Backlog</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {unresolvedItems.length > 0
                ? `${unresolvedItems.length} items from this week need attention for rescheduling.`
                : 'All tasks and schedule blocks were completed or resolved! 🎉'}
            </p>
          </div>

          {unresolvedItems.length > 0 && onNavigate && (
            <button
              onClick={() => onNavigate('adaptive-planner')}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
            >
              <Sparkles size={14} />
              <span>Rebalance in Adaptive Planner</span>
            </button>
          )}
        </div>

        {unresolvedItems.length === 0 ? (
          <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Clean Slate for Next Week</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No overdue tasks or missed commitments carried over. You're ready to plan upcoming goals!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {unresolvedItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      item.type === 'overdue_task'
                        ? 'bg-rose-500/10 text-rose-400'
                        : item.type === 'missed_block'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    {item.type === 'overdue_task' ? (
                      <AlertCircle size={14} />
                    ) : item.type === 'missed_block' ? (
                      <Clock size={14} />
                    ) : (
                      <ListTodo size={14} />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{item.title}</span>
                    <span className="text-[10px] text-slate-500">
                      {item.type === 'overdue_task'
                        ? `Overdue · Deadline: ${item.dateOrDeadline}`
                        : item.type === 'missed_block'
                        ? `Missed session · ${item.durationMinutes}m`
                        : `Pending · ${item.durationMinutes ? `${item.durationMinutes}m estimated` : 'No duration'}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('task-inbox')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                    >
                      View in Inbox
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
