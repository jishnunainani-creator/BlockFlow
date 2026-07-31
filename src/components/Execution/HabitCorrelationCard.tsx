import React from 'react';
import { HabitCorrelation } from '../../types/execution';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  correlations: HabitCorrelation[];
}

export const HabitCorrelationCard: React.FC<Props> = ({ correlations }) => {
  if (!correlations.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
        <p className="text-slate-400 text-sm font-medium">Keep tracking your days to discover productivity patterns.</p>
      </div>
    );
  }

  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 70) return 'bg-indigo-500/20 text-indigo-300';
    if (confidence >= 40) return 'bg-slate-800 text-slate-300';
    return 'bg-slate-900 text-slate-500 border border-slate-800';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) return 'High';
    if (confidence >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-3">
      {correlations.map((corr) => (
        <div key={corr.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-start">
          <div className={`p-2 rounded-lg border ${
            corr.impactDirection === 'positive' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20' :
            'text-red-400 bg-red-400/10 border-red-500/20'
          }`}>
            {corr.impactDirection === 'positive' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-200 font-medium mb-2">{corr.description}</p>
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
