import React, { useEffect } from 'react';
import { useDemo } from '../../context/DemoContext';
import { TOUR_STEPS } from '../../types/onboarding';
import { NavView } from '../Navigation/Sidebar';
import { Sparkles, ChevronLeft, ChevronRight, Check, X, Rocket } from 'lucide-react';

interface GuidedTourProps {
  onNavigate: (view: NavView) => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ onNavigate }) => {
  const { isTourActive, currentTourStep, currentStepIndex, nextTourStep, prevTourStep, closeTour, completeOnboarding } = useDemo();

  // Auto-navigate view when step changes
  useEffect(() => {
    if (isTourActive && currentTourStep) {
      onNavigate(currentTourStep.targetView);
    }
  }, [isTourActive, currentTourStep, onNavigate]);

  if (!isTourActive || !currentTourStep) return null;

  const totalSteps = TOUR_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Dark Spotlight Backdrop Overlay */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300" onClick={closeTour} />

      {/* Interactive Tour Card */}
      <div className="relative z-10 pointer-events-auto bg-slate-900 w-full max-w-md rounded-3xl border border-indigo-500/40 shadow-2xl shadow-indigo-500/10 p-6 space-y-4">
        
        {/* Header Badge & Step Indicator */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} className="text-indigo-400" />
            Product Tour ({currentStepIndex + 1}/{totalSteps})
          </span>
          <button
            onClick={closeTour}
            className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="space-y-2 pt-1">
          <h3 className="text-lg font-black text-white tracking-tight">{currentTourStep.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{currentTourStep.description}</p>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            {currentStepIndex > 0 && (
              <button
                onClick={prevTourStep}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <button
                onClick={nextTourStep}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-md"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => completeOnboarding(true)}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-md"
                >
                  <Rocket size={12} /> Explore Demo
                </button>
                <button
                  onClick={() => completeOnboarding(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Check size={12} /> Got It
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
