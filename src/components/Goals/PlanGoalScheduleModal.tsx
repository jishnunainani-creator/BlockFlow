import React, { useState, useMemo } from 'react';
import { Goal, ScheduledBlock } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { calculateGoalMetrics, proposeSmartGoalScheduleSlots, ProposedGoalSession } from '../../utils/goalEngine';
import { DAYS_OF_WEEK, minutesToTimeStr } from '../../utils/timeUtils';
import {
  Calendar,
  Clock,
  Sparkles,
  Check,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  CalendarCheck,
} from 'lucide-react';

interface PlanGoalScheduleModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PlanGoalScheduleModal: React.FC<PlanGoalScheduleModalProps> = ({
  goal,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentWeekScheduledBlocks, addScheduledBlock, addToast } = useTimetable();

  // Configuration options
  const [selectedDays, setSelectedDays] = useState<number[]>(() => goal?.smart?.preferredDays || [0, 2, 4]);
  const [sessionDuration, setSessionDuration] = useState<number>(() => goal?.smart?.preferredSessionMinutes || 60);
  const [preferredWindow, setPreferredWindow] = useState<'morning' | 'afternoon' | 'evening'>(
    () => goal?.smart?.preferredEnergyWindow || 'morning'
  );

  // How many sessions to schedule this week (default calculated from remaining hours)
  const [sessionCount, setSessionCount] = useState<number>(3);

  // Proposed sessions state with user acceptance toggles
  const [acceptedSessionIds, setAcceptedSessionIds] = useState<Set<string>>(new Set());

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!goal) return null;
    return calculateGoalMetrics(goal, currentWeekScheduledBlocks);
  }, [goal, currentWeekScheduledBlocks]);

  // Generate proposed sessions whenever configuration changes
  const proposedSessions = useMemo(() => {
    if (!goal) return [];

    const slots = proposeSmartGoalScheduleSlots({
      goal,
      existingBlocks: currentWeekScheduledBlocks,
      selectedDays: selectedDays.length > 0 ? selectedDays : [0, 2, 4],
      sessionDuration,
      totalSessionsToSchedule: sessionCount,
      preferredTimeWindow: preferredWindow,
    });

    return slots;
  }, [goal, currentWeekScheduledBlocks, selectedDays, sessionDuration, sessionCount, preferredWindow]);

  // Sync accepted IDs whenever proposals change
  const validProposedSessions = useMemo(() => {
    const valid = proposedSessions.filter((s) => !s.hasCollision);
    // Initialize acceptance to all non-colliding sessions if not customized
    return valid;
  }, [proposedSessions]);

  React.useEffect(() => {
    setAcceptedSessionIds(new Set(validProposedSessions.map((s) => s.id)));
  }, [validProposedSessions]);

  if (!isOpen || !goal || !metrics) return null;

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) => {
      const next = prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort();
      return next.length > 0 ? next : [dayIndex];
    });
  };

  const toggleAccepted = (id: string) => {
    setAcceptedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmSchedule = () => {
    const selectedToSchedule = proposedSessions.filter(
      (s) => !s.hasCollision && acceptedSessionIds.has(s.id)
    );

    if (selectedToSchedule.length === 0) {
      addToast('No sessions selected to schedule.', 'warning');
      return;
    }

    selectedToSchedule.forEach((session) => {
      const newBlock: Omit<ScheduledBlock, 'id' | 'weekId'> = {
        blockId: `goal-${goal.id}-${Date.now()}`,
        title: session.title,
        description: `Dedicated study session for SMART Goal: ${goal.title}`,
        color: goal.color || '#3659C9',
        priority: 'high',
        icon: 'target',
        dayOfWeek: session.dayOfWeek,
        startMinutes: session.startMinutes,
        duration: session.duration,
        status: 'not_started',
        goalId: goal.id,
        goalTitle: goal.title,
      };

      addScheduledBlock(newBlock);
    });

    addToast(
      `Successfully scheduled ${selectedToSchedule.length} focus sessions for "${goal.title}"!`,
      'success'
    );

    if (onSuccess) onSuccess();
    onClose();
  };

  const acceptedCount = proposedSessions.filter((s) => !s.hasCollision && acceptedSessionIds.has(s.id)).length;
  const scheduledHours = Math.round(((acceptedCount * sessionDuration) / 60) * 10) / 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border text-white shrink-0"
              style={{ backgroundColor: `${goal.color}20`, borderColor: `${goal.color}50` }}
            >
              <CalendarCheck size={20} style={{ color: goal.color }} />
            </div>
            <div>
              <span className="text-xs font-bold text-[#3659C9] tracking-wider uppercase">
                Timetable Scheduler
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5 leading-snug">
                Plan Sessions: {goal.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close scheduler"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
          
          {/* Goal Effort Context Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400">Remaining Effort to Complete:</span>{' '}
              <strong className="text-white font-mono text-base ml-1">{metrics.remainingHours}h</strong>
              <span className="text-slate-500"> of {metrics.estimatedTotalHours}h total</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={14} className="text-[#3659C9]" />
              <span>~{metrics.feasibility.studyDaysNeeded} study days estimated</span>
            </div>
          </div>

          {/* ── Section 1: Schedule Cadence Preferences ── */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#3659C9] block">
                Step 1 · Schedule Cadence
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Set Your Weekly Target
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose the days and duration that match your study habits.
              </p>
            </div>

            {/* Days Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Available Study Days
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = selectedDays.includes(d.index);
                  return (
                    <button
                      key={d.index}
                      type="button"
                      onClick={() => toggleDay(d.index)}
                      className={`py-2.5 rounded-lg text-xs font-semibold border text-center transition-all ${
                        isSelected
                          ? 'bg-[#3659C9] border-[#3659C9] text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration, Number of Sessions, Energy Window */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Session Length
                </label>
                <select
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#3659C9]"
                >
                  <option value={30}>30 mins (Quick)</option>
                  <option value={45}>45 mins (Pomodoro)</option>
                  <option value={60}>60 mins (1 Hour)</option>
                  <option value={90}>90 mins (1.5 Hours)</option>
                  <option value={120}>120 mins (2 Hours)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Target Sessions
                </label>
                <select
                  value={sessionCount}
                  onChange={(e) => setSessionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#3659C9]"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <option key={num} value={num}>
                      {num} session{num > 1 ? 's' : ''} ({((num * sessionDuration) / 60).toFixed(1)}h)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Time Window
                </label>
                <select
                  value={preferredWindow}
                  onChange={(e) => setPreferredWindow(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#3659C9]"
                >
                  <option value="morning">Morning (09:00 AM)</option>
                  <option value="afternoon">Afternoon (02:00 PM)</option>
                  <option value="evening">Evening (07:00 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Section 2: Transparent Proposed Sessions Review ── */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#3659C9] block">
                  Step 2 · Review Proposed Time Blocks
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proposed slots avoid existing timetable blocks. Uncheck any session you want to skip.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-[#3659C9] bg-[#3659C9]/15 px-3 py-1 rounded-lg border border-[#3659C9]/30 self-start sm:self-auto">
                {acceptedCount} of {proposedSessions.length} active ({scheduledHours}h total)
              </span>
            </div>

            <div className="space-y-2.5">
              {proposedSessions.map((session) => {
                const isAccepted = !session.hasCollision && acceptedSessionIds.has(session.id);
                const startTimeStr = minutesToTimeStr(session.startMinutes);
                const endTimeStr = minutesToTimeStr(session.startMinutes + session.duration);

                return (
                  <div
                    key={session.id}
                    onClick={() => !session.hasCollision && toggleAccepted(session.id)}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                      session.hasCollision
                        ? 'bg-rose-500/5 border-rose-500/25 text-slate-400 cursor-not-allowed opacity-75'
                        : isAccepted
                        ? 'bg-slate-800/90 border-[#3659C9] text-white cursor-pointer ring-1 ring-[#3659C9]/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {!session.hasCollision ? (
                        <div className="shrink-0">
                          {isAccepted ? (
                            <CheckSquare size={18} className="text-[#3659C9]" />
                          ) : (
                            <Square size={18} className="text-slate-500" />
                          )}
                        </div>
                      ) : (
                        <AlertTriangle size={18} className="text-rose-400 shrink-0" />
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{session.dayName}</span>
                          <span className="font-mono text-slate-200 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {startTimeStr} – {endTimeStr}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">({session.duration}m)</span>
                        </div>

                        {session.shiftedFrom && (
                          <p className="text-xs text-amber-300">
                            {session.collisionMessage}
                          </p>
                        )}

                        {session.hasCollision && (
                          <p className="text-xs text-rose-300">
                            {session.collisionMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {!session.hasCollision ? (
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                          Open Slot
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/30">
                          Collision
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={acceptedCount === 0}
            onClick={handleConfirmSchedule}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3659C9] hover:bg-[#2F4EB8] disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition-colors shadow-md"
          >
            <Check size={16} />
            <span>Schedule {acceptedCount} Sessions ({scheduledHours}h)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
