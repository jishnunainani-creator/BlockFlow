import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { NavView } from '../Navigation/Sidebar';
import { loadGoals } from '../../utils/storage';
import { Goal } from '../../types/timetable';
import { calculateGoalMetrics } from '../../utils/goalEngine';
import {
  calculateExecutionScore,
  calculateCompletionProbability,
  getProductivityDNA,
} from '../../utils/aiProductivityEngine';
import { minutesToTimeStr, formatDuration } from '../../utils/timeUtils';
import {
  Target,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  AlertCircle,
  Play,
  CheckSquare,
  Square,
  RefreshCcw,
} from 'lucide-react';
import { ContextHelp } from '../UI/ContextHelp';
import { EmptyStateGuidance } from '../UI/EmptyStateGuidance';
import PersonalTimeBudgetWidget from '../Analytics/PersonalTimeBudgetWidget';
import ScheduleOptimizerModal from '../AI/ScheduleOptimizerModal';

interface DashboardViewProps {
  onNavigate: (view: NavView) => void;
  userEmail?: string | null;
  onStartFocusMode?: () => void;
}

import { useExecution } from '../../context/ExecutionContext';

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  userEmail,
  onStartFocusMode,
}) => {
  const { currentWeekScheduledBlocks, addToast } = useTimetable();
  const { dailyScores } = useExecution();
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);

  const userName = userEmail ? userEmail.split('@')[0] : 'Guest';

  // Today's index & blocks
  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayBlocks = React.useMemo(() => {
    return currentWeekScheduledBlocks
      .filter((b) => b.dayOfWeek === todayIndex)
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }, [currentWeekScheduledBlocks, todayIndex]);

  // Execution Score & DNA (Memoized)
  const execScore = React.useMemo(
    () => calculateExecutionScore(currentWeekScheduledBlocks),
    [currentWeekScheduledBlocks]
  );

  const dna = React.useMemo(
    () => getProductivityDNA({
      scheduledBlocks: currentWeekScheduledBlocks,
      dailyScores,
    }),
    [currentWeekScheduledBlocks, dailyScores]
  );

  // Load goals once
  const goals = React.useMemo(() => loadGoals(), []);

  // Dynamic Daily Mission derived from real todayBlocks
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());

  const missionItems = React.useMemo(() => {
    return todayBlocks.map((b) => ({
      id: b.id,
      title: b.title,
      duration: b.duration,
      probability: calculateCompletionProbability(b),
      completed: b.status === 'completed' || b.status === 'faster' || completedMissionIds.has(b.id),
    }));
  }, [todayBlocks, completedMissionIds]);

  const [adaptiveBannerOpen, setAdaptiveBannerOpen] = useState(true);

  const toggleMission = (id: string) => {
    setCompletedMissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const item = missionItems.find((i) => i.id === id);
        if (item) addToast(`Completed mission item: "${item.title}"! 🎯`, 'success');
      }
      return next;
    });
  };

  const completedMissionCount = missionItems.filter((i) => i.completed).length;
  const totalMissionMinutes = missionItems.reduce((acc, i) => acc + i.duration, 0);

  const handleAcceptAdaptiveAdjustment = () => {
    addToast('Schedule automatically adjusted! Execution Score improved ✨', 'success');
    setAdaptiveBannerOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin">
      {/* ── HEADER GREETING ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Good Morning, {userName}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Today's Overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOptimizerOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>Optimize Day</span>
          </button>

          {onStartFocusMode && (
            <button
              onClick={onStartFocusMode}
              className="px-4 py-2 bg-[#3659C9] hover:bg-[#2B47A8] dark:bg-[#4F73E3] dark:hover:bg-[#6384ED] text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Start Focus Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* ── ADAPTIVE DAY PLANNER NOTIFICATION BANNER ── */}
      {adaptiveBannerOpen && (
        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0">
              <RefreshCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white block text-sm">Schedule Adjustment Recommended</span>
              <span className="text-slate-400">
                Standup ran 35m longer than planned. Recommended: shift next blocks by 30 minutes to maintain balance.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAcceptAdaptiveAdjustment}
              className="px-3 py-1.5 bg-[#3659C9] hover:bg-[#2B47A8] dark:bg-[#4F73E3] dark:hover:bg-[#6384ED] text-white font-medium text-xs rounded-lg transition-colors"
            >
              Accept Adjustment
            </button>
            <button
              onClick={() => setAdaptiveBannerOpen(false)}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── TOP EXECUTION KPI METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Main Execution Score KPI */}
        <div
          onClick={() => onNavigate('execution')}
          className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1">
              Execution Score
              <ContextHelp text="Execution Score measures how effectively you followed your planned schedule based on completion, timing, priorities, and consistency." title="Daily Execution Score" />
            </span>
            <Target className="w-4 h-4 text-[#3659C9] dark:text-[#4F73E3]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{execScore.score}</span>
            <span className="text-xs text-slate-600 dark:text-slate-400">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            {execScore.consistencyRating} · Tap for details →
          </p>
        </div>

        {/* Time Accuracy */}
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1">
              Time Accuracy
              <ContextHelp text="Measures how closely your actual activity duration matches your planned schedule." title="Time Accuracy" />
            </span>
            <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{execScore.timeAccuracyPct}%</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Schedule duration precision</p>
        </div>

        {/* Goal Progress */}
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">Goal Progress</span>
            <Award className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{execScore.goalProgressPct}%</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Milestone accomplishment</p>
        </div>

        {/* Peak Focus Window */}
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1">
              Peak Focus
              <ContextHelp text="AI-detected time period during which your historical focus ratings and completion rates are highest." title="Peak Focus Window" />
            </span>
            <Zap className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{dna.peakFocusWindow}</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Optimal performance hours</p>
        </div>
      </div>

      {/* ── 24-HOUR TIME BUDGET DASHBOARD (Feature 82) ── */}
      <PersonalTimeBudgetWidget />

      {/* ── TODAY'S SCHEDULE PLAN CARD ── */}
      <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Today's Schedule
              <ContextHelp text="Your scheduled activities for today, ranked chronologically and by priority." title="Today's Schedule" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {missionItems.length} activities planned · {(totalMissionMinutes / 60).toFixed(1)}h total
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 font-medium">
            <span>Completed: </span>
            <span className="text-[#3659C9] dark:text-[#4F73E3] font-bold font-mono">{completedMissionCount} / {missionItems.length}</span>
          </div>
        </div>

        {/* Mission Items List */}
        {missionItems.length > 0 ? (
          <div className="space-y-2">
            {missionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleMission(item.id)}
                className={`p-3 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                  item.completed
                    ? 'bg-slate-800/30 border-slate-800 text-slate-400'
                    : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button className="text-slate-400 hover:text-slate-200 shrink-0">
                    {item.completed ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </button>
                  <span className={`text-xs font-medium truncate ${item.completed ? 'line-through opacity-60 text-slate-400' : 'text-slate-100'}`}>
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">
                    {item.duration}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/30 border border-slate-800 rounded-lg p-8 text-center space-y-2">
            <Target className="w-6 h-6 text-slate-500 mx-auto" />
            <h4 className="text-xs font-semibold text-slate-300">No Activities Scheduled For Today</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Add activities to your calendar timetable to see your daily schedule here.
            </p>
          </div>
        )}
      </div>

      {/* ── GOAL-BASED OUTCOMES & AI COACH SNAPSHOT ── */}
      {/* ── GOAL-BASED OUTCOMES & AI COACH SNAPSHOT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals Card */}
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-slate-400" />
              <span>Goal Outcomes</span>
            </h3>
            <button
              onClick={() => onNavigate('goals')}
              className="text-xs text-[#3659C9] dark:text-[#4F73E3] hover:underline font-medium flex items-center gap-1"
            >
              All Goals <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {goals.length > 0 ? (
              goals.slice(0, 3).map((goal: Goal) => {
                const metrics = calculateGoalMetrics(goal, currentWeekScheduledBlocks);
                return (
                  <div key={goal.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-100 truncate">{goal.title}</span>
                      <span className="text-[#3659C9] dark:text-[#4F73E3] font-bold font-mono shrink-0">
                        {metrics.actualCurrentValue} / {metrics.targetValue} {metrics.unit} ({metrics.progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3659C9] dark:bg-[#4F73E3] rounded-full transition-all"
                        style={{ width: `${metrics.progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{metrics.remainingHours}h remaining</span>
                      <span className="text-slate-300 font-medium truncate max-w-[220px]">
                        {metrics.nextAction}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-5 rounded-lg bg-slate-800/30 border border-slate-800 text-center space-y-1">
                <Target className="w-5 h-5 text-slate-500 mx-auto" />
                <p className="text-xs font-medium text-slate-300">No Active Goals</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Create long-term objectives in Goal Planner to track your milestones.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Productivity Mentor Snapshot */}
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>Productivity Insights</span>
              </span>
            </div>

            {currentWeekScheduledBlocks.length > 0 ? (
              <>
                <h4 className="text-sm font-semibold text-white">
                  Peak Focus Window: {dna.peakFocusWindow}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your schedule contains {currentWeekScheduledBlocks.length} planned activities this week. Complete blocks consistently to refine your productivity curve.
                </p>
              </>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-white">
                  Awaiting Schedule Data
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Add activities to your calendar to unlock personalized insights into your peak focus hours and scheduling consistency.
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigate('ai-insights')}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View Detailed Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Empty State Guidance */}
      {currentWeekScheduledBlocks.length === 0 && (
        <EmptyStateGuidance onOpenAISchedule={() => onNavigate('calendar')} />
      )}

      {/* Optimizer Modal */}
      <ScheduleOptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
      />
    </div>
  );
};
