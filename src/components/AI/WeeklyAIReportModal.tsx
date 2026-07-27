import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { generateWeeklyAIReport } from '../../utils/aiProductivityEngine';
import {
  X,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  TrendingUp,
  Zap,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface WeeklyAIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyAIReportModal: React.FC<WeeklyAIReportModalProps> = ({ isOpen, onClose }) => {
  const { currentWeekScheduledBlocks, currentWeekId, runAISmartSchedule, addToast } = useTimetable();

  if (!isOpen) return null;

  const report = generateWeeklyAIReport(currentWeekId, currentWeekScheduledBlocks);

  const handleApplyAISchedule = () => {
    runAISmartSchedule();
    onClose();
    addToast('Applied AI Smart Schedule for next week!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-hidden relative text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Weekly AI Productivity Review</h3>
              <p className="text-xs text-slate-400">Performance report for week {currentWeekId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin">
          {/* Adherence Grade Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Timetable Adherence Score
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl font-black text-white">{report.adherenceScore}%</span>
                <span className="text-sm font-bold text-slate-300">
                  {report.completedHours}h completed / {report.plannedHours}h planned
                </span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl ring-2 ring-indigo-400/40">
              {report.adherenceGrade}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Peak Performance Day</span>
              <p className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>{report.topPerformingDay}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Most Consistent Activity</span>
              <p className="text-base font-bold text-white mt-1 flex items-center gap-1.5 truncate">
                <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">{report.mostProductiveActivity}</span>
              </p>
            </div>
          </div>

          {/* Weekly Success Highlights */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Weekly Performance Highlights</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300 font-medium">
              {report.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Actionable Recommendations */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Personalized AI Recommendations for Next Week</span>
            </h4>

            <div className="space-y-2 text-xs text-slate-200">
              {report.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/20 flex items-start gap-2.5">
                  <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[10px] shrink-0 mt-0.5">
                    #{idx + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/50 rounded-xl"
          >
            Close Report
          </button>
          <button
            onClick={handleApplyAISchedule}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>✨ Apply AI Smart Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};
