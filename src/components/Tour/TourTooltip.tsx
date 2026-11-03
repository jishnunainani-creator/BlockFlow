import React from 'react';
import { TourStepConfig } from '../../types/tour';
import { TooltipCoords } from '../../utils/tourPositioning';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Lightbulb,
  MousePointerClick,
} from 'lucide-react';

interface TourTooltipProps {
  step: TourStepConfig;
  coords: TooltipCoords;
  totalSteps: number;
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onJumpToStep?: (index: number) => void;
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
  step,
  coords,
  totalSteps,
  currentStepIndex,
  onNext,
  onPrev,
  onSkip,
  onJumpToStep,
}) => {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Arrow style positioning
  const getArrowStyle = (): React.CSSProperties => {
    switch (coords.actualPlacement) {
      case 'top':
        return {
          bottom: '-6px',
          left: `${coords.arrowOffsetPercent}%`,
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'bottom':
        return {
          top: '-6px',
          left: `${coords.arrowOffsetPercent}%`,
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'left':
        return {
          right: '-6px',
          top: `${coords.arrowOffsetPercent}%`,
          transform: 'translateY(-50%) rotate(45deg)',
        };
      case 'right':
      default:
        return {
          left: '-6px',
          top: `${coords.arrowOffsetPercent}%`,
          transform: 'translateY(-50%) rotate(45deg)',
        };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Tour: ${step.title}`}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      className="w-80 sm:w-96 max-w-[calc(100vw-28px)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-slate-100 select-none animate-scale-up space-y-3.5 transition-all duration-200"
    >
      {/* Anchored Arrow Indicator */}
      <div
        style={getArrowStyle()}
        className="absolute w-3 h-3 bg-slate-900 border-l border-t border-slate-800 pointer-events-none"
      />

      {/* Header: Badge & Close */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={11} className="text-indigo-400" />
            Step {step.stepNumber} of {totalSteps}
          </span>
          {step.type === 'action' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
              <MousePointerClick size={10} />
              Interactive
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Exit Tour (Esc)"
          aria-label="Exit Tour"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress Bar & Dots */}
      <div className="space-y-1">
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
        {onJumpToStep && (
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onJumpToStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-indigo-400'
                    : idx < currentStepIndex
                    ? 'w-2 bg-indigo-600/60 hover:bg-indigo-500'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Jump to step ${idx + 1}`}
                aria-label={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1.5 pt-0.5">
        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug">
          {step.title}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {step.description}
        </p>

        {/* Practical Usage Callout */}
        {step.practicalUsage && (
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5 mt-2">
            <span className="shrink-0 text-amber-400 mt-0.5">
              <Lightbulb size={12} />
            </span>
            <span className="leading-snug">{step.practicalUsage}</span>
          </div>
        )}

        {/* Action Prompt Banner if interactive */}
        {step.actionPrompt && (
          <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 font-semibold flex items-center gap-1.5">
            <MousePointerClick size={12} className="shrink-0 text-indigo-400" />
            <span>{step.actionPrompt}</span>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Skip Tour
        </button>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              type="button"
              onClick={onPrev}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-600/20 flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>{isLastStep ? 'Finish' : 'Next'}</span>
            {isLastStep ? <Check size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};
