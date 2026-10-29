import React, { useEffect } from 'react';
import { useDemo } from '../../context/DemoContext';
import { TOUR_STEPS } from '../../types/onboarding';
import { NavView } from '../Navigation/Sidebar';
import { Sparkles, ChevronLeft, ChevronRight, Check, X, Rocket } from 'lucide-react';

interface GuidedTourProps {
  onNavigate: (view: NavView) => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ onNavigate }) => {
  const {
    isTourActive,
    currentTourStep,
    currentStepIndex,
    nextTourStep,
    prevTourStep,
    goToTourStep,
    closeTour,
    completeOnboarding,
  } = useDemo();

  // Auto-navigate view when step changes
  useEffect(() => {
    if (isTourActive && currentTourStep) {
      onNavigate(currentTourStep.targetView);
    }
  }, [isTourActive, currentTourStep, onNavigate]);

  // Keyboard navigation support
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextTourStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevTourStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeTour();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, nextTourStep, prevTourStep, closeTour]);

  if (!isTourActive || !currentTourStep) return null;

  const totalSteps = TOUR_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Dark Spotlight Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300"
        onClick={closeTour}
        aria-hidden="true"
      />

      {/* Interactive Tour Card */}
      <div
        role="dialog"
        aria-label={`Product Tour: ${currentTourStep.title}`}
        className="relative z-10 pointer-events-auto bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl shadow-black/60 p-5 sm:p-6 space-y-4 animate-scale-up"
      >
        {/* Header Badge, Tag & Close Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} className="text-blue-400" />
              Tour · {currentStepIndex + 1} of {totalSteps}
            </span>
            {currentTourStep.badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  currentTourStep.badge.includes('New')
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {currentTourStep.badge}
              </span>
            )}
          </div>

          <button
            onClick={closeTour}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Skip Tour (Esc)"
            aria-label="Skip Tour"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Progress Dots & Bar */}
        <div className="space-y-1.5">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Interactive step dot indicators */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.stepId}
                onClick={() => goToTourStep?.(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-blue-400'
                    : idx < currentStepIndex
                    ? 'w-2 bg-blue-600/70 hover:bg-blue-500'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Jump to: ${step.title}`}
                aria-label={`Step ${idx + 1}: ${step.title}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5 pt-1">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {currentTourStep.title}
          </h3>
          {currentTourStep.subtitle && (
            <p className="text-xs font-semibold text-blue-400">
              {currentTourStep.subtitle}
            </p>
          )}
          <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
            {currentTourStep.description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={prevTourStep}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={closeTour}
                className="text-xs text-slate-500 hover:text-slate-300 font-medium px-2 py-1"
              >
                Skip Tour
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <button
                type="button"
                onClick={nextTourStep}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => completeOnboarding(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Rocket size={13} />
                  <span>Explore Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => completeOnboarding(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Check size={13} className="text-emerald-400" />
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
