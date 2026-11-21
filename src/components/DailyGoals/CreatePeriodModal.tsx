import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Flag,
  Sparkles,
} from 'lucide-react';
import {
  PlanPeriod,
  PeriodKind,
  PeriodMilestone,
  GOAL_PALETTE_OPTIONS,
} from '../../types/dailyGoals';

interface CreatePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  period?: PlanPeriod | null;
  existingPeriods: PlanPeriod[];
  onSave: (period: PlanPeriod) => void;
}

export const CreatePeriodModal: React.FC<CreatePeriodModalProps> = ({
  isOpen,
  onClose,
  period,
  existingPeriods,
  onSave,
}) => {
  const isEditing = Boolean(period && period.id);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [kind, setKind] = useState<PeriodKind>('exam');
  const [color, setColor] = useState('indigo');
  const [milestones, setMilestones] = useState<PeriodMilestone[]>([]);
  const [newMilestoneLabel, setNewMilestoneLabel] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState(todayStr);

  useEffect(() => {
    if (period) {
      setName(period.name);
      setStartDate(period.startDate);
      setEndDate(period.endDate);
      setKind(period.kind);
      setColor(period.color);
      setMilestones(period.milestones || []);
      setNewMilestoneDate(period.startDate);
    } else {
      setName('');
      setStartDate(todayStr);
      // Default to 1 week out
      const [y, m, d] = todayStr.split('-').map(Number);
      const nextWeek = new Date(y, m - 1, d + 7);
      const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
      setEndDate(nextWeekStr);
      setKind('exam');
      setColor('indigo');
      setMilestones([]);
      setNewMilestoneDate(todayStr);
    }
  }, [period, isOpen, todayStr]);

  // Check for overlapping periods (allowed with informational warning)
  const overlappingPeriods = useMemo(() => {
    if (!startDate || !endDate) return [];
    return existingPeriods.filter((p) => {
      if (period && p.id === period.id) return false;
      // Overlap condition: startA <= endB && endA >= startB
      return startDate <= p.endDate && endDate >= p.startDate;
    });
  }, [existingPeriods, startDate, endDate, period]);

  if (!isOpen) return null;

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneLabel.trim()) return;

    setMilestones((prev) => [
      ...prev,
      {
        date: newMilestoneDate || startDate,
        label: newMilestoneLabel.trim(),
      },
    ]);
    setNewMilestoneLabel('');
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validStart = startDate <= endDate ? startDate : endDate;
    const validEnd = endDate >= startDate ? endDate : startDate;

    const updatedPeriod: PlanPeriod = {
      id: period?.id || `period_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      startDate: validStart,
      endDate: validEnd,
      color,
      kind,
      milestones,
      createdAt: period?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(updatedPeriod);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Plan Period' : 'Create Plan Period'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Focus intensive study, exams, or multi-day sprint phases
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Period Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Endsem Exam Phase, Sprint 4, Thesis Sprint"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Date Range Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Overlapping Period Info Banner */}
          {overlappingPeriods.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                Notice: Dates overlap with existing period(s): {overlappingPeriods.map((p) => `"${p.name}"`).join(', ')}. Overlapping periods are fully supported.
              </span>
            </div>
          )}

          {/* Kind & Color Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Kind */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Period Kind
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['exam', 'sprint', 'custom'] as PeriodKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`py-1.5 text-xs font-semibold rounded-lg capitalize border transition-all ${
                      kind === k
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Tag */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Theme Color
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

          {/* Milestones (Exam Days) Section */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-indigo-500" />
                Exam Milestones ({milestones.length})
              </label>
              <span className="text-[11px] text-slate-500">
                Key dates like exam papers or deadlines
              </span>
            </div>

            {/* Existing Milestones List */}
            {milestones.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                        {m.date}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 truncate font-medium">
                        {m.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Milestone Mini-Form */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="date"
                value={newMilestoneDate}
                min={startDate}
                max={endDate}
                onChange={(e) => setNewMilestoneDate(e.target.value)}
                className="w-36 px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={newMilestoneLabel}
                onChange={(e) => setNewMilestoneLabel(e.target.value)}
                placeholder="e.g. Physics Paper 1"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white flex items-center gap-1 shrink-0"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
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
              {isEditing ? 'Save Changes' : 'Create Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
