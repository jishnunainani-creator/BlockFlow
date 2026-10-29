import React from 'react';
import { HabitCorrelation } from '../../types/execution';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  correlations: HabitCorrelation[];
}

export const HabitCorrelationCard: React.FC<Props> = ({ correlations }) => {
  if (!correlations.length) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Keep tracking your days to discover productivity patterns.</p>
      </div>
    );
  }

  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 70) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300';
    if (confidence >= 40) return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-500 border border-slate-200 dark:border-slate-800';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) return 'High';
    if (confidence >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-3">
      {correlations.map((corr) => (
        <div key={corr.id} className="bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-4 items-start">
          <div className={`p-2 rounded-lg border ${
            corr.impactDirection === 'positive' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
            'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'
          }`}>
            {corr.impactDirection === 'positive' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-2">{corr.description}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getConfidenceStyle(corr.confidence)}`}>
                {getConfidenceLabel(corr.confidence)} Confidence
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                Based on {corr.dataPoints} days
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
