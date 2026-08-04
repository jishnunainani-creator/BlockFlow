import React from 'react';
import { useSession } from '../../context/SessionContext';
import { useTimetable } from '../../context/TimetableContext';
import { ScheduledBlock } from '../../types/timetable';
import { formatMinutesToTimeString } from '../../utils/timeUtils';
import { Clock, CheckCircle2, FastForward, PlusCircle, X } from 'lucide-react';

interface EndOfBlockNudgeProps {
  block: ScheduledBlock | null;
  onDismiss: () => void;
  onOpenExtendModal: (block: ScheduledBlock) => void;
}

export const EndOfBlockNudge: React.FC<EndOfBlockNudgeProps> = ({
  block,
  onDismiss,
  onOpenExtendModal,
}) => {
  const { openSessionLogModal } = useSession();
  const { updateBlockStatus } = useTimetable();

  if (!block) return null;

  const timeStr = `${formatMinutesToTimeString(block.startMinutes)} – ${formatMinutesToTimeString(
    block.startMinutes + block.duration
  )}`;

  const handleQuickComplete = () => {
    updateBlockStatus(block.id, 'completed');
    onDismiss();
  };

  const handleQuickSkip = () => {
    updateBlockStatus(block.id, 'skipped');
    onDismiss();
  };

  const handleOpenLog = () => {
    openSessionLogModal(block);
    onDismiss();
  };

  const handleExtend = () => {
    onOpenExtendModal(block);
    onDismiss();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9990] max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl animate-slide-up flex flex-col gap-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{block.title}</span>
              <span className="text-[10px] text-blue-400 font-normal">ended</span>
            </h4>
            <p className="text-[11px] text-slate-400">{timeStr}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleOpenLog}
          className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Log What I Studied</span>
        </button>

        <button
          onClick={handleQuickComplete}
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Complete</span>
        </button>

        <button
          onClick={handleExtend}
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>Extend Session</span>
        </button>

        <button
          onClick={handleQuickSkip}
          className="py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Skip</span>
        </button>
      </div>
    </div>
  );
};
