import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stickman } from './Stickman';

interface BlockPathProps {
  activeStep: number; // -1: not started, 0: at ZERO, 1: Block 1, 2: Block 2, 3: Block 3, 4: Block 4, 5: TARGET
  isWalking: boolean;
  isCelebrating: boolean;
  onTargetElement?: (el: HTMLElement | null) => void;
  className?: string;
}

interface BlockMeta {
  id: string;
  label: string;
  time: string;
}

const BLOCKS: BlockMeta[] = [
  { id: 'b1', label: 'PLAN', time: '09:00' },
  { id: 'b2', label: 'FOCUS', time: '11:00' },
  { id: 'b3', label: 'BUILD', time: '14:00' },
  { id: 'b4', label: 'REVIEW', time: '16:30' },
];

export const BlockPath: React.FC<BlockPathProps> = ({
  activeStep,
  isWalking,
  isCelebrating,
  onTargetElement,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const targetRef = useRef<HTMLDivElement>(null);
  const [stationX, setStationX] = useState<number[]>([]);

  // Calculate physical center positions of each station relative to container
  const updatePositions = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const positions = stationRefs.current.map((el) => {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return rect.left - containerRect.left + rect.width / 2;
    });
    setStationX(positions);
  }, []);

  useEffect(() => {
    updatePositions();
    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);
    // Double check after small delay for fonts/layouts to settle
    const t = setTimeout(updatePositions, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, [updatePositions]);

  // Pass target element to parent for camera zoom transition
  useEffect(() => {
    if (targetRef.current && onTargetElement) {
      onTargetElement(targetRef.current);
    }
  }, [onTargetElement]);

  const currentStickmanX =
    activeStep >= 0 && stationX[activeStep] !== undefined
      ? stationX[activeStep]
      : stationX[0] || 30;

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-2xl mx-auto px-3 sm:px-6 select-none ${className}`}
    >
      {/* ── STICKMAN ON TRACK ── */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-350 ease-out"
        style={{
          left: `${currentStickmanX}px`,
          bottom: '56px',
          transform: 'translateX(-50%)',
          opacity: activeStep >= 0 ? 1 : 0,
        }}
      >
        <div className="w-8 h-12 sm:w-9 sm:h-13">
          <Stickman isWalking={isWalking} isCelebrating={isCelebrating} />
        </div>
      </div>

      {/* ── CONNECTING PROGRESS TRACK LINE ── */}
      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#E5E5E5] z-0 pointer-events-none">
        {/* Active progress fill line */}
        <div
          className="h-full bg-[#2563EB] transition-all duration-350 ease-out"
          style={{
            width:
              activeStep <= 0
                ? '0%'
                : activeStep >= 5
                ? '100%'
                : `${(activeStep / 5) * 100}%`,
          }}
        />
      </div>

      {/* ── STATIONS SEQUENCE ── */}
      <div className="relative z-10 flex items-center justify-between w-full">
        {/* Station 0: ZERO */}
        <div
          ref={(el) => {
            stationRefs.current[0] = el;
          }}
          className="flex flex-col items-center shrink-0"
        >
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
              activeStep >= 0
                ? 'border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]'
                : 'border-[#D4D4D4] text-[#A3A3A3] bg-white'
            }`}
          >
            0
          </div>
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#737373] mt-1.5 uppercase">
            Zero
          </span>
        </div>

        {/* Stations 1-4: Time Blocks */}
        {BLOCKS.map((block, idx) => {
          const stepIndex = idx + 1;
          const isCompleted = activeStep > stepIndex;
          const isCurrent = activeStep === stepIndex;
          const isPending = activeStep < stepIndex;

          return (
            <div
              key={block.id}
              ref={(el) => {
                stationRefs.current[stepIndex] = el;
              }}
              className="flex flex-col items-center shrink-0"
            >
              <div
                className={`w-10 h-13 sm:w-14 sm:h-16 rounded-lg border-2 flex flex-col justify-between p-1.5 transition-all duration-300 ${
                  isCompleted
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                    : isCurrent
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] scale-105 shadow-sm'
                    : 'border-[#E5E5E5] bg-white text-[#737373]'
                }`}
              >
                {/* Time header */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-[8px] sm:text-[9px] font-mono font-medium opacity-80">
                    {block.time}
                  </span>
                  {isCompleted && (
                    <svg
                      className="w-3 h-3 text-[#2563EB]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {isCurrent && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                  )}
                </div>

                {/* Minimal time-block bar */}
                <div
                  className={`w-full h-1 sm:h-1.5 rounded-full transition-colors duration-300 ${
                    isCompleted || isCurrent ? 'bg-[#2563EB]' : 'bg-[#E5E5E5]'
                  }`}
                />

                {/* Block label */}
                <span className="text-[8px] sm:text-[9px] font-bold text-center tracking-wider truncate">
                  {block.label}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-[#A3A3A3] mt-1.5">
                Block {stepIndex}
              </span>
            </div>
          );
        })}

        {/* Station 5: TARGET */}
        <div
          ref={(el) => {
            stationRefs.current[5] = el;
            targetRef.current = el;
          }}
          className="flex flex-col items-center shrink-0"
        >
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center transition-all duration-400 ${
              activeStep >= 5
                ? 'border-[#2563EB] bg-[#2563EB] text-white scale-110 shadow-md target-highlight'
                : 'border-[#D4D4D4] bg-white text-[#A3A3A3]'
            }`}
          >
            {activeStep >= 5 ? (
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-[#A3A3A3]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1" />
              </svg>
            )}
          </div>
          <span
            className={`text-[10px] sm:text-xs font-bold tracking-wider mt-1.5 transition-colors duration-300 ${
              activeStep >= 5 ? 'text-[#2563EB]' : 'text-[#737373]'
            }`}
          >
            {activeStep >= 5 ? 'TARGET ✓' : 'TARGET'}
          </span>
        </div>
      </div>
    </div>
  );
};

