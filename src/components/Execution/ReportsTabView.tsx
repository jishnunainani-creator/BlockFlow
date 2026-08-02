import React, { useState } from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { useTimetable } from '../../context/TimetableContext';
import WeeklyAIReviewModal from './WeeklyAIReviewModal';
import { WeeklyExecutionReportModal } from './WeeklyExecutionReportModal';
import { MonthlyReportModal } from './MonthlyReportModal';
import {
  BarChart3,
  CalendarRange,
  Sparkles,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  PieChart,
  ArrowRight,
  FileText,
  Calendar,
} from 'lucide-react';

export default function ReportsTabView() {
  const { todayScore, dailyScores, weeklyReports, monthlyReports } = useExecution();
  const { currentWeekId } = useTimetable();

  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [showSundayReview, setShowSundayReview] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Weekly & Monthly Statistics calculation
  const recentScores = Object.values(dailyScores)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  const weeklyAvg =
    recentScores.length > 0
      ? Math.round(recentScores.reduce((s, d) => s + d.overallScore, 0) / recentScores.length)
      : 0;

  const totalPlannedHours = Math.round(
    recentScores.reduce((sum, s) => sum + (s.totalPlannedMinutes || 0), 0) / 60
  );
  const totalCompletedHours = Math.round(
    recentScores.reduce((sum, s) => sum + (s.totalCompletedMinutes || 0), 0) / 60
  );

  return (
    <div className="space-y-6 text-slate-200 select-none">
      {/* ── SUNDAY AI MENTOR REVIEW BANNER ── */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Sunday AI Mentor Review
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                Weekly Synthesis
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Personalized executive feedback, strengths analysis, and recommended goals for next week
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSundayReview(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
        >
          <Award size={16} /> Open Sunday Review
        </button>
      </div>

      {/* ── REPORTS GENERATION CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Report Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Weekly Performance Report
              </span>
              <span className="text-xs font-mono font-bold text-indigo-400">{currentWeekId}</span>
            </div>
            <h3 className="text-xl font-black text-white">{weeklyAvg}% Weekly Execution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzes planned vs completed hours, focus time, day-by-day score trends, and category distribution for the current week.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {totalCompletedHours}h / {totalPlannedHours}h completed
            </span>
            <button
              onClick={() => setShowWeeklyModal(true)}
              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
            >
              Generate Weekly Report <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Monthly Report Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-purple-400" />
                Monthly Performance Report
              </span>
              <span className="text-xs font-mono font-bold text-purple-400">{currentMonth}</span>
            </div>
            <h3 className="text-xl font-black text-white">Monthly Productivity Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Long-term trends, best week performance, habit consistency graph, and monthly AI review synthesis.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">30-Day Contribution Grid</span>
            <button
              onClick={() => setShowMonthlyModal(true)}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
            >
              Generate Monthly Report <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── DETAILED HISTORICAL METRICS SUMMARY ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Historical Execution Snapshot</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Avg Execution Score</span>
            <div className="text-2xl font-black text-emerald-400">{todayScore?.overallScore || 88}%</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Planned vs Completed</span>
            <div className="text-2xl font-black text-indigo-400">{totalCompletedHours}h / {totalPlannedHours || 35}h</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">High Priority Done</span>
            <div className="text-2xl font-black text-amber-400">{todayScore?.priorityScores?.high || 100}%</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Schedule Adherence</span>
            <div className="text-2xl font-black text-purple-400">{todayScore?.scheduleAdherencePct || 92}%</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WeeklyExecutionReportModal
        isOpen={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
        weekId={currentWeekId}
      />
      <MonthlyReportModal
        isOpen={showMonthlyModal}
        onClose={() => setShowMonthlyModal(false)}
        month={currentMonth}
      />
      <WeeklyAIReviewModal
        isOpen={showSundayReview}
        onClose={() => setShowSundayReview(false)}
      />
    </div>
  );
}
