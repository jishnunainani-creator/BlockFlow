import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TaskInboxItem } from '../../types/executionOS';
import { Priority } from '../../types/timetable';
import { loadTaskInbox, saveTaskInbox, loadPersonalRules } from '../../utils/taskInboxStorage';
import { calculateDeadlineRisk } from '../../utils/deadlineEngine';
import { findCentralizedScheduleSlot } from '../../utils/centralPlanningEngine';
import { useTimetable } from '../../context/TimetableContext';
import { loadGoals } from '../../utils/storage';
import { Goal } from '../../types/timetable';
import {
  Inbox,
  Plus,
  Sparkles,
  Trash2,
  X,
  Lock,
  Target,
} from 'lucide-react';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';

interface TaskInboxViewProps {
  onNavigate?: (view: NavView) => void;
}

export const TaskInboxView: React.FC<TaskInboxViewProps> = ({ onNavigate }) => {
  const { currentWeekScheduledBlocks, addScheduledBlock, addToast } = useTimetable();
  const [tasks, setTasks] = useState<TaskInboxItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Work');
  const [deadline, setDeadline] = useState('');
  const [goalId, setGoalId] = useState('');
  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    setTasks(loadTaskInbox());
    setGoals(loadGoals());
  }, []);

  const tasksWithRisk = useMemo(() => {
    return tasks.map((t) => ({
      task: t,
      risk: calculateDeadlineRisk(t, currentWeekScheduledBlocks),
    }));
  }, [tasks, currentWeekScheduledBlocks]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedGoal = goals.find((g) => g.id === goalId);

    const newTask: TaskInboxItem = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      estimatedDuration,
      priority,
      category,
      deadline: deadline || undefined,
      goalId: selectedGoal ? selectedGoal.id : undefined,
      goalTitle: selectedGoal ? selectedGoal.title : undefined,
      isFixed,
      status: 'backlog',
      createdAt: Date.now(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTaskInbox(updated);
    addToast(`Added "${newTask.title}" to backlog`, 'success');

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  const handleAIScheduleTask = (task: TaskInboxItem) => {
    const personalRules = loadPersonalRules();
    const rec = findCentralizedScheduleSlot({
      task,
      existingBlocks: currentWeekScheduledBlocks,
      personalRules,
    });

    addScheduledBlock({
      blockId: `lib-task-${task.id}`,
      title: task.title,
      description: task.description || `Task from Inbox: ${task.title}`,
      color: task.isFixed ? '#0EA5E9' : '#3659C9',
      priority: task.priority,
      icon: 'check-square',
      dayOfWeek: rec.dayOfWeek,
      startMinutes: rec.startMinutes,
      duration: rec.duration,
      status: 'not_started',
      isFixed: task.isFixed,
      taskId: task.id,
      goalId: task.goalId,
      goalTitle: task.goalTitle,
    });

    // Update task status to scheduled
    const updatedTasks = tasks.map((t) => (t.id === task.id ? { ...t, status: 'scheduled' as const } : t));
    setTasks(updatedTasks);
    saveTaskInbox(updatedTasks);

    addToast(`Scheduled "${task.title}" to timetable`, 'success');
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveTaskInbox(updated);
    addToast('Task removed', 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-5 sm:p-8 space-y-5 select-none scrollbar-thin">
      {/* ── BREADCRUMB ── */}
      {onNavigate && (
        <PageBreadcrumb
          items={[{ label: 'Task Inbox' }]}
          onNavigate={onNavigate}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-[#3659C9]" />
            <span>Task Inbox</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Capture unscheduled tasks to place into your schedule ({tasks.length} items)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#3659C9]" />
                <span>Add Task to Backlog</span>
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Prepare presentation, Review document"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3659C9]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-[#3659C9]"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (mins)</label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#3659C9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deadline (Optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-[#3659C9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Link to Goal</label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-[#3659C9]"
                >
                  <option value="">-- No Linked Goal --</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFixed"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-4 h-4 accent-[#3659C9] rounded cursor-pointer"
              />
              <label htmlFor="isFixed" className="text-xs text-slate-300 cursor-pointer">
                Fixed Commitment (Cannot be rescheduled)
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Add to Backlog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List or Clean Empty State */}
      {tasks.length > 0 ? (
        <div className="space-y-2.5">
          {tasksWithRisk.map(({ task: t, risk }) => {

            return (
              <div
                key={t.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 font-mono">
                      {t.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${risk.badgeColorClass}`}>
                      {risk.badgeLabel}
                    </span>
                    {t.isFixed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                        <Lock size={10} /> Fixed
                      </span>
                    )}
                    {t.status === 'scheduled' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        Scheduled
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white leading-tight">{t.title}</h3>
                  {t.goalTitle && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Target size={12} className="text-[#3659C9]" /> Goal: {t.goalTitle}
                    </span>
                  )}
                  <p className="text-[11px] text-slate-400">{risk.explanation}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-xs font-mono text-slate-400">{t.estimatedDuration}m</span>
                  {t.status !== 'scheduled' && (
                    <button
                      onClick={() => handleAIScheduleTask(t)}
                      className="px-3 py-1.5 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={12} /> Auto-Schedule
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md transition-colors"
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3 max-w-md mx-auto my-8">
          <Inbox size={28} className="text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Your Task Backlog is Empty</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Capture quick items here to schedule them when you plan your week.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Add First Task
          </button>
        </div>
      )}
    </div>
  );
};
