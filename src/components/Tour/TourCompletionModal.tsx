import React from 'react';
import { Sparkles, CheckCircle2, RotateCcw, ArrowRight, Zap, Keyboard } from 'lucide-react';

interface TourCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplay: () => void;
}

export const TourCompletionModal: React.FC<TourCompletionModalProps> = ({
  isOpen,
  onClose,
  onReplay,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 space-y-5 animate-scale-up">
        {/* Header Icon */}
        <div className="flex justify-center pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <CheckCircle2 size={30} />
          </div>
        </div>

        {/* Title & Description */}
        <div className="text-center space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
            <Sparkles size={11} /> Tour Complete
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">
            You're All Set to Master Your Time
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            You now know the foundations of BlockFlow: flexible timetable blocking, adaptive optimization, local-first notes, and focus tracking.
          </p>
        </div>

        {/* Shortcut Cheat Sheet */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Keyboard size={13} className="text-indigo-400" />
            <span>Power User Shortcuts</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Quick Capture</span>
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-slate-800 rounded text-indigo-300 border border-slate-700">Q</kbd>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Focus Mode</span>
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-slate-800 rounded text-indigo-300 border border-slate-700">F</kbd>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">AI Scheduler</span>
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-slate-800 rounded text-indigo-300 border border-slate-700">V</kbd>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
              <span className="text-slate-400">Grid Navigate</span>
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-slate-800 rounded text-indigo-300 border border-slate-700">Arrows</kbd>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onReplay}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Replay Tour</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Start Planning</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
