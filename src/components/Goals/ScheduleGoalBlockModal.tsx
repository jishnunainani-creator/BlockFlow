import React, { useState } from 'react';
import { Goal, ScheduledBlock } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { Calendar, Clock, Target, X, Check } from 'lucide-react';
import { DAYS_OF_WEEK } from '../../utils/timeUtils';

interface ScheduleGoalBlockModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleGoalBlockModal: React.FC<ScheduleGoalBlockModalProps> = ({
  goal,
  isOpen,
  onClose,
}) => {
  const { addScheduledBlock, addToast } = useTimetable();

  const [title, setTitle] = useState(goal ? `${goal.title} Session` : '');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [startMinutes, setStartMinutes] = useState<number>(540); // 09:00 AM
  const [duration, setDuration] = useState<number>(goal?.preferredSessionMinutes || 90);
  const [componentId, setComponentId] = useState<string>('');

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addScheduledBlock({
      blockId: `lib-goal-${goal.id}`,
      title: title.trim(),
      description: `Dedicated focused session for Goal: ${goal.title}`,
      color: goal.color || '#8B5CF6',
      priority: 'high',
      icon: 'target',
      dayOfWeek,
      startMinutes,
      duration,
      status: 'not_started',
      goalId: goal.id,
      goalTitle: goal.title,
      goalComponentId: componentId || undefined,
    });

    addToast(`Scheduled "${title}" for Goal: "${goal.title}"! 🎯`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in select-none">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4"
      >
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
              Schedule Goal Activity
            </span>
            <h3 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
              <Target size={18} className="text-purple-400" />
              <span>{goal.title}</span>
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Activity Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {goal.components && goal.components.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Link to Goal Sub-Component</label>
            <select
              value={componentId}
              onChange={(e) => setComponentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">-- General Goal Activity --</option>
              {goal.components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.completedHours}/{c.targetHours}h)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1 flex items-center gap-1">
              <Calendar size={12} /> Day of Week
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.index} value={d.index}>
                  {d.full}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1 flex items-center gap-1">
              <Clock size={12} /> Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins (1 hr)</option>
              <option value={90}>90 mins (1.5 hrs)</option>
              <option value={120}>120 mins (2 hrs)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-1/2 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> Schedule Slot
          </button>
        </div>
      </form>
    </div>
  );
};
