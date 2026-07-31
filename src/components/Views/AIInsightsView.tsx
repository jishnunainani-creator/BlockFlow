import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { generateAIInsights, calculateAdherenceMetrics } from '../../utils/aiProductivityEngine';
import { WeeklyAIReportModal } from '../AI/WeeklyAIReportModal';
import {
  Sparkles,
  RefreshCw,
  Award,
  Zap,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const AIInsightsView: React.FC = () => {
  const { currentWeekScheduledBlocks, libraryBlocks, runAISmartSchedule, addToast } = useTimetable();
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  const insights = generateAIInsights(currentWeekScheduledBlocks, libraryBlocks);
  const metrics = calculateAdherenceMetrics(currentWeekScheduledBlocks);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'peak_performance': return Zap;
      case 'skipped_trend': return AlertTriangle;
      case 'workload_warning': return ShieldAlert;
      case 'positive_habit': return Award;
      default: return Sparkles;
    }
  };

  const handleAutoSchedule = () => {
    runAISmartSchedule();
    addToast('AI Smart Schedule generated!', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span>AI Productivity Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Pattern recognition, habit detection, and automated smart timetable generation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeeklyReport(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Weekly AI Report</span>
          </button>
          <button
            onClick={handleAutoSchedule}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Auto-Generate AI Schedule</span>
          </button>
        </div>
      </div>

      {/* Adherence Score Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Schedule Adherence Score</span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-white">{metrics.adherenceScore}%</span>
            <span className="text-sm font-bold text-emerald-400">Grade {metrics.grade}</span>
          </div>
        </div>

        <div className="text-right text-xs text-slate-300 font-medium space-y-0.5">
          <div><span className="text-white font-bold">{metrics.completedHours}h</span> completed</div>
          <div className="text-slate-400">{metrics.plannedHours}h planned this week</div>
        </div>
      </div>

      {/* Detected Insights & Recommendations Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Detected Productivity Habits & Recommendations ({insights.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((ins) => {
            const IconComp = getInsightIcon(ins.type);
            return (
              <div
                key={ins.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">{ins.title}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      {ins.confidence}% AI Confidence
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {ins.description}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{ins.recommendation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Report Modal */}
      <WeeklyAIReportModal isOpen={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} />
    </div>
  );
};
