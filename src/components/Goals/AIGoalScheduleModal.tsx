import React, { useState } from 'react';
import { Goal } from '../../types/timetable';
import { generateAIGoalCandidateSlots } from '../../utils/goalEngine';
import { useTimetable } from '../../context/TimetableContext';
import { DAYS_OF_WEEK, minutesToTimeStr } from '../../utils/timeUtils';
import { Sparkles, Check, CheckSquare, Square, X, Calendar, Clock } from 'lucide-react';

interface AIGoalScheduleModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

interface InnerProps {
  goal: Goal;
  onClose: () => void;
}

const AIGoalScheduleModalContent: React.FC<InnerProps> = ({ goal, onClose }) => {
  const { currentWeekScheduledBlocks, currentWeekId, bulkAddScheduledBlocks, addToast } = useTimetable();

  const candidates = generateAIGoalCandidateSlots(goal, currentWeekScheduledBlocks, currentWeekId);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(candidates.map((_, i) => i))
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
    bulkAddScheduledBlocks(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-medium text-[#3659C9] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} /> AI Goal Scheduling
            </span>
            <h3 className="text-base font-bold text-white mt-1">{goal.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Open focus windows found for this goal based on your weekly timetable:
        </p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
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
                  className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                    selectedIndices.has(i)
                      ? 'bg-slate-800/80 border-[#3659C9] text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedIndices.has(i) ? (
                      <CheckSquare className="text-[#3659C9] shrink-0" size={16} />
                    ) : (
                      <Square className="text-slate-500 shrink-0" size={16} />
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" /> {dayName}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {timeRange} ({cand.duration}m)
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Open Slot
                  </span>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-900/60 p-6 rounded-lg border border-slate-800 text-center text-slate-400 text-xs">
              No open candidate slots found in your preferred window for this week.
            </div>
          )}
        </div>

        <div className="pt-3 flex gap-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-1/2 py-2 rounded-lg font-medium text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={candidates.length === 0 || selectedIndices.size === 0}
            onClick={handleConfirm}
            className="w-1/2 py-2 rounded-lg font-semibold text-xs bg-[#3659C9] hover:bg-[#2F4EB8] disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <Check size={16} /> Add to Timetable ({selectedIndices.size})
          </button>
        </div>
      </div>
    </div>
  );
};

export const AIGoalScheduleModal: React.FC<AIGoalScheduleModalProps> = ({
  goal,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !goal) return null;

  return (
    <AIGoalScheduleModalContent
      goal={goal}
      onClose={onClose}
    />
  );
};
