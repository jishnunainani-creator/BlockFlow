import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useExecution } from '../../context/ExecutionContext';
import {
  loadFocusAudioSettings,
  saveFocusAudioSettings,
  playFocusCompletionAlarm,
  playTestSound,
  unlockAudioContext,
  SoundOption,
} from '../../utils/focusAudio';
import {
  loadActiveFocusSession,
  saveActiveFocusSession,
  clearActiveFocusSession,
  appendFocusSessionLog,
  ActiveFocusSession,
} from '../../utils/focusStorage';
import {
  createActiveSession,
  pauseActiveSession,
  resumeActiveSession,
  calculateElapsedSeconds,
  calculateRemainingSeconds,
  finalizeSession,
} from '../../utils/focusSessionEngine';
import { appendExecutionSession } from '../../utils/sessionStorage';
import { loadTaskInbox, saveTaskInbox } from '../../utils/taskInboxStorage';
import { TaskInboxItem } from '../../types/executionOS';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Target,
  Clock,
  X,
  Zap,
  Volume2,
  VolumeX,
  Bell,
  Coffee,
  Check,
  Settings,
  ListTodo,
  Star,
  AlertTriangle,
} from 'lucide-react';

export interface FocusSessionTarget {
  title?: string;
  blockId?: string;
  taskId?: string;
  goalId?: string;
  plannedDurationMinutes?: number;
}

interface EnhancedFocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  onEarlyExit?: (sessionMinutes: number, taskTitle: string) => void;
  initialTarget?: FocusSessionTarget | null;
}

type TimerPreset = '25_5' | '50_10' | '90_20' | 'custom';
type SessionMode = 'focus' | 'break';

