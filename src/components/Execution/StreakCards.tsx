import React from 'react';
import { ProductivityStreak, STREAK_CONFIG } from '../../types/execution';

interface Props {
  streaks: ProductivityStreak[];
  compact?: boolean;
}

export const StreakCards: React.FC<Props> = ({ streaks, compact = false }) => {
  if (!streaks.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
        <p className="text-slate-500 text-sm font-semibold">No active streaks. Start building them today!</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
      {streaks.map((streak) => (
        <div
          key={streak.type}
          className={`bg-slate-900/80 rounded-xl border p-3 flex flex-col justify-between transition-all duration-300
            ${streak.isActive ? 'border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-slate-800 opacity-60'}
          `}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${streak.isActive ? 'bg-orange-500/10' : 'bg-slate-800'}`}>
              <span className="text-base">{streak.icon}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase truncate">
              {streak.label}
            </span>
          </div>
          
          <div className="flex items-end justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${streak.isActive ? 'text-white' : 'text-slate-400'}`}>
                {streak.currentCount}
              </span>
              <span className="text-xs text-slate-500 font-semibold">days</span>
              {streak.isActive && streak.currentCount > 2 && (
                <span className="animate-bounce ml-1">🔥</span>
              )}
            </div>
          </div>
          
          <div className="mt-2 text-[9px] font-bold text-slate-500 uppercase flex justify-between">
            <span>Longest: {streak.longestCount}</span>
            {!streak.isActive && <span className="text-indigo-400">Restart</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
