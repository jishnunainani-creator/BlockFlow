import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Clock, AlertTriangle, Moon, BookOpen, Briefcase, Dumbbell, Car, Heart, HelpCircle } from 'lucide-react';

export default function TimeBudgetWidget() {
  const { currentWeekScheduledBlocks } = useTimetable();
  const blocks = currentWeekScheduledBlocks || [];

  const hasData = blocks.length > 0;

  // Group blocks by category or title keyword
  const categoryTotals: Record<string, number> = {};
  let totalScheduledMins = 0;

  blocks.forEach((b) => {
    const catName = b.priority ? b.priority.toUpperCase() : 'GENERAL';
    categoryTotals[catName] = (categoryTotals[catName] || 0) + b.duration;
    totalScheduledMins += b.duration;
  });

  // Calculate daily averages (divided across 7 days)
  const dailyScheduledHours = Number((totalScheduledMins / (7 * 60)).toFixed(1));
  const unallocatedHours = Number(Math.max(0, 24 - dailyScheduledHours).toFixed(1));
  const isOverbooked = dailyScheduledHours > 24;

  const categoryList = Object.entries(categoryTotals)
    .map(([name, mins], idx) => {
      const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#64748B'];
      return {
        label: name,
        hours: Number((mins / (7 * 60)).toFixed(1)),
        color: colors[idx % colors.length],
      };
    })
    .filter((c) => c.hours > 0);

  // Add Unallocated Time category
  if (unallocatedHours > 0 && !isOverbooked) {
    categoryList.push({
      label: 'Unallocated (Sleep & Personal)',
      hours: unallocatedHours,
      color: '#475569',
    });
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="text-indigo-400" size={18} />
            24h Daily Time Budget
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {hasData
              ? `Daily average derived from your ${blocks.length} scheduled activity blocks`
              : 'Add activities to your timetable to visualize your daily time allocation'}
          </p>
        </div>
        {isOverbooked && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold shrink-0">
            <AlertTriangle size={14} />
            Overbooked by {Number((dailyScheduledHours - 24).toFixed(1))}h / day
          </div>
        )}
      </div>

      {hasData ? (
        <>
          {/* Progress Bar */}
          <div className="flex h-3.5 rounded-full overflow-hidden bg-slate-950 border border-slate-800">
            {categoryList.map((item, idx) => (
              <div
                key={idx}
                style={{
                  width: `${Math.min(100, (item.hours / 24) * 100)}%`,
                  backgroundColor: item.color,
                }}
                className="h-full transition-all hover:opacity-80"
                title={`${item.label}: ${item.hours}h / day`}
              />
            ))}
          </div>

          {/* Allocation Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
            {categoryList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-300 truncate">{item.label}</p>
                  <p className="text-xs font-bold text-white font-mono">{item.hours}h / day</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
          <HelpCircle className="w-5 h-5 text-slate-500 mx-auto mb-1" />
          <p className="text-xs font-bold text-slate-300">No Scheduled Activities</p>
          <p className="text-[11px] text-slate-400">
            24h unallocated (Sleep, Personal & Free Time). Drag blocks onto your calendar to build your daily time budget.
          </p>
        </div>
      )}
    </div>
  );
}
