import React, { useState, useEffect, useMemo } from 'react';
import { QuickCaptureItem, ConvertedEntityType } from '../../types/quickCapture';
import { useTimetable } from '../../context/TimetableContext';
import { Goal, Priority, ScheduledBlock } from '../../types/timetable';
import { TaskInboxItem } from '../../types/executionOS';
import { loadTaskInbox, saveTaskInbox } from '../../utils/taskInboxStorage';
import { loadGoals, saveGoals } from '../../utils/storage';
import { markItemConverted } from '../../utils/quickCaptureStorage';
import {
  getISOWeekString,
  minutesToTimeStr,
  timeStrToMinutes,
  formatDuration,
} from '../../utils/timeUtils';
import {
  playReminderChime,
  requestNotificationPermission,
} from '../../utils/notificationUtils';
import { PRESET_COLORS } from '../Library/BlockModal';
import {
  X,
  ListTodo,
  Calendar,
  Bell,
  Target,
  AlertTriangle,
  Volume2,
  CheckCircle2,
  Sparkles,
  Quote,
} from 'lucide-react';

interface ConvertCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: QuickCaptureItem | null;
  onConverted: (itemId: string, entityType: ConvertedEntityType, entityId: string) => void;
}

export const ConvertCaptureModal: React.FC<ConvertCaptureModalProps> = ({
  isOpen,
  onClose,
  item,
  onConverted,
}) => {
  const { scheduledBlocks, addScheduledBlock, addToast } = useTimetable();

  // Active conversion tab
  const [activeTab, setActiveTab] = useState<ConvertedEntityType>('task');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common Form State
  const [title, setTitle] = useState('');

  // Task-specific state
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskDuration, setTaskDuration] = useState(30);
  const [taskCategory, setTaskCategory] = useState('Work');
  const [taskGoalId, setTaskGoalId] = useState('');

  // Timetable Block-specific state
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTimeStr, setBlockStartTimeStr] = useState('09:00');
  const [blockDuration, setBlockDuration] = useState(60);
  const [blockColor, setBlockColor] = useState('#3B82F6');
  const [blockPriority, setBlockPriority] = useState<Priority>('medium');

  // Reminder-specific state
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(10);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // SMART Goal-specific state
  const [goalSpecific, setGoalSpecific] = useState('');
  const [goalTargetValue, setGoalTargetValue] = useState(10);
  const [goalUnit, setGoalUnit] = useState('hours');
  const [goalCategory, setGoalCategory] = useState('Academics');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalColor, setGoalColor] = useState('#3659C9');

  // Load goals for linking
  const [allGoals, setAllGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (isOpen) {
      setAllGoals(loadGoals());
    }
  }, [isOpen]);

  // Pre-fill form state based on item and NLP extractions
  useEffect(() => {
    if (item && isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);

      const ext = item.extracted;
      const initialType = ext?.suggestedType || 'task';
      setActiveTab(initialType);

      // Title
      setTitle(ext?.suggestedTitle || item.rawText);

      // Date fallback
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const defaultDate = ext?.suggestedDate || todayStr;

      // Time fallback
      const defaultTime =
        ext?.suggestedTimeMinutes !== undefined
          ? minutesToTimeStr(ext.suggestedTimeMinutes)
          : '09:00';

      // Duration fallback
      const defaultDuration = ext?.suggestedDuration || 60;

      // Priority fallback
      const defaultPriority = ext?.suggestedPriority || 'medium';

      // Task fields
      setTaskDeadline(defaultDate);
      setTaskDuration(defaultDuration);
      setTaskPriority(defaultPriority);
      setTaskCategory('Work');
      setTaskGoalId('');

      // Block fields
      setBlockDate(defaultDate);
      setBlockStartTimeStr(defaultTime);
      setBlockDuration(defaultDuration);
      setBlockColor('#3B82F6');
      setBlockPriority(defaultPriority);

      // Reminder fields
      setReminderMinutesBefore(10);

      // Goal fields
      setGoalSpecific(item.rawText);
      setGoalTargetValue(10);
      setGoalUnit('hours');
      setGoalCategory('Academics');
      setGoalDeadline(defaultDate);
      setGoalColor('#3659C9');
    }
  }, [item, isOpen]);

  // Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Real-time schedule conflict check for Timetable Block & Reminder conversions
  const scheduleConflict = useMemo(() => {
    if (activeTab !== 'timetable_block' && activeTab !== 'reminder') return null;
    if (!blockDate || !blockStartTimeStr) return null;

    try {
      const [y, m, d] = blockDate.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d);
      const candidateWeekId = getISOWeekString(targetDate);
      const candidateDayOfWeek = (targetDate.getDay() + 6) % 7;
      const candidateStartMinutes = timeStrToMinutes(blockStartTimeStr);
      const candidateDuration = blockDuration;

      const candidateEndMinutes = candidateStartMinutes + candidateDuration;

      const overlapping = (scheduledBlocks || []).find((b) => {
        if (!b || b.weekId !== candidateWeekId || b.dayOfWeek !== candidateDayOfWeek) {
          return false;
        }
        const bStart = b.startMinutes;
        const bEnd = b.startMinutes + b.duration;
        return Math.max(candidateStartMinutes, bStart) < Math.min(candidateEndMinutes, bEnd);
      });

      if (overlapping) {
        return {
          conflictingBlockTitle: overlapping.title,
          conflictingTime: `${minutesToTimeStr(overlapping.startMinutes)} – ${minutesToTimeStr(overlapping.startMinutes + overlapping.duration)}`,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, [activeTab, blockDate, blockStartTimeStr, blockDuration, scheduledBlocks]);

  if (!isOpen || !item) return null;

  // ── Conversion Execution Handlers ──

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      setErrorMessage('Please provide a title.');
      return;
    }

    // Never silently insert a block into a conflicting slot
    if ((activeTab === 'timetable_block' || activeTab === 'reminder') && scheduleConflict) {
      setErrorMessage(
        `Cannot schedule: Overlaps with existing block "${scheduleConflict.conflictingBlockTitle}" (${scheduleConflict.conflictingTime}). Please adjust the start time or duration.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'task') {
        // 1. Create Task
        const selectedGoal = allGoals.find((g) => g.id === taskGoalId);
        const newTask: TaskInboxItem = {
          id: `task-${Date.now()}`,
          title: title.trim(),
          description: `Converted from capture: "${item.rawText}"`,
          estimatedDuration: taskDuration,
          priority: taskPriority,
          category: taskCategory,
          deadline: taskDeadline || undefined,
          goalId: selectedGoal ? selectedGoal.id : undefined,
          goalTitle: selectedGoal ? selectedGoal.title : undefined,
          status: 'backlog',
          createdAt: Date.now(),
        };

        const existingTasks = loadTaskInbox();
        saveTaskInbox([newTask, ...existingTasks]);
        markItemConverted(item.id, 'task', newTask.id);
        onConverted(item.id, 'task', newTask.id);
        addToast(`Converted to Task: "${newTask.title}"`, 'success');
        onClose();
      } else if (activeTab === 'timetable_block' || activeTab === 'reminder') {
        // 2 & 3. Create Timetable Block or Reminder
        const [y, m, d] = blockDate.split('-').map(Number);
        const targetDate = new Date(y, m - 1, d);
        const dayOfWeek = (targetDate.getDay() + 6) % 7;
        const startMinutes = timeStrToMinutes(blockStartTimeStr);

        const newBlockData: Omit<ScheduledBlock, 'id' | 'weekId'> = {
          blockId: `block-${Date.now()}`,
          title: title.trim(),
          description: `Converted from capture: "${item.rawText}"`,
          color: blockColor,
          priority: blockPriority,
          icon: activeTab === 'reminder' ? 'bell' : 'code',
          dayOfWeek,
          startMinutes,
          duration: blockDuration,
          status: 'scheduled',
          reminderMinutes: activeTab === 'reminder' ? reminderMinutesBefore : undefined,
        };

        addScheduledBlock(newBlockData);
        const entityType = activeTab === 'reminder' ? 'reminder' : 'timetable_block';
        markItemConverted(item.id, entityType, `block-${Date.now()}`);
        onConverted(item.id, entityType, `block-${Date.now()}`);
        addToast(
          activeTab === 'reminder'
            ? `Created Reminder: "${title.trim()}"`
            : `Scheduled block: "${title.trim()}"`,
          'success'
        );
        onClose();
      } else if (activeTab === 'smart_goal') {
        // 4. Create SMART Goal
        const newGoal: Goal = {
          id: `goal-${Date.now()}`,
          title: title.trim(),
          category: goalCategory,
          description: goalSpecific.trim() || item.rawText,
          color: goalColor,
          status: 'active',
          createdAt: Date.now(),
          smart: {
            specificDetails: goalSpecific.trim() || item.rawText,
            measurableType: goalUnit === 'hours' ? 'effort' : 'quantity',
            targetValue: goalTargetValue,
            currentValue: 0,
            unit: goalUnit,
            estimatedTotalHours: goalUnit === 'hours' ? goalTargetValue : 12,
            dailyAvailableHours: 1,
            weeklyAvailableHours: 5,
            preferredDays: [0, 1, 2, 3, 4],
            preferredSessionMinutes: 60,
            preferredEnergyWindow: 'morning',
            feasibilityNote: 'Created via Universal Inbox Quick Capture.',
            motivation: 'Goal converted from quick capture item.',
            startDate: new Date().toISOString().split('T')[0],
            deadline: goalDeadline || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
          },
          targetDate: goalDeadline || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
          targetWeeklyHours: 5,
          preferredSessionMinutes: 60,
          preferredEnergyWindow: 'morning',
          totalRequiredHours: goalUnit === 'hours' ? goalTargetValue : 12,
        };

        const existingGoals = loadGoals();
        saveGoals([newGoal, ...existingGoals]);
        markItemConverted(item.id, 'smart_goal', newGoal.id);
        onConverted(item.id, 'smart_goal', newGoal.id);
        addToast(`Created SMART Goal: "${newGoal.title}"`, 'success');
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Conversion failed. The captured item has been preserved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    if (granted) {
      addToast('Browser notifications enabled', 'success');
    } else {
      addToast('Notifications were not granted by the browser', 'warning');
    }
  };

  const handleTestChime = () => {
    playReminderChime();
    addToast('Playing 7-second harmonic audio chime preview', 'info');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Convert Captured Item
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and confirm details to create a real record
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConvert} className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Original Captured Text Quote Box */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Quote className="w-3.5 h-3.5 text-blue-500" />
              <span>Original Captured Text</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 italic pl-1">
              &ldquo;{item.rawText}&rdquo;
            </p>
          </div>

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Destination Entity Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('task')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'task'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <ListTodo className="w-4 h-4" />
                <span>Task</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('timetable_block')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'timetable_block'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Timetable Block</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reminder')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'reminder'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Reminder</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('smart_goal')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'smart_goal'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>SMART Goal</span>
              </button>
            </div>
          </div>

          {/* Conflict Warning Banner (if schedule conflict detected) */}
          {scheduleConflict && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Schedule Conflict Detected</strong>
                <span>
                  This time slot overlaps with &ldquo;{scheduleConflict.conflictingBlockTitle}&rdquo; ({scheduleConflict.conflictingTime}). Adjust the start time or duration to schedule cleanly.
                </span>
              </div>
            </div>
          )}

          {/* Actionable Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Form Fields: Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* TAB 1: TASK FIELDS */}
          {activeTab === 'task' && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Duration
                  </label>
                  <select
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 capitalize"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Work">Work</option>
                    <option value="Study">Study</option>
                    <option value="Personal">Personal</option>
                    <option value="Project">Project</option>
                  </select>
                </div>
              </div>

              {allGoals.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Link to Goal (Optional)
                  </label>
                  <select
                    value={taskGoalId}
                    onChange={(e) => setTaskGoalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None</option>
                    {allGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 & 3: TIMETABLE BLOCK / REMINDER FIELDS */}
          {(activeTab === 'timetable_block' || activeTab === 'reminder') && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={blockStartTimeStr}
                    onChange={(e) => setBlockStartTimeStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration
                  </label>
                  <select
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={blockPriority}
                    onChange={(e) => setBlockPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 capitalize"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Reminder specific settings */}
              {activeTab === 'reminder' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Alert Trigger Time
                    </label>
                    <button
                      type="button"
                      onClick={handleTestChime}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Test Audio Chime</span>
                    </button>
                  </div>

                  <select
                    value={reminderMinutesBefore}
                    onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={0}>At start of activity (0m)</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                  </select>

                  {!notificationPermissionGranted && (
                    <button
                      type="button"
                      onClick={handleEnableNotifications}
                      className="w-full py-1.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Enable Browser Push Notifications</span>
                    </button>
                  )}
                </div>
              )}

              {/* Color Accent Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color Accent
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.slice(0, 8).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBlockColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        blockColor === c ? 'scale-110 border-white shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SMART GOAL FIELDS */}
          {activeTab === 'smart_goal' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specific Details (What will you achieve?)
                </label>
                <textarea
                  rows={2}
                  value={goalSpecific}
                  onChange={(e) => setGoalSpecific(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Measurable Value
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={goalTargetValue}
                    onChange={(e) => setGoalTargetValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Measurement Unit
                  </label>
                  <select
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="hours">Hours</option>
                    <option value="chapters">Chapters</option>
                    <option value="problems">Problems</option>
                    <option value="modules">Modules</option>
                    <option value="assignments">Assignments</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Academics">Academics</option>
                    <option value="Career & Work">Career & Work</option>
                    <option value="Skill Development">Skill Development</option>
                    <option value="Fitness & Health">Fitness & Health</option>
                    <option value="Personal Growth">Personal Growth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || ((activeTab === 'timetable_block' || activeTab === 'reminder') && !!scheduleConflict)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
            >
              {isSubmitting
                ? 'Creating...'
                : `Confirm & Create ${activeTab === 'smart_goal' ? 'Goal' : activeTab === 'timetable_block' ? 'Block' : activeTab === 'reminder' ? 'Reminder' : 'Task'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
