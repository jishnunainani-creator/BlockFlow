import React from 'react';
import { ImprovementSuggestion } from '../../types/execution';
import { Lightbulb, Heart, Clock, Focus, BrainCircuit } from 'lucide-react';

interface Props {
  suggestions: ImprovementSuggestion[];
}

export const ImprovementSuggestions: React.FC<Props> = ({ suggestions }) => {
  if (!suggestions.length) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
        <Lightbulb className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={24} />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Log more reflections and complete blocks to get personalized AI suggestions.</p>
      </div>
    );
  }

  const getIcon = (category: string) => {
    switch (category) {
      case 'scheduling': return <Clock size={16} className="text-blue-500 dark:text-blue-400" />;
      case 'energy': return <Heart size={16} className="text-pink-500 dark:text-pink-400" />;
      case 'focus': return <Focus size={16} className="text-indigo-500 dark:text-indigo-400" />;
      default: return <BrainCircuit size={16} className="text-purple-500 dark:text-purple-400" />;
    }
  };

  return (
    <div className="space-y-3">
      {suggestions.slice(0, 5).map((sugg, i) => (
        <div key={i} className="bg-slate-50/70 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-500/30 transition-colors">
          <div className="flex gap-3">
            <div className="mt-0.5">{getIcon(sugg.category)}</div>
            <div>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-2">{sugg.suggestion}</p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  Based on: {sugg.basedOn}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(level => (
                    <div 
                      key={level} 
                      className={`w-1.5 h-1.5 rounded-full ${level <= sugg.confidence ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
