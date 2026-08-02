import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { loadEnergyProfile } from '../../utils/assignmentStorage';
import { optimizeTodaySchedule } from '../../utils/scheduleOptimizerEngine';
import { Sparkles, Brain, Coffee, ArrowRightLeft, X, CheckCircle2 } from 'lucide-react';

interface ScheduleOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOptimizations?: () => void;
}

export default function ScheduleOptimizerModal({
  isOpen,
  onClose,
  onApplyOptimizations = () => {},
}: ScheduleOptimizerModalProps) {
  const { currentWeekScheduledBlocks, scheduledBlocks } = useTimetable();
  const blocks = currentWeekScheduledBlocks?.length > 0 ? currentWeekScheduledBlocks : scheduledBlocks || [];
  const energyProfile = loadEnergyProfile();

  if (!isOpen) return null;

  const optimizations = optimizeTodaySchedule(blocks, energyProfile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div className="p-6 relative space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                <Sparkles className="text-indigo-400" size={22} />
                Optimize My Day
              </h2>
              <p className="text-slate-400 text-xs">AI recommendations derived from your current timetable and energy profile</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {optimizations.length > 0 ? (
            <div className="space-y-3">
              {optimizations.map((opt) => (
                <div key={opt.id} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex gap-3 text-xs">
                  <div className="mt-0.5 text-indigo-400 shrink-0">
                    {opt.type === 'break' ? <Coffee size={20} /> : <Brain size={20} />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-0.5">{opt.title}</h3>
                    <p className="text-slate-300 leading-relaxed">{opt.description}</p>
                    <span className="text-[10px] font-mono text-indigo-400 mt-1 block">Impact: {opt.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Schedule Well Balanced</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Your current daily timetable has no high-intensity overload or missing rest intervals. Keep executing!
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {optimizations.length > 0 && (
              <button
                onClick={() => {
                  onApplyOptimizations();
                  onClose();
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
              >
                <CheckCircle2 size={16} />
                Apply Optimizations
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
