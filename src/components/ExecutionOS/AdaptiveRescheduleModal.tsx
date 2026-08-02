import React from 'react';
import { ScheduledBlock } from '../../types/timetable';
import { findCentralizedScheduleSlot } from '../../utils/centralPlanningEngine';
import { useTimetable } from '../../context/TimetableContext';
import { loadTaskInbox, saveTaskInbox, loadPersonalRules } from '../../utils/taskInboxStorage';
import { TaskInboxItem } from '../../types/executionOS';
import { RefreshCcw, Inbox, SkipForward, Sparkles, X, Check } from 'lucide-react';

interface AdaptiveRescheduleModalProps {
  block: ScheduledBlock | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdaptiveRescheduleModal: React.FC<AdaptiveRescheduleModalProps> = ({
  block,
  isOpen,
  onClose,
}) => {
  const { currentWeekScheduledBlocks, addScheduledBlock, updateBlockStatus, addToast } = useTimetable();

  if (!isOpen || !block) return null;

  const personalRules = loadPersonalRules();
  const rec = findCentralizedScheduleSlot({
    task: { title: block.title, estimatedDuration: block.duration, priority: block.priority, goalId: block.goalId },
    existingBlocks: currentWeekScheduledBlocks,
    personalRules,
  });

  const handleReschedule = () => {
    updateBlockStatus(block.id, 'skipped');

    addScheduledBlock({
      blockId: block.blockId,
      title: block.title,
      description: block.description,
      color: block.color,
      priority: block.priority,
      icon: block.icon,
      dayOfWeek: rec.dayOfWeek,
      startMinutes: rec.startMinutes,
      duration: rec.duration,
      status: 'not_started',
      goalId: block.goalId,
      goalTitle: block.goalTitle,
    });

    addToast(`Intelligently rescheduled "${block.title}"! 🔄`, 'success');
    onClose();
  };

  const handleSendToInbox = () => {
    updateBlockStatus(block.id, 'skipped');

    const inbox = loadTaskInbox();
    const newTask: TaskInboxItem = {
      id: `task-${Date.now()}`,
      title: block.title,
      description: block.description,
      estimatedDuration: block.duration,
      priority: block.priority,
      category: 'Work',
      goalId: block.goalId,
      goalTitle: block.goalTitle,
      status: 'backlog',
      createdAt: Date.now(),
    };

    saveTaskInbox([newTask, ...inbox]);
    addToast(`Sent "${block.title}" to Task Inbox Backlog! 📥`, 'info');
    onClose();
  };

  const handleSkip = () => {
    updateBlockStatus(block.id, 'skipped');
    addToast(`Marked "${block.title}" as Skipped`, 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1">
              <RefreshCcw size={12} /> Adaptive Rescheduling Recovery
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">{block.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          This flexible activity passed without completion. Choose how to recover your schedule:
        </p>

        {/* Explainable Recommendation Box */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
            <Sparkles size={12} /> Recommended Candidate Free Slot
          </span>
          <ul className="space-y-1 text-xs text-slate-300">
            {rec.explainableReasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-indigo-400">▸</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={handleReschedule}
            className="w-full p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <RefreshCcw size={16} /> Reschedule to Candidate Slot
            </span>
            <Check size={16} />
          </button>

          <button
            onClick={handleSendToInbox}
            className="w-full p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <Inbox size={16} className="text-indigo-400" /> Send to Task Inbox Backlog
            </span>
          </button>

          <button
            onClick={handleSkip}
            className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800/60 text-slate-400 font-medium text-xs rounded-xl flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <SkipForward size={14} /> Mark Skipped
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
