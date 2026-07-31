import React from 'react';
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
} from 'lucide-react';
import ProductivityHeatmap from '../Analytics/ProductivityHeatmap';
import LifeBalanceMeter from '../Analytics/LifeBalanceMeter';

export const AnalyticsView: React.FC = () => {
  const { currentWeekScheduledBlocks, currentWeekId } = useTimetable();

  const totalMinutes = currentWeekScheduledBlocks.reduce((acc, b) => acc + b.duration, 0);

  const studyMinutes = currentWeekScheduledBlocks
    .filter((b) => b.priority === 'high' || b.priority === 'Study' || b.title.toLowerCase().includes('dsa') || b.title.toLowerCase().includes('study'))
    .reduce((acc, b) => acc + b.duration, 0);

  const workMinutes = currentWeekScheduledBlocks
    .filter((b) => b.priority === 'medium' || b.priority === 'Work' || b.title.toLowerCase().includes('work') || b.title.toLowerCase().includes('internship'))
    .reduce((acc, b) => acc + b.duration, 0);

  const completedBlocks = currentWeekScheduledBlocks.filter((b) => b.status === 'completed' || b.status === 'faster');
  const missedBlocks = currentWeekScheduledBlocks.filter((b) => b.status === 'missed');
  
  const completionRate = currentWeekScheduledBlocks.length > 0
    ? Math.round((completedBlocks.length / currentWeekScheduledBlocks.length) * 100)
    : 0;

  const productivityScore = Math.min(100, Math.round(completionRate * 0.8 + (studyMinutes > 300 ? 20 : 10)));
  const focusScore = Math.min(100, Math.round(85 + (completedBlocks.length > 3 ? 10 : 0) - missedBlocks.length * 5));

  const dailyTotals = DAYS_OF_WEEK.map((day) => {
    const minutes = currentWeekScheduledBlocks
      .filter((b) => b.dayOfWeek === day.index)
      .reduce((acc, b) => acc + b.duration, 0);
    return {
      day: day.short,
      minutes,
      hours: (minutes / 60).toFixed(1),
    };
  });

  const maxDailyMinutes = Math.max(...dailyTotals.map((d) => d.minutes), 60);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Productivity Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Weekly performance, focus scores, and workload metrics ({currentWeekId})
          </p>
        </div>
      </div>

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
  );
};
