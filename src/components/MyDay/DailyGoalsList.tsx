import React from 'react';
import { Goal, ScheduledBlock } from '../../types/timetable';
import { calculateGoalMetrics } from '../../utils/goalEngine';
import { Target, ArrowUpRight, CheckCircle2, TrendingUp } from 'lucide-react';

interface DailyGoalsListProps {
  goals: Goal[];
  scheduledBlocks: ScheduledBlock[];
  onNavigateToGoals?: () => void;
}

export const DailyGoalsList: React.FC<DailyGoalsListProps> = ({
  goals,
  scheduledBlocks,
  onNavigateToGoals,
}) => {
  // Only active goals
  const activeGoals = goals.filter((g) => g.status === 'active');

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Active SMART Goals
          </h2>
          <span className="text-xs text-slate-500 font-medium">({activeGoals.length})</span>
        </div>

        {onNavigateToGoals && (
          <button
            type="button"
            onClick={onNavigateToGoals}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            All Goals →
          </button>
        )}
      </div>

      {activeGoals.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
          No active goals set. Create a SMART goal to track your milestones.
        </p>
      ) : (
        <div className="space-y-2.5">
          {activeGoals.slice(0, 3).map((goal) => {
            // Authentic progress calculated from underlying schedule blocks and goal properties
            const metrics = calculateGoalMetrics(goal, scheduledBlocks);

            return (
              <div
                key={goal.id}
                onClick={onNavigateToGoals}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block truncate">
                      {goal.category}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {goal.title}
                    </h4>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white shrink-0">
                    {metrics.progressPct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, metrics.progressPct)}%`,
                      backgroundColor: goal.color || '#3B82F6',
                    }}
                  />
                </div>

                {/* Contextual goal progress footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  <span>
                    {metrics.actualCurrentValue} / {metrics.targetValue} {metrics.unit}
                  </span>
                  <span>{metrics.completedHours}h logged</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
