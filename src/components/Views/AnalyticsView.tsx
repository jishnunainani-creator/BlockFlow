import React, { useMemo, useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { PRIORITY_CONFIG, Priority } from '../../types/timetable';
import { formatDuration, DAYS_OF_WEEK } from '../../utils/timeUtils';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  BookOpen,
  Briefcase,
  AlertOctagon,
  Target,
  Award,
  TrendingUp,
  CalendarRange,
} from 'lucide-react';
import ProductivityHeatmap from '../Analytics/ProductivityHeatmap';
import LifeBalanceMeter from '../Analytics/LifeBalanceMeter';
import { WeeklyReviewSection } from '../Analytics/WeeklyReviewSection';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';

interface AnalyticsViewProps {
  onNavigate?: (view: NavView) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onNavigate }) => {
  const { currentWeekScheduledBlocks, currentWeekId } = useTimetable();
  const [activeTab, setActiveTab] = useState<'review' | 'overview'>('review');

  const {
    totalMinutes,
    studyMinutes,
    workMinutes,
    completedBlocks,
    missedBlocks,
    completionRate,
    productivityScore,
    focusScore,
    dailyTotals,
    maxDailyMinutes,
  } = useMemo(() => {
    const totalMins = currentWeekScheduledBlocks.reduce((acc, b) => acc + b.duration, 0);

    const studyMins = currentWeekScheduledBlocks
      .filter((b) => b.priority === 'high' || b.priority === 'Study' || b.title.toLowerCase().includes('dsa') || b.title.toLowerCase().includes('study'))
      .reduce((acc, b) => acc + b.duration, 0);

    const workMins = currentWeekScheduledBlocks
      .filter((b) => b.priority === 'medium' || b.priority === 'Work' || b.title.toLowerCase().includes('work') || b.title.toLowerCase().includes('internship'))
      .reduce((acc, b) => acc + b.duration, 0);

    const completed = currentWeekScheduledBlocks.filter((b) => b.status === 'completed' || b.status === 'faster');
    const missed = currentWeekScheduledBlocks.filter((b) => b.status === 'missed');
    
    const rate = currentWeekScheduledBlocks.length > 0
      ? Math.round((completed.length / currentWeekScheduledBlocks.length) * 100)
      : 0;

    const prodScore = Math.min(100, Math.round(rate * 0.8 + (studyMins > 300 ? 20 : 10)));
    const focScore = Math.min(100, Math.round(85 + (completed.length > 3 ? 10 : 0) - missed.length * 5));

    const totals = DAYS_OF_WEEK.map((day) => {
      const minutes = currentWeekScheduledBlocks
        .filter((b) => b.dayOfWeek === day.index)
        .reduce((acc, b) => acc + b.duration, 0);
      return {
        day: day.short,
        minutes,
        hours: (minutes / 60).toFixed(1),
      };
    });

    const maxMins = Math.max(...totals.map((d) => d.minutes), 60);

    return {
      totalMinutes: totalMins,
      studyMinutes: studyMins,
      workMinutes: workMins,
      completedBlocks: completed,
      missedBlocks: missed,
      completionRate: rate,
      productivityScore: prodScore,
      focusScore: focScore,
      dailyTotals: totals,
      maxDailyMinutes: maxMins,
    };
  }, [currentWeekScheduledBlocks]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-5 select-none scrollbar-thin">
      {/* ── BREADCRUMB ── */}
      {onNavigate && (
        <PageBreadcrumb
          items={[{ label: 'Productivity Analytics' }]}
          onNavigate={onNavigate}
        />
      )}

      {/* Header Bar with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Productivity Analytics & Review</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Weekly execution review, planned vs actual adherence, and reflection insights ({currentWeekId})
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'review'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarRange size={14} />
            <span>Weekly Review</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            <span>Workload Overview</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Weekly Review */}
      {activeTab === 'review' && (
        <WeeklyReviewSection onNavigate={onNavigate} />
      )}

      {/* Tab 2: Workload Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fade-in">
          {/* 6 Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Study Hours</span>
                <BookOpen className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-black text-white">{(studyMinutes / 60).toFixed(1)}h</div>
              <p className="text-[10px] text-slate-500">{studyMinutes} mins study</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Work Hours</span>
                <Briefcase className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-white">{(workMinutes / 60).toFixed(1)}h</div>
              <p className="text-[10px] text-slate-500">{workMinutes} mins work</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Completion Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-white">{completionRate}%</div>
              <p className="text-[10px] text-slate-500">{completedBlocks.length} completed</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Productivity Score</span>
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-white">{productivityScore} / 100</div>
              <p className="text-[10px] text-slate-500">Schedule adherence</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Focus Score</span>
                <Award className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-black text-white">{focusScore} / 100</div>
              <p className="text-[10px] text-slate-500">Deep work consistency</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-semibold uppercase tracking-wider">Missed Sessions</span>
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-black text-white">{missedBlocks.length}</div>
              <p className="text-[10px] text-slate-500">Overdue activities</p>
            </div>
          </div>

          {/* Daily Workload Chart */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Daily Workload Overview</span>
            </h4>

            <div className="grid grid-cols-7 gap-3 items-end h-36 pt-2">
              {dailyTotals.map((d) => {
                const heightPct = maxDailyMinutes > 0 ? (d.minutes / maxDailyMinutes) * 100 : 0;
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400">{d.minutes > 0 ? `${d.hours}h` : ''}</span>
                    <div className="w-full bg-slate-950 rounded-lg overflow-hidden h-full flex flex-col justify-end border border-slate-800">
                      <div
                        style={{ height: `${Math.max(6, heightPct)}%` }}
                        className="w-full bg-indigo-600 rounded-t transition-all duration-300"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── PRODUCTIVITY HEATMAP (Feature 85) ── */}
          <ProductivityHeatmap />

          {/* ── LIFE BALANCE METER (Feature 86) ── */}
          <LifeBalanceMeter />
        </div>
      )}
    </div>
  );
};
