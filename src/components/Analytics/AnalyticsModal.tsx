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
  BookOpen,
  Briefcase,
  AlertOctagon,
  Target,
  Activity,
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

  // Study & Work Hours
  const studyMinutes = currentWeekScheduledBlocks
    .filter((b) => b.priority === 'high' || b.priority === 'Study' || b.title.toLowerCase().includes('dsa') || b.title.toLowerCase().includes('study'))
    .reduce((acc, b) => acc + b.duration, 0);

  const workMinutes = currentWeekScheduledBlocks
    .filter((b) => b.priority === 'medium' || b.priority === 'Work' || b.title.toLowerCase().includes('work') || b.title.toLowerCase().includes('internship'))
    .reduce((acc, b) => acc + b.duration, 0);

  // Completion Rate
  const completedBlocks = currentWeekScheduledBlocks.filter(
    (b) => b.status === 'completed' || b.status === 'faster'
  );
  const missedBlocks = currentWeekScheduledBlocks.filter((b) => b.status === 'missed');
  
  const completionRate = currentWeekScheduledBlocks.length > 0
    ? Math.round((completedBlocks.length / currentWeekScheduledBlocks.length) * 100)
    : 0;

  // Productivity & Focus Scores
  const productivityScore = Math.min(100, Math.round(completionRate * 0.8 + (studyMinutes > 300 ? 20 : 10)));
  const focusScore = Math.min(100, Math.round(85 + (completedBlocks.length > 3 ? 10 : 0) - missedBlocks.length * 5));

  // Daily distribution
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl overflow-hidden relative text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Productivity Dashboard</h3>
              <p className="text-xs text-slate-400">Minimal metric cards & weekly statistics ({currentWeekId})</p>
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
          {/* Key Metric Cards Grid (6 Clean Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 1. Study Hours */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Study Hours</span>
                <BookOpen className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">{(studyMinutes / 60).toFixed(1)}h</div>
              <p className="text-[11px] text-slate-500">{studyMinutes} mins focused study</p>
            </div>

            {/* 2. Work Hours */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Work Hours</span>
                <Briefcase className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{(workMinutes / 60).toFixed(1)}h</div>
              <p className="text-[11px] text-slate-500">{workMinutes} mins task execution</p>
            </div>

            {/* 3. Completion Rate */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{completionRate}%</div>
              <p className="text-[11px] text-slate-500">{completedBlocks.length} / {currentWeekScheduledBlocks.length} blocks done</p>
            </div>

            {/* 4. Productivity Score */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Productivity Score</span>
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{productivityScore} / 100</div>
              <p className="text-[11px] text-slate-500">Based on schedule execution</p>
            </div>

            {/* 5. Focus Score */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Focus Score</span>
                <Award className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white">{focusScore} / 100</div>
              <p className="text-[11px] text-slate-500">Deep work consistency</p>
            </div>

            {/* 6. Missed Blocks */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Missed Blocks</span>
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white">{missedBlocks.length}</div>
              <p className="text-[11px] text-slate-500">Skipped or overdue tasks</p>
            </div>
          </div>

          {/* Secondary Visual Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Daily Workload Overview</span>
            </h4>

            <div className="grid grid-cols-7 gap-2 items-end h-28 pt-2">
              {dailyTotals.map((d) => {
                const heightPct = maxDailyMinutes > 0 ? (d.minutes / maxDailyMinutes) * 100 : 0;
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400">{d.minutes > 0 ? `${d.hours}h` : ''}</span>
                    <div className="w-full bg-slate-900 rounded-md overflow-hidden h-full flex flex-col justify-end border border-slate-800">
                      <div
                        style={{ height: `${Math.max(6, heightPct)}%` }}
                        className="w-full bg-indigo-600 rounded-t transition-all duration-300"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
