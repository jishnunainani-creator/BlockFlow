import React from 'react';
import { Sparkles, Brain, Coffee, ArrowRightLeft, X, Check } from 'lucide-react';

interface ScheduleOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOptimizations?: () => void;
}

export default function ScheduleOptimizerModal({ isOpen, onClose, onApplyOptimizations = () => {} }: ScheduleOptimizerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 blur-3xl rounded-full"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                <Sparkles className="text-indigo-400" size={24} />
                Optimize My Day
              </h2>
              <p className="text-slate-400 text-sm">AI recommendations to improve your schedule</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors relative z-10">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex gap-4">
              <div className="mt-1 text-orange-400">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Workload Balance</h3>
                <p className="text-sm text-slate-400">Shifted "Deep Work" to morning peak energy hours.</p>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex gap-4">
              <div className="mt-1 text-emerald-400">
                <Coffee size={24} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Break Insertion</h3>
                <p className="text-sm text-slate-400">Added a 15m walk at 3:00 PM to prevent afternoon slump.</p>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex gap-4">
              <div className="mt-1 text-blue-400">
                <ArrowRightLeft size={24} />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Context Switching</h3>
                <p className="text-sm text-slate-400">Grouped 3 small admin tasks together at 4:30 PM.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button 
              onClick={() => { onApplyOptimizations(); onClose(); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Check size={18} />
              Apply Optimization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
