import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavView } from '../Navigation/Sidebar';
import { BLOCKFLOW_TOUR_STEPS } from '../../data/tourSteps';
import { SpotlightOverlay } from './SpotlightOverlay';
import { TourTooltip } from './TourTooltip';
import { TourCompletionModal } from './TourCompletionModal';
import {
  findTourTargetElement,
  calculateTooltipCoords,
  TooltipCoords,
  ViewportDimensions,
} from '../../utils/tourPositioning';

const TOUR_COMPLETED_STORAGE_KEY = 'blockflow_product_tour_completed_v1';

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: NavView) => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showCompletion, setShowCompletion] = useState<boolean>(false);
  const targetElementRef = useRef<HTMLElement | null>(null);

  const step = BLOCKFLOW_TOUR_STEPS[currentStepIndex];
  const totalSteps = BLOCKFLOW_TOUR_STEPS.length;

  // ── 1. ROUTE TRANSITION & TARGET DISCOVERY ──
  const locateTarget = useCallback(() => {
    if (!step) return;

    const el = findTourTargetElement(step.targetSelector, step.fallbackSelector);
    if (el) {
      targetElementRef.current = el;
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      targetElementRef.current = null;
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen || !step) return;

    // Navigate to target view if needed
    onNavigate(step.route);

    // Initial check
    locateTarget();

    // Poll for DOM mounting with a bounded timeout (max 1200ms)
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      locateTarget();
      if (targetElementRef.current || attempts >= 8) {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen, step, onNavigate, locateTarget]);

  // ── 2. RECALCULATE ON WINDOW RESIZE AND SCROLL ──
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      if (targetElementRef.current) {
        setTargetRect(targetElementRef.current.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen]);

  // ── 3. INTERACTIVE ACTION STEP LISTENER ──
  useEffect(() => {
    if (!isOpen || !step || step.type !== 'action' || !step.expectedActionSelector) return;

    const el = findTourTargetElement(step.expectedActionSelector);
    if (!el) return;

    const handleUserAction = () => {
      // Delay slightly so action handler completes, then advance
      setTimeout(() => {
        handleNext();
      }, 250);
    };

    el.addEventListener('click', handleUserAction);
    return () => el.removeEventListener('click', handleUserAction);
  }, [isOpen, step, currentStepIndex]);

  // ── 4. KEYBOARD NAVIGATION ──
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Complete Tour
      try {
        localStorage.setItem(TOUR_COMPLETED_STORAGE_KEY, 'true');
      } catch {}
      setShowCompletion(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    try {
      localStorage.setItem(TOUR_COMPLETED_STORAGE_KEY, 'true');
    } catch {}
    setShowCompletion(false);
    onClose();
  };

  const handleReplay = () => {
    setShowCompletion(false);
    setCurrentStepIndex(0);
  };

  if (!isOpen && !showCompletion) return null;

  // ── 5. TOOLTIP POSITION CALCULATION ──
  const viewport: ViewportDimensions = {
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    scrollX: typeof window !== 'undefined' ? window.scrollX : 0,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
  };

  const defaultRect: DOMRect = {
    top: viewport.height / 2 - 100,
    bottom: viewport.height / 2 + 100,
    left: viewport.width / 2 - 150,
    right: viewport.width / 2 + 150,
    width: 300,
    height: 200,
    x: viewport.width / 2 - 150,
    y: viewport.height / 2 - 100,
    toJSON: () => ({}),
  };

  const activeRect = targetRect || defaultRect;
  const tooltipDimensions = { width: 384, height: 260 };
  const tooltipCoords: TooltipCoords = calculateTooltipCoords(
    activeRect,
    tooltipDimensions,
    step?.placement || 'right',
    viewport
  );

  return (
    <>
      {isOpen && !showCompletion && (
        <>
          {/* SVG Spotlight Cutout Overlay */}
          <SpotlightOverlay
            targetRect={targetRect}
            padding={step.padding}
            borderRadius={step.borderRadius}
            isActionStep={step.type === 'action'}
            onBackdropClick={handleClose}
          />

          {/* Anchored Tooltip Card */}
          <TourTooltip
            step={step}
            coords={tooltipCoords}
            totalSteps={totalSteps}
            currentStepIndex={currentStepIndex}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleClose}
            onJumpToStep={(idx) => setCurrentStepIndex(idx)}
          />
        </>
      )}

      {/* Completion Dialog */}
      <TourCompletionModal
        isOpen={showCompletion}
        onClose={handleClose}
        onReplay={handleReplay}
      />
    </>
  );
};
