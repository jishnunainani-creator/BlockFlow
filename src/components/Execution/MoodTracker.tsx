import React from 'react';
import { MoodType, MOOD_CONFIG } from '../../types/execution';

interface Props {
  selectedMood?: MoodType;
  onSelectMood: (mood: MoodType) => void;
  compact?: boolean;
}

export const MoodTracker: React.FC<Props> = ({ selectedMood, onSelectMood, compact = false }) => {
  return (
    <div className={`flex items-center justify-between gap-2 ${compact ? '' : 'bg-slate-900 border border-slate-800 rounded-2xl p-4'}`}>
      {(Object.keys(MOOD_CONFIG) as MoodType[]).map((mood) => {
        const config = MOOD_CONFIG[mood];
        const isSelected = selectedMood === mood;
        return (
          <button
            key={mood}
            onClick={() => onSelectMood(mood)}
            className={`flex flex-col items-center justify-center transition-all duration-200
              ${isSelected ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 bg-slate-800 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'hover:scale-105 hover:bg-slate-800/50'}
              ${compact ? 'w-10 h-10 rounded-full' : 'p-3 rounded-xl w-16'}`}
            title={config.label}
          >
            <span className={`${compact ? 'text-xl' : 'text-3xl mb-1'}`}>{config.emoji}</span>
            {!compact && <span className="text-[10px] font-bold text-slate-400">{config.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
