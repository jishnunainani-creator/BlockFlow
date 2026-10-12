import React, { useState, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getProductivityDNA, generateAIInsights } from '../../utils/aiProductivityEngine';
import { WeeklyAIReportModal } from '../AI/WeeklyAIReportModal';
import {
  Sparkles,
  Zap,
  Dna,
  Clock,
  Calendar,
  Award,
  TrendingUp,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

import { useExecution } from '../../context/ExecutionContext';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';

interface AICoachViewProps {
  onNavigate?: (view: NavView) => void;
}

export const AICoachView: React.FC<AICoachViewProps> = ({ onNavigate }) => {
  const { currentWeekScheduledBlocks, libraryBlocks } = useTimetable();
  const { dailyScores } = useExecution();
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  const dna = useMemo(() => getProductivityDNA({
    scheduledBlocks: currentWeekScheduledBlocks,
    dailyScores,
  }), [currentWeekScheduledBlocks, dailyScores]);

  const completedBlocks = useMemo(() => (currentWeekScheduledBlocks || []).filter(
    (b) => b.status === 'completed' || b.status === 'faster' || b.status === 'took_longer'
  ), [currentWeekScheduledBlocks]);

  const completedCount = completedBlocks.length;
  const hasSufficientData = completedCount >= 3;

  // Real Category Distribution for Life Balance Analysis
  const { categoryBalance, totalMinutes } = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let totalMins = 0;
    (currentWeekScheduledBlocks || []).forEach((b) => {
      const cat = b.priority ? b.priority.toUpperCase() : 'GENERAL';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + b.duration;
      totalMins += b.duration;
    });

    const balance = Object.entries(categoryTotals)
      .map(([name, mins]) => ({
        name,
        percentage: totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0,
        hours: Number((mins / 60).toFixed(1)),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return { categoryBalance: balance, totalMinutes: totalMins };
  }, [currentWeekScheduledBlocks]);

  // Dynamic Real Insights
  const realAIInsights = useMemo(() => 
    generateAIInsights(currentWeekScheduledBlocks || [], libraryBlocks || []),
    [currentWeekScheduledBlocks, libraryBlocks]
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 space-y-5 select-none scrollbar-thin">
      {/* ── BREADCRUMB ── */}
      {onNavigate && (
        <PageBreadcrumb
          items={[{ label: 'AI Coach' }]}
          onNavigate={onNavigate}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span>AI Productivity Coach & DNA Profile</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Private execution intelligence learning your peak hours, optimal session lengths, and habits over time
          </p>
        </div>

        <button
          onClick={() => setShowWeeklyReport(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Sunday Reflection Report</span>
        </button>
      </div>

      {/* Minimum Data Notice if empty */}
      {!hasSufficientData && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              Building Your Personal Productivity DNA
            </p>
            <p className="text-xs text-indigo-800 dark:text-slate-400 mt-0.5">
              Complete at least 3 focus sessions across 2 days to unlock personalized peak focus windows, habit insights, and fatigue detection.
            </p>
          </div>
        </div>
      )}

      {/* ── PERSONAL PRODUCTIVITY DNA CARDS GRID ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-2">
          <Dna className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Personal Productivity DNA (Learned Habits)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block">Peak Focus Window</span>
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">{dna.peakFocusWindow}</div>
            {hasSufficientData && (
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">Empirical completion peak</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block">Preferred Session</span>
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
              {hasSufficientData ? `${dna.preferredSessionMinutes}` : 'Insufficient data'}
            </div>
            {hasSufficientData && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Average logged duration</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block">Max Effective Focus</span>
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
              {totalMinutes > 0 ? `${Number((totalMinutes / 60).toFixed(1))} hrs planned` : '0 hrs planned'}
            </div>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">Calculated from timetable</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block">Most Productive Day</span>
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">{dna.mostProductiveDay}</div>
            {hasSufficientData && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Highest completed count</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400 block">Fatigue Drop-off</span>
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">{dna.leastProductiveTime}</div>
            {hasSufficientData && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Lowest completion rate</p>
            )}
          </div>
        </div>
      </div>

      {/* ── AI COACH ADVICE CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Execution Habit Insight */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Execution Habit Insight</span>
            </h4>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
              {realAIInsights.length > 0 ? 'Live AI Analysis' : 'Awaiting Data'}
            </span>
          </div>
          {realAIInsights.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{realAIInsights[0].title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{realAIInsights[0].description}</p>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 text-indigo-950 dark:text-indigo-300 text-xs font-medium">
                💡 Recommendation: {realAIInsights[0].recommendation}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              "No execution history recorded yet. Complete scheduled blocks on your calendar to generate empirical habit recommendations."
            </p>
          )}
        </div>

        {/* Life Balance Analysis */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Life Balance Analysis</span>
            </h4>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-500/20">
              {categoryBalance.length > 0 ? `${categoryBalance.length} Categories` : 'Empty Timetable'}
            </span>
          </div>

          {categoryBalance.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
              {categoryBalance.slice(0, 6).map((cat) => (
                <div key={cat.name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate font-medium">{cat.name}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{cat.percentage}%</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block">{cat.hours} hrs</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              "No activities scheduled for this week. Add blocks to your timetable to visualize your category balance."
            </p>
          )}
        </div>
      </div>

      <WeeklyAIReportModal isOpen={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} />
    </div>
  );
};
