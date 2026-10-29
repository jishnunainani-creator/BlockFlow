import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TaskInboxItem } from '../../types/executionOS';
import { Priority } from '../../types/timetable';
import { loadTaskInbox, saveTaskInbox, loadPersonalRules } from '../../utils/taskInboxStorage';
import { recordLocalTombstone } from '../../lib/storageRepository';
import { calculateDeadlineRisk } from '../../utils/deadlineEngine';
import { findCentralizedScheduleSlot } from '../../utils/centralPlanningEngine';
import { useTimetable } from '../../context/TimetableContext';
import { loadGoals } from '../../utils/storage';
import { Goal } from '../../types/timetable';
import { QuickCaptureItem, CaptureStatus, ConvertedEntityType } from '../../types/quickCapture';
import {
  loadQuickCaptureItems,
  saveQuickCaptureItems,
  addQuickCaptureItem,
  updateQuickCaptureItem,
  archiveQuickCaptureItem,
  restoreQuickCaptureItem,
  deleteQuickCaptureItem,
} from '../../utils/quickCaptureStorage';
import { QuickCaptureModal } from '../QuickCapture/QuickCaptureModal';
import { ConvertCaptureModal } from '../QuickCapture/ConvertCaptureModal';

import {
  Inbox,
  Plus,
  Sparkles,
  Trash2,
  X,
  Lock,
  Target,
  Zap,
  Edit2,
  Archive,
  RotateCcw,
  CheckCircle2,
  Clock,
  Calendar,
  Bell,
  Search,
  ListTodo,
  ArrowRight,
  Filter,
  Play,
} from 'lucide-react';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';

interface TaskInboxViewProps {
  onNavigate?: (view: NavView) => void;
  onStartFocusMode?: (target?: {
    title?: string;
    blockId?: string;
    taskId?: string;
    goalId?: string;
    plannedDurationMinutes?: number;
  }) => void;
}

