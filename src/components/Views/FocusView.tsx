import React, { useState, useEffect } from 'react';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';
import {
  loadActiveFocusSession,
  saveActiveFocusSession,
  loadFocusHistory,
  FocusSessionLog,
  ActiveFocusSession,
  clearActiveFocusSession,
} from '../../utils/focusStorage';
import {
  createActiveSession,
  pauseActiveSession,
  resumeActiveSession,
  calculateElapsedSeconds,
  calculateRemainingSeconds,
} from '../../utils/focusSessionEngine';
import { loadTaskInbox } from '../../utils/taskInboxStorage';
import { TaskInboxItem } from '../../types/executionOS';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Clock,
  CheckCircle2,
  ListTodo,
  Volume2,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import { formatDuration } from '../../utils/timeUtils';

interface FocusViewProps {
  onNavigate: (view: NavView) => void;
  onStartFocusMode: (target?: { id: string; title: string; category?: string; durationMinutes?: number }) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ onNavigate, onStartFocusMode }) => {
  const [activeSession, setActiveSession] = useState<ActiveFocusSession | null>(() => loadActiveFocusSession());
  const [tasks, setTasks] = useState<TaskInboxItem[]>(() => loadTaskInbox());
  const [history, setHistory] = useState<FocusSessionLog[]>(() => loadFocusHistory());
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Reload state periodically or on storage event
  useEffect(() => {
    const handleStorage = () => {
      setActiveSession(loadActiveFocusSession());
      setTasks(loadTaskInbox());
      setHistory(loadFocusHistory());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      if (activeSession && activeSession.status === 'running') {
        const remaining = calculateRemainingSeconds(activeSession, Date.now());
        if (remaining <= 0) {
          // Refresh active session from disk
          setActiveSession(loadActiveFocusSession());
          setHistory(loadFocusHistory());
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const handleStartPreset = (minutes: number) => {
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    const title = selectedTask ? selectedTask.title : 'Deep Focus Session';

    onStartFocusMode({
      id: selectedTaskId || `session-${Date.now()}`,
      title,
      durationMinutes: minutes,
      category: selectedTask?.category || 'Focus',
    });
  };

  const handleToggleTimer = () => {
    if (!activeSession) {
      handleStartPreset(customMinutes);
      return;
    }
    if (activeSession.status === 'running') {
      const paused = pauseActiveSession(activeSession, Date.now());
      saveActiveFocusSession(paused);
      setActiveSession(paused);
    } else if (activeSession.status === 'paused') {
      const resumed = resumeActiveSession(activeSession, Date.now());
      saveActiveFocusSession(resumed);
      setActiveSession(resumed);
    }
  };

  const handleCancelSession = () => {
    clearActiveFocusSession();
    setActiveSession(null);
  };

  // Metrics
  const remainingSeconds = activeSession ? calculateRemainingSeconds(activeSession, currentTime) : 0;
  const elapsedSeconds = activeSession ? calculateElapsedSeconds(activeSession, currentTime) : 0;
  const totalSeconds = activeSession ? activeSession.durationSeconds : customMinutes * 60;
  const progressPercent = totalSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100)) : 0;

  const formatTimerDisplay = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');
  const totalMinutesFocused = history.reduce((acc, log) => acc + (log.actualMinutes || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin max-w-5xl">
      <PageBreadcrumb items={[{ label: 'Focus & Execution' }]} onNavigate={onNavigate} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <span>Focus Mode &amp; Session Runner</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Eliminate distractions with timed deep-work sprints, task binding, and soundscapes
          </p>
        </div>

        <button
          onClick={() => handleStartPreset(customMinutes)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Launch Fullscreen Focus</span>
        </button>
      </div>

      {/* Main Focus Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Session Card / Timer */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{activeSession ? 'Session in Progress' : 'Ready to Focus'}</span>
            </span>
            {activeSession && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  activeSession.status === 'running'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {activeSession.status}
              </span>
            )}
          </div>

          {/* Central Timer Display */}
          <div className="text-center py-4">
            <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tight drop-shadow-md">
              {activeSession ? formatTimerDisplay(remainingSeconds) : formatTimerDisplay(customMinutes * 60)}
            </div>
            <p className="text-sm font-semibold text-slate-400 mt-2">
              {activeSession ? activeSession.taskTitle : tasks.find((t) => t.id === selectedTaskId)?.title || 'No task selected'}
            </p>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto mt-6 bg-slate-800/80 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-indigo-500 transition-all duration-1000"
                style={{ width: `${activeSession ? progressPercent : 0}%` }}
              />
            </div>
            {activeSession && (
              <p className="text-[11px] font-medium text-slate-500 mt-2">
                {Math.round(elapsedSeconds / 60)}m completed ({progressPercent}%)
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleToggleTimer}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                activeSession?.status === 'running'
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {activeSession?.status === 'running' ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Session</span>
                </>
              ) : activeSession?.status === 'paused' ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Session</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Sprint</span>
                </>
              )}
            </button>

            {activeSession && (
              <button
                onClick={handleCancelSession}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Sprints & Task Selection */}
        <div className="space-y-6">
          {/* Quick Sprint Presets */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sprint Presets</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { min: 25, label: 'Pomodoro', desc: '25m' },
                { min: 50, label: 'Deep Work', desc: '50m' },
                { min: 90, label: 'Flow State', desc: '90m' },
              ].map((p) => (
                <button
                  key={p.min}
                  onClick={() => {
                    setCustomMinutes(p.min);
                    handleStartPreset(p.min);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-center transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-white">{p.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Task Picker */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5 text-amber-400" />
                <span>Bind to Action Task</span>
              </h3>
              <button
                onClick={() => onNavigate('task-inbox')}
                className="text-[10px] text-indigo-400 hover:underline"
              >
                Manage Tasks
              </button>
            </div>

            {pendingTasks.length > 0 ? (
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Select a task to focus on —</option>
                {pendingTasks.slice(0, 15).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.priority.toUpperCase()})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500 italic">No open tasks in Inbox. You can focus freeform.</p>
            )}
          </div>

          {/* Focus Stats Mini Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Focus</p>
              <p className="text-xl font-black text-white mt-0.5">{formatDuration(totalMinutesFocused)}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Focus Session Logs */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Recent Completed Sprints</span>
          </h3>
          <span className="text-xs text-slate-400">{history.length} logged</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-400">No focus sessions completed yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Start a sprint above to record your deep work time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto scrollbar-thin">
            {history.slice(0, 10).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">{log.taskTitle}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(log.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                      {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-300">{log.actualMinutes}m</span>
                  <span className="text-[10px] text-slate-500 block">of {log.plannedMinutes}m</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
