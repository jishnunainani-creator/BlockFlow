import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Calendar,
  AlertTriangle,
  Star,
  CheckCircle2,
  Hash,
  Percent,
  Timer,
  Trash2,
} from 'lucide-react';
import {
  DailyGoal,
  DailyGoalPriority,
  GoalMeasureType,
  GOAL_PALETTE_OPTIONS,
} from '../../types/dailyGoals';
import { ScheduledBlock } from '../../types/timetable';
import { checkGoalWindowOverlap } from '../../utils/dailyGoalsEngine';
import { minutesToTimeStr, timeStrToMinutes } from '../../utils/timeUtils';

interface DailyGoalEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: DailyGoal | null;
  dateStr: string; // "YYYY-MM-DD"
  scheduledBlocks: ScheduledBlock[];
  existingMustDoCount: number;
  onSave: (goal: DailyGoal) => void;
  onDelete?: (goalId: string) => void;
}

export const DailyGoalEditorModal: React.FC<DailyGoalEditorModalProps> = ({
  isOpen,
  onClose,
  goal,
  dateStr,
  scheduledBlocks,
  existingMustDoCount,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(goal && goal.id);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('indigo');
  const [priority, setPriority] = useState<DailyGoalPriority>('medium');
  const [isMustDo, setIsMustDo] = useState(false);
  const [isAnytime, setIsAnytime] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [estimateMin, setEstimateMin] = useState<number | undefined>(60);
  const [measureType, setMeasureType] = useState<GoalMeasureType>('check');
  const [measureTarget, setMeasureTarget] = useState<number>(10);
  const [measureCurrent, setMeasureCurrent] = useState<number>(0);

  // Initialize or reset when goal changes
  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setNotes(goal.notes || '');
      setColor(goal.color || 'indigo');
      setPriority(goal.priority || 'medium');
      setIsMustDo(Boolean(goal.isMustDo));
      setIsAnytime(!goal.startTime);
      setStartTime(goal.startTime || '09:00');
      setEndTime(goal.endTime || '10:00');
      setEstimateMin(goal.estimateMin);
      setMeasureType(goal.measure.type);
      setMeasureTarget(goal.measure.target || (goal.measure.type === 'percent' ? 100 : 10));
      setMeasureCurrent(goal.measure.current || 0);
    } else {
      setTitle('');
      setNotes('');
      setColor('indigo');
      setPriority('medium');
      setIsMustDo(false);
      setIsAnytime(true);
      setStartTime('09:00');
      setEndTime('10:00');
      setEstimateMin(60);
      setMeasureType('check');
      setMeasureTarget(10);
      setMeasureCurrent(0);
    }
  }, [goal, isOpen]);

  // Check fixed commitment overlap when timed
  const overlapCheck = useMemo(() => {
    if (isAnytime) return { hasOverlap: false };
    return checkGoalWindowOverlap({ startTime, endTime }, scheduledBlocks);
  }, [isAnytime, startTime, endTime, scheduledBlocks]);

  if (!isOpen) return null;

  const handleDurationChip = (mins: number) => {
    setEstimateMin(mins);
    if (!isAnytime && startTime) {
      const startM = timeStrToMinutes(startTime);
      const endM = (startM + mins) % 1440;
      setEndTime(minutesToTimeStr(endM));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedGoal: DailyGoal = {
      id: goal?.id || `dg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: goal?.date || dateStr,
      periodId: goal?.periodId,
      title: title.trim(),
      notes: notes.trim() || undefined,
      color,
      priority,
      isMustDo,
      startTime: isAnytime ? undefined : startTime,
      endTime: isAnytime ? undefined : endTime,
      estimateMin: estimateMin && estimateMin > 0 ? estimateMin : undefined,
      actualMin: goal?.actualMin,
      measure: {
        type: measureType,
        target: measureType === 'check' ? undefined : measureTarget,
        current: measureCurrent,
      },
      status: goal?.status || 'planned',
      carriedFromId: goal?.carriedFromId,
      carryCount: goal?.carryCount || 0,
      linkedBlockId: goal?.linkedBlockId,
      linkedAssignmentId: goal?.linkedAssignmentId,
      linkedSmartGoalId: goal?.linkedSmartGoalId,
      order: goal?.order ?? 0,
      createdAt: goal?.createdAt || Date.now(),
      updatedAt: Date.now(),
      completedAt: goal?.completedAt,
    };

    onSave(updatedGoal);
    onClose();
  };

  const showMustDoCapWarning = !goal?.isMustDo && isMustDo && existingMustDoCount >= 3;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Daily Goal' : 'New Daily Goal'}
            </h2>
            <span className="text-xs text-slate-500 font-mono">({dateStr})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Goal Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete math exercises 1 to 5"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Notes or Context (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details, page numbers, or links..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Priority & Color Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['high', 'medium', 'low'] as DailyGoalPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-semibold rounded-lg capitalize border transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500'
                          : p === 'medium'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500'
                          : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette (8 accessible tokens) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Color Tag
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {GOAL_PALETTE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setColor(opt.id)}
                    title={opt.name}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === opt.id ? 'scale-115 border-slate-900 dark:border-white shadow-xs' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: opt.dotColor }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Top 3 Must-Do Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star
                className={`w-4 h-4 ${isMustDo ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`}
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Top 3 Must-Do Goal
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Highlight this as one of today's highest essential priorities
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isMustDo}
              onChange={(e) => setIsMustDo(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Gentle Cap Warning if > 3 Must-dos */}
          {showMustDoCapWarning && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                You already have {existingMustDoCount} must-do goals. Marking more than 3 may dilute focus, but you are free to proceed.
              </span>
            </div>
          )}

          {/* Schedule / Time Window */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Schedule Window
              </label>
              <button
                type="button"
                onClick={() => setIsAnytime(!isAnytime)}
                className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                  isAnytime
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white border-transparent'
                    : 'text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800'
                }`}
              >
                {isAnytime ? 'Anytime today' : 'Specific time'}
              </button>
            </div>

            {!isAnytime && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Start (15m snap)</span>
                  <input
                    type="time"
                    step="900"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">End (15m snap)</span>
                  <input
                    type="time"
                    step="900"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Fixed Commitment Overlap Warning */}
            {overlapCheck.hasOverlap && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Notice: This window overlaps fixed commitment "{overlapCheck.conflictingBlockTitle}".
                </span>
              </div>
            )}

            {/* Duration / Estimate Chips */}
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Estimate (minutes)</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[15, 30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationChip(mins)}
                    className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
                      estimateMin === mins
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Measure Type Picker */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Progress Measure
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { type: 'check' as GoalMeasureType, label: 'Checkbox', icon: CheckCircle2 },
                { type: 'count' as GoalMeasureType, label: 'Count', icon: Hash },
                { type: 'percent' as GoalMeasureType, label: 'Percent', icon: Percent },
                { type: 'minutes' as GoalMeasureType, label: 'Minutes', icon: Timer },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMeasureType(type)}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                    measureType === type
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-500 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>

            {measureType !== 'check' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Target</span>
                  <input
                    type="number"
                    min="1"
                    value={measureTarget}
                    onChange={(e) => setMeasureTarget(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Current</span>
                  <input
                    type="number"
                    min="0"
                    value={measureCurrent}
                    onChange={(e) => setMeasureCurrent(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (goal?.id) onDelete(goal.id);
                  onClose();
                }}
                className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
              >
                {isEditing ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
