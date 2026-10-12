import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  CheckCircle2,
  Clock,
  ListTodo,
  BookOpen,
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

interface MyDayHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  totalScheduledMinutes: number;
  completedBlocksCount: number;
  totalBlocksCount: number;
  tasksCount: number;
  overdueTasksCount: number;
  activeAssignmentsCount: number;
  onOpenAddBlock: () => void;
  onOpenAddTask: () => void;
  onOpenQuickCapture?: () => void;
  onStartFocusMode?: () => void;
}

export const MyDayHeader: React.FC<MyDayHeaderProps> = ({
  selectedDate,
  onSelectDate,
  totalScheduledMinutes,
  completedBlocksCount,
  totalBlocksCount,
  tasksCount,
  overdueTasksCount,
  activeAssignmentsCount,
  onOpenAddBlock,
  onOpenAddTask,
  onOpenQuickCapture,
  onStartFocusMode,
}) => {
  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const selectedYMD = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const isToday = selectedYMD === todayYMD;

  // Calculate day difference for relative label
  const diffDays = Math.round(
    (new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000
  );

  let relativeLabel = '';
  if (diffDays === 0) relativeLabel = 'Today';
  else if (diffDays === -1) relativeLabel = 'Yesterday';
  else if (diffDays === 1) relativeLabel = 'Tomorrow';
  else if (diffDays < -1) relativeLabel = `${Math.abs(diffDays)} days ago`;
  else relativeLabel = `In ${diffDays} days`;

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onSelectDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onSelectDate(next);
  };

  const handleGoToday = () => {
    onSelectDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    onSelectDate(new Date(year, month - 1, day));
  };

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
      {/* Top Row: Date title, navigation & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Selector & Title */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formattedDate}
            </h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
                isToday
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {relativeLabel}
            </span>
          </div>

          {/* Date Switcher Navigation Controls */}
          <div className="flex items-center gap-2 mt-2">
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Previous Day"
                aria-label="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToday}
                disabled={isToday}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  isToday
                    ? 'text-slate-400 dark:text-slate-600 cursor-default'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Next Day"
                aria-label="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Native Date Picker trigger */}
            <div className="relative inline-flex items-center">
              <input
                type="date"
                value={selectedYMD}
                onChange={handleDateChange}
                aria-label="Select specific date"
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenQuickCapture && (
            <button
              type="button"
              onClick={onOpenQuickCapture}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-2xs"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Quick Capture</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddBlock}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Block</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddTask}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ListTodo className="w-4 h-4 text-slate-500" />
            <span>Add Task</span>
          </button>

          {onStartFocusMode && (
            <button
              type="button"
              onClick={onStartFocusMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Focus Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Context-aware Workload Summary Bar */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600 dark:text-slate-400 pt-1">
        {/* Scheduled blocks stat */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {totalBlocksCount === 0 ? (
              <span className="text-slate-500 dark:text-slate-400">No blocks scheduled</span>
            ) : (
              <>
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {totalBlocksCount} block{totalBlocksCount !== 1 ? 's' : ''}
                </strong>{' '}
                ({formatDuration(totalScheduledMinutes)})
                {completedBlocksCount > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                    · {completedBlocksCount} completed
                  </span>
                )}
              </>
            )}
          </span>
        </div>

        <span className="text-slate-300 dark:text-slate-700">·</span>

        {/* Tasks stat */}
        <div className="flex items-center gap-1.5">
          <ListTodo className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {tasksCount === 0 ? (
              <span className="text-slate-500 dark:text-slate-400">No pending tasks</span>
            ) : (
              <>
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {tasksCount} task{tasksCount !== 1 ? 's' : ''}
                </strong>
                {overdueTasksCount > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-medium ml-1">
                    ({overdueTasksCount} overdue)
                  </span>
                )}
              </>
            )}
          </span>
        </div>

        {activeAssignmentsCount > 0 && (
          <>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {activeAssignmentsCount}
                </strong>{' '}
                assignment deadline{activeAssignmentsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
