import React, { useState } from 'react';
import { Send, Clock, Rocket, X, Quote } from 'lucide-react';

interface FutureMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FutureMeModal({ isOpen, onClose }: FutureMeModalProps) {
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('6months');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                <Rocket className="text-indigo-400" size={24} />
                Message to Future Me
              </h2>
              <p className="text-slate-400 text-sm">Write a time capsule to track your growth.</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-6 relative">
            <Quote className="absolute top-3 right-3 text-slate-800" size={40} />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Dear Future Me, right now I'm struggling with learning React, but I hope by the time you read this..."
              className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 outline-none resize-none min-h-[150px] relative z-10 text-lg leading-relaxed"
            />
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Clock size={16} /> Unlock Date
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['1month', '6months', '1year'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setUnlockDate(opt)}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                    unlockDate === opt
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {opt === '1month' ? '1 Month' : opt === '6months' ? '6 Months' : '1 Year'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-colors"
          >
            <Send size={18} />
            Seal Time Capsule
          </button>
        </div>
      </div>
    </div>
  );
}
