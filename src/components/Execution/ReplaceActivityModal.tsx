import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { useTimetable } from '../../context/TimetableContext';
import { ScheduledBlock } from '../../types/timetable';
import { DEVIATION_REASONS } from '../../types/sessionLog';
import { formatMinutesToTimeString } from '../../utils/timeUtils';
import { findAvailableSlotsForReschedule, RescheduleSlotCandidate } from '../../utils/rescheduleSlotFinder';
import { RefreshCw, ArrowRightLeft, Calendar, Inbox, FastForward, XCircle, X } from 'lucide-react';

interface ReplaceActivityModalProps {
  isOpen: boolean;
  block: ScheduledBlock | null;
  onClose: () => void;
}

export const ReplaceActivityModal: React.FC<ReplaceActivityModalProps> = ({ isOpen, block, onClose }) => {
  const { replaceActivity } = useSession();
  const { currentWeekScheduledBlocks, addScheduledBlock, addToast, libraryBlocks } = useTimetable();

  const [actualTitle, setActualTitle] = useState('');
  const [reason, setReason] = useState<string>('Health / fitness');
  const [note, setNote] = useState('');
  const [actionOnPlanned, setActionOnPlanned] = useState<'reschedule' | 'inbox' | 'skip' | 'cancel'>('reschedule');
  const [suggestedSlots, setSuggestedSlots] = useState<RescheduleSlotCandidate[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<RescheduleSlotCandidate | null>(null);

  useEffect(() => {
    if (block && isOpen) {
      setActualTitle('');
      setReason('Health / fitness');
      setNote('');
      setActionOnPlanned('reschedule');

      // Find real open recovery slots
      const slots = findAvailableSlotsForReschedule(block.duration, currentWeekScheduledBlocks);
      setSuggestedSlots(slots);
      setSelectedSlot(slots.find((s) => s.isRecommended) || slots[0] || null);
    }
  }, [block, isOpen, currentWeekScheduledBlocks]);

  if (!isOpen || !block) return null;

  const plannedTimeStr = `${formatMinutesToTimeString(block.startMinutes)} – ${formatMinutesToTimeString(
    block.startMinutes + block.duration
  )}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualTitle.trim()) {
      addToast('Please specify what you actually did', 'warning');
      return;
    }

    let rescheduledBlockId: string | undefined = undefined;

    // If reschedule is selected, create new scheduled block occurrence
    if (actionOnPlanned === 'reschedule' && selectedSlot) {
      addScheduledBlock({
        blockId: block.blockId || `block-${Date.now()}`,
        title: `${block.title} (Recovery)`,
        description: block.description,
        color: block.color,
        priority: block.priority,
        icon: block.icon,
        dayOfWeek: selectedSlot.dayOfWeek,
        startMinutes: selectedSlot.startMinutes,
        duration: selectedSlot.duration,
        reminderMinutes: 15,
        status: 'scheduled',
      });
      addToast(`Rescheduled "${block.title}" to ${selectedSlot.dateLabel} ${selectedSlot.timeRangeStr}! 📅`, 'success');
    }

    replaceActivity({
      scheduledBlock: block,
      actualTitle: actualTitle.trim(),
      reason,
      note: note.trim() || undefined,
      actionOnPlanned,
      rescheduledBlockId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-pink-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                CHANGE OF PLAN
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Planned: <span className="text-slate-200 font-semibold">{block.title}</span> ({plannedTimeStr})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* What did you actually do? */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              What did you actually do?
            </label>
            <input
              type="text"
              value={actualTitle}
              onChange={(e) => setActualTitle(e.target.value)}
              placeholder="e.g. Fitness / Gym"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-pink-500 transition-colors mb-2"
              autoFocus
            />
            {libraryBlocks.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-medium">Quick suggestions:</span>
                {libraryBlocks.slice(0, 4).map((lib) => (
                  <button
                    key={lib.id}
                    type="button"
                    onClick={() => setActualTitle(lib.title)}
                    className="text-[10px] bg-slate-800/60 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/50 transition-colors"
                  >
                    {lib.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Why did your plan change? */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Why did your plan change?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEVIATION_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-left text-xs px-3 py-2 rounded-xl border transition-all ${
                    reason === r
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 font-medium shadow-md shadow-pink-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Optional Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Felt low energy after work..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          {/* What should happen to planned activity? */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              What should happen to {block.title}?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { id: 'reschedule', label: 'Reschedule it', icon: Calendar },
                { id: 'inbox', label: 'Move to Task Inbox', icon: Inbox },
                { id: 'skip', label: 'Skip for today', icon: FastForward },
                { id: 'cancel', label: 'Cancel completely', icon: XCircle },
              ].map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActionOnPlanned(act.id as any)}
                    className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl border transition-all ${
                      actionOnPlanned === act.id
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Suggested Recovery Slots if Reschedule is selected */}
            {actionOnPlanned === 'reschedule' && (
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 space-y-2 animate-fade-in">
                <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Suggested Recovery Slots (Real Availability)
                </p>
                {suggestedSlots.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No free slots found this week.</p>
                ) : (
                  <div className="space-y-1.5">
                    {suggestedSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                          selectedSlot?.startMinutes === slot.startMinutes && selectedSlot?.dayOfWeek === slot.dayOfWeek
                            ? 'bg-blue-600/20 border-blue-500 text-blue-200 font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-slate-200">{slot.dateLabel}</span>
                          <span className="text-slate-400 ml-2">{slot.timeRangeStr}</span>
                        </div>
                        {slot.isRecommended && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                            Recommended
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-pink-600/25 flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Save Change</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
