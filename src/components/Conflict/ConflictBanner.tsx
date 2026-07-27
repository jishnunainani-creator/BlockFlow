import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { suggestFreeTimeSlots } from '../../utils/conflictUtils';
import { DAYS_OF_WEEK } from '../../utils/timeUtils';
import { AlertTriangle, ChevronUp, ChevronDown, Check, MoveRight, Clock } from 'lucide-react';

export const ConflictBanner: React.FC = () => {
  const { conflicts, scheduledBlocks, moveScheduledBlock, addToast } = useTimetable();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);

  if (conflicts.size === 0) return null;

  const conflictList = Array.from(conflicts.values());
  const activeConflict = selectedConflictId
    ? conflicts.get(selectedConflictId) || conflictList[0]
    : conflictList[0];

  const targetBlock = scheduledBlocks.find((sb) => sb.id === activeConflict.blockId);
  const freeSlots = targetBlock
    ? suggestFreeTimeSlots(targetBlock.dayOfWeek, targetBlock.duration, scheduledBlocks)
    : [];

  const handleApplySlot = (startMinutes: number) => {
    if (!targetBlock) return;
    moveScheduledBlock(targetBlock.id, targetBlock.dayOfWeek, startMinutes);
    addToast(`Moved "${targetBlock.title}" to free slot!`, 'success');
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-full px-4 animate-fade-in select-none">
      <div className="bg-rose-950/90 border border-rose-500/50 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden text-rose-100">
        {/* Banner Bar */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Scheduling Conflict Detected</span>
                <span className="px-2 py-0.2 rounded-full bg-rose-500/30 text-rose-300 text-[10px]">
                  {conflicts.size} overlapping {conflicts.size === 1 ? 'item' : 'items'}
                </span>
              </h4>
              <p className="text-[11px] text-rose-200/80">
                {activeConflict.message}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800/80 text-white rounded-xl text-xs font-bold transition-all border border-rose-700/50"
          >
            <span>Resolve</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Free Slots Suggestion Drawer */}
        {isExpanded && targetBlock && (
          <div className="p-4 bg-slate-900/95 border-t border-rose-900/50 space-y-3 text-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Suggested Free Slots on {DAYS_OF_WEEK[targetBlock.dayOfWeek]?.full}:</span>
              </span>
            </div>

            {freeSlots.length === 0 ? (
              <p className="text-xs text-slate-400">No immediate free time slots available on this day.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {freeSlots.map((slot) => (
                  <button
                    key={slot.startMinutes}
                    onClick={() => handleApplySlot(slot.startMinutes)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-200 hover:text-white transition-all group"
                  >
                    <span>{slot.timeStr}</span>
                    <MoveRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
