import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import {
  Zap,
  Play,
  Pause,
  CheckCircle2,
  X,
  Target,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({ isOpen, onClose }) => {
  const { currentWeekScheduledBlocks, updateBlockStatus, addToast } = useTimetable();

  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60); // Default 25 min timer
  const [isRunning, setIsRunning] = useState(false);
  const [currentTaskTitle, setCurrentTaskTitle] = useState('Dynamic Programming Graph Sheet');
  const [nextTaskTitle, setNextTaskTitle] = useState('Internship API Integration');

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      addToast('Focus Session Completed! 🎉 Take a 5 min break.', 'success');
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsRemaining, addToast]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCompleteCurrent = () => {
    setIsRunning(false);
    addToast(`Marked "${currentTaskTitle}" as Completed! 🌟`, 'success');
    setCurrentTaskTitle(nextTaskTitle);
    setNextTaskTitle('CAT Quant Practice & Review');
    setSecondsRemaining(25 * 60);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-8 text-slate-100 select-none animate-fade-in">
      {/* Top Bar: Minimal Focus Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-sm font-black text-white tracking-wide">
            BlockFlow Focus Mode
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center Display: Current Task & Countdown Timer */}
      <div className="max-w-2xl mx-auto w-full text-center space-y-8 my-auto">
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider">
            Current Active Session
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            {currentTaskTitle}
          </h2>
        </div>

        {/* Big Countdown Timer */}
        <div className="font-mono text-7xl sm:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300">
          {formattedTime}
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="py-4 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95"
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? 'Pause Session' : 'Start Focus Session'}</span>
          </button>

          <button
            onClick={handleCompleteCurrent}
            className="py-4 px-6 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-sm flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Activity</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar: Next Activity Preview */}
      <div className="max-w-xl mx-auto w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-slate-500" />
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Up Next</span>
            <span className="font-bold text-slate-200">{nextTaskTitle}</span>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500" />
      </div>
    </div>
  );
};
