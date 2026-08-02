import React, { useState, useEffect } from 'react';
import { loadFutureMeMessages, saveFutureMeMessages } from '../../utils/assignmentStorage';
import { FutureMeMessage } from '../../types/executionOS';
import { useTimetable } from '../../context/TimetableContext';
import { Send, Clock, Rocket, X, Quote, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface FutureMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FutureMeModal({ isOpen, onClose }: FutureMeModalProps) {
  const { addToast } = useTimetable();
  const [messages, setMessages] = useState<FutureMeMessage[]>([]);
  const [text, setText] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [unlockDuration, setUnlockDuration] = useState<'1month' | '6months' | '1year'>('1month');

  useEffect(() => {
    if (isOpen) {
      setMessages(loadFutureMeMessages());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSealCapsule = () => {
    if (!text.trim()) {
      addToast('Please enter a message for your future self', 'warning');
      return;
    }

    const created = new Date();
    const unseal = new Date();
    if (unlockDuration === '1month') unseal.setMonth(unseal.getMonth() + 1);
    else if (unlockDuration === '6months') unseal.setMonth(unseal.getMonth() + 6);
    else unseal.setFullYear(unseal.getFullYear() + 1);

    const newMessage: FutureMeMessage = {
      id: `fm-${Date.now()}`,
      createdDate: created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      unsealDate: unseal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      text: text.trim(),
      goalTarget: targetGoal.trim() || 'General Growth',
      initialProgressPct: 0,
      isUnsealed: false,
    };

    const updated = [newMessage, ...messages];
    setMessages(updated);
    saveFutureMeMessages(updated);

    setText('');
    setTargetGoal('');
    addToast('Time capsule sealed successfully! 🚀', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Rocket className="text-indigo-400" size={22} />
              Message to Future Me
            </h2>
            <p className="text-slate-400 text-xs">Write a sealed time capsule to track your growth</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Write New Capsule Form */}
          <div className="space-y-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative">
              <Quote className="absolute top-3 right-3 text-slate-800" size={32} />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Dear Future Me, right now I'm working hard on mastering BlockFlow and building my career..."
                className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 outline-none resize-none min-h-[120px] relative z-10 text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Goal (Optional)</label>
              <input
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                placeholder="e.g. Master Full-Stack Engineering & Maintain 90% Execution"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Clock size={12} /> Unlock Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1month', '6months', '1year'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setUnlockDuration(opt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      unlockDuration === opt
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {opt === '1month' ? '1 Month' : opt === '6months' ? '6 Months' : '1 Year'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSealCapsule}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all"
            >
              <Send size={16} /> Seal Time Capsule
            </button>
          </div>

          {/* Sealed Time Capsules List */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={14} className="text-indigo-400" /> Sealed Time Capsules ({messages.length})
            </h3>

            {messages.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div key={m.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-indigo-400 font-bold">Sealed: {m.createdDate}</span>
                      <span className="text-slate-500 font-mono">Unlocks: {m.unsealDate}</span>
                    </div>
                    <p className="text-slate-300 line-clamp-2 italic">"{m.text}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                No time capsules written yet. Write your first message to your future self above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
