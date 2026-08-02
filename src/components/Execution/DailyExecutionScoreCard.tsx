import React from 'react';
import { DailyExecutionScore } from '../../types/execution';
import { CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';

interface Props {
  score: DailyExecutionScore | null;
  compact?: boolean;
}

export const DailyExecutionScoreCard: React.FC<Props> = ({ score, compact = false }) => {
  if (!score || score.totalCount === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] text-center space-y-2">
        <Calendar className="w-8 h-8 text-slate-600" />
        <h4 className="text-sm font-bold text-slate-300">No Activities Scheduled Today</h4>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Add activities to your daily timetable to calculate your live Daily Execution Score.
        </p>
      </div>
    );
  }

  const { overallScore, completedCount, totalCount, priorityScores, timeAccuracyPct, dailyMissionCompleted } = score;

  let colorClass = 'text-red-500';
  let strokeClass = 'stroke-red-500';
  let bgGlow = 'bg-red-500/10';
  if (overallScore >= 80) {
    colorClass = 'text-emerald-500';
    strokeClass = 'stroke-emerald-500';
    bgGlow = 'bg-emerald-500/10';
  } else if (overallScore >= 60) {
    colorClass = 'text-amber-500';
    strokeClass = 'stroke-amber-500';
    bgGlow = 'bg-amber-500/10';
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden ${bgGlow}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 to-purple-950/20 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
          <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 160 160">
            <circle
              className="text-slate-800 stroke-current"
              strokeWidth="8"
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
            />
            <circle
              className={`transition-all duration-1000 ease-out ${strokeClass}`}
              strokeWidth="8"
              strokeLinecap="round"
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-4xl font-black ${colorClass}`}>{Math.round(overallScore)}</span>
            <span className="text-slate-400 text-xs font-semibold mt-1">SCORE</span>
          </div>
        </div>

        <div className={`grid gap-3 w-full ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <StatChip icon={<CheckCircle size={14} className="text-indigo-400" />} label="Completed" value={`${completedCount}/${totalCount}`} />
          <StatChip icon={<AlertCircle size={14} className="text-red-400" />} label="High Pri" value={`${Math.round(priorityScores?.high || 0)}%`} />
          <StatChip icon={<AlertCircle size={14} className="text-amber-400" />} label="Med Pri" value={`${Math.round(priorityScores?.medium || 0)}%`} />
          <StatChip icon={<AlertCircle size={14} className="text-emerald-400" />} label="Low Pri" value={`${Math.round(priorityScores?.low || 0)}%`} />
          <StatChip icon={<Clock size={14} className="text-blue-400" />} label="Time Acc" value={`${Math.round(timeAccuracyPct || 0)}%`} />
          <StatChip icon={<CheckCircle size={14} className={dailyMissionCompleted ? 'text-emerald-400' : 'text-slate-500'} />} label="Mission" value={dailyMissionCompleted ? '✅' : '❌'} />
        </div>
      </div>
    </div>
  );
};

const StatChip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex flex-col bg-slate-950/50 rounded-xl p-2 border border-slate-800/50 items-center justify-center text-center">
    <div className="flex items-center gap-1 mb-1">
      {icon}
      <span className="text-[10px] text-slate-400 font-semibold uppercase">{label}</span>
    </div>
    <span className="text-sm font-bold text-white">{value}</span>
  </div>
);
