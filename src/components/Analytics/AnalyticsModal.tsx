import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { PRIORITY_CONFIG, Priority } from '../../types/timetable';
import { formatDuration, DAYS_OF_WEEK } from '../../utils/timeUtils';
import {
  X,
  PieChart,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  Award,
} from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const { currentWeekScheduledBlocks, libraryBlocks, currentWeekId } = useTimetable();

  if (!isOpen) return null;

  // Total scheduled duration in minutes
  const totalMinutes = currentWeekScheduledBlocks.reduce((acc, b) => acc + b.duration, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Workload by Priority
  const priorityTotals: Record<Priority, number> = {
    high: 0,
    medium: 0,
    low: 0,
    personal: 0,
    meetings: 0,
    custom: 0,
  };

  currentWeekScheduledBlocks.forEach((b) => {
    priorityTotals[b.priority] = (priorityTotals[b.priority] || 0) + b.duration;
  });

  // Workload by Activity Block
  const blockTotals: Record<string, { title: string; duration: number; color: string; icon: string }> = {};
  currentWeekScheduledBlocks.forEach((b) => {
    if (!blockTotals[b.title]) {
      blockTotals[b.title] = { title: b.title, duration: 0, color: b.color, icon: b.icon };
    }
    blockTotals[b.title].duration += b.duration;
  });

  const sortedActivities = Object.values(blockTotals).sort((a, b) => b.duration - a.duration);

  // Daily distribution (Mon-Sun)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Productivity Analytics</h3>
              <p className="text-xs text-slate-400">Weekly workload breakdown & stats ({currentWeekId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Hours</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white">{totalHours}h</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{currentWeekScheduledBlocks.length} activities scheduled</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">High Priority</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-white">
                  {(priorityTotals.high / 60).toFixed(1)}h
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {totalMinutes > 0 ? Math.round((priorityTotals.high / totalMinutes) * 100) : 0}% of weekly schedule
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Focus</span>
                <Award className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <span className="text-sm font-bold text-white truncate block">
                  {sortedActivities[0]?.title || 'None'}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {sortedActivities[0] ? formatDuration(sortedActivities[0].duration) : '0m'}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Workload Chart (Bar graph) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Daily Workload Distribution</span>
              </h4>
            </div>

            <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4">
              {dailyTotals.map((d) => {
                const heightPct = maxDailyMinutes > 0 ? (d.minutes / maxDailyMinutes) * 100 : 0;
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-300">{d.minutes > 0 ? `${d.hours}h` : ''}</span>
                    <div className="w-full bg-slate-800 rounded-lg overflow-hidden h-full flex flex-col justify-end">
                      <div
                        style={{ height: `${Math.max(5, heightPct)}%` }}
                        className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg transition-all duration-500"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Priority & Workload Allocation</span>
            </h4>

            <div className="space-y-2.5">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((key) => {
                const dur = priorityTotals[key] || 0;
                const pct = totalMinutes > 0 ? Math.round((dur / totalMinutes) * 100) : 0;
                const cfg = PRIORITY_CONFIG[key];

                if (dur === 0) return null;

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{cfg.badge}</span>
                        <span className="text-slate-200">{cfg.label}</span>
                      </div>
                      <span className="text-slate-400">
                        {formatDuration(dur)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cfg.defaultColor,
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Activity Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Activity Ranking
            </h4>

            <div className="space-y-2">
              {sortedActivities.map((act, idx) => (
                <div
                  key={act.title}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: act.color }} />
                    <span className="font-bold text-white">{act.title}</span>
                  </div>
                  <span className="font-semibold text-slate-300">{formatDuration(act.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
