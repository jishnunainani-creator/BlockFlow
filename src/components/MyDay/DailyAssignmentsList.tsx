import React from 'react';
import { Assignment } from '../../types/executionOS';
import { BookOpen, Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';

interface DailyAssignmentsListProps {
  assignments: Assignment[];
  onNavigateToAssignments?: () => void;
}

export const DailyAssignmentsList: React.FC<DailyAssignmentsListProps> = ({
  assignments,
  onNavigateToAssignments,
}) => {
  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Filter for active assignments (not submitted or graded)
  const activeAssignments = assignments.filter(
    (a) => a.status !== 'submitted' && a.status !== 'graded'
  );

  // Sort: Overdue first, then upcoming by dueDate
  const sortedAssignments = [...activeAssignments].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Assignments & Deadlines
          </h2>
          <span className="text-xs text-slate-500 font-medium">({sortedAssignments.length})</span>
        </div>

        {onNavigateToAssignments && (
          <button
            type="button"
            onClick={onNavigateToAssignments}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Tracker →
          </button>
        )}
      </div>

      {sortedAssignments.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
          No pending assignments or deadlines.
        </p>
      ) : (
        <div className="space-y-2">
          {sortedAssignments.slice(0, 4).map((assignment) => {
            const isOverdue = assignment.dueDate < todayYMD;
            const isDueToday = assignment.dueDate === todayYMD;

            return (
              <div
                key={assignment.id}
                onClick={onNavigateToAssignments}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate block">
                      {assignment.subject}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {assignment.title}
                    </h4>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded shrink-0 ${
                      isOverdue
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                        : isDueToday
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : `Due ${assignment.dueDate}`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, assignment.progressPct || 0)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {assignment.progressPct || 0}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
