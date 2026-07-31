import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Resolution } from '../../types/timetable';
import { Clock } from 'lucide-react';

export const ResolutionSelector: React.FC = () => {
  const { resolution, setResolution } = useTimetable();

  const options: { value: Resolution; label: string }[] = [
    { value: 120, label: '2 hr' },
    { value: 60, label: '1 hr' },
    { value: 45, label: '45 mins' },
    { value: 30, label: '30 mins' },
    { value: 15, label: '15 mins' },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-1 px-1 text-slate-400 text-xs font-medium">
        <Clock className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Grid:</span>
      </div>
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setResolution(opt.value)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${
              resolution === opt.value
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
