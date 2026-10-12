import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BlockPath } from './BlockPath';
import './intro.css';

interface BlockFlowIntroProps {
  onComplete: () => void;
}

type Phase = 'logo' | 'blocks' | 'stickman' | 'journey' | 'target' | 'zoom' | 'done';

export const BlockFlowIntro: React.FC<BlockFlowIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('logo');
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isWalking, setIsWalking] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState<string>('center center');
  const [opacity, setOpacity] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const hasSeenBefore = useRef(
    typeof window !== 'undefined' && localStorage.getItem('blockflow_intro_seen') === 'true'
  );
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const skipIntro = useCallback(() => {
    try {
      localStorage.setItem('blockflow_intro_seen', 'true');
    } catch {
      // Ignore local storage error
    }
    setOpacity(0);
    setTimeout(onComplete, 220);
  }, [onComplete]);

  // Handle setting target element reference for camera zoom
  const handleTargetElement = useCallback((el: HTMLElement | null) => {
    targetElementRef.current = el;
  }, []);

  useEffect(() => {
    // If reduced motion is requested, show brief respectful fade
    if (prefersReducedMotion.current) {
      const timer = setTimeout(() => {
        setOpacity(0);
        setTimeout(onComplete, 300);
      }, 700);
      return () => clearTimeout(timer);
    }

    const speed = hasSeenBefore.current ? 0.52 : 1;
    const t = (ms: number) => ms * speed;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Show skip button after 600ms
    timers.push(setTimeout(() => setShowSkip(true), t(600)));

    // Phase 2: Blocks and path appear
    timers.push(
      setTimeout(() => {
        setPhase('blocks');
      }, t(400))
    );

    // Phase 3: Stickman appears at station 0 (ZERO)
    timers.push(
      setTimeout(() => {
        setPhase('stickman');
        setActiveStep(0);
        setIsWalking(false);
      }, t(850))
    );

    // Phase 4: Journey begins
    // Step to Block 1
    timers.push(
      setTimeout(() => {
        setPhase('journey');
        setIsWalking(true);
        setActiveStep(1);
      }, t(1100))
    );

    // Step to Block 2
    timers.push(
      setTimeout(() => {
        setIsWalking(true);
        setActiveStep(2);
      }, t(1450))
    );

    // Step to Block 3
    timers.push(
      setTimeout(() => {
        setIsWalking(true);
        setActiveStep(3);
      }, t(1800))
    );

    // Step to Block 4
    timers.push(
      setTimeout(() => {
        setIsWalking(true);
        setActiveStep(4);
      }, t(2150))
    );

    // Step to TARGET
    timers.push(
      setTimeout(() => {
        setIsWalking(true);
        setActiveStep(5);
      }, t(2500))
    );

    // Phase 5: TARGET Reached!
    timers.push(
      setTimeout(() => {
        setPhase('target');
        setIsWalking(false);
        setIsCelebrating(true);
      }, t(2850))
    );

    // Phase 6: Signature Camera Zoom Transition into Application
    timers.push(
      setTimeout(() => {
        setPhase('zoom');

        // Calculate exact center coordinates of the TARGET element in viewport
        if (targetElementRef.current) {
          const rect = targetElementRef.current.getBoundingClientRect();
          const originX = rect.left + rect.width / 2;
          const originY = rect.top + rect.height / 2;
          setZoomOrigin(`${originX}px ${originY}px`);
        } else {
          setZoomOrigin('right center');
        }

        // Animate smooth camera dive directly into the target
        let frame = 0;
        const totalFrames = Math.round(36 * speed);

        const animateZoom = () => {
          frame++;
          const progress = Math.min(frame / totalFrames, 1);
          // Cubic ease-in for realistic camera plunge into the target
          const eased = Math.pow(progress, 2.5);

          // Zoom from 100% up to 450% into the target
          setZoomScale(1 + eased * 4.2);

          // Fade out the loading backdrop as target fills viewport
          if (progress > 0.45) {
            const fadeProgress = (progress - 0.45) / 0.55;
            setOpacity(1 - fadeProgress);
          }

          if (progress < 1) {
            requestAnimationFrame(animateZoom);
          } else {
            try {
              localStorage.setItem('blockflow_intro_seen', 'true');
            } catch {
              // Ignore local storage error
            }
            onComplete();
          }
        };

        requestAnimationFrame(animateZoom);
      }, t(3250))
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none bg-[#F8F7F4]"
      style={{
        opacity,
        transform: `scale(${zoomScale})`,
        transformOrigin: zoomOrigin,
        willChange: 'transform, opacity',
      }}
      role="status"
      aria-label="Starting your day in BlockFlow"
    >
      {/* ── TOP BRAND HEADER ── */}
      <div
        className={`text-center mb-12 sm:mb-16 transition-all duration-500 ${
          phase === 'logo'
            ? 'opacity-100 translate-y-0'
            : 'opacity-70 -translate-y-1'
        }`}
      >
        <div className="inline-flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
          <h1
            className="text-xl sm:text-2xl font-bold tracking-[0.25em] text-[#171717] uppercase"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            BlockFlow
          </h1>
        </div>
        <p className="text-[11px] sm:text-xs font-medium tracking-wider text-[#737373] uppercase">
          Zero → Blocks → Target
        </p>
      </div>

      {/* ── 2D INTERACTIVE STORY TRACK ── */}
      <div
        className={`w-full max-w-2xl px-4 transition-all duration-500 ${
          phase !== 'logo' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <BlockPath
          activeStep={activeStep}
          isWalking={isWalking}
          isCelebrating={isCelebrating}
          onTargetElement={handleTargetElement}
        />
      </div>

      {/* ── SUBTLE GUIDANCE CAPTION ── */}
      <div className="mt-10 sm:mt-14 h-6 flex items-center justify-center">
        <p
          className={`text-xs font-medium tracking-wide text-[#737373] transition-all duration-400 ${
            phase === 'target' || phase === 'zoom'
              ? 'opacity-100 scale-100 text-[#2563EB] font-semibold'
              : phase === 'journey'
              ? 'opacity-80'
              : phase === 'stickman'
              ? 'opacity-60'
              : 'opacity-0'
          }`}
        >
          {phase === 'target' || phase === 'zoom'
            ? 'Target reached. Entering BlockFlow...'
            : phase === 'journey'
            ? 'Moving through planned blocks...'
            : phase === 'stickman'
            ? 'Starting at zero...'
            : 'Plan. Execute. Reach your target.'}
        </p>
      </div>

      {/* ── SKIP BUTTON ── */}
      {showSkip && phase !== 'zoom' && phase !== 'done' && (
        <button
          onClick={skipIntro}
          className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 text-xs font-semibold text-[#737373] hover:text-[#171717] transition-all duration-200 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white/80 hover:bg-white shadow-xs backdrop-blur-xs"
          title="Skip intro animation"
        >
          Skip →
        </button>
      )}
    </div>
  );
};

