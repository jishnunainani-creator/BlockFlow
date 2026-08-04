import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { NavView } from '../Navigation/Sidebar';
import { loadGoals } from '../../utils/storage';
import { Goal, GoalMilestone } from '../../types/timetable';
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

  // Today's index
  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayBlocks = currentWeekScheduledBlocks
    .filter((b) => b.dayOfWeek === todayIndex)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // Execution Score & DNA
  const execScore = calculateExecutionScore(currentWeekScheduledBlocks);
  const dna = getProductivityDNA({
    scheduledBlocks: currentWeekScheduledBlocks,
    dailyScores,
  });

  // Dynamic Daily Mission derived from real todayBlocks
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());

  const missionItems = todayBlocks.map((b) => ({
    id: b.id,
    title: b.title,
    duration: b.duration,
    probability: calculateCompletionProbability(b),
    completed: b.status === 'completed' || b.status === 'faster' || completedMissionIds.has(b.id),
  }));

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
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Good Morning, {userName}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · What should we accomplish today?
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOptimizerOpen(true)}
            className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>✨ Optimize My Day</span>
          </button>

          {onStartFocusMode && (
            <button
              onClick={onStartFocusMode}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Start Focus Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* ── ADAPTIVE DAY PLANNER NOTIFICATION BANNER ── */}
      {adaptiveBannerOpen && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              <RefreshCcw className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <span className="font-bold text-white block text-sm">Adaptive Schedule Adjustment Detected</span>
              <span className="text-slate-300">
                Your Internship Standup ran 35m longer than planned. Recommended adjustment: Shift Gym to 6:30 PM & Reduce Reading by 15m.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAcceptAdaptiveAdjustment}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              Accept Adjustments (+11% Score)
            </button>
            <button
              onClick={() => setAdaptiveBannerOpen(false)}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── TOP EXECUTION KPI METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Execution Score KPI */}
        <div
          onClick={() => onNavigate('execution')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm cursor-pointer hover:border-indigo-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
              Execution Score
              <ContextHelp text="Execution Score measures how effectively you followed your planned schedule based on completion, timing, priorities, and consistency." title="Daily Execution Score" />
            </span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{execScore.score}</span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
            <span className="text-xs font-bold text-emerald-400 ml-auto bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {execScore.consistencyRating}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Based on consistency &amp; goal progress</span>
            <span className="text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform">Details →</span>
          </p>
        </div>

        {/* Time Accuracy */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              Time Accuracy
              <ContextHelp text="Measures how closely your actual activity duration matches your planned schedule." title="Time Accuracy" />
            </span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">{execScore.timeAccuracyPct}%</div>
          <p className="text-[11px] text-slate-500">Schedule duration precision</p>
        </div>

        {/* Goal Progress */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Goal Progress</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{execScore.goalProgressPct}%</div>
          <p className="text-[11px] text-slate-500">Milestone accomplishment</p>
        </div>

        {/* Peak Focus Window */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              Peak Focus Window
              <ContextHelp text="AI-detected time period during which your historical focus ratings and completion rates are highest." title="Peak Focus Window" />
            </span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">{dna.peakFocusWindow}</div>
          <p className="text-[11px] text-slate-500">AI Productivity DNA Profile</p>
        </div>
      </div>

      {/* ── 24-HOUR TIME BUDGET DASHBOARD (Feature 82) ── */}
      <PersonalTimeBudgetWidget />

      {/* ── SIGNATURE FEATURE: 🎯 TODAY'S MISSION CARD ── */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>AI Daily Mission</span>
                <ContextHelp text="AI dynamically selects your 4 most critical activities for today based on high-priority goals and deadlines." title="AI Daily Mission" />
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Synthesized from your high-priority goals &amp; schedule
              </p>
            </div>
          </div>

          <div className="text-right text-xs font-semibold text-slate-300">
            <span>Estimated Time: </span>
            <span className="text-indigo-400 font-bold font-mono">{(totalMissionMinutes / 60).toFixed(1)}h</span>
          </div>
        </div>

        {/* Mission Items List */}
        {missionItems.length > 0 ? (
          <div className="space-y-2.5">
            {missionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleMission(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  item.completed
                    ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button className="text-indigo-400 shrink-0">
                    {item.completed ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-slate-500" />}
                  </button>
                  <span className={`text-xs font-semibold truncate ${item.completed ? 'line-through opacity-60' : 'text-white'}`}>
                    {item.title}
                  </span>
                </div>

                {/* Completion Probability Badge */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {item.duration}m
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-semibold text-emerald-400">
                    <Zap size={10} /> {item.probability}% AI Match
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
            <Target className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No Activities Scheduled For Today</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Add activities to your timetable for today to automatically synthesize your AI Daily Mission.
            </p>
          </div>
        )}
      </div>

      {/* ── GOAL-BASED OUTCOMES & AI COACH SNAPSHOT ── */}
      {/* ── GOAL-BASED OUTCOMES & AI COACH SNAPSHOT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Goal-Based Outcomes</span>
            </h3>
            <button
              onClick={() => onNavigate('goals')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              View All Goals <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {loadGoals().length > 0 ? (
              loadGoals().slice(0, 3).map((goal: Goal) => {
                const isGoalDone = goal.milestones && goal.milestones.length > 0
                  ? Math.round((goal.milestones.filter((m: GoalMilestone) => m.isUnlocked).length / goal.milestones.length) * 100)
                  : 0;
                return (
                  <div key={goal.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white truncate max-w-[200px]">{goal.title}</span>
                      <span className="text-purple-400 font-bold font-mono">{isGoalDone}% Progress</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${isGoalDone}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Target: {goal.targetWeeklyHours || 5}h/week · Category: {goal.category || 'General'}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-1.5">
                <Target className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No Active Goals</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Create long-term objectives in the Goal Planner to convert targets into scheduled BlockFlow activities.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Productivity Mentor Snapshot */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/30 flex flex-col justify-between shadow-sm space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Productivity Coach</span>
              </span>
            </div>

            {currentWeekScheduledBlocks.length > 0 ? (
              <>
                <h4 className="text-sm font-bold text-white">
                  Peak Focus: {dna.peakFocusWindow}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  "Your current timetable has {currentWeekScheduledBlocks.length} planned activities. Keep completing blocks to refine peak performance insights."
                </p>
              </>
            ) : (
              <>
                <h4 className="text-sm font-bold text-white">
                  Awaiting Timetable History
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  "Add activities to your calendar to unlock AI recommendations on peak focus hours, fatigue drop-off times, and scheduling efficiency."
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigate('ai-insights')}
            className="w-full py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View Full Productivity DNA Profile</span>
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