export default function EnhancedFocusMode({
  isOpen,
  onClose,
  onEarlyExit: _onEarlyExit = () => {},
  initialTarget = null,
}: EnhancedFocusModeProps) {
  const { currentWeekScheduledBlocks, updateBlockStatus, addToast } = useTimetable();
  const { todayScore } = useExecution();

  // Settings
  const [audioSettings, setAudioSettings] = useState(loadFocusAudioSettings);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Active Session and Target
  const [activeSession, setActiveSession] = useState<ActiveFocusSession | null>(null);
  const [sessionTitle, setSessionTitle] = useState('Deep Work Session');
  const [linkedBlockId, setLinkedBlockId] = useState<string | undefined>(undefined);
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>(undefined);
  const [plannedDurationMins, setPlannedDurationMins] = useState<number | undefined>(undefined);

  // Timer State
  const [preset, setPreset] = useState<TimerPreset>('25_5');
  const [customMins, setCustomMins] = useState(25);
  const [mode, setMode] = useState<SessionMode>('focus');
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Modals & UI State
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Completion Form State
  const [completionNotes, setCompletionNotes] = useState('');
  const [markItemCompleted, setMarkItemCompleted] = useState(false);
  const [sessionRating, setSessionRating] = useState(5);
  const [finalActualMinutes, setFinalActualMinutes] = useState(25);

  // Available Tasks & Blocks for selection
  const [inboxTasks, setInboxTasks] = useState<TaskInboxItem[]>([]);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayBlocks = useMemo(() => {
    return currentWeekScheduledBlocks
      .filter((b) => b.dayOfWeek === todayIndex)
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }, [currentWeekScheduledBlocks, todayIndex]);

  // Refs for audio and completion triggers
  const completionTriggeredRef = useRef(false);
  const originalTitleRef = useRef(typeof document !== 'undefined' ? document.title : 'BlockFlow');

  // Load pending inbox tasks
  useEffect(() => {
    if (isOpen) {
      const allTasks = loadTaskInbox();
      setInboxTasks(allTasks.filter((t) => t.status !== 'completed' && t.status !== 'archived'));
    }
  }, [isOpen]);

  // Load initial target when opened
  useEffect(() => {
    if (isOpen && initialTarget) {
      if (initialTarget.title) setSessionTitle(initialTarget.title);
      if (initialTarget.blockId) setLinkedBlockId(initialTarget.blockId);
      if (initialTarget.taskId) setLinkedTaskId(initialTarget.taskId);
      if (initialTarget.plannedDurationMinutes) {
        setPlannedDurationMins(initialTarget.plannedDurationMinutes);
        setTotalTimerSeconds(initialTarget.plannedDurationMinutes * 60);
        setSecondsRemaining(initialTarget.plannedDurationMinutes * 60);
      }
    }
  }, [isOpen, initialTarget]);

  // Load persisted session on mount / refresh
  useEffect(() => {
    const saved = loadActiveFocusSession();
    if (saved) {
      setActiveSession(saved);
      setSessionTitle(saved.taskTitle || 'Deep Work Session');
      setLinkedBlockId(saved.blockId);
      setLinkedTaskId(saved.taskId);
      setMode(saved.mode || 'focus');
      setTotalTimerSeconds(saved.durationSeconds);

      const now = Date.now();
      const rem = calculateRemainingSeconds(saved, now);
      setSecondsRemaining(rem);

      if (saved.status === 'running') {
        if (rem <= 0) {
          setIsRunning(false);
          triggerCompletionFlow(saved);
        } else {
          setIsRunning(true);
        }
      } else {
        setIsRunning(false);
      }
    }
  }, []);

  // Update audio settings when modified
  const handleUpdateAudioSettings = (updates: Partial<typeof audioSettings>) => {
    const next = { ...audioSettings, ...updates };
    setAudioSettings(next);
    saveFocusAudioSettings(next);
  };

  // Request browser notification permission
  const handleRequestNotificationPermission = () => {
    if (typeof Notification !== 'undefined' && Notification.requestPermission) {
      Notification.requestPermission().then((perm) => {
        setNotificationPermission(perm);
        if (perm === 'granted') {
          addToast('Focus Session Notifications Enabled! 🔔', 'success');
        }
      });
    }
  };

  // Restore original document title
  const restoreTabTitle = () => {
    if (typeof document !== 'undefined' && originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
  };

  // ── Completion Trigger Helper ──
  const triggerCompletionFlow = useCallback(
    (sess: ActiveFocusSession) => {
      if (completionTriggeredRef.current) return;
      completionTriggeredRef.current = true;

      setIsRunning(false);
      const now = Date.now();
      const elapsedSec = calculateElapsedSeconds(sess, now);
      const actualMins = Math.max(1, Math.round(elapsedSec / 60));
      setFinalActualMinutes(actualMins);
      setShowCompletionModal(true);

      // Play audio & desktop alerts
      playFocusCompletionAlarm(audioSettings.sound, audioSettings.volume);

      if (typeof document !== 'undefined') {
        originalTitleRef.current = document.title;
        document.title = `⏰ Focus Complete — ${sess.taskTitle}`;
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200, 100, 400]);
        } catch {}
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('BlockFlow — Focus Session Complete 🌟', {
            body: `${sess.mode === 'focus' ? 'Focus Session Finished' : 'Break Finished'}: ${sess.taskTitle}`,
            icon: '/favicon.ico',
          });
        } catch {}
      }
    },
    [audioSettings]
  );

  // ── High-Precision Loop Resilient to Backgrounding ──
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isRunning && activeSession && activeSession.status === 'running') {
      intervalId = setInterval(() => {
        const now = Date.now();
        const rem = calculateRemainingSeconds(activeSession, now);

        if (rem <= 0) {
          setSecondsRemaining(0);
          if (intervalId) clearInterval(intervalId);
          triggerCompletionFlow(activeSession);
        } else {
          setSecondsRemaining(rem);
        }
      }, 250);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, activeSession, triggerCompletionFlow]);

  // Window focus listener to immediately re-sync timer after tab un-backgrounding
  useEffect(() => {
    const handleWindowFocus = () => {
      if (activeSession) {
        const now = Date.now();
        const rem = calculateRemainingSeconds(activeSession, now);
        setSecondsRemaining(rem);
        if (rem <= 0 && activeSession.status === 'running') {
          triggerCompletionFlow(activeSession);
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('visibilitychange', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('visibilitychange', handleWindowFocus);
    };
  }, [activeSession, triggerCompletionFlow]);

  if (!isOpen) return null;

  // ── Timer Control: Start ──
  const handleStart = () => {
    unlockAudioContext();
    const now = Date.now();

    let newSession: ActiveFocusSession;
    if (activeSession && activeSession.status === 'paused') {
      newSession = resumeActiveSession(activeSession, now);
    } else {
      newSession = createActiveSession({
        taskTitle: sessionTitle,
        blockId: linkedBlockId,
        taskId: linkedTaskId,
        durationSeconds: secondsRemaining > 0 ? secondsRemaining : totalTimerSeconds,
        plannedDurationMinutes: plannedDurationMins || Math.round(totalTimerSeconds / 60),
        mode,
        now,
      });
    }

    completionTriggeredRef.current = false;
    setActiveSession(newSession);
    saveActiveFocusSession(newSession);
    setIsRunning(true);
  };

  // ── Timer Control: Pause ──
  const handlePause = () => {
    if (!activeSession || activeSession.status !== 'running') return;
    const now = Date.now();
    const paused = pauseActiveSession(activeSession, now);
    setActiveSession(paused);
    saveActiveFocusSession(paused);
    setIsRunning(false);
    setSecondsRemaining(calculateRemainingSeconds(paused, now));
  };

  // ── Timer Control: Resume ──
  const handleResume = () => {
    handleStart();
  };

  // ── Timer Control: Reset ──
  const handleReset = () => {
    setIsRunning(false);
    clearActiveFocusSession();
    setActiveSession(null);
    setSecondsRemaining(totalTimerSeconds);
    completionTriggeredRef.current = false;
  };

  // ── Timer Control: Finish Early ──
  const handleFinishEarly = () => {
    const current =
      activeSession ??
      createActiveSession({
        taskTitle: sessionTitle,
        blockId: linkedBlockId,
        taskId: linkedTaskId,
        durationSeconds: totalTimerSeconds,
        mode,
      });

    triggerCompletionFlow(current);
  };

  // ── Timer Control: Cancel ──
  const handleRequestCancel = () => {
    const current = activeSession;
    const elapsedSec = current ? calculateElapsedSeconds(current, Date.now()) : 0;

    if (elapsedSec > 60 || isRunning) {
      setShowCancelConfirmation(true);
    } else {
      executeCancelSession();
    }
  };

  const executeCancelSession = () => {
    setIsRunning(false);
    clearActiveFocusSession();
    setActiveSession(null);
    restoreTabTitle();
    setShowCancelConfirmation(false);
    onClose();
  };

  // ── Finalize & Save Session ──
  const handleConfirmCompletion = () => {
    const sessionToFinalize =
      activeSession ??
      createActiveSession({
        taskTitle: sessionTitle,
        blockId: linkedBlockId,
        taskId: linkedTaskId,
        durationSeconds: totalTimerSeconds,
        mode,
      });

    const result = finalizeSession({
      session: sessionToFinalize,
      now: Date.now(),
      userNotes: completionNotes,
      status: 'completed',
      rating: sessionRating,
    });

    // 1. Persist to canonical ExecutionSession and FocusSessionLog
    appendExecutionSession(result.executionSession);
    appendFocusSessionLog(result.focusSessionLog);

    // 2. Conditionally mark linked item as completed
    if (markItemCompleted) {
      if (linkedBlockId) {
        updateBlockStatus(linkedBlockId, 'completed');
        addToast(`Marked timetable block as completed! 🎉`, 'success');
      } else if (linkedTaskId) {
        const all = loadTaskInbox();
        const updated = all.map((t) =>
          t.id === linkedTaskId ? { ...t, status: 'completed' as const, completedAt: Date.now() } : t
        );
        saveTaskInbox(updated);
        addToast(`Marked task as completed in Inbox! 🎉`, 'success');
      }
    }

    addToast(`Focus session recorded: ${result.actualDurationMinutes}m focus logged! ⏱️`, 'success');
    clearActiveFocusSession();
    setActiveSession(null);
    setShowCompletionModal(false);
    restoreTabTitle();
    onClose();
  };

  // ── Break Timer Transition ──
  const handleStartBreak = (breakMins: number = 5) => {
    setShowCompletionModal(false);
    restoreTabTitle();
    setMode('break');
    setTotalTimerSeconds(breakMins * 60);
    setSecondsRemaining(breakMins * 60);
    clearActiveFocusSession();

    const now = Date.now();
    const breakSess = createActiveSession({
      taskTitle: `Rest & Recovery Break`,
      durationSeconds: breakMins * 60,
      mode: 'break',
      now,
    });
    setActiveSession(breakSess);
    saveActiveFocusSession(breakSess);
    setIsRunning(true);
  };

  // ── Preset Selection ──
  const handleSelectPreset = (p: TimerPreset, minutesVal?: number) => {
    setPreset(p);
    setIsRunning(false);
    clearActiveFocusSession();
    setActiveSession(null);
    setShowPresetDropdown(false);

    let mins = 25;
    if (p === '50_10') mins = 50;
    else if (p === '90_20') mins = 90;
    else if (p === 'custom') mins = minutesVal || customMins;

    setMode('focus');
    setTotalTimerSeconds(mins * 60);
    setSecondsRemaining(mins * 60);
  };

  // ── Linked Task Selection ──
  const handleSelectBlock = (block: (typeof todayBlocks)[0]) => {
    setSessionTitle(block.title);
    setLinkedBlockId(block.id);
    setLinkedTaskId(undefined);
    setPlannedDurationMins(block.duration);
    if (block.duration > 0) {
      setTotalTimerSeconds(block.duration * 60);
      setSecondsRemaining(block.duration * 60);
    }
    setShowTaskPicker(false);
    addToast(`Linked focus session to "${block.title}"`, 'info');
  };

  const handleSelectTask = (task: TaskInboxItem) => {
    setSessionTitle(task.title);
    setLinkedTaskId(task.id);
    setLinkedBlockId(undefined);
    const duration = task.estimatedDuration ?? task.estimatedMinutes;
    if (duration) {
      setPlannedDurationMins(duration);
      setTotalTimerSeconds(duration * 60);
      setSecondsRemaining(duration * 60);
    }
    setShowTaskPicker(false);
    addToast(`Linked focus session to "${task.title}"`, 'info');
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const elapsedSeconds = totalTimerSeconds - secondsRemaining;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none animate-fade-in">
        {/* Glowing Background Accent */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
            mode === 'break' ? 'bg-emerald-600/10' : isRunning ? 'bg-indigo-600/15' : 'bg-amber-600/10'
          }`}
        />

        {/* Header */}
        <header className="p-6 flex justify-between items-center relative z-10 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                mode === 'break'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}
            >
              {mode === 'break' ? <Coffee size={24} /> : <Target size={24} />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                BlockFlow Focus Session
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    mode === 'break'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isRunning
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {mode === 'break' ? 'BREAK' : isRunning ? 'RUNNING' : 'PAUSED'}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {mode === 'break'
                  ? 'Rest interval · Paused time does not count toward focus'
                  : isRunning
                  ? 'High-performance focus timer running'
                  : 'Timer paused · Paused intervals are excluded'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Focus Settings Toggle */}
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Focus Sound & Notification Settings"
            >
              <Settings size={18} />
            </button>

            {/* Cancel / End Session */}
            <button
              onClick={handleRequestCancel}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors text-sm font-medium flex items-center gap-1.5"
            >
              <X size={16} />
              Cancel Session
            </button>
          </div>
        </header>

        {/* Focus Audio Settings Panel */}
        {showSettingsMenu && (
          <div className="absolute top-20 right-6 z-30 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl max-w-sm w-full space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Bell size={16} className="text-indigo-400" /> Focus Alarm & Settings
              </span>
              <button
                onClick={() => setShowSettingsMenu(false)}
                className="text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Sound Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Completion Sound
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['bell', 'chime', 'digital', 'soft_alarm', 'none'] as SoundOption[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdateAudioSettings({ sound: s })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      audioSettings.sound === s
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Control */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
                <span>Volume</span>
                <span className="font-mono text-indigo-300">{audioSettings.volume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioSettings.volume}
                  onChange={(e) => handleUpdateAudioSettings({ volume: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
                />
                <Volume2 className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            {/* Test Sound Button */}
            <button
              onClick={() => playTestSound(audioSettings.sound, audioSettings.volume)}
              className="w-full py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              🔊 Test Alarm Sound
            </button>

            {/* Desktop Notification Status */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Desktop Notifications</span>
              {notificationPermission === 'granted' ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Enabled
                </span>
              ) : (
                <button
                  onClick={handleRequestNotificationPermission}
                  className="text-xs font-bold text-indigo-400 hover:underline"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Focus Stage */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-4xl mx-auto w-full">
          {/* Active Target Title & Selector */}
          <div className="text-center mb-6 max-w-2xl w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span
                className={`font-bold tracking-wider uppercase text-xs flex items-center gap-1.5 ${
                  mode === 'break' ? 'text-emerald-400' : 'text-indigo-400'
                }`}
              >
                <Zap size={14} className="fill-current" />
                {mode === 'break' ? 'Rest & Recharge Break' : 'Focus Commitment'}
              </span>

              {mode === 'focus' && !isRunning && (
                <button
                  onClick={() => setShowTaskPicker(true)}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <ListTodo size={12} />
                  <span>Choose Task</span>
                </button>
              )}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight truncate">
              {mode === 'break' ? 'Take a Breath & Recharge' : sessionTitle}
            </h2>

            {plannedDurationMins && mode === 'focus' && (
              <p className="text-xs text-slate-400 mt-1">
                Planned Duration: <span className="text-indigo-400 font-semibold">{plannedDurationMins}m</span>
                {linkedBlockId && ' · Scheduled Block'}
                {linkedTaskId && ' · Inbox Task'}
              </p>
            )}
          </div>

          {/* Big Countdown Display */}
          <div className="relative mb-8 text-center">
            <div
              className={`text-[110px] sm:text-[145px] leading-none font-black text-white tracking-tighter font-mono ${
                mode === 'break'
                  ? 'drop-shadow-[0_0_40px_rgba(16,185,129,0.2)]'
                  : isRunning
                  ? 'drop-shadow-[0_0_40px_rgba(99,102,241,0.25)]'
                  : 'drop-shadow-[0_0_40px_rgba(245,158,11,0.2)] text-amber-200/90'
              }`}
            >
              {formatTime(secondsRemaining)}
            </div>

            {/* Visual Progress Bar */}
            <div className="w-72 sm:w-96 h-2.5 bg-slate-900 rounded-full mx-auto mt-4 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  mode === 'break'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : isRunning
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, (elapsedSeconds / totalTimerSeconds) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Core Timer Controls */}
          <div className="flex items-center gap-3 mb-10">
            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            {/* Start / Pause / Resume */}
            {isRunning ? (
              <button
                onClick={handlePause}
                className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-95"
              >
                <Pause size={18} />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={activeSession?.status === 'paused' ? handleResume : handleStart}
                className="px-8 py-3.5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <Play size={18} />
                <span>{activeSession?.status === 'paused' ? 'Resume' : 'Start Focus'}</span>
              </button>
            )}

            {/* Finish Session Early */}
            <button
              onClick={handleFinishEarly}
              className="px-5 py-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-sm flex items-center gap-2 transition-all"
              title="Finish Session"
            >
              <Check size={18} />
              <span>Finish</span>
            </button>
          </div>

          {/* Preset Selector & Execution Score */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Presets */}
            <div className="relative">
              <button
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Clock size={14} className="text-indigo-400" />
                <span>
                  Preset:{' '}
                  {preset === '25_5'
                    ? 'Pomodoro (25/5)'
                    : preset === '50_10'
                    ? 'Focus (50/10)'
                    : preset === '90_20'
                    ? 'Deep Work (90/20)'
                    : `Custom (${Math.round(totalTimerSeconds / 60)}m)`}
                </span>
                <ChevronDown size={14} />
              </button>

              {showPresetDropdown && (
                <div className="absolute bottom-full mb-2 left-0 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl space-y-1 z-30">
                  <button
                    onClick={() => handleSelectPreset('25_5')}
                    className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    Pomodoro (25m focus / 5m break)
                  </button>
                  <button
                    onClick={() => handleSelectPreset('50_10')}
                    className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    Focus (50m focus / 10m break)
                  </button>
                  <button
                    onClick={() => handleSelectPreset('90_20')}
                    className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    Deep Work (90m focus / 20m break)
                  </button>
                  <div className="p-2 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customMins}
                      onChange={(e) => setCustomMins(Number(e.target.value))}
                      className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs text-white text-center"
                    />
                    <button
                      onClick={() => handleSelectPreset('custom', customMins)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                    >
                      Set Mins
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Execution Score Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Today's Score
              </span>
              <span className="text-base font-black text-emerald-400">
                {todayScore?.overallScore || 88}%
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* ── SELECT TASK / BLOCK MODAL ── */}
      {showTaskPicker && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ListTodo size={18} className="text-indigo-400" />
                <span>Select Task or Schedule Block</span>
              </h3>
              <button
                onClick={() => setShowTaskPicker(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Custom Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Activity Title
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => {
                    setSessionTitle(e.target.value);
                    setLinkedBlockId(undefined);
                    setLinkedTaskId(undefined);
                  }}
                  placeholder="Enter any task or topic..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => setShowTaskPicker(false)}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Today's Schedule Blocks */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Today's Schedule Blocks ({todayBlocks.length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                {todayBlocks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No scheduled blocks today.</p>
                ) : (
                  todayBlocks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleSelectBlock(b)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-200 truncate">{b.title}</span>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold shrink-0">
                        {b.duration}m
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Inbox Tasks */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pending Inbox Tasks ({inboxTasks.length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                {inboxTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No pending tasks in Universal Inbox.</p>
                ) : (
                  inboxTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTask(t)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-200 truncate">{t.title}</span>
                      <span className="text-[10px] text-purple-400 font-mono font-bold shrink-0">
                        {t.estimatedDuration ? `${t.estimatedDuration}m` : 'Task'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCEL CONFIRMATION DIALOG ── */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cancel Focus Session?</h3>
              <p className="text-xs text-slate-400 mt-1">
                You have active recorded focus progress. Canceling will exit without logging this time.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCancelConfirmation(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
              >
                Keep Focusing
              </button>
              <button
                onClick={executeCancelSession}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Discard & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SESSION COMPLETION & REVIEW MODAL ── */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border-t-4 border-t-emerald-500">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Focus Session Finished
              </span>
              <h3 className="text-xl font-bold text-white">{sessionTitle}</h3>
              <p className="text-xs text-slate-400">
                Recorded duration: <span className="font-bold text-white">{finalActualMinutes} minutes</span>
              </p>
            </div>

            {/* Explicit Completion Confirmation */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left flex items-start gap-3">
              <input
                type="checkbox"
                id="markCompleteCheck"
                checked={markItemCompleted}
                onChange={(e) => setMarkItemCompleted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
              />
              <label htmlFor="markCompleteCheck" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-semibold block text-white">Mark linked item as completed</span>
                <span className="text-[11px] text-slate-500">
                  {linkedBlockId
                    ? 'Updates timetable block to completed'
                    : linkedTaskId
                    ? 'Moves task to completed in Inbox'
                    : 'Check to mark as fully accomplished'}
                </span>
              </label>
            </div>

            {/* Optional Reflection / Notes */}
            <div className="text-left space-y-1">
              <label className="text-xs font-semibold text-slate-400 block">
                Session Reflection & Notes (optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="What did you get done? Any blockers or observations?"
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Focus Rating */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-400 font-semibold">Focus Quality:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSessionRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={18}
                      className={
                        sessionRating >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmCompletion}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <Check className="w-4 h-4" />
                Save & Record Focus Session
              </button>

              <button
                onClick={() => handleStartBreak(5)}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Coffee className="w-4 h-4 text-emerald-400" />
                Start 5m Break
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { EnhancedFocusMode };
