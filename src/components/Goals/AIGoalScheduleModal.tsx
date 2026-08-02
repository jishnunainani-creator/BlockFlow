import React, { useState } from 'react';
import { Goal, ScheduledBlock } from '../../types/timetable';
import { generateAIGoalCandidateSlots } from '../../utils/goalEngine';
import { useTimetable } from '../../context/TimetableContext';
import { DAYS_OF_WEEK, minutesToTimeStr } from '../../utils/timeUtils';
import { Sparkles, Check, CheckSquare, Square, X, Calendar, Clock } from 'lucide-react';

interface AIGoalScheduleModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AIGoalScheduleModal: React.FC<AIGoalScheduleModalProps> = ({
  goal,
  isOpen,
  onClose,
}) => {
  const { currentWeekScheduledBlocks, currentWeekId, addScheduledBlock, addToast } = useTimetable();

  if (!isOpen || !goal) return null;

  const candidates = generateAIGoalCandidateSlots(goal, currentWeekScheduledBlocks, currentWeekId);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(candidates.map((_, i) => i))
  );

  const toggleSlot = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = candidates.filter((_, i) => selectedIndices.has(i));
    selected.forEach((cand) => {
      addScheduledBlock(cand);
    });

    addToast(`Scheduled ${selected.length} goal activity slots for "${goal.title}"! 🎯`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
              <Sparkles size={12} /> AI Goal Scheduling Engine
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">{goal.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          BlockFlow analyzed your current timetable and energy preferences to find optimal open focus windows for this goal:
        </p>

        <div className="space-y-2">
          {candidates.length > 0 ? (
            candidates.map((cand, i) => {
              const dayName = DAYS_OF_WEEK.find((d) => d.index === cand.dayOfWeek)?.full || 'Monday';
              const timeRange = `${minutesToTimeStr(cand.startMinutes)} – ${minutesToTimeStr(
                cand.startMinutes + cand.duration
              )}`;

              return (
                <div
                  key={i}
                  onClick={() => toggleSlot(i)}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    selectedIndices.has(i)
                      ? 'bg-slate-950 border-indigo-500/50 text-white'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedIndices.has(i) ? (
                      <CheckSquare className="text-indigo-400 shrink-0" size={18} />
                    ) : (
                      <Square className="text-slate-600 shrink-0" size={18} />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Calendar size={12} className="text-indigo-400" /> {dayName}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {timeRange} ({cand.duration}m)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Open Slot
                  </span>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
              No open candidate slots found in preferred energy window. Your week is densely packed.
            </div>
          )}
        </div>

        <div className="pt-2 flex gap-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            disabled={candidates.length === 0 || selectedIndices.size === 0}
            onClick={handleConfirm}
            className="w-1/2 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> Add to Timetable ({selectedIndices.size})
          </button>
        </div>
      </div>
    </div>
  );
};
