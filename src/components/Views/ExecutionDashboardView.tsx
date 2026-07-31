import React, { useState } from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { useTimetable } from '../../context/TimetableContext';
import { DailyExecutionScoreCard } from '../Execution/DailyExecutionScoreCard';
import { MoodTracker } from '../Execution/MoodTracker';
import { MoodGraph } from '../Execution/MoodGraph';
import { StreakCards } from '../Execution/StreakCards';
import { AchievementTimeline } from '../Execution/AchievementTimeline';
import { HabitCorrelationCard } from '../Execution/HabitCorrelationCard';
import { ImprovementSuggestions } from '../Execution/ImprovementSuggestions';
import { DailyReflectionModal } from '../Execution/DailyReflectionModal';
import { EndOfDayFlowModal } from '../Execution/EndOfDayFlowModal';
import { WeeklyExecutionReportModal } from '../Execution/WeeklyExecutionReportModal';
import { MonthlyReportModal } from '../Execution/MonthlyReportModal';
import WeeklyAIReviewModal from '../Execution/WeeklyAIReviewModal';
import FutureMeModal from '../Execution/FutureMeModal';
import ProfessionalAchievementTimeline from '../Execution/ProfessionalAchievementTimeline';
import {
  Brain,
  Moon,
  FileText,
  BarChart3,
  CalendarRange,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Flame,
  Trophy,
  Lightbulb,
  Heart,
  Mail,
} from 'lucide-react';