export const TaskInboxView: React.FC<TaskInboxViewProps> = ({ onNavigate, onStartFocusMode }) => {
  const { currentWeekScheduledBlocks, addScheduledBlock, addToast } = useTimetable();

  // Active view tab: 'captures' (Universal Inbox) or 'tasks' (Organized Backlog)
  const [activeTab, setActiveTab] = useState<'captures' | 'tasks'>('captures');

  // Quick Capture Items State
  const [captureItems, setCaptureItems] = useState<QuickCaptureItem[]>(() => loadQuickCaptureItems());
  const [captureFilter, setCaptureFilter] = useState<'all' | 'unprocessed' | 'processed' | 'archived'>('unprocessed');
  const [captureSearchQuery, setCaptureSearchQuery] = useState('');
  const [inlineCaptureText, setInlineCaptureText] = useState('');

  // Modals State
  const [isQuickCaptureModalOpen, setIsQuickCaptureModalOpen] = useState(false);
  const [convertingCaptureItem, setConvertingCaptureItem] = useState<QuickCaptureItem | null>(null);
  const [editingCaptureItem, setEditingCaptureItem] = useState<QuickCaptureItem | null>(null);
  const [editedText, setEditedText] = useState('');

  // Tasks State
  const [tasks, setTasks] = useState<TaskInboxItem[]>(() => loadTaskInbox());
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Work');
  const [deadline, setDeadline] = useState('');
  const [goalId, setGoalId] = useState('');
  const [isFixed, setIsFixed] = useState(false);

  // Sync on mount & external storage changes
  useEffect(() => {
    setCaptureItems(loadQuickCaptureItems());
    setTasks(loadTaskInbox());
    setGoals(loadGoals());

    const handleSync = () => {
      setCaptureItems(loadQuickCaptureItems());
      setTasks(loadTaskInbox());
    };
    window.addEventListener('blockflow_quick_capture_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('blockflow_quick_capture_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const refreshCaptures = useCallback(() => {
    setCaptureItems(loadQuickCaptureItems());
  }, []);

  const refreshTasks = useCallback(() => {
    setTasks(loadTaskInbox());
  }, []);

  // Filtered Captures
  const filteredCaptures = useMemo(() => {
    const q = captureSearchQuery.trim().toLowerCase();
    return captureItems.filter((item) => {
      // Status filter
      if (captureFilter !== 'all' && item.status !== captureFilter) {
        return false;
      }
      // Search query
      if (q) {
        const textMatch = item.rawText.toLowerCase().includes(q);
        const notesMatch = item.notes?.toLowerCase().includes(q);
        return textMatch || notesMatch;
      }
      return true;
    });
  }, [captureItems, captureFilter, captureSearchQuery]);

  const unprocessedCount = useMemo(() => {
    return captureItems.filter((item) => item.status === 'unprocessed').length;
  }, [captureItems]);

  // Tasks with risk
  const tasksWithRisk = useMemo(() => {
    return tasks.map((t) => ({
      task: t,
      risk: calculateDeadlineRisk(t, currentWeekScheduledBlocks),
    }));
  }, [tasks, currentWeekScheduledBlocks]);

  // ── Inline Capture Handler ──
  const handleInlineCapture = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inlineCaptureText.trim();
    if (!text) return;

    addQuickCaptureItem(text);
    setInlineCaptureText('');
    refreshCaptures();
    addToast('Item captured to Universal Inbox', 'success');
  };

  // ── Capture Action Handlers ──
  const handleArchiveCapture = (id: string) => {
    archiveQuickCaptureItem(id);
    refreshCaptures();
    addToast('Item archived', 'info');
  };

  const handleRestoreCapture = (id: string) => {
    restoreQuickCaptureItem(id);
    refreshCaptures();
    addToast('Item restored to unprocessed', 'info');
  };

  const handleDeleteCapture = (id: string) => {
    if (window.confirm('Delete this captured item permanently?')) {
      deleteQuickCaptureItem(id);
      refreshCaptures();
      addToast('Item deleted', 'info');
    }
  };

  const handleSaveEditedText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaptureItem || !editedText.trim()) return;

    updateQuickCaptureItem(editingCaptureItem.id, { rawText: editedText.trim() });
    setEditingCaptureItem(null);
    setEditedText('');
    refreshCaptures();
    addToast('Capture updated', 'success');
  };

  // ── Task Handlers ──
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
    setIsTaskModalOpen(false);
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

    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: 'scheduled' as const } : t
    );
    setTasks(updatedTasks);
    saveTaskInbox(updatedTasks);

    addToast(`Scheduled "${task.title}" to timetable`, 'success');
  };

  const handleDeleteTask = (taskId: string) => {
    recordLocalTombstone('tasks', taskId);
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveTaskInbox(updated);
    addToast('Task removed', 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 select-none scrollbar-thin">
      {/* ── BREADCRUMB ── */}
      <PageBreadcrumb items={[{ label: 'Universal Inbox' }]} onNavigate={onNavigate} />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Inbox className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Universal Inbox</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Capture raw ideas, manage tasks, and convert items into real schedule commitments
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsQuickCaptureModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Quick Capture</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* ── INLINE QUICK CAPTURE BAR ── */}
      <form onSubmit={handleInlineCapture} className="relative">
        <input
          type="text"
          value={inlineCaptureText}
          onChange={(e) => setInlineCaptureText(e.target.value)}
          placeholder="Capture anything fast... e.g., 'Finish DSA problem sheet by Friday' or 'Study at 2 PM for 1h'"
          className="w-full pl-4 pr-24 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
        />
        <button
          type="submit"
          disabled={!inlineCaptureText.trim()}
          className="absolute right-2 top-2 bottom-2 px-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Capture</span>
        </button>
      </form>

      {/* ── SEGMENTED VIEW TABS ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('captures')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'captures'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Universal Inbox</span>
          {unprocessedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
              {unprocessedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'tasks'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Organized Tasks</span>
          <span className="text-slate-400 text-xs">({tasks.length})</span>
        </button>
      </div>

      {/* ── TAB 1: UNIVERSAL INBOX (CAPTURES) ── */}
      {activeTab === 'captures' && (
        <div className="space-y-4">
          {/* Filter Chips & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>

              {(['unprocessed', 'all', 'processed', 'archived'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCaptureFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    captureFilter === f
                      ? 'bg-slate-800 text-white border-slate-700 dark:bg-slate-800'
                      : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f === 'unprocessed' ? `Unprocessed (${unprocessedCount})` : f}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={captureSearchQuery}
                onChange={(e) => setCaptureSearchQuery(e.target.value)}
                placeholder="Search captures..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Captures List */}
          {filteredCaptures.length > 0 ? (
            <div className="space-y-2.5">
              {filteredCaptures.map((item) => {
                const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left side: text, status, suggestion */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status Badge */}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                              item.status === 'unprocessed'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                : item.status === 'processed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {item.status === 'processed' && item.convertedTo
                              ? `Converted to ${item.convertedTo.replace('_', ' ')}`
                              : item.status}
                          </span>

                          <span className="text-[11px] text-slate-400">{dateStr}</span>

                          {/* Extracted NLP Suggestion Badge */}
                          {item.extracted && item.status === 'unprocessed' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/40">
                              <Sparkles className="w-3 h-3" />
                              <span className="capitalize">
                                Suggested: {item.extracted.suggestedType.replace('_', ' ')}
                                {item.extracted.suggestedDate ? ` · ${item.extracted.suggestedDate}` : ''}
                                {item.extracted.suggestedDuration ? ` · ${item.extracted.suggestedDuration}m` : ''}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Raw text */}
                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                          {item.rawText}
                        </p>

                        {/* Notes if present */}
                        {item.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Notes: {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Right side: Conversion & Management Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === 'unprocessed' && (
                          <button
                            type="button"
                            onClick={() => setConvertingCaptureItem(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Convert</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setEditingCaptureItem(item);
                            setEditedText(item.rawText);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit text"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {item.status === 'archived' ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreCapture(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArchiveCapture(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Archive"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteCapture(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="py-12 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {captureFilter === 'unprocessed'
                  ? 'Your Universal Inbox is clear'
                  : 'No captured items match filter'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                {captureFilter === 'unprocessed'
                  ? 'Use the capture bar above to quickly record thoughts, assignments, and goals without losing momentum.'
                  : 'Try selecting a different filter above to view processed or archived items.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: STRUCTURED TASKS (EXISTING BACKLOG) ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Structured task backlog ({tasks.length} items)
            </span>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-2.5">
              {tasksWithRisk.map(({ task: t, risk }) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 font-mono">
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Scheduled
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                      {t.title}
                    </h3>
                    {t.goalTitle && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Target size={12} className="text-[#3659C9]" /> Goal: {t.goalTitle}
                      </span>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{risk.explanation}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-mono text-slate-500">{t.estimatedDuration}m</span>
                    {onStartFocusMode && (
                      <button
                        onClick={() =>
                          onStartFocusMode({
                            title: t.title,
                            taskId: t.id,
                            plannedDurationMinutes: t.estimatedDuration,
                            goalId: t.goalId,
                          })
                        }
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
                        title="Start Focus Session on this task"
                      >
                        <Play size={12} className="fill-current text-indigo-400" />
                        <span>Focus</span>
                      </button>
                    )}
                    {t.status !== 'scheduled' && (
                      <button
                        onClick={() => handleAIScheduleTask(t)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Sparkles size={12} /> Auto-Schedule
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 rounded-md transition-colors"
                      title="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3 max-w-md mx-auto my-8">
              <Inbox size={28} className="text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Your Task Backlog is Empty
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Add structured tasks or convert captured items into tasks to place them on your schedule.
              </p>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Add First Task
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: QUICK CAPTURE ── */}
      {isQuickCaptureModalOpen && (
        <QuickCaptureModal
          isOpen={isQuickCaptureModalOpen}
          onClose={() => setIsQuickCaptureModalOpen(false)}
          onSaved={() => {
            refreshCaptures();
            addToast('Saved to Universal Inbox', 'success');
          }}
          onSaveAndConvert={(item) => {
            refreshCaptures();
            setConvertingCaptureItem(item);
          }}
        />
      )}

      {/* ── MODAL: CONVERT CAPTURE ── */}
      {convertingCaptureItem && (
        <ConvertCaptureModal
          isOpen={Boolean(convertingCaptureItem)}
          onClose={() => setConvertingCaptureItem(null)}
          item={convertingCaptureItem}
          onConverted={() => {
            refreshCaptures();
            refreshTasks();
          }}
        />
      )}

      {/* ── MODAL: EDIT CAPTURE TEXT ── */}
      {editingCaptureItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
          onClick={() => setEditingCaptureItem(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Captured Text
              </h3>
              <button
                type="button"
                onClick={() => setEditingCaptureItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedText} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Captured Text
                </label>
                <textarea
                  rows={3}
                  required
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCaptureItem(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE STRUCTURED TASK ── */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleCreateTask}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-blue-600" />
                <span>Add Task to Backlog</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Prepare presentation, Review document"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link to Goal
                </label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
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
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="isFixed" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                Fixed Commitment (Cannot be rescheduled)
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Add to Backlog
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
