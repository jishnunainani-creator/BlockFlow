import React, { useState } from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { useTimetable } from '../../context/TimetableContext';
import { DailyExecutionScoreCard } from '../Execution/DailyExecutionScoreCard';
import { StreakCards } from '../Execution/StreakCards';
import { HabitCorrelationCard } from '../Execution/HabitCorrelationCard';
import { ImprovementSuggestions } from '../Execution/ImprovementSuggestions';
import { EndOfDayFlowModal } from '../Execution/EndOfDayFlowModal';
import MilestoneManager from '../Execution/MilestoneManager';
import ReportsTabView from '../Execution/ReportsTabView';
import ReflectionsTabView from '../Execution/ReflectionsTabView';
import { PlanVsRealityTab } from '../Execution/PlanVsRealityTab';
import { SessionJournalTab } from '../Execution/SessionJournalTab';
import { StudyHistoryTab } from '../Execution/StudyHistoryTab';
import {
  Brain,
  Moon,
  BarChart3,
  CalendarRange,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Flame,
  Trophy,
  Lightbulb,
  FileText,
  LayoutDashboard,
  Target,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

type EIActiveTab = 'overview' | 'reports' | 'milestones' | 'reflections' | 'plan_vs_reality' | 'session_journal' | 'study_history';

export const ExecutionDashboardView: React.FC = () => {
  const {
    todayScore,
    streaks,
    habitCorrelations,
    improvementSuggestions,
    performanceSummary,
    reflectionInsights,
    dailyScores,
  } = useExecution();

  const [activeTab, setActiveTab] = useState<EIActiveTab>('overview');
  const [showEndOfDay, setShowEndOfDay] = useState(false);

  // Calculate weekly trend
  const recentScores = Object.values(dailyScores)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  const weeklyAvg =
    recentScores.length > 0
      ? Math.round(recentScores.reduce((s, d) => s + d.overallScore, 0) / recentScores.length)
      : 0;

  // Monthly trend
  const monthScores = Object.values(dailyScores).filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyAvg =
    monthScores.length > 0
      ? Math.round(monthScores.reduce((s, d) => s + d.overallScore, 0) / monthScores.length)
      : 0;

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 space-y-6 select-none scrollbar-thin">
        {/* ── HEADER & NAVIGATION TABS ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Execution Intelligence
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  OS
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Productivity command center &amp; career milestones
              </p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start lg:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard size={14} /> Overview
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BarChart3 size={14} /> Reports
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'milestones'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Trophy size={14} /> Milestones
            </button>

            <button
              onClick={() => setActiveTab('reflections')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'reflections'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText size={14} /> Reflections
            </button>

            <button
              onClick={() => setActiveTab('plan_vs_reality')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'plan_vs_reality'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Target size={14} /> Plan vs Reality
            </button>

            <button
              onClick={() => setActiveTab('session_journal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'session_journal'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BookOpen size={14} /> Session Journal
            </button>

            <button
              onClick={() => setActiveTab('study_history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'study_history'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <GraduationCap size={14} /> Study History
            </button>
          </div>

          {/* Primary Quick Action Button */}
          {activeTab === 'overview' && (
            <button
              onClick={() => setShowEndOfDay(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all shrink-0"
            >
              <Moon className="w-4 h-4" />
              <span>End My Day</span>
            </button>
          )}
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* ROW 1: Score + Weekly Trend + Monthly Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Daily Execution Score */}
              <div className="lg:col-span-1">
                <DailyExecutionScoreCard score={todayScore} />
              </div>

              {/* Weekly Trend */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    Weekly Execution Trend
                  </span>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    View Reports <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-3xl font-black text-white">
                  {weeklyAvg}
                  <span className="text-lg text-slate-500">%</span>
                </div>
                <div className="flex items-end gap-1.5 h-16 pt-2">
                  {recentScores.reverse().map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${Math.max(6, (s.overallScore / 100) * 48)}px`,
                          backgroundColor:
                            s.overallScore >= 80
                              ? '#10B981'
                              : s.overallScore >= 60
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      />
                      <span className="text-[9px] font-mono text-slate-400">{s.date.slice(-2)}</span>
                    </div>
                  ))}
                  {recentScores.length === 0 && (
                    <p className="text-xs text-slate-500 w-full text-center py-4">No data yet</p>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">7-day execution average</p>
              </div>

              {/* Monthly Trend */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CalendarRange className="w-3.5 h-3.5 text-purple-400" />
                    Monthly Consistency
                  </span>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    View Reports <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-3xl font-black text-white">
                  {monthlyAvg}
                  <span className="text-lg text-slate-500">%</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${monthlyAvg}%`,
                        backgroundColor:
                          monthlyAvg >= 80 ? '#10B981' : monthlyAvg >= 60 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300">{monthScores.length}d</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">{monthScores.length} days tracked this month</p>
              </div>
            </div>

            {/* ROW 2: AI Performance Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/30 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Execution Insight &amp; Summary
              </span>
              {performanceSummary.length > 0 ? (
                <ul className="space-y-2">
                  {performanceSummary.map((s, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5 shrink-0">▸</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Complete your scheduled activities today to activate live AI performance synthesis.
                </p>
              )}
              {reflectionInsights.length > 0 && (
                <div className="mt-3 pt-3 border-t border-indigo-500/20">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Reflection Insights
                  </span>
                  <ul className="mt-2 space-y-1.5">
                    {reflectionInsights.slice(0, 3).map((insight, i) => (
                      <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ROW 3: Streaks + Habit Correlations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Productivity Streaks
                </span>
                <StreakCards streaks={streaks} />
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  Habit Correlations
                </span>
                <HabitCorrelationCard correlations={habitCorrelations} />
              </div>
            </div>

            {/* ROW 4: AI Suggestions */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Improvement Suggestions
              </span>
              <ImprovementSuggestions suggestions={improvementSuggestions} />
            </div>
          </div>
        )}

        {/* ── TAB 2: REPORTS ── */}
        {activeTab === 'reports' && <ReportsTabView />}

        {/* ── TAB 3: MILESTONES ── */}
        {activeTab === 'milestones' && <MilestoneManager />}

        {/* ── TAB 4: REFLECTIONS ── */}
        {activeTab === 'reflections' && <ReflectionsTabView />}

        {/* ── TAB 5: PLAN VS REALITY ── */}
        {activeTab === 'plan_vs_reality' && <PlanVsRealityTab />}

        {/* ── TAB 6: SESSION JOURNAL ── */}
        {activeTab === 'session_journal' && <SessionJournalTab />}

        {/* ── TAB 7: STUDY HISTORY ── */}
        {activeTab === 'study_history' && <StudyHistoryTab />}
      </div>

      {/* End of Day Modal */}
      <EndOfDayFlowModal isOpen={showEndOfDay} onClose={() => setShowEndOfDay(false)} />
    </>
  );
};
