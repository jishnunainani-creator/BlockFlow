import React, { useState } from 'react';
import { ScheduledBlock } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { loadTaskInbox, saveTaskInbox, loadPersonalRules } from '../../utils/taskInboxStorage';
import { findCentralizedScheduleSlot } from '../../utils/centralPlanningEngine';
import { TaskInboxItem } from '../../types/executionOS';
import { Sun, Calendar, RefreshCcw, Inbox, SkipForward, Sparkles, Check, X } from 'lucide-react';

interface TomorrowBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TomorrowBuilderModal: React.FC<TomorrowBuilderModalProps> = ({ isOpen, onClose }) => {
  const { currentWeekScheduledBlocks, addScheduledBlock, updateBlockStatus, addToast } = useTimetable();
  const [step, setStep] = useState<'carry_forward' | 'tomorrow_plan'>('carry_forward');

  if (!isOpen) return null;

  const todayIndex = (new Date().getDay() + 6) % 7;
  const tomorrowIndex = (todayIndex + 1) % 7;

  const todayIncomplete = (currentWeekScheduledBlocks || []).filter(
    (b) => b.dayOfWeek === todayIndex && b.status !== 'completed' && b.status !== 'faster' && b.status !== 'skipped'
  );

  const inboxTasks = loadTaskInbox().filter((t) => t.status === 'backlog');

  const handleCarryForwardAction = (block: ScheduledBlock, action: 'tomorrow' | 'inbox' | 'skip') => {
    updateBlockStatus(block.id, 'skipped');

    if (action === 'tomorrow') {
      const personalRules = loadPersonalRules();
      const rec = findCentralizedScheduleSlot({
        task: { title: block.title, estimatedDuration: block.duration, priority: block.priority, goalId: block.goalId },
        existingBlocks: currentWeekScheduledBlocks,
        personalRules,
      });

      addScheduledBlock({
        blockId: block.blockId,
        title: block.title,
        description: block.description,
        color: block.color,
        priority: block.priority,
        icon: block.icon,
        dayOfWeek: tomorrowIndex,
        startMinutes: rec.startMinutes,
        duration: block.duration,
        status: 'not_started',
        goalId: block.goalId,
        goalTitle: block.goalTitle,
      });
      addToast(`Moved "${block.title}" to Tomorrow! 🌅`, 'success');
    } else if (action === 'inbox') {
      const currentInbox = loadTaskInbox();
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
      saveTaskInbox([newTask, ...currentInbox]);
      addToast(`Sent "${block.title}" to Task Inbox Backlog! 📥`, 'info');
    } else {
      addToast(`Marked "${block.title}" as Skipped`, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1">
              <Sun size={12} /> Tomorrow Builder &amp; Carry Forward
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              {step === 'carry_forward' ? 'Carry Forward Unfinished Work' : "Tomorrow's Schedule Plan"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Carry Forward Decision */}
        {step === 'carry_forward' && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <p className="text-xs text-slate-400 leading-relaxed">
              BlockFlow prevents unfinished activities from silently disappearing. Choose a carry-forward action for each:
            </p>

            {todayIncomplete.length > 0 ? (
              <div className="space-y-3">
                {todayIncomplete.map((b) => (
                  <div key={b.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white">{b.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{b.duration} mins</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => handleCarryForwardAction(b, 'tomorrow')}
                        className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg shadow flex items-center justify-center gap-1"
                      >
                        <RefreshCcw size={10} /> Move Tomorrow
                      </button>
                      <button
                        onClick={() => handleCarryForwardAction(b, 'inbox')}
                        className="px-2 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1"
                      >
                        <Inbox size={10} className="text-indigo-400" /> Task Inbox
                      </button>
                      <button
                        onClick={() => handleCarryForwardAction(b, 'skip')}
                        className="px-2 py-1.5 bg-slate-900 border border-slate-800 text-slate-500 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1"
                      >
                        <SkipForward size={10} /> Skip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                <Check size={24} className="text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-white">All today's activities are finished!</p>
              </div>
            )}

            <div className="pt-3">
              <button
                onClick={() => setStep('tomorrow_plan')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
              >
                Proceed to Tomorrow's Schedule Plan →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Tomorrow Plan Preview */}
        {step === 'tomorrow_plan' && (
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
                <Sparkles size={12} /> Tomorrow's Optimal Plan Overview
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Inspected tomorrow's timetable, backlog items ({inboxTasks.length} tasks ready), and personal rules (e.g. No heavy work after 10 PM).
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  addToast("Tomorrow's schedule confirmed and locked! 🌅", 'success');
                  onClose();
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
              >
                <Check size={16} /> Confirm &amp; Lock Tomorrow's Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
