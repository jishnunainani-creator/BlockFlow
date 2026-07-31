import React from 'react';
import { Achievement } from '../../types/execution';
import { Trophy, Medal, Target, TrendingUp } from 'lucide-react';

interface Props {
  achievements: Achievement[];
}

export const AchievementTimeline: React.FC<Props> = ({ achievements }) => {
  if (!achievements.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center">
        <Trophy className="text-slate-600 mb-4" size={48} />
        <h3 className="text-lg font-bold text-white mb-2">Journey Begins</h3>
        <p className="text-slate-400 text-sm">Complete your daily missions and maintain streaks to unlock achievements.</p>
      </div>
    );
  }

  const sorted = [...achievements].sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());

  const getIcon = (category: string) => {
    switch (category) {
      case 'streak': return <TrendingUp size={16} className="text-orange-400" />;
      case 'milestone': return <Target size={16} className="text-indigo-400" />;
      case 'consistency': return <Medal size={16} className="text-emerald-400" />;
      default: return <Trophy size={16} className="text-yellow-400" />;
    }
  };

  return (
    <div className="relative pl-4 py-4">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800" />
      
      <div className="space-y-6">
        {sorted.map((ach, i) => (
          <div key={ach.id} className="relative pl-8 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="absolute left-[-11px] top-1.5 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center z-10 shadow-lg">
              {getIcon(ach.category)}
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                <span className="text-[10px] font-semibold text-slate-500">
                  {new Date(ach.earnedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{ach.description}</p>
              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 uppercase">
                {ach.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
