import React, { useState } from 'react';
import { Calendar as CalendarIcon, Info } from 'lucide-react';

export default function ProductivityHeatmap() {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  // Mock data for 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const intensity = Math.floor(Math.random() * 5); // 0-4
    return { day: i + 1, intensity, hours: (intensity * 2) + Math.floor(Math.random() * 2) };
  });

  const getIntensityColor = (intensity: number) => {
    switch(intensity) {
      case 0: return 'bg-slate-800';
      case 1: return 'bg-indigo-900/40';
      case 2: return 'bg-indigo-700/60';
      case 3: return 'bg-indigo-500';
      case 4: return 'bg-indigo-400';
      default: return 'bg-slate-800';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <CalendarIcon className="text-indigo-400" size={20} />
            30-Day Productivity
          </h2>
          <p className="text-slate-400 text-sm">Daily focused hours intensity</p>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Heatmap Grid */}
        <div className="grid grid-cols-6 gap-2 shrink-0">
          {days.map((d, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredDay(i)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`w-10 h-10 rounded-lg cursor-pointer transition-colors ${getIntensityColor(d.intensity)} hover:ring-2 ring-white/20`}
            />
          ))}
        </div>

        {/* Inspector Panel */}
        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col justify-center">
          {hoveredDay !== null ? (
            <>
              <div className="text-indigo-400 text-sm font-medium mb-1">Day {days[hoveredDay].day}</div>
              <div className="text-3xl font-bold text-white mb-2">{days[hoveredDay].hours}h</div>
              <p className="text-slate-400 text-sm">Deep work hours logged</p>
              
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <Info size={14} /> Key Tasks Completed
                </div>
                <ul className="text-sm text-slate-300 space-y-1 pl-4 list-disc marker:text-slate-600">
                  {days[hoveredDay].intensity > 0 ? (
                    <>
                      <li>Database Schema Design</li>
                      <li>Authentication API</li>
                    </>
                  ) : (
                    <li className="text-slate-500 list-none -ml-4">Rest Day</li>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 flex flex-col items-center">
              <Info size={24} className="mb-2 opacity-50" />
              <p className="text-sm">Hover over a day to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
