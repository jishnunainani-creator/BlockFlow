import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { NavView } from '../Navigation/Sidebar';
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
import TimeBudgetWidget from '../Analytics/TimeBudgetWidget';
import ScheduleOptimizerModal from '../AI/ScheduleOptimizerModal';

interface DashboardViewProps {
  onNavigate: (view: NavView) => void;
  userEmail?: string | null;
  onStartFocusMode?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  userEmail,
  onStartFocusMode,
}) => {
  const { currentWeekScheduledBlocks, addToast } = useTimetable();
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);

  const userName = userEmail ? userEmail.split('@')[0] : 'Jishnu';

  // Today's index
  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayBlocks = currentWeekScheduledBlocks
    .filter((b) => b.dayOfWeek === todayIndex)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // Execution Score
  const execScore = calculateExecutionScore(currentWeekScheduledBlocks);
  const dna = getProductivityDNA();

  // Signature Feature: Daily Mission State
  const [missionItems, setMissionItems] = useState([
    { id: 'm1', title: 'Complete Dynamic Programming Graph Sheet', duration: 120, probability: 91, completed: true },
    { id: 'm2', title: 'Finish Internship API Integration Sprint', duration: 90, probability: 88, completed: false },
    { id: 'm3', title: 'Operating Systems Chapter 4 Revision', duration: 60, probability: 84, completed: false },
    { id: 'm4', title: 'Exercise & Core Workout Session', duration: 45, probability: 96, completed: true },
  ]);

  const [adaptiveBannerOpen, setAdaptiveBannerOpen] = useState(true);

  const toggleMission = (id: string) => {
    setMissionItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.completed;
          if (next) addToast(`Completed mission item: "${item.title}"! 🎯`, 'success');
          return { ...item, completed: next };
        }
        return item;
      })
    );
  };

  const completedMissionCount = missionItems.filter((i) => i.completed).length;
  const totalMissionMinutes = missionItems.reduce((acc, i) => acc + i.duration, 0);

  const handleAcceptAdaptiveAdjustment = () => {
    addToast('Schedule automatically adjusted! Execution Score improved by 11% ✨', 'success');
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
      <TimeBudgetWidget />

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
                  <span>Probability: {item.probability}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Crack CAT Examination</span>
                <span className="text-purple-400 font-bold">42% Progress</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-purple-500 rounded-full w-[42%]" />
              </div>
              <p className="text-[10px] text-slate-400">Deadline: November 2026 · Required Study: 2.0h/day</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Launch BlockFlow SaaS Platform</span>
                <span className="text-emerald-400 font-bold">65% Progress</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-emerald-500 rounded-full w-[65%]" />
              </div>
              <p className="text-[10px] text-slate-400">Deadline: August 2026 · Target Hours: 3.5h/day</p>
            </div>
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

            <h4 className="text-sm font-bold text-white">
              Habit Insight: Post-Dinner Fatigue Drop
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              "You consistently skip coding and reading sessions scheduled after 9 PM. Consider scheduling these High-Priority tasks immediately after lunch (2 PM – 4 PM) for 96% completion consistency."
            </p>
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
