import React, { useState } from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { Calendar as CalendarIcon, Info } from 'lucide-react';

export default function ProductivityHeatmap() {
  const { dailyScores } = useExecution();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate real 30-day historical data array based on actual dailyScores
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const scoreObj = dailyScores[dateStr];

    if (scoreObj && (scoreObj.totalCompletedMinutes > 0 || scoreObj.completedCount > 0)) {
      const hours = Math.round(((scoreObj.totalCompletedMinutes || 0) / 60) * 10) / 10;
      const score = scoreObj.overallScore || 0;
      let intensity = 1;
      if (score >= 85) intensity = 4;
      else if (score >= 70) intensity = 3;
      else if (score >= 50) intensity = 2;

      return {
        dateStr,
        dayNum: d.getDate(),
        intensity,
        hours,
        score,
        completedCount: scoreObj.completedCount || 0,
        totalCount: scoreObj.totalCount || 0,
        hasData: true,
      };
    }

    return {
      dateStr,
      dayNum: d.getDate(),
      intensity: 0,
      hours: 0,
      score: 0,
      completedCount: 0,
      totalCount: 0,
      hasData: false,
    };
  });

  const trackedDaysCount = days.filter((d) => d.hasData).length;

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'bg-slate-800 border border-slate-700/50';
      case 1:
        return 'bg-indigo-950 border border-indigo-700/50';
      case 2:
        return 'bg-indigo-800/80 border border-indigo-600/50';
      case 3:
        return 'bg-indigo-600 border border-indigo-500';
      case 4:
        return 'bg-indigo-400 border border-indigo-300';
      default:
        return 'bg-slate-800 border border-slate-700/50';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <CalendarIcon className="text-indigo-400" size={20} />
            30-Day Productivity Heatmap
          </h2>
          <p className="text-slate-400 text-sm">
            {trackedDaysCount > 0
              ? `${trackedDaysCount} of 30 days tracked from actual execution history`
              : 'Real-time execution intensity grid'}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Heatmap Grid */}
        <div className="grid grid-cols-6 gap-2 shrink-0">
          {days.map((d, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`w-10 h-10 rounded-lg cursor-pointer transition-all ${getIntensityColor(
                d.intensity
              )} hover:ring-2 ring-white/30 flex items-center justify-center`}
              title={`${d.dateStr}: ${d.hours}h logged (${d.score}% score)`}
            >
              <span className="text-[10px] font-mono text-slate-400/80">{d.dayNum}</span>
            </div>
          ))}
        </div>

        {/* Inspector Panel */}
        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col justify-center min-h-[160px]">
          {hoveredIndex !== null ? (
            <div className="space-y-2">
              <div className="text-indigo-400 text-xs font-mono font-bold">
                {days[hoveredIndex].dateStr}
              </div>
              {days[hoveredIndex].hasData ? (
                <>
                  <div className="text-3xl font-black text-white">
                    {days[hoveredIndex].hours}h
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      ({days[hoveredIndex].score}% score)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {days[hoveredIndex].completedCount} of {days[hoveredIndex].totalCount} activities completed
                  </p>
                </>
              ) : (
                <div className="text-slate-500 text-xs space-y-1">
                  <p className="font-semibold text-slate-400">No Execution History</p>
                  <p className="text-[11px]">No completed activity blocks recorded for this date.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 flex flex-col items-center space-y-1">
              <Info size={20} className="opacity-50" />
              <p className="text-xs font-medium">Hover over any day box to inspect exact execution hours</p>
              {trackedDaysCount === 0 && (
                <p className="text-[11px] text-slate-600 max-w-xs">
                  Your heatmap will populate dynamically as you complete daily scheduled activities in BlockFlow.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
