import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

export default function LifeBalanceMeter() {
  const categories = [
    { name: 'Career/Study', value: 75, color: '#8b5cf6' },
    { name: 'Health', value: 40, color: '#10b981' },
    { name: 'Social', value: 30, color: '#3b82f6' },
    { name: 'Personal', value: 25, color: '#ec4899' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Activity className="text-indigo-400" size={20} />
            Life Balance
          </h2>
          <p className="text-slate-400 text-sm">30-day category distribution</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
            
            {/* Simple stacked rings visual representation */}
            <circle cx="50" cy="50" r="40" fill="none" stroke={categories[0].color} strokeWidth="12" strokeDasharray={`${categories[0].value * 2.51} 251`} strokeDashoffset="0" className="opacity-90" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#1e293b" strokeWidth="10" />
            <circle cx="50" cy="50" r="28" fill="none" stroke={categories[1].color} strokeWidth="10" strokeDasharray={`${categories[1].value * 1.76} 176`} strokeDashoffset="0" className="opacity-90" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle cx="50" cy="50" r="18" fill="none" stroke={categories[2].color} strokeWidth="8" strokeDasharray={`${categories[2].value * 1.13} 113`} strokeDashoffset="0" className="opacity-90" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">42%</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Balance</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-3">
            <AlertTriangle className="text-red-400 shrink-0" size={18} />
            <div>
              <p className="text-red-400 text-sm font-medium">Imbalance Detected</p>
              <p className="text-red-400/70 text-xs mt-0.5">Career is taking over. Consider dedicating more time to Health.</p>
            </div>
          </div>

          <div className="space-y-3">
            {categories.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{cat.name}</span>
                  <span className="text-slate-500">{cat.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cat.value}%`, backgroundColor: cat.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
