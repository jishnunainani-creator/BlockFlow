import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { NavView } from '../Navigation/Sidebar';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import { Priority, ScheduledBlock, Goal } from '../../types/timetable';
import { TaskInboxItem, Assignment } from '../../types/executionOS';
import { loadTaskInbox, saveTaskInbox } from '../../utils/taskInboxStorage';
import { loadAssignments, saveAssignments } from '../../utils/assignmentStorage';
import { loadGoals, saveGoals, normalizeGoal } from '../../utils/storage';
import { getISOWeekString, minutesToTimeStr, timeStrToMinutes } from '../../utils/timeUtils';
import { checkBlockCollision, suggestFreeTimeSlots } from '../../utils/conflictUtils';
import { BlockFlowLogo } from '../Brand/BlockFlowLogo';
import { PWAInstallBanner } from '../PWA/PWAInstallBanner';
import {
  CheckSquare,
  BookOpen,
  Target,
  Calendar,
  Zap,
  ArrowRight,
  Sun,
  Moon,
  Paperclip,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  Image,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type CaptureType = 'task' | 'assignment' | 'goal' | 'block';

interface MobileQuickCaptureViewProps {
  onNavigate: (view: NavView) => void;
  userEmail?: string | null;
  onOpenAuth?: () => void;
}

interface AttachmentFile {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  isImage: boolean;
}

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export const MobileQuickCaptureView: React.FC<MobileQuickCaptureViewProps> = ({
  onNavigate,
  userEmail,
  onOpenAuth,
}) => {
  const { theme, setTheme } = useTheme();
  const { scheduledBlocks, addScheduledBlock, addToast } = useTimetable();

  // ── 1. CORE CAPTURE FORM STATE ──
  const [captureType, setCaptureType] = useState<CaptureType>('task');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  // Common date helpers
  const todayYMD = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // ── 2. TYPE-SPECIFIC FIELDS ──
  // Task specific
  const [taskDueDate, setTaskDueDate] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');

  // Assignment specific
  const [assignmentSubject, setAssignmentSubject] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState(todayYMD);
  const [assignmentDueTime, setAssignmentDueTime] = useState('23:59');
  const [assignmentPriority, setAssignmentPriority] = useState<Priority>('high');
  const [assignmentEstHours, setAssignmentEstHours] = useState('2');

  // SMART Goal specific
  const [goalCategory, setGoalCategory] = useState('Academics');
  const [goalTargetValue, setGoalTargetValue] = useState('10');
  const [goalUnit, setGoalUnit] = useState('chapters');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalMotivation, setGoalMotivation] = useState('');

  // Schedule Block specific
  const [blockDate, setBlockDate] = useState(todayYMD);
  const [blockStartTime, setBlockStartTime] = useState(() => {
    const now = new Date();
    // Default to the next clean hour
    const nextHour = (now.getHours() + 1) % 24;
    return `${String(nextHour).padStart(2, '0')}:00`;
  });
  const [blockDurationMinutes, setBlockDurationMinutes] = useState('60');
  const [blockColor, setBlockColor] = useState('#3B82F6');
  const [blockPriority, setBlockPriority] = useState<Priority>('medium');

  // Attachment state
  const [attachment, setAttachment] = useState<AttachmentFile | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{
    type: CaptureType;
    title: string;
    targetView: NavView;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Textarea focus ref
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus title field on mount or type reset
  useEffect(() => {
    if (!submitSuccess && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [submitSuccess]);

  // ── 3. COLLISION DETECTION FOR SCHEDULE BLOCKS ──
  const scheduleCollision = useMemo(() => {
    if (captureType !== 'block' || !blockDate || !blockStartTime) return null;

    try {
      const [year, month, day] = blockDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const weekId = getISOWeekString(dateObj);
      const dayOfWeek = (dateObj.getDay() + 6) % 7;
      const startMins = timeStrToMinutes(blockStartTime);
      const dur = parseInt(blockDurationMinutes, 10) || 60;

      return checkBlockCollision(weekId, dayOfWeek, startMins, dur, scheduledBlocks || []);
    } catch {
      return null;
    }
  }, [captureType, blockDate, blockStartTime, blockDurationMinutes, scheduledBlocks]);

  // Suggested free slots when there is a collision
  const suggestedSlots = useMemo(() => {
    if (!scheduleCollision?.hasConflict || !blockDate) return [];
    try {
      const [year, month, day] = blockDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = (dateObj.getDay() + 6) % 7;
      const dur = parseInt(blockDurationMinutes, 10) || 60;
      return suggestFreeTimeSlots(dayOfWeek, dur, scheduledBlocks || []);
    } catch {
      return [];
    }
  }, [scheduleCollision, blockDate, blockDurationMinutes, scheduledBlocks]);

  // ── 4. ATTACHMENT HANDLER ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError('File is too large. Maximum supported size is 5 MB.');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = () => {
      setAttachment({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        isImage,
      });
    };

    reader.onerror = () => {
      setAttachmentError('Failed to read selected file.');
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── 5. SUBMISSION HANDLERS PER CAPTURE TYPE ──
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const trimmedTitle = title.trim();
      const trimmedNotes = notes.trim();

      if (captureType === 'task') {
        // A. Task Inbox Workflow
        const existingTasks = loadTaskInbox();
        const newTask: TaskInboxItem = {
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: trimmedTitle,
          description: trimmedNotes || undefined,
          estimatedDuration: 30,
          estimatedMinutes: 30,
          priority: taskPriority,
          deadline: taskDueDate || undefined,
          category: 'General',
          status: 'backlog',
          createdAt: Date.now(),
        };

        saveTaskInbox([newTask, ...existingTasks]);
        window.dispatchEvent(new CustomEvent('blockflow_tasks_changed'));
        addToast(`Task "${trimmedTitle}" saved to Inbox`, 'success');

        setSubmitSuccess({
          type: 'task',
          title: trimmedTitle,
          targetView: 'task-inbox',
        });
      } else if (captureType === 'assignment') {
        // B. Assignment Tracker Workflow
        const existingAssignments = loadAssignments();
        const dueDateTimeStr = assignmentDueTime
          ? `${assignmentDueDate}T${assignmentDueTime}`
          : assignmentDueDate;

        const newAssignment: Assignment = {
          id: `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          subject: assignmentSubject.trim() || 'General Coursework',
          title: trimmedTitle,
          description: trimmedNotes || undefined,
          dueDate: dueDateTimeStr,
          priority: assignmentPriority,
          estimatedHours: parseFloat(assignmentEstHours) || 2,
          progressPct: 0,
          status: 'pending',
        };

        saveAssignments([newAssignment, ...existingAssignments]);
        window.dispatchEvent(new CustomEvent('blockflow_assignments_changed'));
        addToast(`Assignment "${trimmedTitle}" tracked successfully`, 'success');

        setSubmitSuccess({
          type: 'assignment',
          title: trimmedTitle,
          targetView: 'assignments',
        });
      } else if (captureType === 'goal') {
        // C. SMART Goal Workflow
        const existingGoals = loadGoals();
        const targetVal = parseFloat(goalTargetValue) || 10;

        const rawGoal: Partial<Goal> = {
          id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: trimmedTitle,
          category: goalCategory,
          description: trimmedNotes || undefined,
          color: '#3659C9',
          status: 'active',
          createdAt: Date.now(),
          deadline: goalDeadline || undefined,
          smart: {
            specificDetails: trimmedNotes || trimmedTitle,
            measurableType: goalUnit.toLowerCase().includes('hour') ? 'effort' : 'quantity',
            targetValue: targetVal,
            currentValue: 0,
            unit: goalUnit.trim() || 'milestones',
            deadline: goalDeadline || undefined,
            motivation: goalMotivation.trim() || undefined,
            estimatedTotalHours: targetVal * 2,
            dailyAvailableHours: 1,
            weeklyAvailableHours: 5,
            preferredDays: [0, 2, 4],
            preferredSessionMinutes: 60,
            preferredEnergyWindow: 'morning',
          },
        };

        const normalized = normalizeGoal(rawGoal);
        saveGoals([...existingGoals, normalized]);
        window.dispatchEvent(new CustomEvent('blockflow_goals_changed'));
        addToast(`SMART Goal "${trimmedTitle}" created`, 'success');

        setSubmitSuccess({
          type: 'goal',
          title: trimmedTitle,
          targetView: 'goals',
        });
      } else if (captureType === 'block') {
        // D. Schedule Block Workflow
        if (scheduleCollision?.hasConflict) {
          throw new Error(
            scheduleCollision.message || 'Time slot collides with an existing block on your schedule.'
          );
        }

        const [year, month, day] = blockDate.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const weekId = getISOWeekString(dateObj);
        const dayOfWeek = (dateObj.getDay() + 6) % 7;
        const startMins = timeStrToMinutes(blockStartTime);
        const durationMins = parseInt(blockDurationMinutes, 10) || 60;

        addScheduledBlock({
          blockId: `block-qc-${Date.now()}`,
          title: trimmedTitle,
          description: trimmedNotes || undefined,
          color: blockColor,
          priority: blockPriority,
          icon: 'calendar',
          dayOfWeek,
          startMinutes: startMins,
          duration: durationMins,
          status: 'scheduled',
        });

        addToast(`Block "${trimmedTitle}" scheduled on ${blockDate}`, 'success');

        setSubmitSuccess({
          type: 'block',
          title: trimmedTitle,
          targetView: 'calendar',
        });
      }
    } catch (err: any) {
      console.error('Failed to quick capture item:', err);
      setErrorMessage(err.message || 'Failed to save item. Please check the fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    notes,
    captureType,
    taskDueDate,
    taskPriority,
    assignmentSubject,
    assignmentDueDate,
    assignmentDueTime,
    assignmentPriority,
    assignmentEstHours,
    goalCategory,
    goalTargetValue,
    goalUnit,
    goalDeadline,
    goalMotivation,
    blockDate,
    blockStartTime,
    blockDurationMinutes,
    blockColor,
    blockPriority,
    scheduleCollision,
    addScheduledBlock,
    addToast,
    isSubmitting,
  ]);

  const handleCaptureAnother = () => {
    setTitle('');
    setNotes('');
    setAttachment(null);
    setAttachmentError(null);
    setSubmitSuccess(null);
    setErrorMessage(null);
    setShowOptionalDetails(false);
  };

  const isFormValid = title.trim().length > 0 && (!scheduleCollision?.hasConflict || captureType !== 'block');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* ── DESKTOP AMBIENT BANNER (Only visible on wide screens ≥ 768px) ── */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold">Mobile Quick Capture Mode</span>
          <span className="text-blue-600/70 dark:text-blue-400/70">
            · Fast companion entry for phones & tablets
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="font-medium text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Open Full Dashboard</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* ── COMPACT MOBILE COMPANION HEADER ── */}
      <header className="sticky top-0 z-20 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity"
            title="Open BlockFlow Dashboard"
            aria-label="Open BlockFlow Dashboard"
          >
            <BlockFlowLogo size="sm" />
            <div className="text-left">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                BlockFlow
              </h1>
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                Quick Capture
              </span>
            </div>
          </button>
        </div>

        {/* Right Header Actions: Theme Toggle, Install Action & Exit Link */}
        <div className="flex items-center gap-1.5">
          <PWAInstallBanner variant="button" />

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <span className="hidden sm:inline">Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── MAIN SCROLLABLE CAPTURE CONTAINER ── */}
      <main className="flex-1 overflow-y-auto px-4 py-5 max-w-xl w-full mx-auto space-y-4 pb-12">
        {/* PWA Install Ambient Banner & Offline Indicator */}
        <PWAInstallBanner variant="banner" />

        {/* ── SUCCESS NOTIFICATION OVERLAY CARD ── */}
        {submitSuccess ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 shadow-md text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Saved to BlockFlow!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 px-2">
                "{submitSuccess.title}" was added to your{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {submitSuccess.type === 'task'
                    ? 'Task Inbox'
                    : submitSuccess.type === 'assignment'
                    ? 'Assignment Tracker'
                    : submitSuccess.type === 'goal'
                    ? 'SMART Goals'
                    : 'Schedule'}
                </span>
                .
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleCaptureAnother}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Capture Another Item</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate(submitSuccess.targetView)}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl transition-colors truncate"
                >
                  View in {submitSuccess.type}
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-xl transition-colors truncate"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── 1. PRIMARY MULTILINE CAPTURE FIELD ── */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-2 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <label htmlFor="quick-capture-title" className="sr-only">
                Item Title or Description
              </label>
              <textarea
                ref={titleInputRef}
                id="quick-capture-title"
                rows={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need to remember?"
                className="w-full bg-transparent resize-none text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none leading-relaxed"
                style={{ fontSize: '16px' }} // Prevents iOS mobile auto-zoom
                aria-label="Item title or description"
                required
              />

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                <span>Fast single-handed mobile entry</span>
                <span>{title.length} characters</span>
              </div>
            </div>

            {/* ── 2. CAPTURE DESTINATION TYPE SELECTOR ── */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Save As:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Task */}
                <button
                  type="button"
                  onClick={() => setCaptureType('task')}
                  className={`h-11 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    captureType === 'task'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Task Inbox</span>
                </button>

                {/* 2. Assignment */}
                <button
                  type="button"
                  onClick={() => setCaptureType('assignment')}
                  className={`h-11 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    captureType === 'assignment'
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Assignment</span>
                </button>

                {/* 3. SMART Goal */}
                <button
                  type="button"
                  onClick={() => setCaptureType('goal')}
                  className={`h-11 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    captureType === 'goal'
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 dark:border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>SMART Goal</span>
                </button>

                {/* 4. Schedule Block */}
                <button
                  type="button"
                  onClick={() => setCaptureType('block')}
                  className={`h-11 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    captureType === 'block'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Timetable</span>
                </button>
              </div>
            </div>

            {/* ── 3. TYPE-SPECIFIC CONTEXTUAL FIELDS ── */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
              {/* Type: TASK INBOX */}
              {captureType === 'task' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                      Task Attributes
                    </span>
                    <span className="text-[11px] text-slate-400">All optional</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Due Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Priority Level
                      </label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as Priority)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="high">🔴 High Priority</option>
                        <option value="medium">🟠 Medium Priority</option>
                        <option value="low">🟢 Low Priority</option>
                        <option value="personal">🟡 Personal</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Type: ASSIGNMENT TRACKER */}
              {captureType === 'assignment' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      Coursework Details
                    </span>
                    <span className="text-[11px] text-slate-400">Academic deadline</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Course / Subject
                      </label>
                      <input
                        type="text"
                        value={assignmentSubject}
                        onChange={(e) => setAssignmentSubject(e.target.value)}
                        placeholder="e.g. CS 305, Math 201"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Priority
                      </label>
                      <select
                        value={assignmentPriority}
                        onChange={(e) => setAssignmentPriority(e.target.value as Priority)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="high">🔴 High Priority</option>
                        <option value="medium">🟠 Medium Priority</option>
                        <option value="low">🟢 Low Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={assignmentDueDate}
                        onChange={(e) => setAssignmentDueDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Due Time
                      </label>
                      <input
                        type="time"
                        value={assignmentDueTime}
                        onChange={(e) => setAssignmentDueTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Type: SMART GOAL */}
              {captureType === 'goal' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-purple-500" />
                      SMART Milestone Criteria
                    </span>
                    <span className="text-[11px] text-slate-400">Measurable target</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Category
                      </label>
                      <select
                        value={goalCategory}
                        onChange={(e) => setGoalCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="Academics">Academics</option>
                        <option value="Career">Career & Internships</option>
                        <option value="Skill Development">Skill Development</option>
                        <option value="Fitness">Fitness & Health</option>
                        <option value="Personal Growth">Personal Growth</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Deadline (Optional)
                      </label>
                      <input
                        type="date"
                        value={goalDeadline}
                        onChange={(e) => setGoalDeadline(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Target Quantity (Measurable)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={goalTargetValue}
                        onChange={(e) => setGoalTargetValue(e.target.value)}
                        placeholder="10"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Unit of Progress
                      </label>
                      <input
                        type="text"
                        value={goalUnit}
                        onChange={(e) => setGoalUnit(e.target.value)}
                        placeholder="chapters, problems, hours"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Type: SCHEDULE BLOCK */}
              {captureType === 'block' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      Timetable Timing & Slot
                    </span>
                    <span className="text-[11px] text-slate-400">Conflict-checked</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={blockDate}
                        onChange={(e) => setBlockDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={blockStartTime}
                        onChange={(e) => setBlockStartTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Duration
                      </label>
                      <select
                        value={blockDurationMinutes}
                        onChange={(e) => setBlockDurationMinutes(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour (60m)</option>
                        <option value="90">1.5 hours (90m)</option>
                        <option value="120">2 hours (120m)</option>
                        <option value="180">3 hours (180m)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Priority / Color
                      </label>
                      <select
                        value={blockColor}
                        onChange={(e) => {
                          setBlockColor(e.target.value);
                          if (e.target.value === '#EF4444') setBlockPriority('high');
                          else if (e.target.value === '#10B981') setBlockPriority('low');
                          else setBlockPriority('medium');
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="#3B82F6">🔵 Blue (Standard / Focus)</option>
                        <option value="#8B5CF6">🟣 Purple (Study & Prep)</option>
                        <option value="#10B981">🟢 Green (Personal & Wellness)</option>
                        <option value="#EF4444">🔴 Red (High Priority / Exam)</option>
                        <option value="#F59E0B">🟡 Amber (Meeting & Team)</option>
                      </select>
                    </div>
                  </div>

                  {/* ── REAL-TIME SCHEDULE CONFLICT WARNING ── */}
                  {scheduleCollision?.hasConflict && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Schedule Conflict Detected</p>
                          <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                            {scheduleCollision.message}. Adjust your start time to prevent double-booking.
                          </p>
                        </div>
                      </div>

                      {/* Quick-adopt suggested free slots */}
                      {suggestedSlots.length > 0 && (
                        <div className="pt-1 border-t border-rose-200 dark:border-rose-900/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 block mb-1.5">
                            Suggested Alternative Free Slots:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestedSlots.map((slot) => {
                              const timeString = minutesToTimeStr(slot.startMinutes);
                              return (
                                <button
                                  key={slot.startMinutes}
                                  type="button"
                                  onClick={() => setBlockStartTime(timeString)}
                                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                                >
                                  {slot.timeStr}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── OPTIONAL EXPANDABLE NOTES & ATTACHMENT SECTION ── */}
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                  className="w-full flex items-center justify-between py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Additional Notes & Attachments
                  </span>
                  {showOptionalDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showOptionalDetails && (
                  <div className="pt-3 space-y-3 animate-fade-in">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Detailed Notes or Context
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Extra context, links, or instructions..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    {/* File / Camera Attachment Picker */}
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                        Photo or Document Attachment
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="mobile-qc-attachment-input"
                      />

                      {attachment ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {attachment.isImage && attachment.dataUrl ? (
                              <img
                                src={attachment.dataUrl}
                                alt="Attachment preview"
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/60">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {attachment.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {(attachment.size / 1024).toFixed(0)} KB · Saved locally on this device
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveAttachment}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                            title="Remove attachment"
                            aria-label="Remove attachment"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span>Attach Assignment Notice or PDF (Max 5MB)</span>
                        </button>
                      )}

                      {attachmentError && (
                        <p className="text-[11px] text-rose-500 font-medium mt-1">
                          {attachmentError}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── ERROR FEEDBACK MESSAGE ── */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* ── 4. PRIMARY ACTION BUTTON ── */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to BlockFlow...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>
                      Save to{' '}
                      {captureType === 'task'
                        ? 'Task Inbox'
                        : captureType === 'assignment'
                        ? 'Assignment Tracker'
                        : captureType === 'goal'
                        ? 'SMART Goals'
                        : 'Schedule'}
                    </span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2">
                Persisted immediately in BlockFlow canonical database
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
