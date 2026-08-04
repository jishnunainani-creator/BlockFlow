import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { useTimetable } from '../../context/TimetableContext';
import { COMPLETION_STATUS_CONFIG } from '../../types/timetable';
import { getTodayDateString } from '../../utils/executionStorage';
import { Target, CheckCircle2, ArrowRightLeft, Calendar, AlertTriangle, Lightbulb, PieChart, Info, HelpCircle } from 'lucide-react';

export const PlanVsRealityTab: React.FC = () => {
  const { currentWeekScheduledBlocks } = useTimetable();
  const { getPlanVsRealityForDate, getDeviationAnalytics, getPlanningInsights } = useSession();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  const todayBlocks = currentWeekScheduledBlocks;
  const metrics = getPlanVsRealityForDate(selectedDate, todayBlocks);
  const analytics = getDeviationAnalytics(30);
  const insights = getPlanningInsights();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Selector Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            PLAN VS REALITY
          </h3>
          <p className="text-xs text-slate-400">
            Compare what you planned against what you actually executed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Key Metric Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Plan Adherence Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan Adherence</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-blue-400">{metrics.planAdherencePct}%</p>
          <p className="text-[11px] text-slate-400">
            {metrics.completedAsPlannedCount} of {metrics.totalPlannedCount} activities executed as planned.
          </p>
        </div>

        {/* Execution Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Execution Score</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{metrics.executionScore}%</p>
          <p className="text-[11px] text-slate-400">
            Measures total meaningful work completed regardless of schedule changes.
          </p>
        </div>

        {/* Rescheduled / Replaced */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rescheduled / Replaced</span>
            <ArrowRightLeft className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-3xl font-black text-pink-400">
            {metrics.rescheduledCount + metrics.completedDifferentlyCount}
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.completedDifferentlyCount} replaced • {metrics.rescheduledCount} rescheduled
          </p>
        </div>

        {/* Skipped */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Skipped / Missed</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">{metrics.skippedCount}</p>
          <p className="text-[11px] text-slate-400">Activities skipped or cancelled</p>
        </div>
      </div>

      {/* Distinction Explanation Box */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">EXECUTION SCORE vs PLAN ADHERENCE:</span> Execution Score measures total work accomplished (e.g. 6 hours of fitness/reading/coding = high score). Plan Adherence measures how strictly you followed your initial timetable schedule.
        </div>
      </div>

      {/* Side by Side Plan vs Reality Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Plan vs Reality Comparison — {selectedDate}
        </h4>

        {metrics.items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs italic">
            No scheduled blocks found for this date.
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.items.map((item, idx) => {
              const statusConfig =
                COMPLETION_STATUS_CONFIG[item.status as keyof typeof COMPLETION_STATUS_CONFIG] ||
                COMPLETION_STATUS_CONFIG.not_started;

              const isMatch = item.status === 'completed' && item.plannedTitle === item.actualTitle;

              return (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs relative overflow-hidden"
                >
                  {/* Left Column: PLANNED */}
                  <div className="space-y-1 pr-0 md:pr-4 border-b md:border-b-0 md:border-r border-slate-800/80 pb-3 md:pb-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Planned Intention
                    </span>
                    <p className="font-bold text-slate-200 text-sm">{item.plannedTitle}</p>
                    <p className="text-slate-400">{item.plannedTimeStr}</p>
                  </div>

                  {/* Right Column: ACTUAL */}
                  <div className="space-y-1 pl-0 md:pl-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                        Actual Reality
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${statusConfig.bgClass}`}>
                        <span>{statusConfig.badge}</span>
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>

                    <p className={`font-bold text-sm ${isMatch ? 'text-emerald-400' : 'text-blue-300'}`}>
                      {item.actualTitle}
                    </p>
                    <p className="text-slate-400">{item.actualTimeStr}</p>

                    {item.topic && (
                      <p className="text-[11px] text-slate-300 pt-1 font-medium">
                        Topic: <span className="text-white">{item.topic}</span>
                      </p>
                    )}

                    {item.deviationReason && (
                      <p className="text-[10px] text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-md inline-block mt-1">
                        Reason: {item.deviationReason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deviation Analytics Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <PieChart className="w-4 h-4 text-purple-400" />
          Deviation Analytics (Last 30 Days)
        </h4>

        {!analytics.hasEnoughData ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Not enough execution history yet.</p>
            <p className="text-[11px] text-slate-500">
              Log at least 3 completed or replaced activities to generate real deviation analytics.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outcome Breakdown Bars */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Execution Outcomes</h5>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Executed As Planned</span>
                    <span className="text-emerald-400 font-bold">{analytics.executedAsPlannedPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${analytics.executedAsPlannedPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Rescheduled</span>
                    <span className="text-purple-400 font-bold">{analytics.rescheduledPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${analytics.rescheduledPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Replaced</span>
                    <span className="text-pink-400 font-bold">{analytics.replacedPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-pink-500 h-full rounded-full" style={{ width: `${analytics.replacedPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Cancelled / Skipped</span>
                    <span className="text-amber-400 font-bold">{analytics.cancelledSkippedPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${analytics.cancelledSkippedPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Common Deviation Reasons */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Common Deviation Reasons</h5>
              {analytics.reasonBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No deviation reasons recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.reasonBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-300 font-medium">{item.reason}</span>
                      <span className="text-pink-400 font-bold">{item.percentage}% ({item.count})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Learning & Pattern Insights Section */}
      {insights.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Learned Planning Patterns
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((pattern) => (
              <div key={pattern.id} className="bg-slate-950 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>⚡</span>
                  <span>{pattern.title}</span>
                </h5>
                <p className="text-xs text-slate-300">{pattern.description}</p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Based on {pattern.evidenceCount} real events</span>
                  <button className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold px-3 py-1 rounded-xl transition-colors">
                    {pattern.suggestedActionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
