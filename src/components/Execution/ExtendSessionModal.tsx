import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { ScheduledBlock } from '../../types/timetable';
import { Clock, PlusCircle, X } from 'lucide-react';

interface ExtendSessionModalProps {
  isOpen: boolean;
  block: ScheduledBlock | null;
  onClose: () => void;
}

export const ExtendSessionModal: React.FC<ExtendSessionModalProps> = ({ isOpen, block, onClose }) => {
  const { extendSession } = useSession();
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState<string>('');

  if (!isOpen || !block) return null;

  const handleApply = () => {
    const mins = customMinutes ? parseInt(customMinutes, 10) : selectedMinutes;
    if (isNaN(mins) || mins <= 0) return;

    extendSession(block.id, mins);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">EXTEND SESSION</h3>
              <p className="text-xs text-slate-400 font-medium">{block.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Select Extension Duration
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setSelectedMinutes(mins);
                  setCustomMinutes('');
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  selectedMinutes === mins && !customMinutes
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                +{mins} mins {mins === 60 ? '(1 hour)' : ''}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Custom Minutes</label>
            <input
              type="number"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="e.g. 20"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply Extension</span>
          </button>
        </div>
      </div>
    </div>
  );
};
