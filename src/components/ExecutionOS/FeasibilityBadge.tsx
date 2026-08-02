import React from 'react';
import { calculateScheduleFeasibility } from '../../utils/centralPlanningEngine';
import { ScheduledBlock } from '../../types/timetable';
import { loadPersonalRules } from '../../utils/taskInboxStorage';
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';

interface FeasibilityBadgeProps {
  blocks: ScheduledBlock[];
  compact?: boolean;
}

export const FeasibilityBadge: React.FC<FeasibilityBadgeProps> = ({ blocks, compact = false }) => {
  const personalRules = loadPersonalRules();
  const feasibility = calculateScheduleFeasibility(blocks, personalRules);

  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let gaugeColor = '#10B981';
  if (feasibility.score < 60) {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    gaugeColor = '#EF4444';
  } else if (feasibility.score < 80) {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    gaugeColor = '#F59E0B';
  }

  if (compact) {
    return (
      <div
        className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-sm ${badgeColor}`}
        title={`Schedule Feasibility: ${feasibility.score}% (${feasibility.rating})`}
      >
        {feasibility.isOverloaded ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
        <span>{feasibility.score}% Feasibility</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
            Timetable Intelligence
          </span>
          <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
            <ShieldCheck className="text-indigo-400" size={18} />
            <span>Schedule Feasibility Score</span>
          </h3>
        </div>

        <div className={`px-3 py-1 rounded-xl text-xs font-bold border font-mono ${badgeColor}`}>
          {feasibility.score}% {feasibility.rating}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${feasibility.score}%`, backgroundColor: gaugeColor }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span>Planned: {feasibility.totalPlannedHours}h / week</span>
        <span>Available Free: {feasibility.availableFreeHours}h</span>
      </div>

      {/* Overload Warnings */}
      {feasibility.warnings.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 space-y-1.5 pt-2">
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
            <AlertTriangle size={14} /> Overload &amp; Rule Warnings ({feasibility.warnings.length})
          </div>
          <ul className="space-y-1 text-[11px] text-rose-200/80">
            {feasibility.warnings.map((w, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-rose-400">▸</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
