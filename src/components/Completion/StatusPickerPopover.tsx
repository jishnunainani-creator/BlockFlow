import React from 'react';
import { CompletionStatus, COMPLETION_STATUS_CONFIG } from '../../types/timetable';
import { Check, X } from 'lucide-react';

interface StatusPickerPopoverProps {
  currentStatus: CompletionStatus;
  onSelectStatus: (status: CompletionStatus) => void;
  onClose: () => void;
}

export const StatusPickerPopover: React.FC<StatusPickerPopoverProps> = ({
  currentStatus,
  onSelectStatus,
  onClose,
}) => {
  const options: CompletionStatus[] = [
    'not_started',
    'in_progress',
    'completed',
    'took_longer',
    'faster',
    'skipped',
    'missed',
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 min-w-[180px] animate-fade-in text-slate-100 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span>Task Outcome</span>
        <button onClick={onClose} className="p-0.5 hover:text-white rounded">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-1">
        {options.map((st) => {
          const cfg = COMPLETION_STATUS_CONFIG[st];
          const isSelected = currentStatus === st;
          return (
            <button
              key={st}
              onClick={() => {
                onSelectStatus(st);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{cfg.badge}</span>
                <span>{cfg.label}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
