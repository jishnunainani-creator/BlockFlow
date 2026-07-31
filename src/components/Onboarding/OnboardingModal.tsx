import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { Sparkles, Play, Rocket, Calendar, ArrowRight, X, Clock } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, startTour, skipOnboarding, completeOnboarding } = useDemo();

  if (!isOnboardingOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative p-6 sm:p-8 space-y-6">
        
        {/* Background Accent Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={skipOnboarding}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome to BlockFlow</h2>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Plan Intelligently. Execute Consistently. Improve Continuously.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto pt-1">
            Let's take a quick 2-minute tour to see how BlockFlow transforms schedule planning into an AI-powered execution system.
          </p>
        </div>

        {/* Time Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700">
            <Clock size={12} className="text-indigo-400" />
            Estimated time: 2 mins
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={startTour}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all group"
          >
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span>Start Interactive Tour</span>
            <ArrowRight size={14} />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => completeOnboarding(true)}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Rocket size={14} />
              <span>Load Demo Workspace</span>
            </button>
            <button
              onClick={() => completeOnboarding(false)}
              className="py-3 px-3 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Calendar size={14} />
              <span>Create My Schedule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
