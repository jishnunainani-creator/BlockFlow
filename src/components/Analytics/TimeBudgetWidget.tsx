import React from 'react';
import { Clock, AlertTriangle, Moon, BookOpen, Briefcase, Dumbbell, Car, Heart } from 'lucide-react';

export default function TimeBudgetWidget() {
  const timeAllocations = [
    { label: 'Sleep', hours: 8, color: '#3b82f6', icon: Moon },
    { label: 'Study', hours: 4, color: '#8b5cf6', icon: BookOpen },
    { label: 'Work', hours: 3, color: '#10b981', icon: Briefcase },
    { label: 'Exercise', hours: 1, color: '#f59e0b', icon: Dumbbell },
    { label: 'Travel', hours: 1, color: '#64748b', icon: Car },
    { label: 'Free Time', hours: 7, color: '#ec4899', icon: Heart },
  ];

  const totalHours = timeAllocations.reduce((acc, curr) => acc + curr.hours, 0);
  const overbooked = totalHours > 24;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Clock className="text-indigo-400" size={20} />
            24h Time Budget
          </h2>
          <p className="text-slate-400 text-sm">Your daily time allocation.</p>
        </div>
        {overbooked && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-semibold">
            <AlertTriangle size={14} />
            Overbooked by {totalHours - 24}h
          </div>
        )}
      </div>

      <div className="flex h-4 rounded-full overflow-hidden mb-6 bg-slate-800">
        {timeAllocations.map((item, idx) => (
          <div
            key={idx}
            style={{ 
              width: `${(item.hours / 24) * 100}%`,
              backgroundColor: item.color 
            }}
            className="h-full transition-all hover:opacity-80 cursor-pointer"
            title={`${item.label}: ${item.hours}h`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {timeAllocations.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center opacity-80"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                <Icon size={16} />
              </div>
              <div>
                <p className="text-slate-300 text-sm font-medium">{item.label}</p>
                <p className="text-slate-500 text-xs">{item.hours}h</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
