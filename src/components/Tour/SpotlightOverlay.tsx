import React, { useEffect, useState } from 'react';

interface SpotlightOverlayProps {
  targetRect: DOMRect | null;
  padding?: number;
  borderRadius?: number;
  isActionStep?: boolean;
  onBackdropClick?: () => void;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  targetRect,
  padding = 6,
  borderRadius = 12,
  isActionStep = false,
  onBackdropClick,
}) => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!targetRect) {
    // If no target is active, render a standard dim backdrop
    return (
      <div
        className="fixed inset-0 z-[9990] bg-slate-950/75 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onBackdropClick}
        aria-hidden="true"
      />
    );
  }

  const x = Math.max(0, targetRect.left - padding);
  const y = Math.max(0, targetRect.top - padding);
  const width = Math.min(viewport.width, targetRect.width + padding * 2);
  const height = Math.min(viewport.height, targetRect.height + padding * 2);

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-none overflow-hidden select-none">
      <svg
        className="w-full h-full absolute inset-0 pointer-events-auto"
        width={viewport.width}
        height={viewport.height}
        onClick={onBackdropClick}
      >
        <defs>
          <mask id="blockflow-tour-spotlight-mask">
            {/* White base fills entire viewport (opaque mask) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout reveals target element (transparent hole) */}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={borderRadius}
              ry={borderRadius}
              fill="black"
            />
          </mask>
        </defs>

        {/* Dimming overlay rectangle with mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.78)"
          mask="url(#blockflow-tour-spotlight-mask)"
        />

        {/* Highlight ring around target */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke="#6366F1"
          strokeWidth="2.5"
          className="animate-pulse"
          strokeDasharray="8 6"
        />
      </svg>

      {/* Transparent Click-through hole when action is required */}
      {isActionStep && (
        <div
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: `${borderRadius}px`,
          }}
          className="pointer-events-none"
        />
      )}
    </div>
  );
};
