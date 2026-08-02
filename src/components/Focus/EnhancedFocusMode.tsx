import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useExecution } from '../../context/ExecutionContext';
import DistractionModal from './DistractionModal';
import { loadDistractionLogs, saveDistractionLogs } from '../../utils/assignmentStorage';
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
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Target,
  Clock,
  X,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Bell,
  Coffee,
  Check,
  Settings,
} from 'lucide-react';

interface EnhancedFocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  onEarlyExit?: (sessionMinutes: number, taskTitle: string) => void;
}

type TimerPreset = '25_5' | '50_10' | '90_20' | 'custom';
type SessionMode = 'focus' | 'break';

export default function EnhancedFocusMode({
  isOpen,
  onClose,
  onEarlyExit = () => {},
}: EnhancedFocusModeProps) {
  const { currentWeekScheduledBlocks, updateBlockStatus, addToast } = useTimetable();
  const { todayScore } = useExecution();

  // Settings
  const [audioSettings, setAudioSettings] = useState(loadFocusAudioSettings);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Timer State
  const [preset, setPreset] = useState<TimerPreset>('25_5');
  const [customMins, setCustomMins] = useState(25);
  const [mode, setMode] = useState<SessionMode>('focus');
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Modals & UI State
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedTaskTitle, setCompletedTaskTitle] = useState('');

  // Refs for timestamp accuracy and preventing duplicate completion calls
  const sessionEndsAtRef = useRef<number | null>(null);
  const remainingOnPauseRef = useRef<number | null>(null);
  const completionTriggeredRef = useRef(false);
  const originalTitleRef = useRef(typeof document !== 'undefined' ? document.title : 'BlockFlow');

  // Today's active task blocks
  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayBlocks = currentWeekScheduledBlocks
    .filter((b) => b.dayOfWeek === todayIndex)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const activeTask =
    todayBlocks.find((b) => b.status === 'in_progress') ||
    todayBlocks.find((b) => !b.status || b.status === 'not_started') ||
    todayBlocks[0];

  const nextTask = todayBlocks.find(
    (b) => b.id !== activeTask?.id && (!b.status || b.status === 'not_started')
  );

  // Load persisted session on mount / refresh
  useEffect(() => {
    const saved = loadActiveFocusSession();
    if (saved && saved.status === 'running') {
      const now = Date.now();
      setMode(saved.mode || 'focus');
      setTotalTimerSeconds(saved.durationSeconds);

      if (now < saved.endsAt) {
        const remaining = Math.max(0, Math.ceil((saved.endsAt - now) / 1000));
        setSecondsRemaining(remaining);
        sessionEndsAtRef.current = saved.endsAt;
        setIsRunning(true);
        completionTriggeredRef.current = false;
      } else {
        // Time expired while page was closed / refreshed!
        setSecondsRemaining(0);
        setIsRunning(false);
        if (!saved.completionTriggered) {
          triggerSessionCompletion(saved.taskTitle || 'Focus Task', saved.mode || 'focus');
        }
      }
    } else if (saved && saved.status === 'paused') {
      setMode(saved.mode || 'focus');
      setTotalTimerSeconds(saved.durationSeconds);
      const remaining = saved.remainingSecondsOnPause || saved.durationSeconds;
      setSecondsRemaining(remaining);
      remainingOnPauseRef.current = remaining;
      setIsRunning(false);
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

  // ── Centralized Completion Trigger (Executes ONCE) ───────────────────────────
  const triggerSessionCompletion = useCallback(
    (taskName: string, sessionType: SessionMode) => {
      if (completionTriggeredRef.current) return;
      completionTriggeredRef.current = true;

      setIsRunning(false);
      sessionEndsAtRef.current = null;
      clearActiveFocusSession();

      setCompletedTaskTitle(taskName);
      setShowCompletionModal(true);

      // 1. Audio Alarm Playback
      playFocusCompletionAlarm(audioSettings.sound, audioSettings.volume);

      // 2. Tab Title Alert
      if (typeof document !== 'undefined') {
        originalTitleRef.current = document.title;
        document.title = `⏰ Focus Complete — ${taskName}`;
      }

      // 3. Mobile Vibration
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200, 100, 400]);
        } catch {}
      }

      // 4. Browser Desktop Notification
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('BlockFlow — Focus Session Complete 🌟', {
            body: `${sessionType === 'focus' ? 'Focus Session Finished' : 'Break Finished'}: ${taskName}`,
            icon: '/favicon.ico',
          });
        } catch {}
      }

      // 5. Append Real Focus History Log
      appendFocusSessionLog({
        id: `session-${Date.now()}`,
        startedAt: Date.now() - totalTimerSeconds * 1000,
        endedAt: Date.now(),
        plannedMinutes: Math.round(totalTimerSeconds / 60),
        actualMinutes: Math.round(totalTimerSeconds / 60),
        taskTitle: taskName,
        blockId: activeTask?.id,
        goalId: activeTask?.goalId,
        status: 'completed',
      });
    },
    [activeTask, audioSettings, totalTimerSeconds]
  );

  // Restore original document title on cleanup / dismissal
  const restoreTabTitle = () => {
    if (typeof document !== 'undefined' && originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
  };

  // ── Timestamp-Based Countdown Loop (250ms precision) ──────────────────────────
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;

    if (isRunning && sessionEndsAtRef.current) {
      timerId = setInterval(() => {
        const now = Date.now();
        const endsAt = sessionEndsAtRef.current;

        if (endsAt) {
          const diffSeconds = Math.ceil((endsAt - now) / 1000);

          if (diffSeconds <= 0) {
            setSecondsRemaining(0);
            if (timerId) clearInterval(timerId);
            triggerSessionCompletion(activeTask?.title || 'Focus Task', mode);
          } else {
            setSecondsRemaining(diffSeconds);
          }
        }
      }, 250);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isRunning, activeTask, mode, triggerSessionCompletion]);

  if (!isOpen) return null;

  // ── Start Focus Session ──
  const handleStart = () => {
    unlockAudioContext();

    const now = Date.now();
    const duration = secondsRemaining > 0 ? secondsRemaining : totalTimerSeconds;
    const endsAt = now + duration * 1000;

    sessionEndsAtRef.current = endsAt;
    remainingOnPauseRef.current = null;
    completionTriggeredRef.current = false;
    setIsRunning(true);

    saveActiveFocusSession({
      id: `session-${now}`,
      taskTitle: activeTask?.title || 'Focus Task',
      blockId: activeTask?.id,
      goalId: activeTask?.goalId,
      startedAt: now,
      endsAt,
      durationSeconds: totalTimerSeconds,
      status: 'running',
      mode,
    });
  };

  // ── Pause Focus Session ──
  const handlePause = () => {
    setIsRunning(false);
    sessionEndsAtRef.current = null;
    remainingOnPauseRef.current = secondsRemaining;

    saveActiveFocusSession({
      id: `session-${Date.now()}`,
      taskTitle: activeTask?.title || 'Focus Task',
      blockId: activeTask?.id,
      goalId: activeTask?.goalId,
      startedAt: Date.now(),
      endsAt: Date.now() + secondsRemaining * 1000,
      durationSeconds: totalTimerSeconds,
      remainingSecondsOnPause: secondsRemaining,
      status: 'paused',
      mode,
    });
  };

  // ── Toggle Preset ──
  const handleSelectPreset = (p: TimerPreset, minutesVal?: number) => {
    setPreset(p);
    setIsRunning(false);
    sessionEndsAtRef.current = null;
    clearActiveFocusSession();
    setShowPresetDropdown(false);

    let mins = 25;
    let breakMins = 5;

    if (p === '50_10') {
      mins = 50;
      breakMins = 10;
    } else if (p === '90_20') {
      mins = 90;
      breakMins = 20;
    } else if (p === 'custom') {
      mins = minutesVal || customMins;
      breakMins = 5;
    }

    setMode('focus');
    setTotalTimerSeconds(mins * 60);
    setSecondsRemaining(mins * 60);
  };

  // ── Reset Timer ──
  const handleResetTimer = () => {
    setIsRunning(false);
    sessionEndsAtRef.current = null;
    clearActiveFocusSession();
    setSecondsRemaining(totalTimerSeconds);
  };

  // ── End / Cancel Session ──
  const handleEndSession = () => {
    const elapsedSeconds = totalTimerSeconds - secondsRemaining;
    if (isRunning && elapsedSeconds > 60) {
      setShowDistractionModal(true);
    } else {
      setIsRunning(false);
      sessionEndsAtRef.current = null;
      clearActiveFocusSession();
      restoreTabTitle();
      onClose();
    }
  };

  const handleLogDistraction = (reason: string) => {
    const elapsedMinutes = Math.round((totalTimerSeconds - secondsRemaining) / 60);
    const logs = loadDistractionLogs();
    saveDistractionLogs([
      {
        id: `dist-${Date.now()}`,
        timestamp: Date.now(),
        reason: reason as any,
        taskTitle: activeTask?.title || 'Focus Task',
        sessionMinutes: elapsedMinutes,
      },
      ...logs,
    ]);
    onEarlyExit(elapsedMinutes, activeTask?.title || 'Focus Task');
    addToast('Distraction trigger logged for AI analysis', 'info');
    setIsRunning(false);
    sessionEndsAtRef.current = null;
    clearActiveFocusSession();
    restoreTabTitle();
    onClose();
  };

  // ── Complete Activity Action ──
  const handleMarkActivityComplete = () => {
    if (activeTask) {
      updateBlockStatus(activeTask.id, 'completed');
      addToast(`Marked "${activeTask.title}" as Completed! 🎉`, 'success');
    }
    setShowCompletionModal(false);
    restoreTabTitle();
  };

  // ── Start Break Timer Action ──
  const handleStartBreak = (breakMins: number = 5) => {
    setShowCompletionModal(false);
    restoreTabTitle();
    setMode('break');
    setTotalTimerSeconds(breakMins * 60);
    setSecondsRemaining(breakMins * 60);
    completionTriggeredRef.current = false;
    handleStart();
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const presetLabels: Record<TimerPreset, string> = {
    '25_5': 'Pomodoro (25/5)',
    '50_10': 'Focus (50/10)',
    '90_20': 'Deep Work (90/20)',
    custom: `Custom (${Math.floor(totalTimerSeconds / 60)}m)`,
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none animate-fade-in">
        {/* Glowing Background Accent */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
            mode === 'break' ? 'bg-emerald-600/10' : 'bg-indigo-600/10'
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
                BlockFlow Focus Mode
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    mode === 'break'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {mode === 'break' ? 'BREAK' : 'LIVE'}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {mode === 'break' ? 'Rest & recovery interval' : 'Distraction-free execution environment'}
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

            {/* End Session */}
            <button
              onClick={handleEndSession}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors text-sm font-medium flex items-center gap-1.5"
            >
              <X size={16} />
              End Session
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

            {/* Browser Notification Status */}
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-4xl mx-auto w-full">
          {/* Active Task Banner */}
          <div className="text-center mb-8">
            <p
              className={`font-bold tracking-wider uppercase text-xs mb-2 flex items-center justify-center gap-1.5 ${
                mode === 'break' ? 'text-emerald-400' : 'text-indigo-400'
              }`}
            >
              <Zap size={14} className="fill-current" />
              {mode === 'break' ? 'Rest & Recharge Break' : 'Active Focus Task'}
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {mode === 'break'
                ? 'Take a Deep Breath & Relax'
                : activeTask?.title || 'Deep Work & Study Session'}
            </h2>
          </div>

          {/* Big Countdown Timer */}
          <div className="relative mb-10 text-center">
            <div
              className={`text-[120px] sm:text-[150px] leading-none font-black text-white tracking-tighter font-mono ${
                mode === 'break'
                  ? 'drop-shadow-[0_0_40px_rgba(16,185,129,0.2)]'
                  : 'drop-shadow-[0_0_40px_rgba(99,102,241,0.2)]'
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
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
                style={{
                  width: `${((totalTimerSeconds - secondsRemaining) / totalTimerSeconds) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-12">
            <button
              onClick={handleResetTimer}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Reset Timer"
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={isRunning ? handlePause : handleStart}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 ${
                mode === 'break'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]'
              }`}
            >
              {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>

            {mode === 'focus' && (
              <button
                onClick={handleMarkActivityComplete}
                className="px-5 py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 size={18} />
                Mark Complete
              </button>
            )}
          </div>

          {/* Stat Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Up Next Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm space-y-1">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Up Next</p>
              <p className="text-slate-200 font-bold truncate">
                {nextTask?.title || 'No further tasks scheduled for today'}
              </p>
            </div>

            {/* Timer Mode Selector Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm relative">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                Timer Preset
              </p>
              <button
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                className="text-slate-200 font-bold text-sm flex items-center justify-between w-full hover:text-indigo-400 transition-colors"
              >
                <span>{presetLabels[preset]}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {showPresetDropdown && (
                <div className="absolute left-0 right-0 bottom-full mb-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-20 space-y-1">
                  <button
                    onClick={() => handleSelectPreset('25_5')}
                    className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    Pomodoro (25m work / 5m break)
                  </button>
                  <button
                    onClick={() => handleSelectPreset('50_10')}
                    className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    Focus (50m work / 10m break)
                  </button>
                  <button
                    onClick={() => handleSelectPreset('90_20')}
                    className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    Deep Work (90m work / 20m break)
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

            {/* Execution Score Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm space-y-1">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                Execution Score
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-emerald-400">
                  {todayScore?.overallScore || 88}%
                </span>
                <span className="text-emerald-400/80 text-[10px] font-semibold">
                  Today's Performance
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Distraction Modal */}
      <DistractionModal
        isOpen={showDistractionModal}
        onClose={() => {
          setShowDistractionModal(false);
          onClose();
        }}
        onLogDistraction={handleLogDistraction}
      />

      {/* ── FOCUS SESSION COMPLETE OVERLAY MODAL ── */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border-t-4 border-t-emerald-500">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                🔔 FOCUS SESSION COMPLETE
              </span>
              <h3 className="text-2xl font-black text-white">{completedTaskTitle}</h3>
              <p className="text-xs text-slate-400">
                {Math.round(totalTimerSeconds / 60)}-minute focus session finished successfully.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <p className="text-[11px] font-semibold text-slate-400">Is this activity completed?</p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleMarkActivityComplete}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <Check className="w-4 h-4" />
                Yes — Mark Activity Complete
              </button>

              <button
                onClick={() => handleStartBreak(preset === '50_10' ? 10 : preset === '90_20' ? 20 : 5)}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Coffee className="w-4 h-4" />
                Start Break ({preset === '50_10' ? '10m' : preset === '90_20' ? '20m' : '5m'})
              </button>

              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  restoreTabTitle();
                }}
                className="w-full py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Keep Activity Open & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { EnhancedFocusMode };
