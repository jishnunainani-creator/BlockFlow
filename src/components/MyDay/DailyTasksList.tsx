import React from 'react';
import { TaskInboxItem } from '../../types/executionOS';
import {
  ListTodo,
  CheckCircle2,
  Circle,
  Plus,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowUpRight,
  Play,
} from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

interface DailyTasksListProps {
  tasks: TaskInboxItem[];
  selectedDate: Date;
  onToggleTaskComplete: (taskId: string) => void;
  onOpenAddTask: () => void;
  onNavigateToInbox?: () => void;
  onStartFocus?: (task: TaskInboxItem) => void;
}

export const DailyTasksList: React.FC<DailyTasksListProps> = ({
  tasks,
  selectedDate,
  onToggleTaskComplete,
  onOpenAddTask,
  onNavigateToInbox,
  onStartFocus,
}) => {
  const selectedYMD = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  // Partition tasks into:
  // 1. Overdue incomplete tasks (deadline < selectedYMD)
  // 2. Due on selectedDate
  // 3. Other pending backlog tasks
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'archived' && t.deadline && t.deadline < selectedYMD
  );

  const dueOnDateTasks = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'archived' &&
      t.deadline === selectedYMD
  );

  const completedTodayTasks = tasks.filter(
    (t) => t.status === 'completed' && (t.deadline === selectedYMD || !t.deadline)
  );

  const totalActionableTasks = overdueTasks.length + dueOnDateTasks.length;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Priority Tasks
          </h2>
          <span className="text-xs text-slate-500 font-medium">({totalActionableTasks})</span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToInbox && (
            <button
              type="button"
              onClick={onNavigateToInbox}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Task Inbox →
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAddTask}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {totalActionableTasks === 0 && completedTodayTasks.length === 0 ? (
        /* Empty State */
        <div className="py-6 text-center space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No pending tasks due for this day.
          </p>
          <button
            type="button"
            onClick={onOpenAddTask}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create a task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 1. Overdue Tasks Section */}
          {overdueTasks.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" />
                <span>Overdue from previous dates ({overdueTasks.length})</span>
              </div>

              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-2.5 p-2.5 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 transition-all hover:border-rose-300"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleTaskComplete(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                      title="Mark task completed"
                    >
                      <Circle className="w-4 h-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {task.title}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          Due: {task.deadline}
                        </span>
                        {task.estimatedDuration && (
                          <>
                            <span>·</span>
                            <span>{formatDuration(task.estimatedDuration)}</span>
                          </>
                        )}
                        {task.priority && (
                          <>
                            <span>·</span>
                            <span className="capitalize">{task.priority}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {onStartFocus && (
                    <button
                      type="button"
                      onClick={() => onStartFocus(task)}
                      title="Start Focus Session on this task"
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 2. Tasks Due Today */}
          {dueOnDateTasks.length > 0 && (
            <div className="space-y-1.5">
              {overdueTasks.length > 0 && (
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-1">
                  Due on this date ({dueOnDateTasks.length})
                </div>
              )}

              {dueOnDateTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleTaskComplete(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                      title="Mark task completed"
                    >
                      <Circle className="w-4 h-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {task.title}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        {task.priority && (
                          <span
                            className={`capitalize font-medium ${
                              task.priority === 'high'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}
                        {task.estimatedDuration && (
                          <>
                            <span>·</span>
                            <span>{formatDuration(task.estimatedDuration)}</span>
                          </>
                        )}
                        {task.goalTitle && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[120px] text-indigo-600 dark:text-indigo-400">
                              {task.goalTitle}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {onStartFocus && (
                    <button
                      type="button"
                      onClick={() => onStartFocus(task)}
                      title="Start Focus Session on this task"
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 3. Completed Tasks */}
          {completedTodayTasks.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Completed ({completedTodayTasks.length})
              </div>

              {completedTodayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-1.5 text-xs text-slate-400 line-through"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTaskComplete(task.id)}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-slate-400 transition-colors shrink-0"
                    title="Mark uncompleted"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <span className="truncate">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
