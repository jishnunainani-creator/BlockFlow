import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { generateAIInsights, calculateAdherenceMetrics } from '../../utils/aiProductivityEngine';
import {
  X,
  Sparkles,
  Zap,
  AlertTriangle,
  Award,
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface AIInsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ isOpen, onClose }) => {
  const { currentWeekScheduledBlocks, libraryBlocks, runAISmartSchedule, addToast } = useTimetable();

  if (!isOpen) return null;

  const insights = generateAIInsights(currentWeekScheduledBlocks, libraryBlocks);
  const metrics = calculateAdherenceMetrics(currentWeekScheduledBlocks);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'peak_performance':
        return Zap;
      case 'skipped_trend':
        return AlertTriangle;
      case 'workload_warning':
        return ShieldAlert;
      case 'positive_habit':
        return Award;
      default:
        return Sparkles;
    }
  };

  const handleAutoSchedule = () => {
    runAISmartSchedule();
    onClose();
    addToast('AI Smart Schedule generated!', 'success');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 shadow-2xl overflow-hidden flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Productivity Intelligence</h3>
              <p className="text-xs text-slate-400">Pattern recognition & schedule optimization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Adherence Overview Header */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-500/30 shrink-0 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Schedule Adherence</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-white">{metrics.adherenceScore}%</span>
              <span className="text-xs font-bold text-emerald-400">Grade {metrics.grade}</span>
            </div>
          </div>
          <div className="text-right text-xs font-medium text-slate-300">
            <div>{metrics.completedHours}h completed</div>
            <div className="text-slate-400">{metrics.plannedHours}h planned</div>
          </div>
        </div>

        {/* Action Button: Auto-Generate AI Schedule */}
        <button
          onClick={handleAutoSchedule}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs shadow-lg mb-4 active:scale-98 transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>✨ Auto-Generate AI Smart Schedule</span>
        </button>

        {/* Insights Cards */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Detected Habits & Recommendations ({insights.length})
          </h4>

          {insights.map((ins) => {
            const IconComp = getInsightIcon(ins.type);
            return (
              <div
                key={ins.id}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{ins.title}</h5>
                    <span className="text-[10px] font-semibold text-emerald-400">
                      {ins.confidence}% AI Confidence
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-medium">{ins.description}</p>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-indigo-300 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{ins.recommendation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
