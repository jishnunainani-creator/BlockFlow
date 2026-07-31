import React from 'react';
import { AlertCircle, Smartphone, Video, Coffee, Users, Brain, X } from 'lucide-react';

export type DistractionReason = 'Phone' | 'Social Media' | 'YouTube' | 'Friend' | 'Fatigue' | 'Meeting' | 'Other';

interface DistractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogDistraction: (reason: DistractionReason) => void;
}

export default function DistractionModal({ isOpen, onClose, onLogDistraction }: DistractionModalProps) {
  if (!isOpen) return null;

  const reasons = [
    { id: 'Phone', icon: Smartphone, label: 'Phone', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'Youtube', icon: Video, label: 'YouTube / Video', color: 'text-red-400', bg: 'bg-red-400/10' },
    { id: 'Fatigue', icon: Brain, label: 'Fatigue', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'Friend', icon: Users, label: 'Friend/Chat', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'Meeting', icon: Coffee, label: 'Meeting', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3 text-slate-200">
              <AlertCircle className="text-indigo-400" size={24} />
              <h2 className="text-xl font-bold">Session Interrupted</h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={20} />
            </button>
          </div>

          <p className="text-slate-400 mb-6 text-center text-lg">What pulled your attention away?</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {reasons.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => onLogDistraction(r.id as DistractionReason)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-full ${r.bg} ${r.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-slate-300 font-medium text-sm">{r.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => onLogDistraction('Other')}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all group col-span-2"
            >
              <span className="text-slate-300 font-medium">Other Reason</span>
            </button>
          </div>
          
          <p className="text-xs text-center text-slate-500">Logging this helps AI optimize your future schedules.</p>
        </div>
      </div>
    </div>
  );
}

export { DistractionModal };