export const ExecutionDashboardView: React.FC = () => {
  const {
    todayScore,
    todayMood,
    todayReflection,
    moods,
    streaks,
    achievements,
    habitCorrelations,
    improvementSuggestions,
    performanceSummary,
    reflectionInsights,
    saveMood,
    dailyScores,
  } = useExecution();
  const { currentWeekId } = useTimetable();

  const [showReflection, setShowReflection] = useState(false);
  const [showEndOfDay, setShowEndOfDay] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [showFutureMe, setShowFutureMe] = useState(false);
  const [showWeeklyAIReview, setShowWeeklyAIReview] = useState(false);

  // Calculate weekly trend
  const recentScores = Object.values(dailyScores)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  const weeklyAvg = recentScores.length > 0
    ? Math.round(recentScores.reduce((s, d) => s + d.overallScore, 0) / recentScores.length)
    : 0;

  // Monthly trend
  const monthScores = Object.values(dailyScores)
    .filter((s) => {
      const d = new Date(s.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  const monthlyAvg = monthScores.length > 0
    ? Math.round(monthScores.reduce((s, d) => s + d.overallScore, 0) / monthScores.length)
    : 0;

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 space-y-6 select-none scrollbar-thin">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Execution Intelligence
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Growth
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Your personal productivity command center
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFutureMe(true)}
            className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Future Me Time Capsule</span>
          </button>

          <button
            onClick={() => setShowWeeklyAIReview(true)}
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Sunday AI Review</span>
          </button>

          <button
            onClick={() => setShowReflection(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Log Reflection</span>
          </button>

          <button
            onClick={() => setShowEndOfDay(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Moon className="w-4 h-4" />
            <span>End My Day</span>
          </button>
        </div>
        </div>

        {/* ── ROW 1: Score + Weekly Trend + Monthly Trend ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily Execution Score */}
          <div className="lg:col-span-1">
            <DailyExecutionScoreCard score={todayScore} />
          </div>

          {/* Weekly Trend */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                Weekly Trend
              </span>
              <button
                onClick={() => setShowWeeklyReport(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                Full Report <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="text-3xl font-black text-white">{weeklyAvg}<span className="text-lg text-slate-500">%</span></div>
            <div className="flex items-end gap-1 h-16">
              {recentScores.reverse().map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(4, (s.overallScore / 100) * 48)}px`,
                      backgroundColor: s.overallScore >= 80 ? '#10B981' : s.overallScore >= 60 ? '#F59E0B' : '#EF4444',
                      opacity: 0.8,
                    }}
                  />
                  <span className="text-[8px] text-slate-500">{s.date.slice(-2)}</span>
                </div>
              ))}
              {recentScores.length === 0 && (
                <p className="text-xs text-slate-500 w-full text-center py-4">No data yet</p>
              )}
            </div>
            <p className="text-[10px] text-slate-500">Last 7 days average</p>
          </div>

          {/* Monthly Trend */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-purple-400" />
                Monthly Trend
              </span>
              <button
                onClick={() => setShowMonthlyReport(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                Full Report <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="text-3xl font-black text-white">{monthlyAvg}<span className="text-lg text-slate-500">%</span></div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${monthlyAvg}%`,
                    backgroundColor: monthlyAvg >= 80 ? '#10B981' : monthlyAvg >= 60 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <span className="text-xs font-bold text-slate-400">{monthScores.length}d</span>
            </div>
            <p className="text-[10px] text-slate-500">{monthScores.length} days tracked this month</p>
          </div>
        </div>

        {/* ── ROW 2: Mood + AI Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today's Mood + Mood Graph */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                Today's Mood
              </span>
              {todayMood && (
                <span className="text-xs text-slate-500">Recorded ✓</span>
              )}
            </div>
            {!todayMood ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">How are you feeling today?</p>
                <MoodTracker onSelectMood={saveMood} />
              </div>
            ) : (
              <MoodGraph moods={moods} days={7} />
            )}
          </div>

          {/* AI Performance Summary */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/30 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Performance Summary
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
              <p className="text-xs text-slate-500 italic">
                Complete some activities today to see your AI-generated performance analysis.
              </p>
            )}
            {reflectionInsights.length > 0 && (
              <div className="mt-3 pt-3 border-t border-indigo-500/20">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Reflection Insights</span>
                <ul className="mt-2 space-y-1.5">
                  {reflectionInsights.slice(0, 3).map((insight, i) => (
                    <li key={i} className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                      <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 3: Streaks + Habit Correlations ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Streaks */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Productivity Streaks
              </span>
            </div>
            <StreakCards streaks={streaks} />
          </div>

          {/* Habit Correlations */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                Habit Correlations
              </span>
            </div>
            <HabitCorrelationCard correlations={habitCorrelations} />
          </div>
        </div>

        {/* ── ROW 4: AI Suggestions ── */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Improvement Suggestions
            </span>
          </div>
          <ImprovementSuggestions suggestions={improvementSuggestions} />
        </div>

        {/* ── ROW 5: Achievement Timeline ── */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Achievement Timeline
            </span>
            <span className="text-[10px] text-slate-500">{achievements.length} earned</span>
          </div>
          <AchievementTimeline achievements={achievements} />
        </div>

        {/* ── QUICK ACTION BUTTONS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4">
          <button
            onClick={() => setShowEndOfDay(true)}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all text-center space-y-2 group"
          >
            <Moon className="w-5 h-5 text-indigo-400 mx-auto group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">End My Day</span>
          </button>
          <button
            onClick={() => setShowReflection(true)}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all text-center space-y-2 group"
          >
            <FileText className="w-5 h-5 text-purple-400 mx-auto group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">Write Reflection</span>
          </button>
          <button
            onClick={() => setShowWeeklyReport(true)}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all text-center space-y-2 group"
          >
            <BarChart3 className="w-5 h-5 text-blue-400 mx-auto group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">Weekly Report</span>
          </button>
          <button
            onClick={() => setShowMonthlyReport(true)}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all text-center space-y-2 group"
          >
            <CalendarRange className="w-5 h-5 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block">Monthly Report</span>
          </button>
        </div>
      </div>

      {/* ── PROFESSIONAL ACHIEVEMENTS TIMELINE (Feature 90) ── */}
      <ProfessionalAchievementTimeline />

      {/* Modals */}
      <DailyReflectionModal isOpen={showReflection} onClose={() => setShowReflection(false)} />
      <EndOfDayFlowModal isOpen={showEndOfDay} onClose={() => setShowEndOfDay(false)} />
      <WeeklyExecutionReportModal isOpen={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} weekId={currentWeekId} />
      <MonthlyReportModal isOpen={showMonthlyReport} onClose={() => setShowMonthlyReport(false)} month={currentMonth} />
      <FutureMeModal isOpen={showFutureMe} onClose={() => setShowFutureMe(false)} />
      <WeeklyAIReviewModal isOpen={showWeeklyAIReview} onClose={() => setShowWeeklyAIReview(false)} />
    </>
  );
};
