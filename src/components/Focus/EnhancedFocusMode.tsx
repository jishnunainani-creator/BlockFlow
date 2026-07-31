import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useExecution } from '../../context/ExecutionContext';
import DistractionModal from './DistractionModal';
import { loadDistractionLogs, saveDistractionLogs } from '../../utils/assignmentStorage';
import { DistractionReason } from '../../types/executionOS';
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
} from 'lucide-react';

interface EnhancedFocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  onEarlyExit?: (sessionMinutes: number, taskTitle: string) => void;
}

type TimerPreset = '25_5' | '50_10' | '90_20' | 'custom';

export default function EnhancedFocusMode({
  isOpen,
  onClose,
  onEarlyExit = () => {},
}: EnhancedFocusModeProps) {
  const { currentWeekScheduledBlocks, updateBlockStatus, addToast } = useTimetable();
  const { todayScore } = useExecution();

  const [preset, setPreset] = useState<TimerPreset>('25_5');
  const [customMins, setCustomMins] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  // Today's task blocks
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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      if (activeTask) {
        updateBlockStatus(activeTask.id, 'completed');
      }
      addToast('Focus Session Completed! 🌟 Great job!', 'success');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, activeTask, updateBlockStatus, addToast]);

  if (!isOpen) return null;

  const handleSelectPreset = (p: TimerPreset, minutesVal?: number) => {
    setPreset(p);
    setIsRunning(false);
    setShowPresetDropdown(false);
    let mins = 25;
    if (p === '50_10') mins = 50;
    else if (p === '90_20') mins = 90;
    else if (p === 'custom') mins = minutesVal || customMins;

    setSecondsRemaining(mins * 60);
    setTotalTimerSeconds(mins * 60);
  };

  const handleEndSession = () => {
    const elapsedSeconds = totalTimerSeconds - secondsRemaining;
    if (isRunning && elapsedSeconds > 60) {
      setShowDistractionModal(true);
    } else {
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
    onClose();
  };

  const handleCompleteCurrent = () => {
    if (activeTask) {
      updateBlockStatus(activeTask.id, 'completed');
      addToast(`Marked "${activeTask.title}" as Completed! 🎉`, 'success');
    } else {
      addToast('Session completed! 🎉', 'success');
    }
    setIsRunning(false);
    setSecondsRemaining(totalTimerSeconds);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(totalTimerSeconds);
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <header className="p-6 flex justify-between items-center relative z-10 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Target size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                BlockFlow Focus Mode
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  LIVE
                </span>
              </h1>
              <p className="text-xs text-slate-400">Distraction-free execution environment</p>
            </div>
          </div>

          <button
            onClick={handleEndSession}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <X size={16} />
            End Session
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-4xl mx-auto w-full">
          {/* Current Task Banner */}
          <div className="text-center mb-8">
            <p className="text-indigo-400 font-bold tracking-wider uppercase text-xs mb-2 flex items-center justify-center gap-1.5">
              <Zap size={14} className="fill-current" /> Active Focus Task
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {activeTask?.title || 'Deep Work & Study Session'}
            </h2>
          </div>

          {/* Big Countdown Timer */}
          <div className="relative mb-10 text-center">
            <div className="text-[120px] sm:text-[150px] leading-none font-black text-white tracking-tighter font-mono drop-shadow-[0_0_40px_rgba(99,102,241,0.2)]">
              {formatTime(secondsRemaining)}
            </div>

            {/* Visual Progress Bar */}
            <div className="w-72 sm:w-96 h-2 bg-slate-900 rounded-full mx-auto mt-4 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                style={{
                  width: `${((totalTimerSeconds - secondsRemaining) / totalTimerSeconds) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-4 mb-12">
            <button
              onClick={handleResetTimer}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Reset Timer"
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 rounded-full flex items-center justify-center text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all transform hover:scale-105 active:scale-95"
            >
              {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>

            <button
              onClick={handleCompleteCurrent}
              className="px-5 py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 size={18} />
              Mark Complete
            </button>
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

      <DistractionModal
        isOpen={showDistractionModal}
        onClose={() => {
          setShowDistractionModal(false);
          onClose();
        }}
        onLogDistraction={handleLogDistraction}
      />
    </>
  );
}

export { EnhancedFocusMode };
