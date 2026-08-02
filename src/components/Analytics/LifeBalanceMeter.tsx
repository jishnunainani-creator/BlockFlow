import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function LifeBalanceMeter() {
  const { currentWeekScheduledBlocks, scheduledBlocks } = useTimetable();
  const blocks = currentWeekScheduledBlocks?.length > 0 ? currentWeekScheduledBlocks : scheduledBlocks || [];

  // Calculate actual category minutes from real scheduled blocks
  let careerStudyMins = 0;
  let healthMins = 0;
  let socialMins = 0;
  let personalMins = 0;

  blocks.forEach((b) => {
    const title = (b.title || '').toLowerCase();
    const priority = (b.priority || '').toLowerCase();

    if (title.includes('gym') || title.includes('workout') || title.includes('fitness') || priority.includes('fitness')) {
      healthMins += b.duration || 60;
    } else if (title.includes('meeting') || title.includes('club') || title.includes('client') || title.includes('social')) {
      socialMins += b.duration || 60;
    } else if (title.includes('read') || title.includes('rest') || title.includes('nap') || priority.includes('personal')) {
      personalMins += b.duration || 60;
    } else {
      careerStudyMins += b.duration || 60;
    }
  });

  const totalMins = careerStudyMins + healthMins + socialMins + personalMins;
  const hasData = totalMins > 0;

  const categories = [
    { name: 'Career / Study', value: hasData ? Math.round((careerStudyMins / totalMins) * 100) : 0, color: '#8b5cf6', hours: Math.round((careerStudyMins / 60) * 10) / 10 },
    { name: 'Health & Fitness', value: hasData ? Math.round((healthMins / totalMins) * 100) : 0, color: '#10b981', hours: Math.round((healthMins / 60) * 10) / 10 },
    { name: 'Social & Meetings', value: hasData ? Math.round((socialMins / totalMins) * 100) : 0, color: '#3b82f6', hours: Math.round((socialMins / 60) * 10) / 10 },
    { name: 'Personal & Rest', value: hasData ? Math.round((personalMins / totalMins) * 100) : 0, color: '#ec4899', hours: Math.round((personalMins / 60) * 10) / 10 },
  ];

  // Imbalance detection
  const dominantCat = categories.find((c) => c.value >= 60);
  const balanceScore = hasData ? Math.max(20, 100 - (dominantCat ? dominantCat.value - 25 : 15)) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Activity className="text-indigo-400" size={20} />
            Life Balance Meter
          </h2>
          <p className="text-slate-400 text-sm">
            {hasData ? 'Category distribution derived from current timetable' : 'Real-time category distribution'}
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-44 h-44 shrink-0">
            <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={categories[0].color}
                strokeWidth="10"
                strokeDasharray={`${categories[0].value * 2.51} 251`}
                strokeDashoffset="0"
                className="opacity-90"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{balanceScore}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Balance</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
            {dominantCat ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3">
                <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-amber-300 text-xs font-bold">Imbalance Warning ({dominantCat.name})</p>
                  <p className="text-amber-200/80 text-[11px] mt-0.5 leading-relaxed">
                    {dominantCat.name} accounts for {dominantCat.value}% of your planned time. Consider adding health or rest blocks for recovery.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-3">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-emerald-300 text-xs font-bold">Healthy Category Distribution</p>
                  <p className="text-emerald-200/80 text-[11px] mt-0.5 leading-relaxed">
                    Your timetable maintains a balanced allocation across work, fitness, and personal rest.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {categories.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="text-slate-400 font-mono">
                      {cat.hours}h ({cat.value}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center space-y-2">
          <Activity className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No Scheduled Activities Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Add activities across categories (Study, Fitness, Work, Personal) to your timetable to view your Life Balance Meter.
          </p>
        </div>
      )}
    </div>
  );
}
