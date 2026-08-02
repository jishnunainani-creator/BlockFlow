import React from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { useTimetable } from '../../context/TimetableContext';
import { calculatePlanVsReality } from '../../utils/planVsRealityEngine';
import { BarChart3, Clock, Target, TrendingUp, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const PlanVsRealityTab: React.FC = () => {
  const { currentWeekScheduledBlocks } = useTimetable();
  const { dailyScores } = useExecution();

  const { metrics, insights, hasData } = calculatePlanVsReality(currentWeekScheduledBlocks, dailyScores);

  return (
    <div className="space-y-6 select-none">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <BarChart3 className="text-indigo-400" size={22} />
          <span>Plan vs Reality Analysis</span>
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Empirical comparison between what you scheduled and what you actually executed
        </p>
      </div>

      {hasData ? (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Clock size={14} className="text-indigo-400" /> Workload Fulfill
              </span>
              <div className="text-3xl font-black text-white">
                {metrics.actualHoursTotal}h
                <span className="text-xs font-normal text-slate-400 ml-2">/ {metrics.plannedHoursTotal}h planned</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">{metrics.adherencePct}% overall adherence</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-400" /> Sessions Finished
              </span>
              <div className="text-3xl font-black text-white">
                {metrics.completedSessionsCount}
                <span className="text-xs font-normal text-slate-400 ml-2">/ {metrics.plannedSessionsCount} planned</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Completed timetable blocks</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <TrendingUp size={14} className="text-purple-400" /> Adherence Rating
              </span>
              <div className="text-3xl font-black text-purple-400">{metrics.adherencePct}%</div>
              <p className="text-[10px] text-slate-500 font-mono">Real execution follow-through</p>
            </div>
          </div>

          {/* Category Breakdown Comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target size={16} className="text-indigo-400" /> Category Workload Comparison (Planned vs Actual)
            </h3>
            <div className="space-y-3">
              {metrics.categoryBreakdown.map((cat, i) => {
                const pct = cat.plannedHours > 0 ? Math.min(100, Math.round((cat.actualHours / cat.plannedHours) * 100)) : 0;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{cat.category}</span>
                      <span className="text-slate-400 font-mono">
                        {cat.actualHours}h actual / {cat.plannedHours}h planned ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                      <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Window Adherence */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-purple-400" /> Time Window Execution Efficiency
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {metrics.timeWindowAdherence.map((win, i) => {
                const pct = win.plannedHours > 0 ? Math.min(100, Math.round((win.actualHours / win.plannedHours) * 100)) : 0;
                return (
                  <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-slate-300">{win.window} Window</span>
                    <div className="text-2xl font-black text-white font-mono">{pct}%</div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {win.actualHours}h actual / {win.plannedHours}h planned
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Plan vs Reality Insights */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/30 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles size={16} className="text-indigo-400" /> AI Plan vs Reality Insight
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {insights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-400">▸</span>
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3 max-w-md mx-auto my-8">
          <AlertCircle size={32} className="text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Insufficient Historical Data</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Complete your scheduled timetable blocks for at least 2 days to activate live Plan vs Reality analysis.
          </p>
        </div>
      )}
    </div>
  );
};
