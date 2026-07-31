import React from 'react';
import { CalendarClock, Sun, Calendar, Clock, Sparkles, Trash2, X } from 'lucide-react';

interface ScheduledBlock {
  id: string;
  title: string;
  duration: number;
}

interface SmartReschedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: ScheduledBlock | null;
  onReschedule: (newDay: number, newStart: number) => void;
  onDelete: () => void;
}

export default function SmartReschedulerModal({ isOpen, onClose, block, onReschedule, onDelete }: SmartReschedulerModalProps) {
  if (!isOpen || !block) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarClock className="text-indigo-400" size={20} />
            Reschedule Activity
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-6">
            <p className="text-slate-400 text-sm mb-1">Activity</p>
            <p className="text-slate-200 font-medium text-lg">{block.title}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors text-left group">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:bg-orange-500/20">
                <Sun size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Move to Tomorrow</p>
                <p className="text-xs text-slate-500">Keep momentum, shift 1 day</p>
              </div>
            </button>

            <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors text-left group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Move to Weekend</p>
                <p className="text-xs text-slate-500">Free up weekday time</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors text-left group">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Let AI Decide</p>
                <p className="text-xs text-slate-500">Find the best available slot automatically</p>
              </div>
            </button>

            <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors text-left group">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500/20">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Choose New Time</p>
                <p className="text-xs text-slate-500">Manually select slot</p>
              </div>
            </button>

            <div className="h-px bg-slate-800 my-2"></div>

            <button onClick={() => { onDelete(); onClose(); }} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 transition-colors text-left group">
              <div className="w-10 h-10 rounded-lg text-red-400 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <p className="text-red-400 font-medium">Delete Activity</p>
                <p className="text-xs text-slate-500">Remove from schedule entirely</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
